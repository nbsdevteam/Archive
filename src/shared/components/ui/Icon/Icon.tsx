import type { LucideProps } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRightLeft,
  Archive,
  BarChart2,
  Bell,
  Clock,
  Code,
  Copy,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Download,
  Eye,
  EyeOff,
  File,
  FileCheck,
  FileSearchCorner,
  FileText,
  Filter,
  Folder,
  FolderPlus,
  FolderSearch,
  HardDrive,
  Home,
  Info,
  MoreVertical,
  Paperclip,
  Pencil,
  RefreshCw,
  Search,
  Tag,
  Trash,
  Trash2,
  Upload,
  FileUp,
  User,
  X,
  XCircle,
} from "lucide-react";

/**
 * Icon name mapping (Lucide React names as kebab-case).
 * Add new mappings here as needed.
 */
const iconMap = {
  "alert-circle": AlertCircle,
  "alert-triangle": AlertTriangle,
  home: Home,
  "smart-home": Home,
  "bar-chart-2": BarChart2,
  copy: Copy,
  upload: Upload,
  "file-up": FileUp,
  download: Download,
  "arrow-left": ArrowLeft,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "chevrons-left": ChevronsLeft,
  "chevrons-right": ChevronsRight,
  "chevrons-up-down": ChevronsUpDown,
  "arrow-right-left": ArrowRightLeft,
  "more-vertical": MoreVertical,
  paperclip: Paperclip,
  search: Search,
  "folder-plus": FolderPlus,
  folder: Folder,
  "folder-search": FolderSearch,
  "file-search-corner": FileSearchCorner,
  bell: Bell,
  file: File,
  "file-text": FileText,
  "file-check": FileCheck,
  "hard-drive": HardDrive,
  archive: Archive,
  user: User,
  x: X,
  trash: Trash,
  "trash-2": Trash2,
  eye: Eye,
  "eye-off": EyeOff,
  eyeOff: EyeOff,
  "refresh-cw": RefreshCw,
  filter: Filter,
  info: Info,
  edit: Pencil,
  pencil: Pencil,
  calendar: Calendar,
  clock: Clock,
  code: Code,
  tag: Tag,
  "x-circle": XCircle,
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
 * By default icons are decorative (aria-hidden). Pass title to expose as img with aria-label for accessibility.
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
