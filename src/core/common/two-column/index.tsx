import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { TowColData } from '../../data/json/twoColData'
import ImageWithBasePath from '../imageWithBasePath';
import { all_routes } from '../../../router/all_routes';
import PerfectScrollbar from "react-perfect-scrollbar";
import "../../../../node_modules/react-perfect-scrollbar/dist/css/styles.css";
const TwoColumnSidebar = () => {
    const routes = all_routes
    const Location = useLocation();
    const [showSubMenusTab, ] = useState(true);
    const [isActive, SetIsActive] = useState<any>();
    const [subOpen, setSubopen] = useState<any>("");
    const savedMenuValue = sessionStorage.getItem('menuValue2')|| '';
    const showTabs = (res:any) => {
        sessionStorage.setItem('menuValue2', res.menuValue);
        TowColData.forEach((menus:any)=>{
            menus.menu.forEach((mainMenus:any) => {
                if (res.menuValue === mainMenus.menuValue) {
                    mainMenus.showMyTab = true;
                  } else {
                    mainMenus.showMyTab = false;
                  }
            })
        }

        )
    }
    const toggleSidebar = (title: any) => {
        localStorage.setItem("menuOpened", title);
        if (title === subOpen) {
          setSubopen("");
        } else {
          setSubopen(title);
        }
      };
      useEffect(() => {
        if(Location.pathname === '/layout-twocolumn') {
            sessionStorage.setItem('menuValue2', 'Layouts');
            SetIsActive('Layouts') 
            
            
            TowColData.forEach((menus:any)=>{
                menus.menu.forEach((mainMenus:any) => {
                    if ('Layouts' === mainMenus.menuValue) {
                        mainMenus.showMyTab = true;
                      } else {
                        mainMenus.showMyTab = false;
                      }
                })
            }
    
            )
        } 
        
        
      }, [Location.pathname,isActive,savedMenuValue])
      
  return (
    <div className="two-col-sidebar" id="two-col-sidebar">
        <div className="sidebar sidebar-twocol">
            <div className="twocol-mini">
                <Link to={routes.adminDashboard} className="logo-small">
                    <ImageWithBasePath src="assets/img/logo-small.svg" alt="Logo"/>
                </Link>
                <PerfectScrollbar>
                <div className="sidebar-left slimscroll">
                    <div className="nav flex-column align-items-center nav-pills" id="sidebar-tabs" role="tablist"
                        aria-orientation="vertical">
                            {TowColData.map((mainMenu, index) => (
                                <React.Fragment key={`main-${index}`}>
                                {mainMenu.menu.map((title,i)=>(
                                   
                                 <Link to="#" className={`nav-link ${
                                    title?.subMenus
                                        ?.map((link: any) => link?.route)
                                        .includes(Location.pathname) 
                                        ? "active"
                                        : ""
                                    }`} onClick={()=>{showTabs(title)}} title={title.menuValue} key={`nav-${index}-${i}`}>
                                 <i className={`ti ti-${title.icon}`}></i>
                             </Link>
                                )
                                )}
                                
                                </React.Fragment>
                            ))}
                       
                    </div>
                </div>
                </PerfectScrollbar>

            </div>
            <div className="sidebar-right">
                <div className="sidebar-logo mb-4">
                    <Link to={routes.adminDashboard} className="logo logo-normal">
                        <ImageWithBasePath src="assets/img/logo.svg" alt="Logo"/>
                    </Link>
                    <Link to={routes.adminDashboard} className="dark-logo">
                        <ImageWithBasePath src="assets/img/logo-white.svg" alt="Logo"/>
                    </Link>
                </div>
                <div className="sidebar-scroll">
                    <h6 className="mb-3">Welcome to NBS Archive System</h6>
                    <div className="text-center rounded bg-light p-3 mb-4">
                        <div className="avatar avatar-lg online mb-3">
                            <ImageWithBasePath src="assets/img/profiles/avatar-02.jpg" alt="Img" className="img-fluid rounded-circle"/>
                        </div>
                        <h6 className="fs-12 fw-normal mb-1">Adrian Herman</h6>
                        <p className="fs-10">System Admin</p>
                    </div>
                    <div className="tab-content" id="v-pills-tabContent">
                        <div className={`tab-pane ${showSubMenusTab ? 'd-block':'d-none'}`} id="dashboard">
                            <ul>
                            {TowColData.map((mainMenu, index) => (
                                <React.Fragment key={`main-${index}`}>
                                    {mainMenu.menu.map((title: any, i: number) => (
                                    <React.Fragment key={`title-${index}-${i}`}>
                                        {title.showMyTab === true && (
                                        <>
                                            <li className="menu-title">
                                            <span>{title.menuValue}</span>
                                            </li>
                                            {title.subMenus.map((subMenus: any, j: number) => (
                                            <React.Fragment key={`submenu-${index}-${i}-${j}`}>
                                                {title.hasSubRoute && (
                                                <li>
                                                    <Link
                                                    className={
                                                        subMenus.route === Location.pathname ? "active" : ""
                                                    }
                                                    to={subMenus.route}
                                                    >
                                                    {subMenus.menuValue}
                                                    </Link>
                                                </li>
                                                )}
                                                {title.hasSubRouteTwo && (
                                                <>
                                                    {subMenus.customSubmenuTwo ? (
                                                    <li className="submenu">
                                                        <Link
                                                        to="#"
                                                        className={`${
                                                            subMenus?.subMenus
                                                            ?.map((link: any) => link?.route)
                                                            .includes(Location.pathname)
                                                            ? "active"
                                                            : ""
                                                        } ${
                                                            subOpen === subMenus.menuValue ? "subdrop" : ""
                                                        }`}
                                                        onClick={() => toggleSidebar(subMenus.menuValue)}
                                                        >
                                                        <span>{subMenus.menuValue}</span>
                                                        <span className="menu-arrow"></span>
                                                        </Link>
                                                        <ul
                                                        style={{
                                                            display:
                                                            subOpen === subMenus.menuValue ? "block" : "none",
                                                        }}
                                                        >
                                                        {subMenus.subMenusTwo.map(
                                                            (subMenuTwo: any, k: number) => (
                                                            <li key={`submenu-two-${index}-${i}-${j}-${k}`}>
                                                                <Link
                                                                className={
                                                                    subMenuTwo.route === Location.pathname
                                                                    ? "active"
                                                                    : ""
                                                                }
                                                                to={subMenuTwo.route}
                                                                >
                                                                {subMenuTwo.menuValue}
                                                                </Link>
                                                            </li>
                                                            )
                                                        )}
                                                        </ul>
                                                    </li>
                                                    ) : (
                                                    <li key={`submenu-link-${index}-${i}-${j}`}>
                                                        <Link
                                                        to={subMenus.route}
                                                        className={
                                                            subMenus.route === Location.pathname ? "active" : ""
                                                        }
                                                        >
                                                        {subMenus.menuValue}
                                                        </Link>
                                                    </li>
                                                    )}
                                                </>
                                                )}
                                            </React.Fragment>
                                            ))}
                                        </>
                                        )}
                                    </React.Fragment>
                                    ))}
                                </React.Fragment>
                                ))}

                            </ul>
                        </div>
                        <div className="tab-pane fade" id="application">
                            <ul>
                                <li className="menu-title"><span>APPLICATION</span></li>
                                <li><Link to={all_routes.voiceCall}>Voice Call</Link></li>
                                <li><Link to={all_routes.videoCall}>Video Call</Link></li>
                                <li><Link to={all_routes.outgoingCall}>Outgoing Call</Link></li>
                                <li><Link to={all_routes.incomingCall}>Incoming Call</Link></li>
                                <li><Link to={all_routes.callHistory}>Call History</Link></li>
                                <li><Link to={all_routes.calendar}>Calendar</Link></li>
                                <li><Link to={all_routes.email}>Email</Link></li>
                                <li><Link to={all_routes.todo}>To Do</Link></li>
                                <li><Link to={all_routes.notes}>Notes</Link></li>
                                <li><Link to={all_routes.fileManager}>File Manager</Link></li>
                                <li><Link to={all_routes.kanbanView}>Kanban</Link></li>
                                <li><Link to={all_routes.invoices}>Invoices</Link></li>
                            </ul>
                        </div>
                        <div className="tab-pane fade" id="super-admin">
                            <ul>
                                <li className="menu-title"><span>SUPER ADMIN</span></li>
                                <li><Link to={all_routes.superAdminDashboard}>Dashboard</Link></li>
                                <li><Link to={all_routes.companiesGrid}>Companies</Link></li>
                                <li><Link to={all_routes.superAdminSubscriptions}>Subscriptions</Link></li>
                                <li><Link to={all_routes.superAdminPackages}>Packages</Link></li>
                                <li><Link to={all_routes.superAdminDomain}>Domain</Link></li>
                                <li><Link to={all_routes.superAdminPurchaseTransaction}>Purchase Transaction</Link></li>
                            </ul>
                        </div>
                        <div className="tab-pane fade" id="layout">
                            <ul>
                                <li className="menu-title"><span>LAYOUT</span></li>
                                <li><Link to={all_routes.Horizontal}><span>Horizontal</span></Link></li>
                                <li><Link to={all_routes.Detached}><span>Detached</span></Link></li>
                                <li><Link to={all_routes.Modern}><span>Modern</span></Link></li>
                                <li><Link to={all_routes.TwoColumn}><span>Two Column </span></Link></li>
                                <li><Link to={all_routes.Hovered}><span>Hovered</span></Link></li>
                                <li><Link to={all_routes.layoutBox}><span>Boxed</span></Link></li>
                                <li><Link to={all_routes.HorizontalSingle}><span>Horizontal Single</span></Link></li>
                                <li><Link to={all_routes.HorizontalOverlay}><span>Horizontal Overlay</span></Link>
                                </li>
                                <li><Link to={all_routes.HorizontalBox}><span>Horizontal Box</span></Link></li>
                                <li><Link to={all_routes.MenuAside}><span>Menu Aside</span></Link></li>
                                <li><Link to={all_routes.Transparent}><span>Transparent</span></Link></li>
                                <li><Link to={all_routes.WithoutHeader}><span>Without Header</span></Link></li>
                                <li><Link to={all_routes.layoutRtl}><span>RTL</span></Link></li>
                                <li><Link to={all_routes.layoutDark}><span>Dark</span></Link></li>
                            </ul>
                        </div>
                        <div className="tab-pane fade" id="projects">
                            <ul>
                                <li className="menu-title"><span>PROJECTS</span></li>
                                <li><Link to={all_routes.clientgrid}>Clients</Link></li>
                                <li className="submenu">
                                    <Link to="#"><span>Projects</span>
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.project}>Projects</Link></li>
                                        <li><Link to={all_routes.tasks}>Tasks</Link></li>
                                        <li><Link to={all_routes.taskboard}>Task Board</Link></li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                        <div className="tab-pane fade" id="crm">
                            <ul>
                                <li className="menu-title"><span>CRM</span></li>
                                <li><Link to={all_routes.contactGrid}><span>Contacts</span></Link></li>
                                <li><Link to={all_routes.companiesGrid}><span>Companies</span></Link></li>
                                <li><Link to={all_routes.dealsGrid}><span>Deals</span></Link></li>
                                <li><Link to={all_routes.leadsGrid}><span>Leads</span></Link></li>
                                <li><Link to={all_routes.pipeline}><span>Pipeline</span></Link></li>
                                <li><Link to={all_routes.analytics}><span>Analytics</span></Link></li>
                                <li><Link to={all_routes.activity}><span>Activities</span></Link></li>
                            </ul>
                        </div>
                        <div className="tab-pane fade" id="hrm">
                            <ul>
                                <li className="menu-title"><span>HRM</span></li>
                                <li className="submenu">
                                    <Link to="#"><span>Employees</span>
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.employeeList}>Employee Lists</Link></li>
                                        <li><Link to={all_routes.employeeGrid}>Employee Grid</Link></li>
                                        <li><Link to={all_routes.employeedetails}>Employee Details</Link></li>
                                        <li><Link to={all_routes.departments}>Departments</Link></li>
                                        <li><Link to={all_routes.designations}>Designations</Link></li>
                                        <li><Link to={all_routes.policy}>Policies</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#"><span>Tickets</span>
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.tickets}>Tickets</Link></li>
                                        <li><Link to={all_routes.ticketDetails}>Ticket Details</Link></li>
                                    </ul>
                                </li>
                                <li><Link to={all_routes.holidays}><span>Holidays</span></Link></li>
                                <li className="submenu">
                                    <Link to="#"><span>Attendance</span>
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li className="submenu submenu-two">
                                            <Link to="#">Leaves<span
                                                    className="menu-arrow inside-submenu"></span></Link>
                                            <ul>
                                                <li><Link to={all_routes.leaveadmin}>Leaves (Admin)</Link></li>
                                                <li><Link to={all_routes.leaveemployee}>Leave (Employee)</Link></li>
                                                <li><Link to={all_routes.leavesettings}>Leave Settings</Link></li>
                                            </ul>
                                        </li>
                                        <li><Link to={all_routes.attendanceadmin}>Attendance (Admin)</Link></li>
                                        <li><Link to={all_routes.attendanceemployee}>Attendance (Employee)</Link></li>
                                        <li><Link to={all_routes.timesheet}>Timesheets</Link></li>
                                        <li><Link to={all_routes.scheduletiming}>Shift & Schedule</Link></li>
                                        <li><Link to={all_routes.overtime}>Overtime</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#"><span>Performance</span>
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.performanceIndicator}>Performance Indicator</Link></li>
                                        <li><Link to={all_routes.performanceReview}>Performance Review</Link></li>
                                        <li><Link to={all_routes.performanceAppraisal}>Performance Appraisal</Link></li>
                                        <li><Link to={all_routes.goalTracking}>Goal List</Link></li>
                                        <li><Link to={all_routes.goalType}>Goal Type</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#"><span>Training</span>
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.trainers}>Training List</Link></li>
                                        <li><Link to={all_routes.trainers}>Trainers</Link></li>
                                        <li><Link to={all_routes.trainingType}>Training Type</Link></li>
                                    </ul>
                                </li>
                                <li><Link to={all_routes.promotion}><span>Promotion</span></Link></li>
                                <li><Link to={all_routes.resignation}><span>Resignation</span></Link></li>
                                <li><Link to={all_routes.termination}><span>Termination</span></Link></li>
                            </ul>
                        </div>
                        <div className="tab-pane fade" id="finance">
                            <ul>
                                <li className="menu-title"><span>FINANCE & ACCOUNTS</span></li>
                                <li className="submenu">
                                    <Link to="#"><span>Sales</span>
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.estimate}>Estimates</Link></li>
                                        <li><Link to={all_routes.invoices}>Invoices</Link></li>
                                        <li><Link to={all_routes.payments}>Payments</Link></li>
                                        <li><Link to={all_routes.expenses}>Expenses</Link></li>
                                        <li><Link to={all_routes.providentfund}>Provident Fund</Link></li>
                                        <li><Link to={all_routes.taxes}>Taxes</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#"><span>Accounting</span>
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.categories}>Categories</Link></li>
                                        <li><Link to={all_routes.budgets}>Budgets</Link></li>
                                        <li><Link to={all_routes.budgetexpenses}>Budget Expenses</Link></li>
                                        <li><Link to={all_routes.budgetrevenues}>Budget Revenues</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#"><span>Payroll</span>
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.employeesalary}>Employee Salary</Link></li>
                                        <li><Link to={all_routes.payslip}>Payslip</Link></li>
                                        <li><Link to={all_routes.payrollAddition}>Payroll Items</Link></li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                        <div className="tab-pane fade" id="administration">
                            <ul>
                                <li className="menu-title"><span>ADMINISTRATION</span></li>
                                <li className="submenu">
                                    <Link to="#"><span>Assets</span>
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.assetList}>Assets</Link></li>
                                        <li><Link to={all_routes.assetCategories}>Asset Categories</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#"><span>Help & Supports</span>
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.knowledgebase}>Knowledge Base</Link></li>
                                        <li><Link to={all_routes.activity}>Activities</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#"><span>User Management</span>
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.users}>Users</Link></li>
                                        <li><Link to={all_routes.rolesPermissions}>Roles & Permissions</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#"><span>Reports</span>
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.expensesreport}>Expense Report</Link></li>
                                        <li><Link to={all_routes.invoicereport}>Invoice Report</Link></li>
                                        <li><Link to={all_routes.paymentreport}>Payment Report</Link></li>
                                        <li><Link to={all_routes.projectreport}>Project Report</Link></li>
                                        <li><Link to={all_routes.taskreport}>Task Report</Link></li>
                                        <li><Link to={all_routes.userreport}>User Report</Link></li>
                                        <li><Link to={all_routes.employeereport}>Employee Report</Link></li>
                                        <li><Link to={all_routes.payslipreport}>Payslip Report</Link></li>
                                        <li><Link to={all_routes.attendancereport}>Attendance Report</Link></li>
                                        <li><Link to={all_routes.leavereport}>Leave Report</Link></li>
                                        <li><Link to={all_routes.dailyreport}>Daily Report</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">
                                        General Settings
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.profilesettings}>Profile</Link></li>
                                        <li><Link to={all_routes.securitysettings}>Security</Link></li>
                                        <li><Link to={all_routes.notificationssettings}>Notifications</Link></li>
                                        <li><Link to={all_routes.connectedApps}>Connected Apps</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">
                                        Website Settings
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.bussinessSettings}>Business Settings</Link></li>
                                        <li><Link to={all_routes.seoSettings}>SEO Settings</Link></li>
                                        <li><Link to={all_routes.localizationSettings}>Localization</Link></li>
                                        <li><Link to={all_routes.prefixes}>Prefixes</Link></li>
                                        <li><Link to={all_routes.preference}>Preferences</Link></li>
                                        <li><Link to={all_routes.performanceAppraisal}>Appearance</Link></li>
                                        <li><Link to={all_routes.language}>Language</Link></li>
                                        <li><Link to={all_routes.authenticationSettings}>Authentication</Link></li>
                                        <li><Link to={all_routes.aiSettings}>AI Settings</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">App Settings<span className="menu-arrow"></span></Link>
                                    <ul>
                                        <li><Link to={all_routes.salarySettings}>Salary Settings</Link></li>
                                        <li><Link to={all_routes.approvalSettings}>Approval Settings</Link></li>
                                        <li><Link to={all_routes.invoiceSettings}>Invoice Settings</Link></li>
                                        <li><Link to={all_routes.leaveType}>Leave Type</Link></li>
                                        <li><Link to={all_routes.customFields}>Custom Fields</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">
                                        System Settings
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.emailSettings}>Email Settings</Link></li>
                                        <li><Link to={all_routes.emailTemplates}>Email Templates</Link></li>
                                        <li><Link to={all_routes.smsSettings}>SMS Settings</Link></li>
                                        <li><Link to={all_routes.smsTemplate}>SMS Templates</Link></li>
                                        <li><Link to={all_routes.otpSettings}>OTP</Link></li>
                                        <li><Link to={all_routes.gdprCookies}>GDPR Cookies</Link></li>
                                        <li><Link to={all_routes.maintenanceMode}>Maintenance Mode</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">
                                        Financial Settings
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.paymentGateways}>Payment Gateways</Link></li>
                                        <li><Link to={all_routes.taxRates}>Tax Rate</Link></li>
                                        <li><Link to={all_routes.currencies}>Currencies</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">Other Settings<span className="menu-arrow"></span></Link>
                                    <ul>
                                        <li><Link to={all_routes.customCss}>Custom CSS</Link></li>
                                        <li><Link to={all_routes.customJs}>Custom JS</Link></li>
                                        <li><Link to={all_routes.cronjob}>Cronjob</Link></li>
                                        <li><Link to={all_routes.storage}>Storage</Link></li>
                                        <li><Link to={all_routes.banIpAddress}>Ban IP Address</Link></li>
                                        <li><Link to={all_routes.backup}>Backup</Link></li>
                                        <li><Link to={all_routes.clearcache}>Clear Cache</Link></li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                        <div className="tab-pane fade" id="content">
                            <ul>
                                <li className="menu-title"><span>CONTENT</span></li>
                                <li><Link to={all_routes.pages}>Pages</Link></li>
                                <li className="submenu">
                                    <Link to="#">
                                        Blogs
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.blogs}>All Blogs</Link></li>
                                        <li><Link to={all_routes.blogCategories}>Categories</Link></li>
                                        <li><Link to={all_routes.blogComments}>Comments</Link></li>
                                        <li><Link to={all_routes.blogTags}>Blog Tags</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">
                                        Locations
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.countries}>Countries</Link></li>
                                        <li><Link to={all_routes.states}>States</Link></li>
                                        <li><Link to={all_routes.cities}>Cities</Link></li>
                                    </ul>
                                </li>
                                <li><Link to={all_routes.testimonials}>Testimonials</Link></li>
                                <li><Link to={all_routes.faq}>FAQ’S</Link></li>
                            </ul>
                        </div>
                        <div className="tab-pane fade" id="pages">
                            <ul>
                                <li className="menu-title"><span>PAGES</span></li>
                                <li><Link to={all_routes.starter}><span>Starter</span></Link></li>
                                <li><Link to={all_routes.profile}><span>Profile</span></Link></li>
                                <li><Link to={all_routes.gallery}><span>Gallery</span></Link></li>
                                <li><Link to={all_routes.searchresult}><span>Search Results</span></Link></li>
                                <li><Link to={all_routes.timeline}><span>Timeline</span></Link></li>
                                <li><Link to={all_routes.pricing}><span>Pricing</span></Link></li>
                                <li><Link to={all_routes.comingSoon}><span>Coming Soon</span></Link></li>
                                <li><Link to={all_routes.underMaintenance}><span>Under Maintenance</span></Link></li>
                                <li><Link to={all_routes.underConstruction}><span>Under Construction</span></Link></li>
                                <li><Link to={all_routes.apikey}><span>API Keys</span></Link></li>
                                <li><Link to={all_routes.privacyPolicy}><span>Privacy Policy</span></Link></li>
                                <li><Link to={all_routes.termscondition}><span>Terms & Conditions</span></Link></li>
                            </ul>
                        </div>
                        <div className="tab-pane fade" id="authentication">
                            <ul>
                                <li className="menu-title"><span>AUTHENTICATION</span></li>
                                <li className="submenu">
                                    <Link to="#">
                                        Login<span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.login}>Cover</Link></li>
                                        <li><Link to={all_routes.login2}>Illustration</Link></li>
                                        <li><Link to={all_routes.login3}>Basic</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">
                                        Register<span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.register}>Cover</Link></li>
                                        <li><Link to={all_routes.register2}>Illustration</Link></li>
                                        <li><Link to={all_routes.register3}>Basic</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">
                                        Forgot Password<span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.forgotPassword}>Cover</Link></li>
                                        <li><Link to={all_routes.forgotPassword2}>Illustration</Link></li>
                                        <li><Link to={all_routes.forgotPassword3}>Basic</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">
                                        Reset Password<span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.resetPassword}>Cover</Link></li>
                                        <li><Link to={all_routes.resetPassword2}>Illustration</Link></li>
                                        <li><Link to={all_routes.resetPassword3}>Basic</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">
                                        Email Verification<span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.emailVerification}>Cover</Link></li>
                                        <li><Link to={all_routes.emailVerification2}>Illustration</Link></li>
                                        <li><Link to={all_routes.emailVerification3}>Basic</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">
                                        2 Step Verification<span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.twoStepVerification}>Cover</Link></li>
                                        <li><Link to={all_routes.twoStepVerification2}>Illustration</Link></li>
                                        <li><Link to={all_routes.twoStepVerification3}>Basic</Link></li>
                                    </ul>
                                </li>
                                <li><Link to={all_routes.lockScreen}>Lock Screen</Link></li>
                                <li><Link to={all_routes.error404}>404 Error</Link></li>
                                <li><Link to={all_routes.error500}>500 Error</Link></li>
                            </ul>
                        </div>
                        <div className="tab-pane fade" id="ui-elements">
                            <ul>
                                <li className="menu-title"><span>UI INTERFACE</span></li>
                                <li className="submenu">
                                    <Link to="#">Base UI<span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li><Link to={all_routes.uiAlerts}>Alerts</Link></li>
                                        <li><Link to={all_routes.uiAccordion}>Accordion</Link></li>
                                        <li><Link to={all_routes.uiAvatar}>Avatar</Link></li>
                                        <li><Link to={all_routes.uiBadges}>Badges</Link></li>
                                        <li><Link to={all_routes.uiBorders}>Border</Link></li>
                                        <li><Link to={all_routes.uiButtons}>Buttons</Link></li>
                                        <li><Link to={all_routes.uiButtonsGroup}>Button Group</Link></li>
                                        <li><Link to={all_routes.uiBreadcrumb}>Breadcrumb</Link></li>
                                        <li><Link to={all_routes.uiCards}>Card</Link></li>
                                        <li><Link to={all_routes.uiCarousel}>Carousel</Link></li>
                                        <li><Link to={all_routes.uiColor}>Colors</Link></li>
                                        <li><Link to={all_routes.uiDropdowns}>Dropdowns</Link></li>
                                        <li><Link to={all_routes.grid}>Grid</Link></li>
                                        <li><Link to={all_routes.images}>Images</Link></li>
                                        <li><Link to={all_routes.lightbox}>Lightbox</Link></li>
                                        <li><Link to={all_routes.media}>Media</Link></li>
                                        <li><Link to={all_routes.modals}>Modals</Link></li>
                                        <li><Link to={all_routes.offcanvas}>Offcanvas</Link></li>
                                        <li><Link to={all_routes.pagination}>Pagination</Link></li>
                                        <li><Link to={all_routes.popover}>Popovers</Link></li>
                                        <li><Link to={all_routes.progress}>Progress</Link></li>
                                        <li><Link to={all_routes.placeholder}>Placeholders</Link></li>
                                        <li><Link to={all_routes.spinner}>Spinner</Link></li>
                                        <li><Link to={all_routes.sweetalert}>Sweet Alerts</Link></li>
                                        <li><Link to={all_routes.navTabs}>Tabs</Link></li>
                                        <li><Link to={all_routes.toasts}>Toasts</Link></li>
                                        <li><Link to={all_routes.tooltip}>Tooltips</Link></li>
                                        <li><Link to={all_routes.typography}>Typography</Link></li>
                                        <li><Link to={all_routes.video}>Video</Link></li>
                                        <li><Link to={all_routes.sortable}>Sortable</Link></li>
                                        <li><Link to={all_routes.swiperjs}>Swiperjs</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#"> Advanced UI <span className="menu-arrow"></span> </Link>
                                    <ul>
                                        <li><Link to={all_routes.ribbon}>Ribbon</Link></li>
                                        <li><Link to={all_routes.clipboard}>Clipboard</Link></li>
                                        <li><Link to={all_routes.dragandDrop}>Drag & Drop</Link></li>
                                        <li><Link to={all_routes.rangeSlider}>Range Slider</Link></li>
                                        <li><Link to={all_routes.rating}>Rating</Link></li>
                                        <li><Link to={all_routes.textEditor}>Text Editor</Link></li>
                                        <li><Link to={all_routes.counter}>Counter</Link></li>
                                        <li><Link to={all_routes.scrollBar}>Scrollbar</Link></li>
                                        <li><Link to={all_routes.stickyNotes}>Sticky Note</Link></li>
                                        <li><Link to={all_routes.timeline}>Timeline</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#"> Forms <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                        <li className="submenu submenu-two">
                                            <Link to="#">Form Elements<span
                                                    className="menu-arrow inside-submenu"></span></Link>
                                            <ul>
                                                <li><Link to={all_routes.basicInput}>Basic Inputs</Link></li>
                                                <li><Link to={all_routes.checkboxandRadion}>Checkbox & Radios</Link></li>
                                                <li><Link to={all_routes.inputGroup}>Input Groups</Link></li>
                                                <li><Link to={all_routes.gridandGutters}>Grid & Gutters</Link></li>
                                                <li><Link to={all_routes.formSelect}>Form Select</Link></li>
                                                <li><Link to={all_routes.formMask}>Input Masks</Link></li>
                                                <li><Link to={all_routes.fileUpload}>File Uploads</Link></li>
                                            </ul>
                                        </li>
                                        <li className="submenu submenu-two">
                                            <Link to="#">Layouts<span
                                                    className="menu-arrow inside-submenu"></span></Link>
                                            <ul>
                                                <li><Link to={all_routes.horizontalForm}>Horizontal Form</Link></li>
                                                <li><Link to={all_routes.verticalForm}>Vertical Form</Link></li>
                                                <li><Link to={all_routes.floatingLable}>Floating Labels</Link></li>
                                            </ul>
                                        </li>
                                        <li><Link to={all_routes.formValidation}>Form Validation</Link></li>
                                        <li><Link to={all_routes.formSelect2}>Select2</Link></li>
                                        <li><Link to={all_routes.formWizard}>Form Wizard</Link></li>
                                        <li><Link to={all_routes.formPicker}>Form Picker</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">Tables <span className="menu-arrow"></span></Link>
                                    <ul>
                                        <li><Link to={all_routes.tablesBasic}>Basic Tables </Link></li>
                                        <li><Link to={all_routes.dataTables}>Data Table </Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">Charts<span className="menu-arrow"></span> </Link>
                                    <ul>
                                        <li><Link to={all_routes.apexChart}>Apex Charts</Link></li>
                                      
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">Icons<span className="menu-arrow"></span> </Link>
                                    <ul>
                                        <li><Link to={all_routes.fontawesome}>Fontawesome Icons</Link></li>
                                        <li><Link to={all_routes.tablerIcons}>Tabler Icons</Link></li>
                                        <li><Link to={all_routes.bootstrapIcons}>Bootstrap Icons</Link></li>
                                        <li><Link to={all_routes.RemixIcons}>Remix Icons</Link></li>
                                        <li><Link to={all_routes.featherIcons}>Feather Icons</Link></li>
                                        <li><Link to={all_routes.iconicIcon}>Ionic Icons</Link></li>
                                        <li><Link to={all_routes.materialIcon}>Material Icons</Link></li>
                                        <li><Link to={all_routes.pe7icon}>Pe7 Icons</Link></li>
                                        <li><Link to={all_routes.simpleLineIcon}>Simpleline Icons</Link></li>
                                        <li><Link to={all_routes.themifyIcon}>Themify Icons</Link></li>
                                        <li><Link to={all_routes.weatherIcon}>Weather Icons</Link></li>
                                        <li><Link to={all_routes.typicon}>Typicon Icons</Link></li>
                                        <li><Link to={all_routes.FlagIcons}>Flag Icons</Link></li>
                                    </ul>
                                </li>
                                <li className="submenu">
                                    <Link to="#">
                                        <span>Maps</span>
                                        <span className="menu-arrow"></span>
                                    </Link>
                                    <ul>
                                      
                                        <li>
                                            <Link to={all_routes.mapLeaflet}>Leaflet</Link>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                        <div className="tab-pane fade" id="extras">
                            <ul>
                                <li className="menu-title"><span>EXTRAS</span></li>
                                <li><Link to="#">Documentation</Link></li>
                                <li><Link to="#">Change Log</Link></li>
                                <li className="submenu">
                                    <Link to="#"><span>Multi Level</span><span
                                            className="menu-arrow"></span></Link>
                                    <ul>
                                        <li><Link to="#">Multilevel 1</Link></li>
                                        <li className="submenu submenu-two">
                                            <Link to="#">Multilevel 2<span
                                                    className="menu-arrow inside-submenu"></span></Link>
                                            <ul>
                                                <li><Link to="#">Multilevel 2.1</Link></li>
                                                <li className="submenu submenu-two submenu-three">
                                                    <Link to="#">Multilevel 2.2<span
                                                            className="menu-arrow inside-submenu inside-submenu-two"></span></Link>
                                                    <ul>
                                                        <li><Link to="#">Multilevel 2.2.1</Link></li>
                                                        <li><Link to="#">Multilevel 2.2.2</Link></li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </li>
                                        <li><Link to="#">Multilevel 3</Link></li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default TwoColumnSidebar