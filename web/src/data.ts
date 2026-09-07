export type Facility = {
  id: string;
  name: string;
  address: string;
  city: string;
  enrollment: number;
  capacity: number;
  revenue: number;
  complianceScore: number;
  status: "good" | "warning" | "alert";
  rooms: Room[];
};

export type Room = {
  id: string;
  name: string;
  ageGroup: "infant" | "toddler" | "preschool" | "school-age";
  ratioLimit: number; // max children per staff
  staffCount: number;
  childrenPresent: number;
  capacity: number;
};

export type Child = {
  id: string;
  name: string;
  dob: string;
  room: string;
  facilityId: string;
  status: "active" | "waitlist" | "inquiry" | "enrolled";
  guardian: string;
  guardianPhone: string;
  immunizationStatus: "current" | "missing" | "expires-soon";
  checkedIn: boolean;
  enrollmentDate: string;
  tuitionStatus: "current" | "overdue" | "pending";
};

export type Staff = {
  id: string;
  name: string;
  role: string;
  facilityId: string;
  room: string;
  certifications: Certification[];
  backgroundScreening: { status: "clear" | "pending" | "expired"; expiresDate: string };
  scheduledShifts: string[];
};

export type Certification = {
  name: string;
  expiry: string;
  status: "valid" | "expiring-soon" | "expired";
};

export type Invoice = {
  id: string;
  family: string;
  child: string;
  facilityId: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  period: string;
};

export type Incident = {
  id: string;
  childName: string;
  facilityId: string;
  date: string;
  type: string;
  description: string;
  reportedBy: string;
  guardianNotified: boolean;
  guardianSigned: boolean;
  severity: "low" | "medium" | "high";
};

export type Message = {
  id: string;
  thread: string;
  from: string;
  fromRole: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  read: boolean;
  facilityId: string;
  childId?: string;
};

export type LogEntry = {
  id: string;
  childId: string;
  childName: string;
  facilityId: string;
  room: string;
  timestamp: string;
  type: "meal" | "nap" | "diaper" | "bathroom" | "note" | "incident";
  detail: string;
  loggedBy: string;
};

export type EnrollmentLead = {
  id: string;
  childName: string;
  guardianName: string;
  phone: string;
  email: string;
  facilityId: string;
  ageGroup: string;
  stage: "inquiry" | "tour" | "waitlist" | "application" | "paperwork" | "active";
  createdAt: string;
  notes: string;
};

// ─── Facilities ───────────────────────────────────────────────
export const facilities: Facility[] = [
  {
    id: "f1",
    name: "Coral Springs Center",
    address: "4400 W Sample Rd",
    city: "Coral Springs, FL 33073",
    enrollment: 62,
    capacity: 72,
    revenue: 41800,
    complianceScore: 97,
    status: "good",
    rooms: [
      { id: "r1", name: "Bluebell Infants", ageGroup: "infant", ratioLimit: 4, staffCount: 3, childrenPresent: 11, capacity: 12 },
      { id: "r2", name: "Sunflower Toddlers", ageGroup: "toddler", ratioLimit: 6, staffCount: 2, childrenPresent: 12, capacity: 12 },
      { id: "r3", name: "Clover Preschool", ageGroup: "preschool", ratioLimit: 15, staffCount: 2, childrenPresent: 22, capacity: 30 },
      { id: "r4", name: "Maple School-Age", ageGroup: "school-age", ratioLimit: 20, staffCount: 1, childrenPresent: 17, capacity: 18 },
    ],
  },
  {
    id: "f2",
    name: "Boca Raton Center",
    address: "1551 Glades Rd",
    city: "Boca Raton, FL 33431",
    enrollment: 48,
    capacity: 60,
    revenue: 33600,
    complianceScore: 89,
    status: "warning",
    rooms: [
      { id: "r5", name: "Daisy Infants", ageGroup: "infant", ratioLimit: 4, staffCount: 2, childrenPresent: 7, capacity: 8 },
      { id: "r6", name: "Tulip Toddlers", ageGroup: "toddler", ratioLimit: 6, staffCount: 2, childrenPresent: 11, capacity: 12 },
      { id: "r7", name: "Rose Preschool", ageGroup: "preschool", ratioLimit: 15, staffCount: 2, childrenPresent: 18, capacity: 30 },
      { id: "r8", name: "Oak School-Age", ageGroup: "school-age", ratioLimit: 20, staffCount: 1, childrenPresent: 12, capacity: 10 },
    ],
  },
  {
    id: "f3",
    name: "Pompano Beach Center",
    address: "2100 NE 14th St",
    city: "Pompano Beach, FL 33060",
    enrollment: 35,
    capacity: 50,
    revenue: 24500,
    complianceScore: 94,
    status: "good",
    rooms: [
      { id: "r9", name: "Lily Infants", ageGroup: "infant", ratioLimit: 4, staffCount: 2, childrenPresent: 7, capacity: 8 },
      { id: "r10", name: "Violet Toddlers", ageGroup: "toddler", ratioLimit: 6, staffCount: 2, childrenPresent: 12, capacity: 12 },
      { id: "r11", name: "Iris Preschool", ageGroup: "preschool", ratioLimit: 15, staffCount: 2, childrenPresent: 16, capacity: 30 },
    ],
  },
];

// ─── Children ─────────────────────────────────────────────────
export const children: Child[] = [
  { id: "c1", name: "Amelia Torres", dob: "2024-02-14", room: "Bluebell Infants", facilityId: "f1", status: "active", guardian: "Maria Torres", guardianPhone: "(954) 555-0142", immunizationStatus: "current", checkedIn: true, enrollmentDate: "2024-08-01", tuitionStatus: "current" },
  { id: "c2", name: "Noah Patel", dob: "2024-05-20", room: "Bluebell Infants", facilityId: "f1", status: "active", guardian: "Priya Patel", guardianPhone: "(954) 555-0198", immunizationStatus: "expires-soon", checkedIn: true, enrollmentDate: "2024-09-01", tuitionStatus: "current" },
  { id: "c3", name: "Sofia Reyes", dob: "2023-01-10", room: "Sunflower Toddlers", facilityId: "f1", status: "active", guardian: "Carlos Reyes", guardianPhone: "(954) 555-0267", immunizationStatus: "current", checkedIn: false, enrollmentDate: "2023-07-15", tuitionStatus: "overdue" },
  { id: "c4", name: "Liam Johnson", dob: "2022-11-03", room: "Sunflower Toddlers", facilityId: "f1", status: "active", guardian: "Sarah Johnson", guardianPhone: "(954) 555-0311", immunizationStatus: "current", checkedIn: true, enrollmentDate: "2023-02-01", tuitionStatus: "current" },
  { id: "c5", name: "Ava Kim", dob: "2021-06-22", room: "Clover Preschool", facilityId: "f1", status: "active", guardian: "Mina Kim", guardianPhone: "(954) 555-0489", immunizationStatus: "current", checkedIn: true, enrollmentDate: "2022-08-15", tuitionStatus: "current" },
  { id: "c6", name: "James Williams", dob: "2021-03-15", room: "Clover Preschool", facilityId: "f1", status: "active", guardian: "Denise Williams", guardianPhone: "(954) 555-0502", immunizationStatus: "missing", checkedIn: true, enrollmentDate: "2022-09-01", tuitionStatus: "pending" },
  { id: "c7", name: "Isabella Cruz", dob: "2018-09-01", room: "Maple School-Age", facilityId: "f1", status: "active", guardian: "Roberto Cruz", guardianPhone: "(954) 555-0634", immunizationStatus: "current", checkedIn: false, enrollmentDate: "2021-08-01", tuitionStatus: "current" },
  { id: "c8", name: "Oliver Nguyen", dob: "2024-03-05", room: "Daisy Infants", facilityId: "f2", status: "active", guardian: "Lan Nguyen", guardianPhone: "(561) 555-0123", immunizationStatus: "current", checkedIn: true, enrollmentDate: "2024-09-01", tuitionStatus: "current" },
  { id: "c9", name: "Emma Garcia", dob: "2022-08-18", room: "Tulip Toddlers", facilityId: "f2", status: "active", guardian: "Luis Garcia", guardianPhone: "(561) 555-0244", immunizationStatus: "expires-soon", checkedIn: true, enrollmentDate: "2023-04-01", tuitionStatus: "current" },
  { id: "c10", name: "Ethan Brown", dob: "2021-12-01", room: "Rose Preschool", facilityId: "f2", status: "active", guardian: "Karen Brown", guardianPhone: "(561) 555-0388", immunizationStatus: "current", checkedIn: false, enrollmentDate: "2023-01-10", tuitionStatus: "overdue" },
];

// ─── Enrollment Leads ─────────────────────────────────────────
export const enrollmentLeads: EnrollmentLead[] = [
  { id: "e1", childName: "Mia Fernandez", guardianName: "Ana Fernandez", phone: "(954) 555-0711", email: "ana.f@email.com", facilityId: "f1", ageGroup: "Infant (0–18 mo)", stage: "inquiry", createdAt: "2026-08-28", notes: "Interested in Jan start. Father works nearby." },
  { id: "e2", childName: "Lucas Shaw", guardianName: "David Shaw", phone: "(954) 555-0822", email: "dshaw@email.com", facilityId: "f1", ageGroup: "Toddler (18–36 mo)", stage: "tour", createdAt: "2026-08-20", notes: "Tour scheduled Fri 9am." },
  { id: "e3", childName: "Chloe Martin", guardianName: "Renee Martin", phone: "(954) 555-0933", email: "renee.m@email.com", facilityId: "f1", ageGroup: "Preschool (3–5 yr)", stage: "waitlist", createdAt: "2026-08-01", notes: "On waitlist for Clover room." },
  { id: "e4", childName: "Henry Wilson", guardianName: "Tom Wilson", phone: "(954) 555-1044", email: "twilson@email.com", facilityId: "f1", ageGroup: "Preschool (3–5 yr)", stage: "application", createdAt: "2026-07-25", notes: "Application received. Awaiting references." },
  { id: "e5", childName: "Zoe Anderson", guardianName: "Beth Anderson", phone: "(954) 555-1155", email: "banderson@email.com", facilityId: "f1", ageGroup: "Infant (0–18 mo)", stage: "paperwork", createdAt: "2026-07-10", notes: "DH 680 pending. Start date Sept 15." },
  { id: "e6", childName: "Jack Thompson", guardianName: "Laura Thompson", phone: "(561) 555-1266", email: "l.thompson@email.com", facilityId: "f2", ageGroup: "Toddler (18–36 mo)", stage: "active", createdAt: "2026-06-01", notes: "Enrolled. All docs received." },
];

// ─── Staff ────────────────────────────────────────────────────
export const staff: Staff[] = [
  {
    id: "s1", name: "Denise Morales", role: "Lead Teacher", facilityId: "f1", room: "Bluebell Infants",
    certifications: [
      { name: "CPR/First Aid", expiry: "2027-03-15", status: "valid" },
      { name: "DCF 40-Hour Training", expiry: "2027-06-01", status: "valid" },
    ],
    backgroundScreening: { status: "clear", expiresDate: "2029-01-10" },
    scheduledShifts: ["Mon 7am–3pm", "Tue 7am–3pm", "Wed 7am–3pm", "Thu 7am–3pm", "Fri 7am–3pm"],
  },
  {
    id: "s2", name: "Rashida Okafor", role: "Assistant Teacher", facilityId: "f1", room: "Bluebell Infants",
    certifications: [
      { name: "CPR/First Aid", expiry: "2026-09-20", status: "expiring-soon" },
      { name: "DCF 40-Hour Training", expiry: "2027-01-15", status: "valid" },
    ],
    backgroundScreening: { status: "clear", expiresDate: "2028-07-22" },
    scheduledShifts: ["Mon 9am–5pm", "Tue 9am–5pm", "Thu 9am–5pm", "Fri 9am–5pm"],
  },
  {
    id: "s3", name: "Gloria Sánchez", role: "Lead Teacher", facilityId: "f1", room: "Sunflower Toddlers",
    certifications: [
      { name: "CPR/First Aid", expiry: "2025-12-01", status: "expired" },
      { name: "DCF 40-Hour Training", expiry: "2028-02-10", status: "valid" },
    ],
    backgroundScreening: { status: "clear", expiresDate: "2027-04-05" },
    scheduledShifts: ["Mon 8am–4pm", "Tue 8am–4pm", "Wed 8am–4pm", "Thu 8am–4pm"],
  },
  {
    id: "s4", name: "Marcus Webb", role: "Assistant Teacher", facilityId: "f1", room: "Clover Preschool",
    certifications: [
      { name: "CPR/First Aid", expiry: "2027-11-30", status: "valid" },
      { name: "DCF 40-Hour Training", expiry: "2028-05-20", status: "valid" },
    ],
    backgroundScreening: { status: "pending", expiresDate: "—" },
    scheduledShifts: ["Mon 9am–5pm", "Wed 9am–5pm", "Fri 9am–5pm"],
  },
  {
    id: "s5", name: "Jade Osei", role: "Lead Teacher", facilityId: "f2", room: "Daisy Infants",
    certifications: [
      { name: "CPR/First Aid", expiry: "2027-07-14", status: "valid" },
      { name: "DCF 40-Hour Training", expiry: "2027-09-01", status: "valid" },
    ],
    backgroundScreening: { status: "clear", expiresDate: "2028-12-01" },
    scheduledShifts: ["Mon 7am–3pm", "Tue 7am–3pm", "Wed 7am–3pm", "Thu 7am–3pm", "Fri 7am–3pm"],
  },
];

// ─── Invoices ─────────────────────────────────────────────────
export const invoices: Invoice[] = [
  { id: "inv001", family: "Torres Family", child: "Amelia Torres", facilityId: "f1", amount: 1450, dueDate: "2026-09-01", status: "paid", period: "September 2026" },
  { id: "inv002", family: "Patel Family", child: "Noah Patel", facilityId: "f1", amount: 1450, dueDate: "2026-09-01", status: "pending", period: "September 2026" },
  { id: "inv003", family: "Reyes Family", child: "Sofia Reyes", facilityId: "f1", amount: 1250, dueDate: "2026-08-01", status: "overdue", period: "August 2026" },
  { id: "inv004", family: "Johnson Family", child: "Liam Johnson", facilityId: "f1", amount: 1250, dueDate: "2026-09-01", status: "paid", period: "September 2026" },
  { id: "inv005", family: "Kim Family", child: "Ava Kim", facilityId: "f1", amount: 1100, dueDate: "2026-09-01", status: "paid", period: "September 2026" },
  { id: "inv006", family: "Williams Family", child: "James Williams", facilityId: "f1", amount: 1100, dueDate: "2026-09-01", status: "pending", period: "September 2026" },
  { id: "inv007", family: "Cruz Family", child: "Isabella Cruz", facilityId: "f1", amount: 850, dueDate: "2026-09-01", status: "paid", period: "September 2026" },
  { id: "inv008", family: "Nguyen Family", child: "Oliver Nguyen", facilityId: "f2", amount: 1450, dueDate: "2026-09-01", status: "paid", period: "September 2026" },
  { id: "inv009", family: "Garcia Family", child: "Emma Garcia", facilityId: "f2", amount: 1250, dueDate: "2026-09-01", status: "paid", period: "September 2026" },
  { id: "inv010", family: "Brown Family", child: "Ethan Brown", facilityId: "f2", amount: 1100, dueDate: "2026-08-01", status: "overdue", period: "August 2026" },
  { id: "inv011", family: "Torres Family", child: "Amelia Torres", facilityId: "f1", amount: 1450, dueDate: "2026-08-01", status: "paid", period: "August 2026" },
  { id: "inv012", family: "Torres Family", child: "Amelia Torres", facilityId: "f1", amount: 1450, dueDate: "2026-07-01", status: "paid", period: "July 2026" },
  { id: "inv013", family: "Patel Family", child: "Noah Patel", facilityId: "f1", amount: 1450, dueDate: "2026-08-01", status: "paid", period: "August 2026" },
];

// ─── Incidents ────────────────────────────────────────────────
export const incidents: Incident[] = [
  { id: "i1", childName: "Noah Patel", facilityId: "f1", date: "2026-08-29", type: "Minor Injury", description: "Child scraped knee during outdoor play. Cleaned and bandaged. No further treatment required.", reportedBy: "Denise Morales", guardianNotified: true, guardianSigned: true, severity: "low" },
  { id: "i2", childName: "Sofia Reyes", facilityId: "f1", date: "2026-08-27", type: "Behavioral Incident", description: "Child bit another child on the arm during free play. Ice applied to affected area. Both families notified.", reportedBy: "Gloria Sánchez", guardianNotified: true, guardianSigned: false, severity: "medium" },
  { id: "i3", childName: "Emma Garcia", facilityId: "f2", date: "2026-08-25", type: "Illness", description: "Child presented with fever of 101.2°F. Parent called for pickup. Child excluded per illness policy.", reportedBy: "Jade Osei", guardianNotified: true, guardianSigned: true, severity: "low" },
  { id: "i4", childName: "Ethan Brown", facilityId: "f2", date: "2026-08-22", type: "Ratio Alert", description: "Room was briefly over 1:15 ratio for 4 minutes during shift transition. Staff adjusted immediately.", reportedBy: "System (Auto-logged)", guardianNotified: false, guardianSigned: false, severity: "high" },
];

// ─── Messages ─────────────────────────────────────────────────
export const messages: Message[] = [
  { id: "m1", thread: "t1", from: "Maria Torres", fromRole: "Guardian", to: "Denise Morales", subject: "Amelia pickup today", preview: "Hi Denise, my mother will be picking up Amelia today around 3:30...", body: "Hi Denise, my mother will be picking up Amelia today around 3:30. Her name is Carmen Torres and she's on the authorized pickup list. Just wanted to give you a heads-up!", timestamp: "2026-08-31 08:14", read: false, facilityId: "f1", childId: "c1" },
  { id: "m2", thread: "t2", from: "Priya Patel", fromRole: "Guardian", to: "Office Admin", subject: "Invoice question — August", preview: "Hello, I noticed my August invoice shows a different amount than...", body: "Hello, I noticed my August invoice shows a different amount than what I expected. Could someone please review this? Thank you.", timestamp: "2026-08-30 15:42", read: false, facilityId: "f1", childId: "c2" },
  { id: "m3", thread: "t3", from: "Gloria Sánchez", fromRole: "Teacher", to: "Office Admin", subject: "Allergy alert — Sofia Reyes", preview: "Please note Sofia has developed a new allergy to tree nuts...", body: "Please note Sofia has developed a new allergy to tree nuts per the doctor's note received today. Please update her file and flag for the kitchen.", timestamp: "2026-08-29 11:05", read: true, facilityId: "f1", childId: "c3" },
  { id: "m4", thread: "t4", from: "Admin — Sunshine Childcare Group", fromRole: "Operator", to: "All Staff", subject: "[Broadcast] Labor Day schedule", preview: "Reminder: all three centers will be CLOSED Monday, Sept 1st...", body: "Reminder: all three centers will be CLOSED Monday, September 1st for Labor Day. Emergency contact for facility issues: (954) 555-0001.", timestamp: "2026-08-28 09:00", read: true, facilityId: "f1" },
  { id: "m5", thread: "t5", from: "Karen Brown", fromRole: "Guardian", to: "Jade Osei", subject: "Ethan's sleep schedule update", preview: "Hi, we've been working on Ethan's nap schedule at home and...", body: "Hi, we have been working on Ethan's nap schedule at home and he is now napping from about 1pm to 2:30pm. Hoping this matches closer to the room schedule.", timestamp: "2026-08-28 07:55", read: true, facilityId: "f2", childId: "c10" },
];

// ─── Daily Logs ───────────────────────────────────────────────
export const logEntries: LogEntry[] = [
  { id: "l1", childId: "c1", childName: "Amelia Torres", facilityId: "f1", room: "Bluebell Infants", timestamp: "08:02", type: "meal", detail: "4 oz formula, finished completely", loggedBy: "Denise Morales" },
  { id: "l2", childId: "c2", childName: "Noah Patel", facilityId: "f1", room: "Bluebell Infants", timestamp: "08:15", type: "diaper", detail: "Wet diaper, changed", loggedBy: "Rashida Okafor" },
  { id: "l3", childId: "c1", childName: "Amelia Torres", facilityId: "f1", room: "Bluebell Infants", timestamp: "09:30", type: "nap", detail: "Nap started — swaddled", loggedBy: "Denise Morales" },
  { id: "l4", childId: "c3", childName: "Sofia Reyes", facilityId: "f1", room: "Sunflower Toddlers", timestamp: "08:45", type: "meal", detail: "Half a banana, crackers, juice — ate well", loggedBy: "Gloria Sánchez" },
  { id: "l5", childId: "c4", childName: "Liam Johnson", facilityId: "f1", room: "Sunflower Toddlers", timestamp: "09:00", type: "bathroom", detail: "Used potty, successful", loggedBy: "Gloria Sánchez" },
  { id: "l6", childId: "c5", childName: "Ava Kim", facilityId: "f1", room: "Clover Preschool", timestamp: "09:10", type: "note", detail: "Reported stomachache, monitoring. Ate breakfast normally.", loggedBy: "Marcus Webb" },
  { id: "l7", childId: "c2", childName: "Noah Patel", facilityId: "f1", room: "Bluebell Infants", timestamp: "10:00", type: "meal", detail: "5 oz formula, finished", loggedBy: "Rashida Okafor" },
  { id: "l8", childId: "c1", childName: "Amelia Torres", facilityId: "f1", room: "Bluebell Infants", timestamp: "10:45", type: "nap", detail: "Woke from nap — alert and happy", loggedBy: "Denise Morales" },
  { id: "l9", childId: "c6", childName: "James Williams", facilityId: "f1", room: "Clover Preschool", timestamp: "10:20", type: "incident", detail: "Small fall during circle time — no injury observed, monitored for 15 min", loggedBy: "Marcus Webb" },
];

// ─── Auth / Roles ─────────────────────────────────────────────
/** Sign-in card the user picks. */
export type LoginRole = "admin" | "staff" | "parent";
/** Actual permission level. "admin" card signs in either an owner (all centers) or a director (one center). */
export type Role = "owner" | "director" | "staff" | "parent";

export type DemoUser = {
  id: string;
  role: Role;
  name: string;
  email: string;
  /** owner/director + parent: password · staff: 4-digit PIN */
  secret: string;
  title: string;
  facilityId: string;
  /** staff only — the room they're assigned to */
  room?: string;
  /** staff only — links to the staff[] record */
  staffId?: string;
  /** parent only — children they're linked to */
  childIds?: string[];
  /** parent only — 10-digit family code for first-time setup */
  familyCode?: string;
  initials: string;
};

export const demoUsers: DemoUser[] = [
  { id: "u-admin", role: "owner", name: "Gene Oglesby", email: "gene@sunshinechildcare.com", secret: "demo1234", title: "Owner / Operator", facilityId: "f1", initials: "GO" },
  { id: "u-director", role: "director", name: "Patricia Lane", email: "patricia@sunshinechildcare.com", secret: "demo1234", title: "Center Director · Coral Springs", facilityId: "f1", initials: "PL" },
  { id: "u-staff", role: "staff", name: "Denise Morales", email: "denise@sunshinechildcare.com", secret: "2468", title: "Lead Teacher · Bluebell Infants", facilityId: "f1", room: "Bluebell Infants", staffId: "s1", initials: "DM" },
  { id: "u-staff2", role: "staff", name: "Gloria Sánchez", email: "gloria@sunshinechildcare.com", secret: "1357", title: "Lead Teacher · Sunflower Toddlers", facilityId: "f1", room: "Sunflower Toddlers", staffId: "s3", initials: "GS" },
  { id: "u-parent", role: "parent", name: "Maria Torres", email: "maria.torres@email.com", secret: "demo1234", title: "Parent of Amelia", facilityId: "f1", childIds: ["c1"], familyCode: "4471-2290-58", initials: "MT" },
  { id: "u-parent2", role: "parent", name: "Priya Patel", email: "priya.patel@email.com", secret: "demo1234", title: "Parent of Noah", facilityId: "f1", childIds: ["c2"], familyCode: "8813-0042-71", initials: "PP" },
];

// ─── Parent-portal data ───────────────────────────────────────
export type ChildDocument = {
  id: string;
  childId: string;
  name: string;
  formCode?: string;
  status: "on-file" | "needs-signature" | "missing" | "expires-soon";
  date?: string;
  required: boolean;
};

export const childDocuments: ChildDocument[] = [
  { id: "d1", childId: "c1", name: "Florida Certification of Immunization", formCode: "DH 680", status: "on-file", date: "2026-02-10", required: true },
  { id: "d2", childId: "c1", name: "Enrollment Agreement 2026–27", status: "needs-signature", required: true },
  { id: "d3", childId: "c1", name: "Emergency Contacts & Authorized Pickups", status: "on-file", date: "2024-08-01", required: true },
  { id: "d4", childId: "c1", name: "Photo & Media Consent", status: "on-file", date: "2024-08-01", required: false },
  { id: "d5", childId: "c2", name: "Florida Certification of Immunization", formCode: "DH 680", status: "expires-soon", date: "2026-09-30", required: true },
  { id: "d6", childId: "c2", name: "Enrollment Agreement 2026–27", status: "on-file", date: "2026-08-15", required: true },
  { id: "d7", childId: "c2", name: "Emergency Contacts & Authorized Pickups", status: "on-file", date: "2024-09-01", required: true },
  { id: "d8", childId: "c2", name: "Photo & Media Consent", status: "missing", required: false },
];

export type AuthorizedPickup = {
  id: string;
  childId: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
};

export const authorizedPickups: AuthorizedPickup[] = [
  { id: "p1", childId: "c1", name: "Maria Torres", relationship: "Mother", phone: "(954) 555-0142", isPrimary: true },
  { id: "p2", childId: "c1", name: "Daniel Torres", relationship: "Father", phone: "(954) 555-0143", isPrimary: true },
  { id: "p3", childId: "c1", name: "Carmen Torres", relationship: "Grandmother", phone: "(954) 555-0177", isPrimary: false },
  { id: "p4", childId: "c2", name: "Priya Patel", relationship: "Mother", phone: "(954) 555-0198", isPrimary: true },
  { id: "p5", childId: "c2", name: "Arjun Patel", relationship: "Father", phone: "(954) 555-0199", isPrimary: true },
];

export type FeedItem = {
  id: string;
  childId: string;
  time: string;
  type: "checkin" | "meal" | "nap" | "diaper" | "bathroom" | "photo" | "note" | "mood" | "learning";
  title: string;
  detail?: string;
  by: string;
  /** emoji stand-in for a photo in the demo */
  photo?: string;
};

export const feed: FeedItem[] = [
  { id: "fd1", childId: "c1", time: "07:52", type: "checkin", title: "Checked in", detail: "Dropped off by Maria Torres · signed", by: "Denise Morales" },
  { id: "fd2", childId: "c1", time: "08:02", type: "meal", title: "Bottle · 4 oz formula", detail: "Finished completely", by: "Denise Morales" },
  { id: "fd3", childId: "c1", time: "08:40", type: "mood", title: "Happy & playful", detail: "Enjoyed tummy time with the sensory mat", by: "Rashida Okafor" },
  { id: "fd4", childId: "c1", time: "09:30", type: "nap", title: "Nap started", detail: "Swaddled, fell asleep in about 5 minutes", by: "Denise Morales" },
  { id: "fd5", childId: "c1", time: "10:45", type: "nap", title: "Woke from nap", detail: "1 hr 15 min · alert and happy", by: "Denise Morales" },
  { id: "fd6", childId: "c1", time: "11:05", type: "photo", title: "Music time 🎶", detail: "Amelia loved the shaker eggs today!", by: "Rashida Okafor", photo: "🎵" },
  { id: "fd7", childId: "c1", time: "11:30", type: "diaper", title: "Diaper · wet", detail: "Changed, cream applied", by: "Denise Morales" },
  { id: "fd8", childId: "c1", time: "12:10", type: "learning", title: "Reaching & grasping", detail: "Reached for and held a soft block with both hands — FL Early Learning Standard: Motor Development", by: "Denise Morales" },
  { id: "fd9", childId: "c2", time: "08:10", type: "checkin", title: "Checked in", detail: "Dropped off by Priya Patel · signed", by: "Rashida Okafor" },
  { id: "fd10", childId: "c2", time: "08:15", type: "diaper", title: "Diaper · wet", detail: "Changed", by: "Rashida Okafor" },
  { id: "fd11", childId: "c2", time: "10:00", type: "meal", title: "Bottle · 5 oz formula", detail: "Finished", by: "Rashida Okafor" },
  { id: "fd12", childId: "c2", time: "10:20", type: "photo", title: "Outdoor stroll ☀️", detail: "Fresh air in the shaded courtyard", by: "Denise Morales", photo: "🌳" },
  { id: "fd13", childId: "c2", time: "11:40", type: "nap", title: "Nap started", by: "Rashida Okafor" },
];

export type ParentThread = {
  id: string;
  childId: string;
  /** teacher = child's classroom · office = admin-only, per Procare's pattern */
  kind: "teacher" | "office";
  with: string;
  messages: { id: string; from: "me" | "them"; name: string; body: string; time: string }[];
};

export const parentThreads: ParentThread[] = [
  {
    id: "pt1", childId: "c1", kind: "teacher", with: "Bluebell Infants teachers",
    messages: [
      { id: "pm1", from: "me", name: "Maria Torres", body: "Hi Denise, my mother will be picking up Amelia today around 3:30. Her name is Carmen Torres and she's on the authorized pickup list.", time: "08:14" },
      { id: "pm2", from: "them", name: "Denise Morales", body: "Got it, thank you Maria! We'll have her ready. Amelia's had a great morning so far 😊", time: "08:21" },
    ],
  },
  {
    id: "pt2", childId: "c1", kind: "office", with: "Coral Springs office",
    messages: [
      { id: "pm3", from: "them", name: "Front Office", body: "Reminder: all centers are closed Monday, Sept 1 for Labor Day.", time: "Aug 28" },
    ],
  },
  {
    id: "pt3", childId: "c2", kind: "office", with: "Coral Springs office",
    messages: [
      { id: "pm4", from: "me", name: "Priya Patel", body: "Hello, I noticed my August invoice shows a different amount than I expected. Could someone please review this?", time: "Aug 30" },
      { id: "pm5", from: "them", name: "Front Office", body: "Hi Priya — looking into it now, we'll have an answer for you by tomorrow morning.", time: "Aug 30" },
    ],
  },
  { id: "pt4", childId: "c2", kind: "teacher", with: "Bluebell Infants teachers", messages: [] },
];
