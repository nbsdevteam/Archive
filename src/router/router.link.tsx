import { Navigate } from "react-router-dom";
import { all_routes } from "./all_routes";
import { PublicRoute } from "../app/routes/PublicRoute";
import {
  ActivityPage,
  CompaniesPage,
  DashboardPage,
  DocumentAttachmentViewPage,
  DocumentDetailPage,
  DocumentsPage,
  DocumentsReportPage,
  DocumentsTrashPage,
  ArchivedDocumentsPage,
  EditRequestsPage,
  FolderDetailPage,
  FoldersPage,
  Login,
  ForgotPassword,
  ResetPassword,
  NotesPage,
  NotificationsPage,
  PermissionsPage,
  SearchPage,
  SignatureRequestsPage,
  UploadDocumentPage,
} from "./lazyRoutes";

const routes = all_routes;

export const publicRoutes = [
  {
    path: "/",
    name: "Root",
    element: <Navigate to={routes.dashboard} replace />,
  },
  {
    path: routes.adminDashboard,
    element: <Navigate to={routes.dashboard} replace />,
  },
  {
    path: routes.dashboard,
    element: <DashboardPage />,
  },
  // Activity (audit/activity log)
  {
    path: routes.activity,
    element: <ActivityPage />,
  },
  // Documents
  {
    path: routes.documents,
    element: <DocumentsPage />,
  },
  {
    path: routes.documentsReport,
    element: <DocumentsReportPage />,
  },
  {
    path: routes.documentsTrash,
    element: <DocumentsTrashPage />,
  },
  {
    path: routes.archivedDocuments,
    element: <ArchivedDocumentsPage />,
  },
  {
    path: routes.documentsUpload,
    element: <UploadDocumentPage />,
  },
  {
    path: routes.documentDetail,
    element: <DocumentDetailPage />,
  },
  {
    path: routes.documentAttachmentView,
    element: <DocumentAttachmentViewPage />,
  },
  // Folders
  {
    path: routes.folders,
    element: <FoldersPage />,
  },
  {
    path: routes.folderDetail,
    element: <FolderDetailPage />,
  },
  {
    path: routes.companies,
    element: <CompaniesPage />,
  },
  // Requests + notifications
  {
    path: routes.editRequests,
    element: <EditRequestsPage />,
  },
  {
    path: routes.signatures,
    element: <SignatureRequestsPage />,
  },
  {
    path: routes.notes,
    element: <NotesPage />,
  },
  {
    path: routes.notifications,
    element: <NotificationsPage />,
  },
  {
    path: routes.permissions,
    element: <PermissionsPage />,
  },
  {
    path: routes.search,
    element: <SearchPage />,
  },
];

export const authRoutes = [
  {
    path: routes.login,
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: routes.forgotPassword,
    element: (
      <PublicRoute>
        <ForgotPassword />
      </PublicRoute>
    ),
  },
  {
    path: routes.resetPassword,
    element: (
      <PublicRoute>
        <ResetPassword />
      </PublicRoute>
    ),
  },
];

export const layoutRoutes: Array<{ path: string; element: React.ReactNode }> =
  [];
