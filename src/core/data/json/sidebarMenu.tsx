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
        label: "Dashboards",
        translationKey: "dashboard",
        link: routes.dashboard,
        submenu: false,
        showSubRoute: false,
        icon: "LayoutDashboard", // lucide-react icon name
        base: routes.dashboard,
        base2: routes.adminDashboard,
        base3: routes.employeeDashboard,
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
        label: "Notifications",
        translationKey: "notifications",
        link: routes.notifications,
        submenu: false,
        showSubRoute: false,
        icon: "Bell", // lucide-react icon name
        base: routes.notifications,
      },
      {
        label: "Charts",
        translationKey: "charts",
        link: routes.apexChart,
        submenu: false,
        showSubRoute: false,
        icon: "BarChart3", // lucide-react icon name
        base: routes.apexChart,
        base2: routes.primeChart,
        base3: routes.chartJs,
      },
      {
        label: "Data Tables",
        translationKey: "dataTables",
        link: routes.dataTables,
        submenu: false,
        showSubRoute: false,
        icon: "Table", // lucide-react icon name
        base: routes.dataTables,
        base2: routes.tablesBasic,
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