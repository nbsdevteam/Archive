import React, { Suspense, lazy } from "react";
import { LoadingSpinner } from "../core/common/LoadingSpinner";

class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  handleDismissError = () => {
    this.setState({ hasError: false });
  };

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
            <button onClick={this.handleDismissError}>
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
      <Suspense fallback={null}>
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
export const Register = createLazyComponent(
  () => import("../features/auth/pages/RegisterPage"),
  <LoadingSpinner text="Loading sign up..." />
);
export const ForgotPassword = createLazyComponent(
  () => import("../features/auth/pages/ForgotPasswordPage"),
  <LoadingSpinner text="Loading password reset..." />
);
export const ResetPassword = createLazyComponent(
  () => import("../features/auth/pages/ResetPasswordPage"),
  <LoadingSpinner text="Loading reset..." />
);
export const EmailVerification = createLazyComponent(
  () => import("../features/auth/pages/EmailVerificationPage"),
  <LoadingSpinner text="Loading verification..." />
);
export const TwoStepVerification = createLazyComponent(
  () => import("../features/auth/pages/TwoStepVerificationPage"),
  <LoadingSpinner text="Loading verification..." />
);

// Dashboard
export const DashboardPage = createLazyComponent(
  () => import("../features/dashboard/pages/DashboardPage"),
  <LoadingSpinner text="Loading dashboard..." />
);

// Archive
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
  () => import("../features/activity/pages/ArchiveActivityPage"),
  <LoadingSpinner text="Loading activity..." />
);

// Documents + folders
export const DocumentsPage = createLazyComponent(
  () => import("../features/documents/pages/Documents"),
  <LoadingSpinner text="Loading documents..." />
);
export const DocumentsTrashPage = createLazyComponent(
  () => import("../features/documents/pages/DocumentsTrashPage"),
  <LoadingSpinner text="Loading trash..." />
);
export const UploadDocumentPage = createLazyComponent(
  () => import("../features/documents/pages/UploadDocumentPage"),
  <LoadingSpinner text="Loading upload..." />
);
export const DocumentDetailPage = createLazyComponent(
  () => import("../features/documents/pages/DocumentDetailPage"),
  <LoadingSpinner text="Loading document..." />
);
export const DocumentAttachmentViewPage = createLazyComponent(
  () => import("../features/documents/pages/DocumentAttachmentViewPage"),
  <LoadingSpinner text="Loading attachment..." />
);
export const FoldersPage = createLazyComponent(
  () => import("../features/folders/pages/Folders"),
  <LoadingSpinner text="Loading folders..." />
);
export const FolderDetailPage = createLazyComponent(
  () => import("../features/folders/pages/FolderDetail"),
  <LoadingSpinner text="Loading folder..." />
);

// Requests + notifications
export const EditRequestsPage = createLazyComponent(
  () => import("../features/edit-requests/pages/EditRequestsPage"),
  <LoadingSpinner text="Loading edit requests..." />
);
export const SignatureRequestsPage = createLazyComponent(
  () => import("../features/signatures/pages/SignatureRequestsPage"),
  <LoadingSpinner text="Loading signatures..." />
);
export const NotesPage = createLazyComponent(
  () => import("../features/notes/pages/NotesPage"),
  <LoadingSpinner text="Loading notes..." />
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
