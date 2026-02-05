import { useCallback, useEffect, useMemo, useState,memo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ImageWithBasePath from "../imageWithBasePath";
import "../../../assets/icon/tabler-icons/webfont/tabler-icons.css";
import { setExpandMenu } from "../../data/redux/sidebarSlice";
import { useDispatch, useSelector } from "react-redux";
import { SidebarDataTest } from "../../data/json/sidebarMenu";
import { all_routes } from "../../../router/all_routes";
import type { AppDispatch } from "../../data/redux/store";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import {
  Sidebar as NbsSidebarImport,
  type SidebarConfig,
  type SidebarNavLinkItem,
  type SidebarProps,
} from "@nbs/component-library";

/** Typed alias so the IDE shows prop suggestions for inline props */
const NbsSidebar = NbsSidebarImport as React.ComponentType<SidebarProps>;

import {
  LayoutDashboard,
  FileText,
  Folder,
  Pencil,
  PenTool,
  Bell,
  BarChart3,
  Table,
  Shield,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  Folder,
  Pencil,
  PenTool,
  Bell,
  BarChart3,
  Table,
  Shield,
};

interface SidebarMenuItem {
  label: string;
  translationKey?: string;
  link: string;
  submenu?: boolean;
  submenuItems?: SidebarMenuItem[];
  icon?: string;
  adminOnly?: boolean;
}

interface SidebarMainMenu {
  submenuItems: SidebarMenuItem[];
}

function collectHrefs(items: SidebarMenuItem[], isAdmin: boolean): string[] {
  const hrefs: string[] = [];
  for (const item of items) {
    if (item.adminOnly && !isAdmin) continue;
    if (item.submenuItems?.length) {
      hrefs.push(...collectHrefs(item.submenuItems, isAdmin));
    } else {
      hrefs.push(item.link);
    }
  }
  return hrefs;
}

function pickActiveHref(pathname: string, hrefs: string[]): string {
  const norm = (p: string) => p.toLowerCase().replace(/\/$/, "") || "";
  const current = norm(pathname);
  let best: string | undefined;
  for (const href of hrefs) {
    const h = norm(href);
    if (current === h || current.startsWith(h + "/")) {
      if (!best || norm(best).length < h.length) best = href;
    }
  }
  return best ?? pathname;
}

const Sidebar = memo(() => {
  const dataLayout = useSelector((state: any) => state.themeSetting.dataLayout);
  const useGlassEffect = dataLayout !== "modern";
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const { t } = useTranslation();

  const isAdmin = user?.role === "admin" || (user as any)?.is_admin === true;
  const [activeHref, setActiveHref] = useState<string>(() => location.pathname);

  const allHrefs = useMemo(() => {
    const menuData = (SidebarDataTest ?? []) as SidebarMainMenu[];
    const hrefs: string[] = [];
    for (const main of menuData) {
      hrefs.push(...collectHrefs(main.submenuItems ?? [], isAdmin));
    }
    return hrefs;
  }, [isAdmin]);

  useEffect(() => {
    setActiveHref(pickActiveHref(location.pathname, allHrefs));
  }, [location.pathname, allHrefs]);

  const onMouseEnter = useCallback(() => {
    dispatch(setExpandMenu(true));
    if (document.body.classList.contains("mini-sidebar") || document.documentElement.getAttribute("data-size") === "hoverview") {
      document.body.classList.add("expand-menu");
    }
  }, [dispatch]);

  const onMouseLeave = useCallback(() => {
    dispatch(setExpandMenu(false));
    document.body.classList.remove("expand-menu");
  }, [dispatch]);

  const handleItemClick = useCallback(
    (href: string) => {
      setActiveHref(href);
      navigate(href);
    },
    [navigate]
  );

  const sidebarConfig = useMemo<SidebarConfig>(() => {
    function flattenToLinks(menuItems: SidebarMenuItem[]): SidebarNavLinkItem[] {
      const out: SidebarNavLinkItem[] = [];
      for (const item of menuItems) {
        if (item.adminOnly && !isAdmin) continue;
        if (item.submenuItems?.length) {
          out.push(...flattenToLinks(item.submenuItems));
          continue;
        }
        out.push({
          type: "link",
          name: item.translationKey ? t(`sidebar.${item.translationKey}`) : item.label,
          href: item.link,
          icon: item.icon && iconMap[item.icon] ? iconMap[item.icon] : undefined,
          onClick: handleItemClick,
        });
      }
      return out;
    }
    const menuData = (SidebarDataTest ?? []) as SidebarMainMenu[];
    const sectionItems: SidebarNavLinkItem[] = [];
    for (const main of menuData) {
      sectionItems.push(...flattenToLinks(main.submenuItems ?? []));
    }
    return {
      sections: [
        {
          id: "main",
          label: t("sidebar.mainMenu"),
          collapsible: true,
          defaultOpen: true,
          items: sectionItems,
        },
      ],
    };
  }, [isAdmin, t, handleItemClick]);

  return (
    <div
      className="sidebar"
      id="sidebar"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="sidebar-logo">
        <Link to={all_routes.adminDashboard} className="logo logo-normal">
          <span className="logo-text">NBS Archive System</span>
        </Link>
        <Link to={all_routes.adminDashboard} className="logo-small" />
        <Link to={all_routes.adminDashboard} className="dark-logo">
          <span className="logo-text">NBS Archive System</span>
        </Link>
      </div>

      <div className="modern-profile p-3 pb-0">
        <div className="text-center rounded p-3 mb-4 user-profile">
          <div className="avatar avatar-lg online mb-3">
            <ImageWithBasePath
              src="assets/img/profiles/avatar-02.jpg"
              alt="Img"
              className="img-fluid rounded-circle"
            />
          </div>
          <h6 className="fs-12 fw-normal mb-1">Admin User</h6>
          <p className="fs-10">Administrator</p>
        </div>
        <hr />
      </div>

      <div className="sidebar-header p-3 pb-0 pt-2">
        <div className="text-center rounded bg-light p-2 mb-4 sidebar-profile d-flex align-items-center">
          <div className="avatar avatar-md onlin">
            <ImageWithBasePath
              src="assets/img/profiles/avatar-02.jpg"
              alt="Img"
              className="img-fluid rounded-circle"
            />
          </div>
          <div className="text-start sidebar-profile-info ms-2">
            <h6 className="fs-12 fw-normal mb-1">Admin User</h6>
            <p className="fs-10">Administrator</p>
          </div>
        </div>
        <div className="input-group input-group-flat d-inline-flex mb-4">
          <span className="input-icon-addon">
            <i className="ti ti-search" />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder={t("sidebar.search")}
          />
          <span className="input-group-text">
            <kbd>CTRL + /</kbd>
          </span>
        </div>
        <div className="d-flex align-items-center justify-content-between menu-item mb-3">
          <div className="me-3">
            <Link to={all_routes.archiveFolders} className="btn btn-menubar">
              <i className="ti ti-folder" />
            </Link>
          </div>
          <div className="me-3">
            <Link to={all_routes.archiveUpload} className="btn btn-menubar">
              <i className="ti ti-upload" />
            </Link>
          </div>
          <div className="me-3 notification-item">
            <Link to={all_routes.archiveActivity} className="btn btn-menubar position-relative me-1">
              <i className="ti ti-activity" />
            </Link>
          </div>
          <div className="me-0">
            <Link to={all_routes.archiveTrash} className="btn btn-menubar">
              <i className="ti ti-trash" />
            </Link>
          </div>
        </div>
      </div>

      <NbsSidebar config={sidebarConfig} activeHref={activeHref} width="100%" glassEffect={useGlassEffect} />
    </div>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
