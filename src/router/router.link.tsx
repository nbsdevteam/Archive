import { Navigate } from "react-router-dom";
import { all_routes } from "./all_routes";
import { PublicRoute } from "../app/routes/PublicRoute";
import {
  ArchiveActivity,
  ArchiveDocuments,
  ArchiveFolders,
  ArchiveTrash,
  ArchiveUpload,
  DashboardPage,
  DocumentDetailPage,
  DocumentsPage,
  EditRequestsPage,
  EmailVerification,
  ForgotPassword,
  FolderDetailPage,
  FoldersPage,
  Login,
  Register,
  ResetPassword,
  NotificationsPage,
  PermissionsPage,
  SearchPage,
  SignatureRequestsPage,
  TwoStepVerification,
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
  // Archive routes (keep for backward compatibility)
  {
    path: routes.archiveFolders,
    element: <ArchiveFolders />,
  },
  {
    path: routes.archiveDocuments,
    element: <ArchiveDocuments />,
  },
  {
    path: routes.archiveUpload,
    element: <ArchiveUpload />,
  },
  {
    path: routes.archiveTrash,
    element: <ArchiveTrash />,
  },
  {
    path: routes.archiveActivity,
    element: <ArchiveActivity />,
  },
  // Documents
  {
    path: routes.documents,
    element: <DocumentsPage />,
  },
  {
    path: routes.documentsUpload,
    element: <UploadDocumentPage />,
  },
  {
    path: routes.documentDetail,
    element: <DocumentDetailPage />,
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
    path: routes.register,
    element: (
      <PublicRoute>
        <Register />
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
  {
    path: routes.emailVerification,
    element: (
      <PublicRoute>
        <EmailVerification />
      </PublicRoute>
    ),
  },
  {
    path: routes.twoStepVerification,
    element: (
      <PublicRoute>
        <TwoStepVerification />
      </PublicRoute>
    ),
  },
];

export const layoutRoutes: Array<{ path: string; element: React.ReactNode }> = [];
