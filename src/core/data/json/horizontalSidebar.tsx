import { all_routes } from "../../../router/all_routes";

const routes = all_routes;

export const HorizontalSidebarData = [
  {
    title: "Main",
    showAsTab: false,
    separateRoute: false,
    menu: [
      {
        menuValue: "Dashboard",
        hasSubRoute: true,
        showSubRoute: false,
        icon: "smart-home",
        base: "dashboard",
        subMenus: [
          {
            menuValue: "Admin Dashboard",
            route: routes.adminDashboard,
            base: "index",
          },
          {
            menuValue: "Employee Dashboard",
            route: routes.employeeDashboard,
            base: "employee",
          },
        ],
      },
      {
        menuValue: "Archive",
        hasSubRoute: true,
        showSubRoute: false,
        icon: "folder",
        base: "archive",
        subMenus: [
          {
            menuValue: "Folders",
            route: routes.archiveFolders,
            base: "archive-folders",
          },
          {
            menuValue: "Documents",
            route: routes.archiveDocuments,
            base: "archive-documents",
          },
          {
            menuValue: "Upload",
            route: routes.archiveUpload,
            base: "archive-upload",
          },
          {
            menuValue: "Trash",
            route: routes.archiveTrash,
            base: "archive-trash",
          },
          {
            menuValue: "Activity",
            route: routes.archiveActivity,
            base: "archive-activity",
          },
        ],
      },
      {
        menuValue: "Reports",
        hasSubRoute: true,
        showSubRoute: false,
        icon: "chart-bar",
        base: "reports",
        subMenus: [
          {
            menuValue: "Charts",
            route: routes.apexChart,
            base: "apex-charts",
          },
          {
            menuValue: "Data Tables",
            route: routes.dataTables,
            base: "data-tables",
          },
        ],
      },
    ],
  },
];