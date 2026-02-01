import type { LucideProps } from "lucide-react";
import {
  Home,
  Upload,
  FileUp,
  Download,
  ArrowLeft,
  Paperclip,
  Search,
  FolderPlus,
  Folder,
  FolderSearch,
  FileSearchCorner,
  Bell,
  FileText,
  FileCheck,
  Archive,
  User,
  X,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

/**
 * Icon name mapping (Lucide React names as kebab-case).
 * Add new mappings here as needed.
 */
const iconMap = {
  home: Home,
  "smart-home": Home,
  upload: Upload,
  "file-up": FileUp,
  download: Download,
  "arrow-left": ArrowLeft,
  paperclip: Paperclip,
  search: Search,
  "folder-plus": FolderPlus,
  folder: Folder,
  "folder-search": FolderSearch,
  "file-search-corner": FileSearchCorner,
  bell: Bell,
  "file-text": FileText,
  "file-check": FileCheck,
  archive: Archive,
  user: User,
  x: X,
  trash: Trash2,
  eye: Eye,
  "eye-off": EyeOff,
  eyeOff: EyeOff,
  "refresh-cw": RefreshCw,
} as const;

export type IconName = keyof typeof iconMap;

export interface IconProps extends Omit<LucideProps, "ref"> {
  /** Icon name (matches Lucide naming or Themify ti-* suffix) */
  name: IconName;
  /** Additional CSS classes (spacing, color, etc.) */
  className?: string;
  /** Accessible title; when provided, removes aria-hidden */
  title?: string;
}

/**
 * Shared Icon component wrapping Lucide icons.
 * Renders at 1em x 1em so Bootstrap font-size classes (fs-16, fs-1, etc.) work as expected.
 * Inherits stroke color via currentColor so text color classes apply.
 */
export const Icon = ({ name, className, title, ...rest }: IconProps) => {
  const LucideIcon = iconMap[name];

  if (!LucideIcon) {
    console.warn(`[Icon] Unknown icon name: "${name}"`);
    return null;
  }

  return (
    <LucideIcon
      className={className}
      style={{ width: "1em", height: "1em", ...rest.style }}
      strokeWidth={2}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
      {...rest}
    />
  );
};

export default Icon;
