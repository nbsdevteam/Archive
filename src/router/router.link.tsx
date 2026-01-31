import { Navigate } from "react-router-dom";
import { all_routes } from "./all_routes";
import { PublicRoute } from "../app/routes/PublicRoute";
import {
  AdminDashboard,
  EmployeeDashboard,
  DashboardPage,
  DataTables,
  TablesBasic,
  Apexchart,
  PrimeReactChart,
  ChartJSExample,
  ArchiveFolders,
  ArchiveDocuments,
  ArchiveUpload,
  ArchiveTrash,
  ArchiveActivity,
  DocumentsPage,
  UploadDocumentPage,
  DocumentDetailPage,
  FoldersPage,
  FolderDetailPage,
  EditRequestsPage,
  SignatureRequestsPage,
  NotificationsPage,
  PermissionsPage,
  SearchPage,
  Login,
  Login2,
  Login3,
  Register,
  Register2,
  Register3,
  TwoStepVerification,
  TwoStepVerification2,
  TwoStepVerification3,
  EmailVerification,
  EmailVerification2,
  EmailVerification3,
  ResetPassword,
  ResetPassword2,
  ResetPassword3,
  ForgotPassword,
  ForgotPassword2,
  ForgotPassword3,
  ResetPasswordSuccess,
  ResetPasswordSuccess2,
  ResetPasswordSuccess3,
  LockScreen,
  Error404,
  Error500,
  UnderMaintenance,
  UnderConstruction,
  ComingSoon,
  LayoutDemo,
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
    path: routes.employeeDashboard,
    element: <EmployeeDashboard />,
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
  // Legacy routes (aliases to archive or new features)
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
  {
    path: routes.folders,
    element: <FoldersPage />,
  },
  {
    path: routes.folderDetail,
    element: <FolderDetailPage />,
  },
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
  // Reports (Charts + Data Tables)
  {
    path: routes.dataTables,
    element: <DataTables />,
  },
  {
    path: routes.tablesBasic,
    element: <TablesBasic />,
  },
  {
    path: routes.apexChart,
    element: <Apexchart />,
  },
  {
    path: routes.primeChart,
    element: <PrimeReactChart />,
  },
  {
    path: routes.chartJs,
    element: <ChartJSExample />,
  },
];

export const authRoutes = [
  {
    path: routes.comingSoon,
    element: <ComingSoon />,
  },
  {
    path: routes.login,
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: routes.login2,
    element: <Login2 />,
  },
  {
    path: routes.login3,
    element: <Login3 />,
  },
  {
    path: routes.register,
    element: <Register />,
  },
  {
    path: routes.register2,
    element: <Register2 />,
  },
  {
    path: routes.register3,
    element: <Register3 />,
  },
  {
    path: routes.twoStepVerification,
    element: <TwoStepVerification />,
  },
  {
    path: routes.twoStepVerification2,
    element: <TwoStepVerification2 />,
  },
  {
    path: routes.twoStepVerification3,
    element: <TwoStepVerification3 />,
  },
  {
    path: routes.emailVerification,
    element: <EmailVerification />,
  },
  {
    path: routes.emailVerification2,
    element: <EmailVerification2 />,
  },
  {
    path: routes.emailVerification3,
    element: <EmailVerification3 />,
  },
  {
    path: routes.resetPassword,
    element: <ResetPassword />,
  },
  {
    path: routes.resetPassword2,
    element: <ResetPassword2 />,
  },
  {
    path: routes.resetPassword3,
    element: <ResetPassword3 />,
  },
  {
    path: routes.forgotPassword,
    element: <ForgotPassword />,
  },
  {
    path: routes.forgotPassword2,
    element: <ForgotPassword2 />,
  },
  {
    path: routes.forgotPassword3,
    element: <ForgotPassword3 />,
  },
  {
    path: routes.error404,
    element: <Error404 />,
  },
  {
    path: routes.error500,
    element: <Error500 />,
  },
  {
    path: routes.underMaintenance,
    element: <UnderMaintenance />,
  },
  {
    path: routes.underConstruction,
    element: <UnderConstruction />,
  },
  {
    path: routes.lockScreen,
    element: <LockScreen />,
  },
  {
    path: routes.resetPasswordSuccess,
    element: <ResetPasswordSuccess />,
  },
  {
    path: routes.resetPasswordSuccess2,
    element: <ResetPasswordSuccess2 />,
  },
  {
    path: routes.resetPasswordSuccess3,
    element: <ResetPasswordSuccess3 />,
  },
];

export const layoutRoutes = [
  {
    path: routes.Horizontal,
    element: <LayoutDemo />,
  },
  {
    path: routes.Detached,
    element: <LayoutDemo />,
  },
  {
    path: routes.Modern,
    element: <Navigate to={routes.dashboard} replace />,
  },
  {
    path: routes.TwoColumn,
    element: <LayoutDemo />,
  },
  {
    path: routes.Hovered,
    element: <LayoutDemo />,
  },
  {
    path: routes.layoutDefault,
    element: <LayoutDemo />,
  },
  {
    path: routes.layoutMini,
    element: <LayoutDemo />,
  },
  {
    path: routes.layoutRtl,
    element: <LayoutDemo />,
  },
  {
    path: routes.layoutDark,
    element: <LayoutDemo />,
  },
  {
    path: routes.HorizontalSingle,
    element: <LayoutDemo />,
  },
  {
    path: routes.HorizontalOverlay,
    element: <LayoutDemo />,
  },
  {
    path: routes.HorizontalBox,
    element: <LayoutDemo />,
  },
  {
    path: routes.MenuAside,
    element: <LayoutDemo />,
  },
  {
    path: routes.Transparent,
    element: <LayoutDemo />,
  },
  {
    path: routes.WithoutHeader,
    element: <LayoutDemo />,
  },
  {
    path: routes.RTL,
    element: <LayoutDemo />,
  },
  {
    path: routes.Dark,
    element: <LayoutDemo />,
  },
  {
    path: routes.Boxed,
    element: <LayoutDemo />,
  },
];
