import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export const categories = [
  "Water",
  "Road",
  "Transport",
  "Healthcare",
  "Internet",
] as const;
export const priorities = ["High", "Medium", "Low"] as const;
export const statuses = [
  "New",
  "Under Review",
  "Action Suggested",
  "Resolved",
] as const;

export const locations = [
  {
    locationName: "Hadapsar, Pune",
    city: "Pune",
    latitude: 18.5089,
    longitude: 73.9259,
  },
  {
    locationName: "Kothrud, Pune",
    city: "Pune",
    latitude: 18.5074,
    longitude: 73.8077,
  },
  {
    locationName: "Pimpri, Pune",
    city: "Pune",
    latitude: 18.6298,
    longitude: 73.7997,
  },
  {
    locationName: "Nashik Road, Nashik",
    city: "Nashik",
    latitude: 19.95,
    longitude: 73.84,
  },
  {
    locationName: "Central Nashik",
    city: "Nashik",
    latitude: 19.9975,
    longitude: 73.7898,
  },
  {
    locationName: "Nagpur Central",
    city: "Nagpur",
    latitude: 21.1458,
    longitude: 79.0882,
  },
  {
    locationName: "Mumbai Suburbs",
    city: "Mumbai",
    latitude: 19.1136,
    longitude: 72.8697,
  },
  {
    locationName: "Thane",
    city: "Thane",
    latitude: 19.2183,
    longitude: 72.9781,
  },
] as const;

export type LocationName = (typeof locations)[number]["locationName"];
export type Category = (typeof categories)[number];
export type Priority = (typeof priorities)[number];
export type ComplaintStatus = (typeof statuses)[number];
export type City = (typeof locations)[number]["city"];

export interface ComplaintFilters {
  category?: string;
  priority?: string;
  city?: string;
  status?: string;
  search?: string;
}

export interface ComplaintAnalysis {
  category: Category;
  priority: Priority;
  priorityReason: string;
  summary: string;
  affectedGroup: string;
  recommendedDepartment: string;
  recommendedAction: string;
  confidence: number;
  usedFallback: boolean;
}

export interface NewComplaint {
  complaintText: string;
  language: "English" | "Hindi" | "Marathi";
  analysis: ComplaintAnalysis;
  locationName: LocationName;
  contactName?: string | null;
  contactPhone?: string | null;
  isDemo?: boolean;
  createdAt?: string;
}

interface RawComplaint {
  id: number;
  complaint_text: string;
  language: "English" | "Hindi" | "Marathi";
  category: Category;
  confidence: number;
  priority: Priority;
  priority_reason: string;
  summary: string;
  affected_group: string;
  recommended_department: string;
  recommended_action: string;
  location_name: LocationName;
  city: City;
  latitude: number;
  longitude: number;
  status: ComplaintStatus;
  created_at: string;
  is_demo: number;
  contact_name: string | null;
  contact_phone: string | null;
}

export interface ComplaintRecord {
  id: number;
  complaintText: string;
  language: "English" | "Hindi" | "Marathi";
  category: Category;
  confidence: number;
  priority: Priority;
  priorityReason: string;
  summary: string;
  affectedGroup: string;
  recommendedDepartment: string;
  recommendedAction: string;
  locationName: LocationName;
  city: City;
  latitude: number;
  longitude: number;
  status: ComplaintStatus;
  createdAt: string;
  isDemo: boolean;
  contactName: string | null;
  contactPhone: string | null;
}

const databasePath =
  process.env.JANCONNECT_DB_PATH ??
  resolve(import.meta.dirname, "../data/janconnect.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);
database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_text TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('English', 'Hindi', 'Marathi')),
    category TEXT NOT NULL CHECK (category IN ('Water', 'Road', 'Transport', 'Healthcare', 'Internet')),
    confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    priority_reason TEXT NOT NULL,
    summary TEXT NOT NULL,
    affected_group TEXT NOT NULL,
    recommended_department TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    location_name TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'New'
      CHECK (status IN ('New', 'Under Review', 'Action Suggested', 'Resolved')),
    created_at TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 0,
    contact_name TEXT,
    contact_phone TEXT
  );
  CREATE INDEX IF NOT EXISTS complaints_created_at_idx ON complaints(created_at);
  CREATE INDEX IF NOT EXISTS complaints_category_priority_idx ON complaints(category, priority);
  CREATE INDEX IF NOT EXISTS complaints_location_idx ON complaints(location_name);
`);

function fromRow(row: RawComplaint): ComplaintRecord {
  return {
    id: row.id,
    complaintText: row.complaint_text,
    language: row.language,
    category: row.category,
    confidence: row.confidence,
    priority: row.priority,
    priorityReason: row.priority_reason,
    summary: row.summary,
    affectedGroup: row.affected_group,
    recommendedDepartment: row.recommended_department,
    recommendedAction: row.recommended_action,
    locationName: row.location_name,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    status: row.status,
    createdAt: row.created_at,
    isDemo: row.is_demo === 1,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
  };
}

function insertStatement() {
  return database.prepare(`
    INSERT INTO complaints (
      complaint_text, language, category, confidence, priority, priority_reason,
      summary, affected_group, recommended_department, recommended_action,
      location_name, city, latitude, longitude, status, created_at, is_demo,
      contact_name, contact_phone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', ?, ?, ?, ?)
  `);
}

function insertValues(record: NewComplaint) {
  const location = locations.find(
    (candidate) => candidate.locationName === record.locationName,
  );
  if (!location) {
    throw new Error("The selected demo location is not supported.");
  }

  return [
    record.complaintText,
    record.language,
    record.analysis.category,
    record.analysis.confidence,
    record.analysis.priority,
    record.analysis.priorityReason,
    record.analysis.summary,
    record.analysis.affectedGroup,
    record.analysis.recommendedDepartment,
    record.analysis.recommendedAction,
    location.locationName,
    location.city,
    location.latitude,
    location.longitude,
    record.createdAt ?? new Date().toISOString(),
    record.isDemo ? 1 : 0,
    record.contactName || null,
    record.contactPhone || null,
  ] as const;
}

export function createComplaint(record: NewComplaint): ComplaintRecord {
  const result = insertStatement().run(...insertValues(record));
  const created = getComplaint(Number(result.lastInsertRowid));
  if (!created) {
    throw new Error("The request was saved but could not be loaded.");
  }
  return created;
}

export function createDemoComplaints(records: NewComplaint[]): number {
  const statement = insertStatement();
  database.exec("BEGIN IMMEDIATE");
  try {
    for (const record of records) {
      statement.run(...insertValues(record));
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  return records.length;
}

export function getComplaint(id: number): ComplaintRecord | undefined {
  const row = database
    .prepare("SELECT * FROM complaints WHERE id = ?")
    .get(id) as RawComplaint | undefined;
  return row ? fromRow(row) : undefined;
}

export function listComplaints(
  filters: ComplaintFilters = {},
): ComplaintRecord[] {
  const conditions: string[] = [];
  const values: (string | number)[] = [];
  if (filters.category) {
    conditions.push("category = ?");
    values.push(filters.category);
  }
  if (filters.priority) {
    conditions.push("priority = ?");
    values.push(filters.priority);
  }
  if (filters.city) {
    conditions.push("city = ?");
    values.push(filters.city);
  }
  if (filters.status) {
    conditions.push("status = ?");
    values.push(filters.status);
  }
  if (filters.search?.trim()) {
    conditions.push(
      "(complaint_text LIKE ? OR summary LIKE ? OR location_name LIKE ?)",
    );
    const search = `%${filters.search.trim()}%`;
    values.push(search, search, search);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = database
    .prepare(
      `SELECT * FROM complaints ${where} ORDER BY datetime(created_at) DESC, id DESC LIMIT 1000`,
    )
    .all(...values) as unknown as RawComplaint[];
  return rows.map(fromRow);
}

export function updateComplaintStatus(
  id: number,
  status: ComplaintStatus,
): ComplaintRecord | undefined {
  const result = database
    .prepare("UPDATE complaints SET status = ? WHERE id = ?")
    .run(status, id);
  if (result.changes === 0) {
    return undefined;
  }
  return getComplaint(id);
}

export function countComplaints(): number {
  const row = database
    .prepare("SELECT COUNT(*) AS count FROM complaints")
    .get() as { count: number };
  return row.count;
}