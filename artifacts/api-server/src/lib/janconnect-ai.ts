import {
  categories,
  listComplaints,
  locations,
  type Category,
  type ComplaintAnalysis,
  type ComplaintRecord,
  type LocationName,
  type NewComplaint,
  type Priority,
} from "./janconnect-db";
import { logger } from "./logger";

const departments: Record<Category, string> = {
  Water: "Water Supply Department",
  Road: "Public Works Department",
  Transport: "Public Transport Department",
  Healthcare: "Public Health Department",
  Internet: "Digital Infrastructure Department",
};

const actions: Record<Category, string> = {
  Water: "Inspect local water supply, pipeline availability, and service interruptions.",
  Road: "Inspect the reported road segment and assess repair or resurfacing needs.",
  Transport: "Review local route coverage, service frequency, and access to nearby stops.",
  Healthcare: "Review local healthcare access and the availability of essential services.",
  Internet: "Assess local connectivity coverage and investigate reported network outages.",
};

const keywords: Record<Category, string[]> = {
  Water: [
    "water",
    "पानी",
    "पाणी",
    "नळ",
    "जल",
    "नल",
    "पाणीपुरवठा",
    "water supply",
  ],
  Road: [
    "road",
    "pothole",
    "potholes",
    "रस्ता",
    "सड़क",
    "खड्डा",
    "खड्डे",
    "गड्ढा",
    "गड्ढे",
  ],
  Transport: [
    "bus",
    "transport",
    "प्रवास",
    "बस",
    "परिवहन",
    "वाहतूक",
    "बस सेवा",
    "bus stop",
  ],
  Healthcare: [
    "hospital",
    "doctor",
    "आरोग्य",
    "स्वास्थ्य",
    "दवाखाना",
    "रुग्णालय",
    "अस्पताल",
    "वैद्यकीय",
  ],
  Internet: [
    "internet",
    "network",
    "इंटरनेट",
    "नेटवर्क",
    "signal",
    "connectivity",
    "कनेक्शन",
  ],
};

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && categories.includes(value as Category);
}

function isPriority(value: unknown): value is Priority {
  return value === "High" || value === "Medium" || value === "Low";
}

function classifyKeywords(text: string): Category {
  const normalized = text.toLocaleLowerCase();
  let best: Category = "Road";
  let bestScore = 0;
  for (const category of categories) {
    const score = keywords[category].reduce(
      (total, word) => total + (normalized.includes(word.toLocaleLowerCase()) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }
  return best;
}

function getPriority(text: string, category: Category): {
  priority: Priority;
  reason: string;
} {
  const normalized = text.toLocaleLowerCase();
  const severeWords =
    /urgent|emergency|dangerous|unsafe|accident|injur|children|elderly|no access|without water|पानी नहीं|पाणी नाही|पाणी येत नाही|नाही येत|बंद आहे|तातडी|धोकादायक|बच्चे|बुजुर्ग|लहान मुले|ज्येष्ठ|आपातकाल|खतरनाक|कई दिनों|काही दिवस|कई दिन/iu;
  if (severeWords.test(normalized)) {
    return {
      priority: "High",
      reason:
        "The report suggests an essential-service disruption or a potential safety concern requiring prompt review.",
    };
  }

  const suggestionWords =
    /would be useful|consider adding|could add|suggest|another|please add|विचार करावा|सुविधा असावी|होना चाहिए|बढ़ाया जाए|बनाया जाए/iu;
  if (suggestionWords.test(normalized)) {
    return {
      priority: "Low",
      reason:
        "The request describes a suggested improvement rather than an immediate safety issue.",
    };
  }

  return {
    priority: "Medium",
    reason:
      category === "Water" || category === "Healthcare"
        ? "The report concerns an essential service and warrants timely local review."
        : "The reported infrastructure issue affects local access and warrants review.",
  };
}

function fallbackAnalysis(
  complaintText: string,
  locationName: string,
): ComplaintAnalysis {
  const category = classifyKeywords(complaintText);
  const { priority, reason } = getPriority(complaintText, category);
  const hasCategoryKeyword = keywords[category].some((word) =>
    complaintText.toLocaleLowerCase().includes(word.toLocaleLowerCase()),
  );
  const confidence = hasCategoryKeyword ? 0.72 : 0.38;
  return {
    category,
    priority,
    priorityReason: reason,
    summary: `Residents report a ${category.toLocaleLowerCase()} access concern in ${locationName}.`,
    affectedGroup: "Local residents",
    recommendedDepartment: departments[category],
    recommendedAction: actions[category],
    confidence,
    usedFallback: true,
  };
}

async function openAiJson<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    throw new Error(`OpenAI returned HTTP ${response.status}.`);
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }
  return JSON.parse(content) as T;
}

function validAnalysis(candidate: unknown): ComplaintAnalysis | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }
  const value = candidate as Record<string, unknown>;
  if (
    !isCategory(value.category) ||
    !isPriority(value.priority) ||
    typeof value.priorityReason !== "string" ||
    typeof value.summary !== "string" ||
    typeof value.affectedGroup !== "string" ||
    typeof value.recommendedDepartment !== "string" ||
    typeof value.recommendedAction !== "string" ||
    typeof value.confidence !== "number" ||
    !Number.isFinite(value.confidence)
  ) {
    return null;
  }
  return {
    category: value.category,
    priority: value.priority,
    priorityReason: value.priorityReason.slice(0, 500),
    summary: value.summary.slice(0, 500),
    affectedGroup: value.affectedGroup.slice(0, 200),
    recommendedDepartment: value.recommendedDepartment.slice(0, 200),
    recommendedAction: value.recommendedAction.slice(0, 500),
    confidence: Math.max(0, Math.min(1, value.confidence)),
    usedFallback: false,
  };
}

export async function analyzeComplaint(
  complaintText: string,
  language: string,
  locationName: string,
): Promise<ComplaintAnalysis> {
  const fallback = fallbackAnalysis(complaintText, locationName);
  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }
  try {
    const candidate = await openAiJson<unknown>(
      [
        "You analyze citizen requests about public infrastructure in India.",
        "Understand English, Hindi, and Marathi. Always return English labels and concise English analysis.",
        "Return only a JSON object with category, priority, priorityReason, summary, affectedGroup, recommendedDepartment, recommendedAction, confidence.",
        "category must be exactly one of Water, Road, Transport, Healthcare, Internet.",
        "priority must be exactly High, Medium, or Low. Consider urgency, safety, essential services, severity, and people affected.",
        "If confidence is low, choose the closest category and set confidence below 0.55.",
        "Do not claim that an authority has acted or that this is an official government system.",
      ].join(" "),
      JSON.stringify({
        complaintText,
        language,
        location: locationName,
      }),
    );
    return validAnalysis(candidate) ?? fallback;
  } catch (error) {
    logger.warn(
      { err: error, locationName },
      "AI complaint analysis failed; using keyword fallback",
    );
    return fallback;
  }
}

interface InsightsResult {
  generatedAt: string;
  insights: string[];
  suggestedPriorities: string[];
  totalRecords: number;
  usedFallback: boolean;
  disclaimer: string;
}

const insightsDisclaimer =
  "AI-generated prototype recommendations based on submitted and synthetic records. These are not government decisions.";

function fallbackInsights(records: ComplaintRecord[]): InsightsResult {
  const categoryCounts = new Map<string, number>();
  const locationCounts = new Map<
    string,
    { count: number; high: number; categories: Map<string, number> }
  >();
  for (const record of records) {
    categoryCounts.set(
      record.category,
      (categoryCounts.get(record.category) ?? 0) + 1,
    );
    const current = locationCounts.get(record.locationName) ?? {
      count: 0,
      high: 0,
      categories: new Map<string, number>(),
    };
    current.count += 1;
    if (record.priority === "High") {
      current.high += 1;
    }
    current.categories.set(
      record.category,
      (current.categories.get(record.category) ?? 0) + 1,
    );
    locationCounts.set(record.locationName, current);
  }

  const topCategory = [...categoryCounts.entries()].sort(
    (left, right) => right[1] - left[1],
  )[0];
  const topLocation = [...locationCounts.entries()].sort(
    (left, right) => right[1].count - left[1].count,
  )[0];
  const locationIssue = topLocation
    ? [...topLocation[1].categories.entries()].sort(
        (left, right) => right[1] - left[1],
      )[0]?.[0]
    : undefined;

  const insights =
    records.length === 0
      ? ["No requests have been submitted yet. Add a request or generate demo data to explore demand patterns."]
      : [
          topCategory
            ? `${topCategory[0]} is the most requested category, with ${topCategory[1]} of ${records.length} requests.`
            : "There is not yet enough category data to identify a leading issue.",
          topLocation && locationIssue
            ? `${topLocation[0]} has the most requests (${topLocation[1].count}); ${locationIssue} is its leading issue.`
            : "Requests are spread across locations; continue monitoring emerging concentrations.",
          topLocation && topLocation[1].high > 0
            ? `${topLocation[1].high} high-priority request${topLocation[1].high === 1 ? "" : "s"} are recorded in ${topLocation[0]}.`
            : "No high-priority requests are currently recorded.",
        ];

  const suggestedPriorities = [
    "Review essential-service requests in locations with the largest request counts.",
    "Assess high-priority clusters for safety and service-continuity concerns.",
    "Compare category demand across areas before planning local infrastructure reviews.",
  ];
  return {
    generatedAt: new Date().toISOString(),
    insights,
    suggestedPriorities,
    totalRecords: records.length,
    usedFallback: true,
    disclaimer: insightsDisclaimer,
  };
}

export async function generateDevelopmentInsights(): Promise<InsightsResult> {
  const records = listComplaints();
  const fallback = fallbackInsights(records);
  if (!process.env.OPENAI_API_KEY || records.length === 0) {
    return fallback;
  }

  const aggregates = {
    totalRequests: records.length,
    byCategory: categories.map((category) => ({
      category,
      count: records.filter((record) => record.category === category).length,
    })),
    byLocation: locations.map((location) => {
      const localRecords = records.filter(
        (record) => record.locationName === location.locationName,
      );
      return {
        location: location.locationName,
        requests: localRecords.length,
        highPriority: localRecords.filter(
          (record) => record.priority === "High",
        ).length,
        topIssue:
          [...categories]
            .map((category) => ({
              category,
              count: localRecords.filter(
                (record) => record.category === category,
              ).length,
            }))
            .sort((left, right) => right.count - left.count)[0]?.category ??
          "Water",
      };
    }),
  };

  try {
    const candidate = await openAiJson<{
      insights?: unknown;
      suggestedPriorities?: unknown;
    }>(
      [
        "You are a civic-development decision-support assistant analyzing aggregate request counts in India.",
        "Return only a JSON object with an insights array and suggestedPriorities array. Use concise English.",
        "Give observational, non-prescriptive prototype recommendations grounded only in the aggregates.",
        "Do not claim government affiliation, real-world validation, or completed action.",
      ].join(" "),
      JSON.stringify(aggregates),
    );
    const insights = Array.isArray(candidate.insights)
      ? candidate.insights.filter(
          (item): item is string =>
            typeof item === "string" && item.length > 0,
        )
      : [];
    const suggestedPriorities = Array.isArray(candidate.suggestedPriorities)
      ? candidate.suggestedPriorities.filter(
          (item): item is string =>
            typeof item === "string" && item.length > 0,
        )
      : [];
    if (!insights.length || !suggestedPriorities.length) {
      return fallback;
    }
    return {
      generatedAt: new Date().toISOString(),
      insights: insights.slice(0, 5),
      suggestedPriorities: suggestedPriorities.slice(0, 5),
      totalRecords: records.length,
      usedFallback: false,
      disclaimer: insightsDisclaimer,
    };
  } catch (error) {
    logger.warn(
      { err: error },
      "AI insights generation failed; using aggregate fallback",
    );
    return fallback;
  }
}

export function createSyntheticRequests(count: number): NewComplaint[] {
  const categoryByLocation: Record<LocationName, Category> = {
    "Hadapsar, Pune": "Water",
    "Kothrud, Pune": "Transport",
    "Pimpri, Pune": "Road",
    "Nashik Road, Nashik": "Healthcare",
    "Central Nashik": "Water",
    "Nagpur Central": "Road",
    "Mumbai Suburbs": "Internet",
    Thane: "Transport",
  };
  const weightedLocations: LocationName[] = [
    ...Array<LocationName>(30).fill("Hadapsar, Pune"),
    ...Array<LocationName>(20).fill("Kothrud, Pune"),
    ...Array<LocationName>(18).fill("Pimpri, Pune"),
    ...Array<LocationName>(12).fill("Nashik Road, Nashik"),
    ...Array<LocationName>(6).fill("Central Nashik"),
    ...Array<LocationName>(5).fill("Nagpur Central"),
    ...Array<LocationName>(5).fill("Mumbai Suburbs"),
    ...Array<LocationName>(4).fill("Thane"),
  ];
  const templates: Record<
    Category,
    Record<"English" | "Hindi" | "Marathi", string[]>
  > = {
    Water: {
      English: [
        "Water supply has been irregular in our locality for several days.",
        "Families in our area have no reliable access to drinking water.",
      ],
      Hindi: [
        "हमारे इलाके में कई दिनों से पानी की समस्या है।",
        "हमारे मोहल्ले में पानी की आपूर्ति नियमित नहीं है।",
      ],
      Marathi: [
        "आमच्या भागात गेल्या काही दिवसांपासून पाणी येत नाही.",
        "आमच्या परिसरातील पाणीपुरवठा अनियमित आहे.",
      ],
    },
    Road: {
      English: [
        "The road in our area has several potholes and is unsafe at night.",
        "Please inspect the damaged road near homes and the local school.",
      ],
      Hindi: [
        "हमारे इलाके की सड़क पर कई गड्ढे हैं और रात में चलना मुश्किल है।",
        "कृपया हमारे क्षेत्र की खराब सड़क की मरम्मत करें।",
      ],
      Marathi: [
        "आमच्या भागातील रस्ता खड्ड्यांनी भरला आहे.",
        "शाळेजवळील खराब रस्त्याची दुरुस्ती करावी.",
      ],
    },
    Transport: {
      English: [
        "There are not enough buses for residents during the morning commute.",
        "A nearby bus stop would improve transport access for our locality.",
      ],
      Hindi: [
        "हमारे इलाके में बस की सुविधा बहुत कम है।",
        "सुबह के समय हमारे क्षेत्र में बसें बहुत कम चलती हैं।",
      ],
      Marathi: [
        "आमच्या भागात सकाळच्या वेळी बसची सुविधा कमी आहे.",
        "जवळच्या परिसरासाठी आणखी बस सेवा सुरू करावी.",
      ],
    },
    Healthcare: {
      English: [
        "Residents have difficulty reaching a nearby health clinic.",
        "Our area needs better access to primary healthcare services.",
      ],
      Hindi: [
        "हमारे इलाके में नजदीकी स्वास्थ्य केंद्र तक पहुंचना मुश्किल है।",
        "क्षेत्र में प्राथमिक स्वास्थ्य सेवाओं की आवश्यकता है।",
      ],
      Marathi: [
        "आमच्या भागातील नागरिकांना जवळच्या दवाखान्यात पोहोचणे कठीण आहे.",
        "परिसरात प्राथमिक आरोग्य सेवांची उपलब्धता वाढवावी.",
      ],
    },
    Internet: {
      English: [
        "Mobile internet connectivity is unreliable across our neighbourhood.",
        "Network coverage drops frequently in our residential area.",
      ],
      Hindi: [
        "हमारे इलाके में इंटरनेट और नेटवर्क कनेक्टिविटी कमजोर है।",
        "रिहायशी क्षेत्र में मोबाइल नेटवर्क बार-बार बंद हो जाता है।",
      ],
      Marathi: [
        "आमच्या परिसरात इंटरनेट आणि नेटवर्क कनेक्टिव्हिटी कमी आहे.",
        "रहिवासी भागात मोबाईल नेटवर्क वारंवार बंद पडते.",
      ],
    },
  };
  const languages = ["English", "Hindi", "Marathi"] as const;
  return Array.from({ length: count }, (_, index): NewComplaint => {
    const locationName =
      weightedLocations[Math.floor(Math.random() * weightedLocations.length)]!;
    const category = categoryByLocation[locationName];
    const language = languages[index % languages.length]!;
    const issueTemplates = templates[category][language];
    const complaintText =
      issueTemplates[Math.floor(Math.random() * issueTemplates.length)]!;
    const priority =
      index % 7 === 0 ? "High" : index % 4 === 0 ? "Low" : "Medium";
    return {
      complaintText,
      language,
      locationName,
      isDemo: true,
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000),
      ).toISOString(),
      analysis: {
        category,
        priority,
        priorityReason:
          priority === "High"
            ? "Synthetic example of a higher-urgency essential-service or safety concern."
            : priority === "Low"
              ? "Synthetic example of a suggested service improvement."
              : "Synthetic example of a local infrastructure concern requiring review.",
        summary: `${category} access request in ${locationName}.`,
        affectedGroup: "Local residents",
        recommendedDepartment: departments[category],
        recommendedAction: actions[category],
        confidence: 0.91,
        usedFallback: true,
      },
    };
  });
}