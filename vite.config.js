import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import path from "path";
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            global: "globalthis", // 👈 critical for "global is not defined"
            "@": path.resolve(__dirname, "src"),
            moment: 'moment/moment.js'
        },
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: "globalThis",
            },
            plugins: [
                NodeGlobalsPolyfillPlugin({
                    buffer: true,
                    process: true,
                }),
            ],
        },
    },
    server: {
        /**
         * Dev server settings (only used when you run `vite`/`npm run dev`).
         */
        port: 3003,
        host: true,
        proxy: {
            /**
             * Proxy rules (development only).
             *
             * Why proxy?
             * - Your frontend is served from `http://localhost:5173`
             * - Your backend is on a different origin (different host/port)
             * - Browsers enforce CORS rules across origins
             * - Proxying makes requests look "same-origin" from the browser's perspective
             *
             * Result:
             * - Your frontend code can call `/api/...`
             * - Vite forwards that request to the backend target below
             */
            '/api': {
                target: 'http://192.168.116.211:8069',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path,
            },
            /**
             * WebSocket proxy (development only).
             * If the backend exposes WS at `/websocket`, the frontend can connect to:
             *   ws://localhost:5173/websocket
             * and Vite will forward it to the backend WS server.
             */
            '/websocket': {
                target: 'ws://192.168.116.211:8069',
                /**
                 * Enables WebSocket proxying. Without this, WS upgrade requests won't be forwarded.
                 */
                ws: true,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor chunks
                    "react-vendor": ["react", "react-dom", "react-router-dom"],
                    "redux-vendor": ["react-redux", "@reduxjs/toolkit"],
                    "ui-vendor": ["antd", "react-bootstrap", "react-feather"],
                    // Feature module chunks
                    auth: [
                        "./src/feature-module/auth/login/login",
                        "./src/feature-module/auth/register/register",
                        "./src/feature-module/auth/twoStepVerification/twoStepVerification",
                        "./src/feature-module/auth/emailVerification/emailVerification",
                        "./src/feature-module/auth/resetPassword/resetPassword",
                        "./src/feature-module/auth/forgotPassword/forgotPassword",
                    ],
                    dashboard: [
                        "./src/feature-module/mainMenu/adminDashboard",
                        "./src/feature-module/mainMenu/employeeDashboard/employee-dashboard",
                        "./src/feature-module/mainMenu/leadsDashboard",
                        "./src/feature-module/mainMenu/dealsDashboard",
                    ],
                    crm: [
                        "./src/feature-module/crm/contacts/contactList",
                        "./src/feature-module/crm/contacts/contactGrid",
                        "./src/feature-module/crm/contacts/contactDetails",
                        "./src/feature-module/crm/companies/companiesGrid",
                        "./src/feature-module/crm/companies/companiesList",
                        "./src/feature-module/crm/companies/companiesDetails",
                        "./src/feature-module/crm/leads/leadsGrid",
                        "./src/feature-module/crm/leads/leadsList",
                        "./src/feature-module/crm/leads/leadsDetails",
                        "./src/feature-module/crm/deals/dealsGrid",
                        "./src/feature-module/crm/deals/dealsDetails",
                        "./src/feature-module/crm/deals/dealsList",
                        "./src/feature-module/crm/pipeline/pipeline",
                        "./src/feature-module/crm/analytics/analytics",
                    ],
                    hrm: [
                        "./src/feature-module/hrm/employees/employeesList",
                        "./src/feature-module/hrm/employees/employeesGrid",
                        "./src/feature-module/hrm/employees/deparment",
                        "./src/feature-module/hrm/employees/designations",
                        "./src/feature-module/hrm/employees/policy",
                        "./src/feature-module/hrm/employees/employeedetails",
                        "./src/feature-module/hrm/attendance/leaves/leaveAdmin",
                        "./src/feature-module/hrm/attendance/leaves/leaveEmployee",
                        "./src/feature-module/hrm/attendance/leaves/leavesettings",
                        "./src/feature-module/hrm/attendance/attendanceadmin",
                        "./src/feature-module/hrm/attendance/attendance_employee",
                        "./src/feature-module/hrm/attendance/timesheet",
                        "./src/feature-module/hrm/attendance/scheduletiming",
                        "./src/feature-module/hrm/attendance/overtime",
                        "./src/feature-module/hrm/holidays",
                        "./src/feature-module/hrm/termination",
                        "./src/feature-module/hrm/resignation",
                        "./src/feature-module/hrm/promotion",
                    ],
                    projects: [
                        "./src/feature-module/projects/clinet/clienttgrid",
                        "./src/feature-module/projects/clinet/clientlist",
                        "./src/feature-module/projects/clinet/clientdetails",
                        "./src/feature-module/projects/project/project",
                        "./src/feature-module/projects/project/projectdetails",
                        "./src/feature-module/projects/project/projectlist",
                        "./src/feature-module/projects/task/task",
                        "./src/feature-module/projects/task/taskdetails",
                        "./src/feature-module/projects/task/task-board",
                    ],
                    finance: [
                        "./src/feature-module/finance-accounts/sales/invoices",
                        "./src/feature-module/finance-accounts/sales/add_invoices",
                        "./src/feature-module/sales/invoiceDetails",
                        "./src/feature-module/finance-accounts/sales/payment",
                        "./src/feature-module/finance-accounts/sales/expenses",
                        "./src/feature-module/finance-accounts/sales/provident_fund",
                        "./src/feature-module/finance-accounts/sales/taxes",
                        "./src/feature-module/finance-accounts/sales/estimates",
                        "./src/feature-module/finance-accounts/payrool/employee_salary",
                        "./src/feature-module/finance-accounts/payrool/payslip",
                        "./src/feature-module/finance-accounts/payrool/payroll",
                        "./src/feature-module/finance-accounts/payrool/payrollOvertime",
                        "./src/feature-module/finance-accounts/payrool/payrollDedution",
                    ],
                    application: [
                        "./src/feature-module/application/chat",
                        "./src/feature-module/application/call/voiceCall",
                        "./src/feature-module/application/call/videocalls",
                        "./src/feature-module/application/call/outgingcalls",
                        "./src/feature-module/application/call/incomingcall",
                        "./src/feature-module/application/call/callHistory",
                        "./src/feature-module/mainMenu/apps/calendar",
                        "./src/feature-module/application/email",
                        "./src/feature-module/application/emailReply",
                        "./src/feature-module/application/todo/todo",
                        "./src/feature-module/application/todo/todolist",
                        "./src/feature-module/application/notes",
                        "./src/feature-module/application/socialfeed",
                        "./src/feature-module/application/fileManager",
                        "./src/feature-module/application/kanbanView",
                    ],
                    settings: [
                        "./src/feature-module/settings/generalSettings/profile-settings",
                        "./src/feature-module/settings/generalSettings/security-settings",
                        "./src/feature-module/settings/generalSettings/notifications-settings",
                        "./src/feature-module/settings/generalSettings/connected-apps",
                        "./src/feature-module/settings/websiteSettings/bussiness-settings",
                        "./src/feature-module/settings/websiteSettings/seo-settings",
                        "./src/feature-module/settings/websiteSettings/companySettings",
                        "./src/feature-module/settings/websiteSettings/localization-settings",
                        "./src/feature-module/settings/websiteSettings/prefixes",
                        "./src/feature-module/settings/websiteSettings/preferences",
                        "./src/feature-module/settings/websiteSettings/authentication-settings",
                        "./src/feature-module/settings/websiteSettings/ai-settings",
                        "./src/feature-module/settings/appSettings/salary-settings",
                        "./src/feature-module/settings/appSettings/approval-settings",
                        "./src/feature-module/settings/websiteSettings/appearance",
                        "./src/feature-module/settings/websiteSettings/language-web",
                        "./src/feature-module/settings/websiteSettings/add-language",
                        "./src/feature-module/settings/appSettings/invoiceSettings",
                        "./src/feature-module/settings/appSettings/customFields",
                        "./src/feature-module/settings/appSettings/leave-type",
                        "./src/feature-module/settings/systemSettings/emailSettings",
                        "./src/feature-module/settings/systemSettings/email-templates",
                        "./src/feature-module/settings/systemSettings/smsSettings",
                        "./src/feature-module/settings/systemSettings/sms-template",
                        "./src/feature-module/settings/systemSettings/otp-settings",
                        "./src/feature-module/settings/systemSettings/gdprCookies",
                        "./src/feature-module/settings/systemSettings/maintenance-mode",
                        "./src/feature-module/settings/financialSettings/paymentGateways",
                        "./src/feature-module/settings/financialSettings/taxRates",
                        "./src/feature-module/settings/financialSettings/currencies",
                        "./src/feature-module/settings/otherSettings/backup",
                        "./src/feature-module/settings/otherSettings/clearCache",
                        "./src/feature-module/settings/otherSettings/custom-css",
                        "./src/feature-module/settings/otherSettings/custom-js",
                        "./src/feature-module/settings/otherSettings/cronjob",
                        "./src/feature-module/settings/otherSettings/cronjobSchedule",
                        "./src/feature-module/settings/otherSettings/storage",
                    ],
                    performance: [
                        "./src/feature-module/performance/performanceIndicator",
                        "./src/feature-module/performance/performanceReview",
                        "./src/feature-module/performance/performanceAppraisal",
                        "./src/feature-module/performance/goalTracking",
                        "./src/feature-module/performance/goalType",
                    ],
                    training: [
                        "./src/feature-module/training/trainingList",
                        "./src/feature-module/training/trainers",
                        "./src/feature-module/training/trainingType",
                    ],
                    "user-management": [
                        "./src/feature-module/userManagement/rolesPermissions",
                        "./src/feature-module/administration/user-management/permissionpage",
                        "./src/feature-module/userManagement/manageusers",
                        "./src/feature-module/userManagement/permission",
                    ],
                    reports: [
                        "./src/feature-module/administration/reports/expensereport",
                        "./src/feature-module/administration/reports/invoicereport",
                        "./src/feature-module/administration/reports/paymentreport",
                        "./src/feature-module/administration/reports/projectreport",
                        "./src/feature-module/administration/reports/taskreport",
                        "./src/feature-module/administration/reports/userreports",
                        "./src/feature-module/administration/reports/employeereports",
                        "./src/feature-module/administration/reports/payslipreport",
                        "./src/feature-module/administration/reports/attendencereport",
                        "./src/feature-module/administration/reports/leavereport",
                        "./src/feature-module/administration/reports/dailyreport",
                    ],
                    content: [
                        "./src/feature-module/content/blog/blogs",
                        "./src/feature-module/content/blog/blogCategories",
                        "./src/feature-module/content/blog/blogComments",
                        "./src/feature-module/content/blog/blogTags",
                    ],
                    pages: [
                        "./src/feature-module/pages/profile",
                        "./src/feature-module/pages/gallery",
                        "./src/feature-module/pages/search-result",
                        "./src/feature-module/pages/timeline",
                        "./src/feature-module/pages/pricing",
                        "./src/feature-module/pages/api-keys",
                        "./src/feature-module/pages/privacy-policy",
                        "./src/feature-module/pages/terms-condition",
                    ],
                    administration: [
                        "./src/feature-module/administration/asset",
                        "./src/feature-module/administration/asset-category",
                        "./src/feature-module/administration/help-support/knowledgebase",
                        "./src/feature-module/administration/user-management/users",
                        "./src/feature-module/administration/user-management/rolePermission",
                        "./src/feature-module/administration/help-support/activity",
                    ],
                    recruitment: [
                        "./src/feature-module/recruitment/jobs/jobgrid",
                        "./src/feature-module/recruitment/joblist/joblist",
                        "./src/feature-module/recruitment/candidates/candidategrid",
                        "./src/feature-module/recruitment/candidates/candidatelist",
                        "./src/feature-module/recruitment/candidates/candidatekanban",
                        "./src/feature-module/recruitment/refferal/refferallist",
                    ],
                    "super-admin": [
                        "./src/feature-module/super-admin/companies",
                        "./src/feature-module/super-admin/subscription",
                        "./src/feature-module/super-admin/packages/packagelist",
                        "./src/feature-module/super-admin/packages/packagegrid",
                        "./src/feature-module/super-admin/domin",
                        "./src/feature-module/super-admin/purchase-transaction",
                    ],
                    tickets: [
                        "./src/feature-module/tickets/tickets",
                        "./src/feature-module/tickets/tickets-grid",
                        "./src/feature-module/tickets/ticket-details",
                    ],
                },
            },
        },
        chunkSizeWarningLimit: 1000,
        sourcemap: false,
        minify: "terser",
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
    },
});
