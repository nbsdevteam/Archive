import { all_routes } from "../../../router/all_routes";

const routes = all_routes;

export const SidebarDataTest = [
  {
    tittle: "Main Menu",
    icon: "airplay",
    showAsTab: true,
    separateRoute: false,
    submenuItems: [
      {
        label: "Dashboard",
        translationKey: "dashboard",
        link: routes.dashboard,
        submenu: false,
        showSubRoute: false,
        icon: "LayoutDashboard", // lucide-react icon name
        base: routes.dashboard,
        base2: routes.adminDashboard,
      },
      {
        label: "Documents",
        translationKey: "documents",
        link: routes.documents,
        submenu: false,
        showSubRoute: false,
        icon: "FileText", // lucide-react icon name
        base: routes.documents,
        base2: routes.documentsUpload,
        base3: routes.documentDetail,
        base4: routes.documentAttachmentView,
        base5: routes.documentsTrash,
      },
      /* Direct link to trashed documents (same route as Documents → Trash). */
      {
        label: "Trash",
        translationKey: "trash",
        link: routes.documentsTrash,
        submenu: false,
        showSubRoute: false,
        icon: "Trash2", // lucide-react icon name
        base: routes.documentsTrash,
      },
      {
        label: "Folders",
        translationKey: "folders",
        link: routes.folders,
        submenu: false,
        showSubRoute: false,
        icon: "Folder", // lucide-react icon name
        base: routes.folders,
        base2: routes.folderDetail,
      },
      {
        label: "Companies",
        translationKey: "companies",
        link: routes.companies,
        submenu: false,
        showSubRoute: false,
        icon: "Building2",
        base: routes.companies,
      },
      {
        label: "Edit Requests",
        translationKey: "editRequests",
        link: routes.editRequests,
        submenu: false,
        showSubRoute: false,
        icon: "Pencil", // lucide-react icon name
        base: routes.editRequests,
      },
      {
        label: "Signatures",
        translationKey: "signatures",
        link: routes.signatures,
        submenu: false,
        showSubRoute: false,
        icon: "PenTool", // lucide-react icon name
        base: routes.signatures,
      },
      {
        label: "Notes",
        translationKey: "notes",
        link: routes.notes,
        submenu: false,
        showSubRoute: false,
        icon: "StickyNote", // lucide-react icon name
        base: routes.notes,
      },
      {
        label: "Notifications",
        translationKey: "notifications",
        link: routes.notifications,
        submenu: false,
        showSubRoute: false,
        icon: "Bell", // lucide-react icon name
        base: routes.notifications,
      },
      {
        label: "Activity",
        translationKey: "activity",
        link: routes.activity,
        submenu: false,
        showSubRoute: false,
        icon: "Activity",
        base: routes.activity,
      },
      {
        label: "Permissions",
        translationKey: "permissions",
        link: routes.permissions,
        submenu: false,
        showSubRoute: false,
        icon: "Shield", // lucide-react icon name
        base: routes.permissions,
        adminOnly: true, // Admin-only item
      },
    ],
  },
];
