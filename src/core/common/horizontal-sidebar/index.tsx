import React, { useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { HorizontalSidebarData } from "../../data/json/horizontalSidebar";
import ImageWithBasePath from "../imageWithBasePath";

// Types for menu items
interface SubMenuThree {
  menuValue: string;
  route: string;
}

interface SubMenuTwo {
  menuValue: string;
  route?: string;
  customSubmenuTwo?: boolean;
  customSubmenuThree?: boolean;
  subMenusTwo?: SubMenuThree[];
  subMenusThree?: SubMenuThree[];
}

interface SubMenu {
  menuValue: string;
  route?: string;
  customSubmenuTwo?: boolean;
  subMenusTwo?: SubMenuTwo[];
}

interface MenuItem {
  menuValue: string;
  hasSubRoute?: boolean;
  showSubRoute?: boolean;
  icon?: string;
  base?: string;
  subMenus?: SubMenu[];
}

interface MenuGroup {
  title: string;
  showAsTab: boolean;
  separateRoute: boolean;
  menu: MenuItem[];
}

// Helper: Recursively get all routes from a menu structure
const getAllRoutes = (item: SubMenu | SubMenuTwo | SubMenuThree): string[] => {
  const routes: string[] = [];
  if ("route" in item && item.route) {
    routes.push(item.route);
  }
  if ("subMenusTwo" in item && item.subMenusTwo) {
    item.subMenusTwo.forEach((sub) => {
      routes.push(...getAllRoutes(sub));
    });
  }
  if ("subMenusThree" in item && item.subMenusThree) {
    item.subMenusThree.forEach((sub) => {
      routes.push(...getAllRoutes(sub));
    });
  }
  return routes;
};

const HorizontalSidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // State for open menus at different levels (only opens on click, not auto-open)
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(new Set());
  const [openSubMenusTwo, setOpenSubMenusTwo] = useState<Set<string>>(
    new Set()
  );
  const [openSubMenusThree, setOpenSubMenusThree] = useState<Set<string>>(
    new Set()
  );

  // Toggle functions (subdrop class only added on click)
  const toggleMenu = useCallback((menuValue: string) => {
    setOpenMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuValue)) {
        newSet.delete(menuValue);
      } else {
        newSet.add(menuValue);
      }
      return newSet;
    });
  }, []);

  const toggleSubMenu = useCallback((menuValue: string) => {
    setOpenSubMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuValue)) {
        newSet.delete(menuValue);
      } else {
        newSet.add(menuValue);
      }
      return newSet;
    });
  }, []);

  const toggleSubMenuTwo = useCallback((menuValue: string) => {
    setOpenSubMenusTwo((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuValue)) {
        newSet.delete(menuValue);
      } else {
        newSet.add(menuValue);
      }
      return newSet;
    });
  }, []);

  const toggleSubMenuThree = useCallback((menuValue: string) => {
    setOpenSubMenusThree((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuValue)) {
        newSet.delete(menuValue);
      } else {
        newSet.add(menuValue);
      }
      return newSet;
    });
  }, []);

  // Check if menu is active
  const isMenuActive = useCallback(
    (menuItem: MenuItem): boolean => {
      const routes =
        menuItem.subMenus?.flatMap((sub) => getAllRoutes(sub)) || [];
      return routes.includes(currentPath);
    },
    [currentPath]
  );

  // Check if submenu is active
  const isSubMenuActive = useCallback(
    (subItem: SubMenu | SubMenuTwo): boolean => {
      if ("route" in subItem && subItem.route === currentPath) return true;
      const routes = getAllRoutes(subItem);
      return routes.includes(currentPath);
    },
    [currentPath]
  );

  return (
    <div className="sidebar sidebar-horizontal" id="horizontal-menu">
      <div className="sidebar-menu">
        <div className="main-menu">
          <ul className="nav-menu">
            <li className="menu-title">
              <span>Main</span>
            </li>

            {(HorizontalSidebarData as MenuGroup[])?.map((group, groupIdx) =>
              group.menu?.map((menuItem, i) => {
                const hasSubmenu =
                  menuItem.subMenus && menuItem.subMenus.length > 0;
                const isOpen = openMenus.has(menuItem.menuValue);
                const isActive = isMenuActive(menuItem);

                return (
                  <li className={hasSubmenu ? "submenu" : ""} key={`menu-${groupIdx}-${i}`}>
                    <Link
                      to="#"
                      onClick={(e) => {
                        if (hasSubmenu) {
                          e.preventDefault();
                          toggleMenu(menuItem.menuValue);
                        }
                      }}
                      className={`${isActive ? "active" : ""} ${
                        isOpen ? "subdrop" : ""
                      }`}
                    >
                      {menuItem.icon && (
                        <i className={`ti ti-${menuItem.icon}`}></i>
                      )}
                      <span>{menuItem.menuValue}</span>
                      {hasSubmenu && <span className="menu-arrow"></span>}
                    </Link>

                    {/* Level 1 Submenu */}
                    {hasSubmenu && (
                      <ul style={{ display: isOpen ? "block" : "none" }}>
                        {menuItem.subMenus?.map((subItem, j) => {
                          const hasSubTwo =
                            subItem.customSubmenuTwo &&
                            subItem.subMenusTwo &&
                            subItem.subMenusTwo.length > 0;
                          const isSubOpen = openSubMenus.has(subItem.menuValue);
                          const isSubActive = isSubMenuActive(subItem);

                          return (
                            <li
                              className={hasSubTwo ? "submenu submenu-two" : ""}
                              key={`sub-${groupIdx}-${i}-${j}`}
                            >
                              <Link
                                to={hasSubTwo ? "#" : subItem.route || "#"}
                                onClick={(e) => {
                                  if (hasSubTwo) {
                                    e.preventDefault();
                                    toggleSubMenu(subItem.menuValue);
                                  }
                                }}
                                className={`${isSubActive ? "active" : ""} ${
                                  isSubOpen ? "subdrop" : ""
                                }`}
                              >
                                {subItem.menuValue}
                                {hasSubTwo && (
                                  <span className="menu-arrow inside-submenu"></span>
                                )}
                              </Link>

                              {/* Level 2 Submenu */}
                              {hasSubTwo && (
                                <ul
                                  style={{
                                    display: isSubOpen ? "block" : "none",
                                  }}
                                >
                                  {subItem.subMenusTwo?.map((subTwo, k) => {
                                    const hasSubThree =
                                      (subTwo.customSubmenuTwo ||
                                        subTwo.customSubmenuThree) &&
                                      (subTwo.subMenusTwo ||
                                        subTwo.subMenusThree) &&
                                      ((subTwo.subMenusTwo &&
                                        subTwo.subMenusTwo.length > 0) ||
                                        (subTwo.subMenusThree &&
                                          subTwo.subMenusThree.length > 0));
                                    const isSubTwoOpen = openSubMenusTwo.has(
                                      subTwo.menuValue
                                    );
                                    const isSubTwoActive =
                                      isSubMenuActive(subTwo);

                                    return (
                                      <li
                                        className={hasSubThree ? "submenu" : ""}
                                        key={`sub-two-${groupIdx}-${i}-${j}-${k}`}
                                      >
                                        <Link
                                          to={
                                            hasSubThree
                                              ? "#"
                                              : subTwo.route || "#"
                                          }
                                          onClick={(e) => {
                                            if (hasSubThree) {
                                              e.preventDefault();
                                              toggleSubMenuTwo(
                                                subTwo.menuValue
                                              );
                                            }
                                          }}
                                          className={`${
                                            isSubTwoActive ? "active" : ""
                                          } ${isSubTwoOpen ? "subdrop" : ""}`}
                                        >
                                          {subTwo.menuValue}
                                          {hasSubThree && (
                                            <span className="menu-arrow"></span>
                                          )}
                                        </Link>

                                        {/* Level 3 Submenu */}
                                        {hasSubThree && (
                                          <ul
                                            style={{
                                              display: isSubTwoOpen
                                                ? "block"
                                                : "none",
                                            }}
                                          >
                                            {(
                                              subTwo.subMenusTwo ||
                                              subTwo.subMenusThree
                                            )?.map((subThree, l) => {
                                              const hasSubFour =
                                                "subMenusTwo" in subThree ||
                                                "subMenusThree" in subThree;
                                              const isSubThreeOpen =
                                                openSubMenusThree.has(
                                                  subThree.menuValue
                                                );

                                              if (hasSubFour) {
                                                return (
                                                  <li
                                                    className="submenu submenu-two submenu-three"
                                                    key={`sub-three-${groupIdx}-${i}-${j}-${k}-${l}`}
                                                  >
                                                    <Link
                                                      to="#"
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        toggleSubMenuThree(
                                                          subThree.menuValue
                                                        );
                                                      }}
                                                      className={
                                                        isSubThreeOpen
                                                          ? "subdrop"
                                                          : ""
                                                      }
                                                    >
                                                      {subThree.menuValue}
                                                      <span className="menu-arrow inside-submenu inside-submenu-two"></span>
                                                    </Link>
                                                    <ul
                                                      style={{
                                                        display: isSubThreeOpen
                                                          ? "block"
                                                          : "none",
                                                      }}
                                                    >
                                                      {(
                                                        (subThree as SubMenuTwo)
                                                          .subMenusTwo ||
                                                        (subThree as SubMenuTwo)
                                                          .subMenusThree
                                                      )?.map((subFour, m) => (
                                                        <li
                                                          key={`sub-four-${groupIdx}-${i}-${j}-${k}-${l}-${m}`}
                                                        >
                                                          <Link
                                                            to={
                                                              subFour.route ||
                                                              "#"
                                                            }
                                                            className={
                                                              subFour.route ===
                                                              currentPath
                                                                ? "active"
                                                                : ""
                                                            }
                                                          >
                                                            {subFour.menuValue}
                                                          </Link>
                                                        </li>
                                                      ))}
                                                    </ul>
                                                  </li>
                                                );
                                              }

                                              return (
                                                <li key={`sub-three-link-${groupIdx}-${i}-${j}-${k}-${l}`}>
                                                  <Link
                                                    to={subThree.route || "#"}
                                                    className={
                                                      subThree.route ===
                                                      currentPath
                                                        ? "active"
                                                        : ""
                                                    }
                                                  >
                                                    {subThree.menuValue}
                                                  </Link>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })
            )}
          </ul>

          {/* Profile & Theme Toggle */}
          <div className="d-xl-flex align-items-center d-none">
            <Link to="#" className="me-3 avatar avatar-sm">
              <ImageWithBasePath
                src="assets/img/profiles/avatar-07.jpg"
                alt="profile"
                className="rounded-circle"
              />
            </Link>
            <Link
              to="#"
              className="btn btn-icon btn-sm rounded-circle mode-toggle"
            >
              <i className="ti ti-sun"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HorizontalSidebar;
