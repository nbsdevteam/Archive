/**
 * React Query key factory. Keys are hierarchical so a whole domain can be invalidated by its
 * root (e.g. queryKeys.documents.all covers lists, trash, counts and the report).
 */
export const queryKeys = {
  documents: {
    all: ["documents"] as const,
    list: (params: object) => ["documents", "list", params] as const,
    trash: (params: object) => ["documents", "trash", params] as const,
    count: (params: object) => ["documents", "count", params] as const,
    trashCount: () => ["documents", "trash-count"] as const,
    report: (params: object) => ["documents", "report", params] as const,
    attachments: (id: number) => ["documents", "attachments", id] as const,
  },
  folders: {
    all: ["folders"] as const,
    list: (params: object) => ["folders", "list", params] as const,
    infinite: (params: object) => ["folders", "infinite", params] as const,
  },
  notes: {
    all: ["notes"] as const,
    list: (params: object) => ["notes", "list", params] as const,
    infinite: (params: object) => ["notes", "infinite", params] as const,
  },
  audit: {
    all: ["audit"] as const,
    list: (params: object) => ["audit", "list", params] as const,
    infinite: (params: object) => ["audit", "infinite", params] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    stats: () => ["dashboard", "stats"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params: object) => ["notifications", "list", params] as const,
    unreadCount: () => ["notifications", "unread-count"] as const,
  },
  signatures: {
    all: ["signatures"] as const,
    list: (params: object) => ["signatures", "list", params] as const,
  },
  editRequests: {
    all: ["edit-requests"] as const,
    list: (params: object) => ["edit-requests", "list", params] as const,
  },
  companies: {
    all: ["companies"] as const,
    lookup: (params: object) => ["companies", "lookup", params] as const,
    list: (params: object) => ["companies", "list", params] as const,
  },
  permissions: {
    all: ["permissions"] as const,
    users: (params: object) => ["permissions", "users", params] as const,
  },
  search: {
    all: ["search"] as const,
    results: (kind: string, params: unknown) => ["search", kind, params] as const,
  },
  reference: {
    departments: () => ["reference", "departments"] as const,
    documentTypes: (departmentId: number) => ["reference", "document-types", departmentId] as const,
    tags: () => ["reference", "tags"] as const,
  },
};
