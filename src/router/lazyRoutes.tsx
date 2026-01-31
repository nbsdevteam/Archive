import React, { Suspense, lazy } from "react";
import { LoadingSpinner } from "../core/common/LoadingSpinner";

class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Lazy component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary-fallback">
            <h3>Something went wrong loading this component.</h3>
            <button onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

const createLazyComponent = (
  importFunc: () => Promise<{ default: React.ComponentType<object> }>,
  fallback?: React.ReactNode,
  preload?: boolean
) => {
  const LazyComponent = lazy(importFunc);

  if (preload) {
    importFunc();
  }

  return (props: object) => (
    <LazyErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

// Auth
export const Login = createLazyComponent(
  () => import("../features/auth/pages/LoginPage"),
  <LoadingSpinner text="Loading login..." />,
  true
);
export const Login2 = createLazyComponent(
  () => import("../feature-module/auth/login/login-2"),
  <LoadingSpinner text="Loading login..." />
);
export const Login3 = createLazyComponent(
  () => import("../feature-module/auth/login/login-3"),
  <LoadingSpinner text="Loading login..." />
);
export const Register = createLazyComponent(
  () => import("../feature-module/auth/register/register"),
  <LoadingSpinner text="Loading registration..." />
);
export const Register2 = createLazyComponent(
  () => import("../feature-module/auth/register/register-2"),
  <LoadingSpinner text="Loading registration..." />
);
export const Register3 = createLazyComponent(
  () => import("../feature-module/auth/register/register-3"),
  <LoadingSpinner text="Loading registration..." />
);
export const TwoStepVerification = createLazyComponent(
  () =>
    import("../feature-module/auth/twoStepVerification/twoStepVerification"),
  <LoadingSpinner text="Loading verification..." />
);
export const TwoStepVerification2 = createLazyComponent(
  () =>
    import("../feature-module/auth/twoStepVerification/twoStepVerification-2"),
  <LoadingSpinner text="Loading verification..." />
);
export const TwoStepVerification3 = createLazyComponent(
  () =>
    import("../feature-module/auth/twoStepVerification/twoStepVerification-3"),
  <LoadingSpinner text="Loading verification..." />
);
export const EmailVerification = createLazyComponent(
  () => import("../feature-module/auth/emailVerification/emailVerification"),
  <LoadingSpinner text="Loading email verification..." />
);
export const EmailVerification2 = createLazyComponent(
  () => import("../feature-module/auth/emailVerification/emailVerification-2"),
  <LoadingSpinner text="Loading email verification..." />
);
export const EmailVerification3 = createLazyComponent(
  () => import("../feature-module/auth/emailVerification/emailVerification-3"),
  <LoadingSpinner text="Loading email verification..." />
);
export const ResetPassword = createLazyComponent(
  () => import("../feature-module/auth/resetPassword/resetPassword"),
  <LoadingSpinner text="Loading password reset..." />
);
export const ResetPassword2 = createLazyComponent(
  () => import("../feature-module/auth/resetPassword/resetPassword-2"),
  <LoadingSpinner text="Loading password reset..." />
);
export const ResetPassword3 = createLazyComponent(
  () => import("../feature-module/auth/resetPassword/resetPassword-3"),
  <LoadingSpinner text="Loading password reset..." />
);
export const ForgotPassword = createLazyComponent(
  () => import("../feature-module/auth/forgotPassword/forgotPassword"),
  <LoadingSpinner text="Loading password reset..." />
);
export const ForgotPassword2 = createLazyComponent(
  () => import("../feature-module/auth/forgotPassword/forgotPassword-2"),
  <LoadingSpinner text="Loading password reset..." />
);
export const ForgotPassword3 = createLazyComponent(
  () => import("../feature-module/auth/forgotPassword/forgotPassword-3"),
  <LoadingSpinner text="Loading password reset..." />
);
export const ResetPasswordSuccess = createLazyComponent(
  () =>
    import("../feature-module/auth/resetPasswordSuccess/resetPasswordSuccess"),
  <LoadingSpinner text="Loading success..." />
);
export const ResetPasswordSuccess2 = createLazyComponent(
  () =>
    import(
      "../feature-module/auth/resetPasswordSuccess/resetPasswordSuccess-2"
    ),
  <LoadingSpinner text="Loading success..." />
);
export const ResetPasswordSuccess3 = createLazyComponent(
  () =>
    import(
      "../feature-module/auth/resetPasswordSuccess/resetPasswordSuccess-3"
    ),
  <LoadingSpinner text="Loading success..." />
);
export const LockScreen = createLazyComponent(
  () => import("../feature-module/auth/lockScreen"),
  <LoadingSpinner text="Loading lock screen..." />
);
export const Error404 = createLazyComponent(
  () => import("../feature-module/pages/error/error-404"),
  <LoadingSpinner text="Loading page..." />
);
export const Error500 = createLazyComponent(
  () => import("../feature-module/pages/error/error-500"),
  <LoadingSpinner text="Loading page..." />
);
export const UnderMaintenance = createLazyComponent(
  () => import("../feature-module/pages/underMaintenance"),
  <LoadingSpinner text="Loading page..." />
);
export const UnderConstruction = createLazyComponent(
  () => import("../feature-module/pages/underConstruction"),
  <LoadingSpinner text="Loading page..." />
);
export const ComingSoon = createLazyComponent(
  () => import("../feature-module/pages/coming-soon"),
  <LoadingSpinner text="Loading page..." />
);

// Dashboards
export const AdminDashboard = createLazyComponent(
  () => import("../feature-module/mainMenu/adminDashboard"),
  <LoadingSpinner text="Loading dashboard..." />
);
export const EmployeeDashboard = createLazyComponent(
  () =>
    import("../feature-module/mainMenu/employeeDashboard/employee-dashboard"),
  <LoadingSpinner text="Loading dashboard..." />
);
export const DashboardPage = createLazyComponent(
  () => import("../features/dashboard/pages/DashboardPage"),
  <LoadingSpinner text="Loading dashboard..." />
);

// Archive module
export const ArchiveFolders = createLazyComponent(
  () => import("../features/archive/pages/ArchiveFolders"),
  <LoadingSpinner text="Loading folders..." />
);
export const ArchiveDocuments = createLazyComponent(
  () => import("../features/archive/pages/ArchiveDocuments"),
  <LoadingSpinner text="Loading documents..." />
);
export const ArchiveUpload = createLazyComponent(
  () => import("../features/archive/pages/ArchiveUpload"),
  <LoadingSpinner text="Loading upload..." />
);
export const ArchiveTrash = createLazyComponent(
  () => import("../features/archive/pages/ArchiveTrash"),
  <LoadingSpinner text="Loading trash..." />
);
export const ArchiveActivity = createLazyComponent(
  () => import("../features/archive/pages/ArchiveActivity"),
  <LoadingSpinner text="Loading activity..." />
);

// Legacy feature pages (aliases or new features)
export const DocumentsPage = createLazyComponent(
  () => import("../features/documents/pages/DocumentsPage"),
  <LoadingSpinner text="Loading documents..." />
);
export const UploadDocumentPage = createLazyComponent(
  () => import("../features/documents/pages/UploadDocumentPage"),
  <LoadingSpinner text="Loading upload..." />
);
export const DocumentDetailPage = createLazyComponent(
  () => import("../features/documents/pages/DocumentDetailPage"),
  <LoadingSpinner text="Loading document..." />
);
export const FoldersPage = createLazyComponent(
  () => import("../features/folders/pages/FoldersPage"),
  <LoadingSpinner text="Loading folders..." />
);
export const FolderDetailPage = createLazyComponent(
  () => import("../features/folders/pages/FolderDetailPage"),
  <LoadingSpinner text="Loading folder..." />
);
export const EditRequestsPage = createLazyComponent(
  () => import("../features/edit-requests/pages/EditRequestsPage"),
  <LoadingSpinner text="Loading edit requests..." />
);
export const SignatureRequestsPage = createLazyComponent(
  () => import("../features/signatures/pages/SignatureRequestsPage"),
  <LoadingSpinner text="Loading signatures..." />
);
export const NotificationsPage = createLazyComponent(
  () => import("../features/notifications/pages/NotificationsPage"),
  <LoadingSpinner text="Loading notifications..." />
);
export const PermissionsPage = createLazyComponent(
  () => import("../features/permissions/pages/PermissionsPage"),
  <LoadingSpinner text="Loading permissions..." />
);
export const SearchPage = createLazyComponent(
  () => import("../features/search/pages/SearchPage"),
  <LoadingSpinner text="Loading search..." />
);

// Reports tools
export const DataTables = createLazyComponent(
  () => import("../feature-module/uiInterface/table/data-tables"),
  <LoadingSpinner text="Loading tables..." />
);
export const TablesBasic = createLazyComponent(
  () => import("../feature-module/uiInterface/table/tables-basic"),
  <LoadingSpinner text="Loading tables..." />
);
export const Apexchart = createLazyComponent(
  () => import("../feature-module/uiInterface/charts/apexcharts"),
  <LoadingSpinner text="Loading charts..." />
);
export const PrimeReactChart = createLazyComponent(
  () => import("../feature-module/uiInterface/charts/prime-react-chart"),
  <LoadingSpinner text="Loading charts..." />
);
export const ChartJSExample = createLazyComponent(
  () => import("../feature-module/uiInterface/charts/chartjs"),
  <LoadingSpinner text="Loading charts..." />
);

// Layout demo
export const LayoutDemo = createLazyComponent(
  () => import("../feature-module/mainMenu/layout-dashoard"),
  <LoadingSpinner text="Loading layout..." />
);
export const LayoutModernDashboard = createLazyComponent(
  () => import("../features/dashboard/pages/LayoutModernDashboardPage"),
  <LoadingSpinner text="Loading dashboard..." />
);
