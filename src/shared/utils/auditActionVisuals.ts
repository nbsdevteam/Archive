import type { ComponentType } from "react";
import {
  Archive,
  ArchiveRestore,
  BadgeCheck,
  BadgeX,
  Building,
  Building2,
  CheckCheck,
  ClipboardCheck,
  ClipboardX,
  CircleCheck,
  CircleX,
  Download,
  Eraser,
  Eye,
  FileCog,
  FilePenLine,
  Files,
  FileStack,
  FolderOpen,
  FolderPen,
  FolderPlus,
  FolderSync,
  FolderX,
  GitBranchPlus,
  Link2,
  LogIn,
  LogOut,
  Paperclip,
  PenTool,
  RotateCcw,
  ScanSearch,
  Settings2,
  ShieldCheck,
  ShieldX,
  Trash,
  Trash2,
  Upload,
} from "lucide-react";

export type AuditActionColor =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info";

type IconComponent = ComponentType<{
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
}>;

/**
 * Centralized mapping of audit action codes to Lucide icon and color intent.
 * Used by table badges and timeline chips for consistent icon-only display with tooltip labels.
 */
export function getAuditActionVisual(action: string): {
  Icon: IconComponent;
  color: AuditActionColor;
} {
  const actionVisualMap: Record<
    string,
    { Icon: IconComponent; color: AuditActionColor }
  > = {
    upload: { Icon: Upload, color: "success" },
    view: { Icon: Eye, color: "info" },
    download: { Icon: Download, color: "info" },
    edit_request: { Icon: ClipboardCheck, color: "primary" },
    edit_request_created: { Icon: FilePenLine, color: "primary" },
    edit_request_approved: { Icon: BadgeCheck, color: "success" },
    edit_request_rejected: { Icon: ClipboardX, color: "error" },
    approval: { Icon: CircleCheck, color: "success" },
    rejection: { Icon: CircleX, color: "error" },
    new_version: { Icon: FileStack, color: "primary" },
    new_version_uploaded: { Icon: Files, color: "success" },
    archive: { Icon: Archive, color: "warning" },
    unarchive: { Icon: ArchiveRestore, color: "success" },
    document_soft_deleted: { Icon: Trash2, color: "error" },
    document_restored: { Icon: RotateCcw, color: "success" },
    document_permanently_deleted: { Icon: Trash, color: "error" },
    search: { Icon: ScanSearch, color: "info" },
    login: { Icon: LogIn, color: "secondary" },
    logout: { Icon: LogOut, color: "secondary" },
    attachment_upload: { Icon: Paperclip, color: "success" },
    attachment_updated: { Icon: FileCog, color: "primary" },
    attachment_deleted: { Icon: Eraser, color: "error" },
    attachment_restored: { Icon: FolderSync, color: "success" },
    attachment_permanently_deleted: { Icon: BadgeX, color: "error" },
    multiple_attachments_upload: { Icon: Files, color: "success" },
    signed_version_uploaded: { Icon: PenTool, color: "primary" },
    relation_created: { Icon: Link2, color: "info" },
    folder_created: { Icon: FolderPlus, color: "secondary" },
    folder_updated: { Icon: FolderPen, color: "secondary" },
    folder_deleted: { Icon: FolderX, color: "error" },
    folder_moved: { Icon: FolderOpen, color: "secondary" },
    department_created: { Icon: Building2, color: "secondary" },
    department_updated: { Icon: Building, color: "primary" },
    department_archived: { Icon: ShieldX, color: "warning" },
    document_type_created: { Icon: GitBranchPlus, color: "primary" },
    document_type_updated: { Icon: Settings2, color: "primary" },
    document_type_archived: { Icon: ShieldCheck, color: "warning" },
  };

  return actionVisualMap[action] ?? { Icon: CheckCheck, color: "primary" };
}
