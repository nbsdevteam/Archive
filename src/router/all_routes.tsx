export const all_routes: Record<string, string> = {
  // dashboards
  adminDashboard: "/index",
  dashboard: "/dashboard",

  // archive module
  archiveFolders: "/archive/folders",
  archiveDocuments: "/archive/documents",
  archiveUpload: "/archive/upload",
  archiveTrash: "/archive/trash",
  archiveActivity: "/archive/activity",

  // documents + folders
  documents: "/documents",
  documentsUpload: "/documents/upload",
  documentsTrash: "/documents/trash",
  documentDetail: "/documents/:id",
  /** View a single attachment (preview) for a document. */
  documentAttachmentView: "/documents/:id/attachments/:attachmentId",
  folders: "/folders",
  folderDetail: "/folders/:id",
  editRequests: "/edit-requests",
  signatures: "/signatures",
  notes: "/notes",
  notifications: "/notifications",
  permissions: "/admin/permissions",
  search: "/search",

  // auth routes
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  emailVerification: "/email-verification",
  twoStepVerification: "/two-step-verification",
};
