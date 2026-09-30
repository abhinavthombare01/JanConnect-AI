import { Router, type IRouter, type Response } from "express";
import {
  AnalyzeComplaintBody,
  AnalyzeComplaintResponse,
  CreateComplaintBody,
  CreateComplaintResponse,
  GenerateDemoDataBody,
  GenerateDemoDataResponse,
  GenerateInsightsResponse,
  GetAnalyticsQueryParams,
  GetAnalyticsResponse,
  GetComplaintParams,
  GetComplaintResponse,
  GetHotspotsQueryParams,
  GetHotspotsResponse,
  ListComplaintsQueryParams,
  ListComplaintsResponse,
  UpdateComplaintBody,
  UpdateComplaintParams,
  UpdateComplaintResponse,
} from "@workspace/api-zod";
import {
  categories,
  listComplaints,
  locations,
  createComplaint,
  createDemoComplaints,
  getComplaint,
  updateComplaintStatus,
  type ComplaintFilters,
} from "../lib/janconnect-db";
import {
  analyzeComplaint,
  createSyntheticRequests,
  generateDevelopmentInsights,
} from "../lib/janconnect-ai";

const router: IRouter = Router();

function invalidRequest(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

function filtersFrom(
  values: ComplaintFilters,
): ComplaintFilters {
  return {
    category: values.category,
    priority: values.priority,
    city: values.city,
    status: values.status,
    search: values.search,
  };
}

router.get("/complaints", (req, res): void => {
  const parsed = ListComplaintsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    invalidRequest(res, parsed.error.message);
    return;
  }
  const results = listComplaints(filtersFrom(parsed.data));
  res.json(ListComplaintsResponse.parse(results));
});

router.post("/complaints", async (req, res): Promise<void> => {
  const parsed = CreateComplaintBody.safeParse(req.body);
  if (!parsed.success) {
    invalidRequest(res, parsed.error.message);
    return;
  }
  const input = parsed.data;
  const analysis = await analyzeComplaint(
    input.complaintText,
    input.language,
    input.locationName,
  );
  const created = createComplaint({
    complaintText: input.complaintText,
    language: input.language,
    locationName: input.locationName,
    contactName: input.contactName,
    contactPhone: input.contactPhone,
    analysis,
  });
  res
    .status(201)
    .json(
      CreateComplaintResponse.parse({
        ...created,
        usedFallback: analysis.usedFallback,
      }),
    );
});

router.get("/complaints/:id", (req, res): void => {
  const params = GetComplaintParams.safeParse(req.params);
  if (!params.success) {
    invalidRequest(res, params.error.message);
    return;
  }
  const complaint = getComplaint(params.data.id);
  if (!complaint) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  res.json(GetComplaintResponse.parse(complaint));
});

router.put("/complaints/:id", (req, res): void => {
  const params = UpdateComplaintParams.safeParse(req.params);
  if (!params.success) {
    invalidRequest(res, params.error.message);
    return;
  }
  const body = UpdateComplaintBody.safeParse(req.body);
  if (!body.success) {
    invalidRequest(res, body.error.message);
    return;
  }
  const complaint = updateComplaintStatus(params.data.id, body.data.status);
  if (!complaint) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  res.json(UpdateComplaintResponse.parse(complaint));
});

router.post("/analyze-complaint", async (req, res): Promise<void> => {
  const parsed = AnalyzeComplaintBody.safeParse(req.body);
  if (!parsed.success) {
    invalidRequest(res, parsed.error.message);
    return;
  }
  const input = parsed.data;
  const analysis = await analyzeComplaint(
    input.complaintText,
    input.language,
    input.locationName,
  );
  res.json(AnalyzeComplaintResponse.parse(analysis));
});

router.get("/analytics", (req, res): void => {
  const parsed = GetAnalyticsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    invalidRequest(res, parsed.error.message);
    return;
  }
  const records = listComplaints(filtersFrom(parsed.data));
  const categoryBreakdown = categories.map((category) => ({
    category,
    count: records.filter((record) => record.category === category).length,
  }));
  const priorityBreakdown = (["High", "Medium", "Low"] as const).map(
    (priority) => ({
      priority,
      count: records.filter((record) => record.priority === priority).length,
    }),
  );
  const categoryLeader = [...categoryBreakdown].sort(
    (left, right) => right.count - left.count,
  )[0];
  const dayCounts = new Map<string, number>();
  for (const record of records) {
    const day = record.createdAt.slice(0, 10);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }
  const today = new Date();
  const dailyRequests = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - (13 - index));
    const day = date.toISOString().slice(0, 10);
    return { day, count: dayCounts.get(day) ?? 0 };
  });
  const locationCounts = new Map<
    string,
    { locationName: string; city: string; count: number }
  >();
  for (const record of records) {
    const current = locationCounts.get(record.locationName) ?? {
      locationName: record.locationName,
      city: record.city,
      count: 0,
    };
    current.count += 1;
    locationCounts.set(record.locationName, current);
  }
  const result = {
    totalRequests: records.length,
    highPriority: records.filter((record) => record.priority === "High").length,
    mediumPriority: records.filter((record) => record.priority === "Medium")
      .length,
    lowPriority: records.filter((record) => record.priority === "Low").length,
    mostRequestedCategory:
      categoryLeader && categoryLeader.count > 0
        ? categoryLeader.category
        : null,
    categoryBreakdown,
    priorityBreakdown,
    dailyRequests,
    locationDemand: [...locationCounts.values()].sort(
      (left, right) => right.count - left.count,
    ),
  };
  res.json(GetAnalyticsResponse.parse(result));
});

router.get("/hotspots", (req, res): void => {
  const parsed = GetHotspotsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    invalidRequest(res, parsed.error.message);
    return;
  }
  const records = listComplaints(filtersFrom(parsed.data));
  const hotspots = locations.flatMap((location) => {
    const areaRecords = records.filter(
      (record) => record.locationName === location.locationName,
    );
    if (areaRecords.length < 3) {
      return [];
    }
    const issueCounts = categories.map((category) => ({
      category,
      count: areaRecords.filter((record) => record.category === category)
        .length,
    }));
    const topIssue = issueCounts.sort(
      (left, right) => right.count - left.count,
    )[0]!.category;
    const highPriority = areaRecords.filter(
      (record) => record.priority === "High",
    ).length;
    const severity =
      highPriority >= 6 || areaRecords.length >= 24
        ? "High"
        : highPriority >= 2 || areaRecords.length >= 10
          ? "Medium"
          : "Low";
    return [
      {
        id: location.locationName
          .toLocaleLowerCase()
          .replace(/[^a-z0-9]+/g, "-"),
        locationName: location.locationName,
        city: location.city,
        requests: areaRecords.length,
        topIssue,
        highPriority,
        severity,
        latitude: location.latitude,
        longitude: location.longitude,
        radiusMeters: 1600,
      },
    ];
  });
  res.json(GetHotspotsResponse.parse(hotspots));
});

router.post("/generate-demo-data", (req, res): void => {
  const parsed = GenerateDemoDataBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    invalidRequest(res, parsed.error.message);
    return;
  }
  const createdCount = createDemoComplaints(
    createSyntheticRequests(parsed.data.count ?? 150),
  );
  res
    .status(201)
    .json(
      GenerateDemoDataResponse.parse({
        createdCount,
        message: `${createdCount} synthetic demo requests added.`,
      }),
    );
});

router.post("/generate-insights", async (_req, res): Promise<void> => {
  const insights = await generateDevelopmentInsights();
  res.json(GenerateInsightsResponse.parse(insights));
});

export default router;