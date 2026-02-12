import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSidebarUiStore } from "../../../shared/stores/sidebarUiStore";
import { searchApi } from "../../../app/adapter/api/search.api";
import type { SearchResult } from "../../../app/adapter/api/search.api";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import ImageWithBasePath from "../imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import { Button } from "../../../shared/components/ui";
import { convertToArabianStandardTime } from "../../../shared/utils/format/date";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import React from "react";
import type { HorizontalMenuItem, HorizontalSubMenu } from "../../data/types";

const hasActiveChild = (
  subMenus: HorizontalSubMenu[] | undefined,
  currentPath: string
): boolean => {
  if (!subMenus) return false;
  return subMenus.some((sub) => {
    if (sub.route === currentPath) return true;
    if (sub.subMenusTwo && hasActiveChild(sub.subMenusTwo, currentPath))
      return true;
    if (sub.subMenusThree && hasActiveChild(sub.subMenusThree, currentPath))
      return true;
    if (sub.subMenusFour && hasActiveChild(sub.subMenusFour, currentPath))
      return true;
    return false;
  });
};

const Header = React.memo(() => {
  const { t } = useTranslation();
  const routes = all_routes;
  const navigate = useNavigate();
  const Location = useLocation();
  const headerSearchRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout().then(() => {
      navigate(routes.login, { replace: true });
    });
  }, [logout, navigate]);

  const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(new Set());
  const [openSubMenusTwo, setOpenSubMenusTwo] = useState<Set<string>>(
    new Set()
  );
  const [openSubMenusThree, setOpenSubMenusThree] = useState<Set<string>>(
    new Set()
  );

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

  const {
    mobileSidebar,
    setMobileSidebar,
    toggleMiniSidebar,
  } = useSidebarUiStore();

  // Memoize the toggle mobile sidebar function
  const toggleMobileSidebar = useCallback(() => {
    setMobileSidebar(!mobileSidebar);
  }, [setMobileSidebar, mobileSidebar]);

  // Memoize the toggle mini sidebar function
  const handleToggleMiniSidebar = useCallback(() => {
    toggleMiniSidebar();
  }, [toggleMiniSidebar]);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Header global search (documents + folders)
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    setSearchError(null);
    searchApi
      .globalSearch({
        query: debouncedSearchTerm.trim(),
        search_in_content: true,
        fuzzy: true,
      })
      .then((res) => {
        if (!cancelled) {
          setSearchResults(res.data || []);
          setSearchError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSearchResults([]);
          setSearchError(err?.message || t("header.searchFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerSearchRef.current && !headerSearchRef.current.contains(e.target as Node)) {
        setSearchDropdownOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /**
   * Normalizes the entity type from API response
   * @param type - The type or entity_type from API
   * @returns Normalized type: "document", "folder", or "note"
   */
  const normalizeType = useCallback((type: string | undefined): "document" | "folder" | "note" => {
    const lowerType = type?.toLowerCase();
    if (lowerType === "folder") return "folder";
    if (lowerType === "note") return "note";
    return "document";
  }, []);

  /** Use entity_type from API when type is missing */
  const getEffectiveType = useCallback(
    (item: SearchResult): "document" | "folder" | "note" => {
      return normalizeType(item.type ?? item.entity_type);
    },
    [normalizeType]
  );

  /**
   * Gets the display name for a search result based on entity type
   * @param item - Search result item
   * @returns Display name string
   */
  const getDisplayName = useCallback(
    (item: SearchResult) => {
      const t = getEffectiveType(item);
      if (t === "document") return item.title || item.name || "-";
      if (t === "note") return item.title || "-";
      return item.name || item.title || "-";
    },
    [getEffectiveType]
  );

  /** Formats API timestamp (UTC) as Arabia Standard Time for search result meta. */
  const formatDateCompact = useCallback((iso: string | undefined): string => {
    if (!iso) return "-";
    return convertToArabianStandardTime(iso);
  }, []);

  /**
   * Gets metadata to display for a search result based on entity type
   * @param item - Search result item
   * @returns Formatted metadata string
   */
  const getMeta = useCallback(
    (item: SearchResult): string => {
      const t = getEffectiveType(item);
      if (t === "document") {
        if (item.barcode?.trim()) return item.barcode.trim();
        return formatDateCompact(item.upload_date ?? item.created_at);
      }
      if (t === "note") {
        return formatDateCompact(item.updated_at ?? item.created_at);
      }
      return formatDateCompact(item.create_date ?? item.created_at);
    },
    [getEffectiveType, formatDateCompact]
  );

  /**
   * Handles click on a search result item
   * - Documents: Navigate to document detail page
   * - Folders: Navigate to folder detail page
   * - Notes: Navigate to the folder containing the note (if folder_id exists)
   */
  const handleSearchResultClick = useCallback(
    (item: SearchResult) => {
      setSearchDropdownOpen(false);
      setSearchTerm("");
      setSearchResults([]);
      const type = getEffectiveType(item);
      
      if (type === "document") {
        navigate(routes.documentDetail.replace(":id", String(item.id)));
      } else if (type === "folder") {
        navigate(routes.folderDetail.replace(":id", String(item.id)));
      } else if (type === "note") {
        // Navigate to folder containing the note
        if (item.folder_id) {
          navigate(routes.folderDetail.replace(":id", String(item.folder_id)));
        } else {
          // Show error if folder_id doesn't exist
          setSearchError(t("header.noteFolderNotFound") || "Note's folder not found");
          setTimeout(() => setSearchError(null), 3000);
        }
      }
    },
    [navigate, getEffectiveType, routes.documentDetail, routes.folderDetail, t]
  );

  // Memoize the toggle fullscreen function
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen]);

  const renderSubMenusFour = useCallback(
    (items: HorizontalSubMenu[] | undefined) => {
      if (!items) return null;
      return items.map((item, index) => (
        <li key={`level4-${index}-${item.menuValue || item.label}`}>
          <Link
            to={item.route || "#"}
            className={item.route === Location.pathname ? "active" : ""}
          >
            {item.menuValue || item.label}
          </Link>
        </li>
      ));
    },
    [Location.pathname]
  );

  const renderSubMenusThree = useCallback(
    (items: HorizontalSubMenu[] | undefined, parentKey: string) => {
      if (!items) return null;
      return items.map((item, index) => {
        const menuKey = `${parentKey}-l3-${index}-${
          item.menuValue || item.label
        }`;
        const hasSubMenus = item.subMenusFour && item.subMenusFour.length > 0;
        const isActive =
          item.route === Location.pathname ||
          hasActiveChild(item.subMenusFour, Location.pathname);
        const isOpen = openSubMenusThree.has(menuKey);

        return (
          <li
            key={menuKey}
            className={hasSubMenus ? "submenu submenu-two submenu-three" : ""}
          >
            <Link
              to={item.route || "#"}
              className={`${isActive ? "active" : ""} ${
                isOpen ? "subdrop" : ""
              }`}
              onClick={(e) => {
                if (hasSubMenus) {
                  e.preventDefault();
                  toggleSubMenuThree(menuKey);
                }
              }}
            >
              {item.menuValue || item.label}
              {hasSubMenus && (
                <span className="menu-arrow inside-submenu inside-submenu-two"></span>
              )}
            </Link>
            {hasSubMenus && (
              <ul style={{ display: isOpen ? "block" : "none" }}>
                {renderSubMenusFour(item.subMenusFour)}
              </ul>
            )}
          </li>
        );
      });
    },
    [
      Location.pathname,
      openSubMenusThree,
      toggleSubMenuThree,
      renderSubMenusFour,
    ]
  );

  // Render Level 2 submenu items
  const renderSubMenusTwo = useCallback(
    (items: HorizontalSubMenu[] | undefined, parentKey: string) => {
      if (!items) return null;
      return items.map((item, index) => {
        const menuKey = `${parentKey}-l2-${index}-${
          item.menuValue || item.label
        }`;
        const hasSubMenus =
          (item.subMenusThree && item.subMenusThree.length > 0) ||
          (item.subMenusFour && item.subMenusFour.length > 0);
        const isActive =
          item.route === Location.pathname ||
          hasActiveChild(item.subMenusThree, Location.pathname) ||
          hasActiveChild(item.subMenusFour, Location.pathname);
        const isOpen = openSubMenusTwo.has(menuKey);

        // Determine the correct submenu items to render
        const subItems = item.subMenusThree || item.subMenusFour;

        return (
          <li
            key={menuKey}
            className={hasSubMenus ? "submenu submenu-two" : ""}
          >
            <Link
              to={item.route || "#"}
              className={`${isActive ? "active" : ""} ${
                isOpen ? "subdrop" : ""
              }`}
              onClick={(e) => {
                if (hasSubMenus) {
                  e.preventDefault();
                  toggleSubMenuTwo(menuKey);
                }
              }}
            >
              {item.menuValue || item.label}
              {hasSubMenus && (
                <span className="menu-arrow inside-submenu"></span>
              )}
            </Link>
            {hasSubMenus && subItems && (
              <ul style={{ display: isOpen ? "block" : "none" }}>
                {item.subMenusThree
                  ? renderSubMenusThree(item.subMenusThree, menuKey)
                  : renderSubMenusFour(item.subMenusFour)}
              </ul>
            )}
          </li>
        );
      });
    },
    [
      Location.pathname,
      renderSubMenusThree,
      renderSubMenusFour,
    ]
  );

  // Render Level 1 submenu items
  const renderSubMenus = useCallback(
    (data: HorizontalMenuItem, parentKey: string) => {
      if (!data.subMenus) return null;
      return data.subMenus.map((subMenu, index) => {
        const menuKey = `${parentKey}-l1-${index}-${
          subMenu.menuValue || subMenu.label
        }`;
        const hasSubMenus =
          (subMenu.customSubmenuTwo && subMenu.subMenusTwo) ||
          subMenu.subMenusThree ||
          subMenu.subMenusFour;
        const isActive =
          subMenu.route === Location.pathname ||
          hasActiveChild(subMenu.subMenusTwo, Location.pathname) ||
          hasActiveChild(subMenu.subMenusThree, Location.pathname) ||
          hasActiveChild(subMenu.subMenusFour, Location.pathname);
        const isOpen = openSubMenus.has(menuKey);

        return (
          <li
            key={menuKey}
            className={hasSubMenus ? "submenu submenu-two" : ""}
          >
            <Link
              to={subMenu.route || "#"}
              className={`${isActive ? "active" : ""} ${
                isOpen ? "subdrop" : ""
              }`}
              onClick={(e) => {
                if (hasSubMenus) {
                  e.preventDefault();
                  toggleSubMenu(menuKey);
                }
              }}
            >
              <span>{subMenu.menuValue || subMenu.label}</span>
              {hasSubMenus && (
                <span className="menu-arrow inside-submenu"></span>
              )}
            </Link>
            {hasSubMenus && (
              <ul style={{ display: isOpen ? "block" : "none" }}>
                {subMenu.subMenusTwo &&
                  renderSubMenusTwo(subMenu.subMenusTwo, menuKey)}
                {!subMenu.subMenusTwo &&
                  subMenu.subMenusThree &&
                  renderSubMenusThree(subMenu.subMenusThree, menuKey)}
                {!subMenu.subMenusTwo &&
                  !subMenu.subMenusThree &&
                  subMenu.subMenusFour &&
                  renderSubMenusFour(subMenu.subMenusFour)}
              </ul>
            )}
          </li>
        );
      });
    },
    [
      Location.pathname,

      renderSubMenusTwo,
      renderSubMenusThree,
      renderSubMenusFour,
    ]
  );

  return (
    <>
      {/* Header */}
      <div className="header">
        <div className="main-header">
          <div className="header-left">
            <Link to={routes.dashboard} className="logo">
              {/* <ImageWithBasePath src="assets/img/logo.svg" alt="NBS Archive System" /> */}
              <span className="logo-text">NBS Archive System</span>
            </Link>
           
          </div>

          <Link
            id="mobile_btn"
            onClick={toggleMobileSidebar}
            className="mobile_btn"
            to="#sidebar"
          >
            <span className="bar-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </Link>

          <div className="header-user">
            <div className="nav user-menu nav-list">
              <div
                className="me-auto d-flex align-items-center"
                id="header-search"
                style={{ flex: 1, minWidth: 0, gap: "1.25rem" }}
              >
                <Link
                  id="toggle_btn"
                  to="#"
                  onClick={handleToggleMiniSidebar}
                  className="btn btn-menubar flex-shrink-0"
                >
                  <i className="ti ti-arrow-bar-to-left"></i>
                </Link>
                <div
                  ref={headerSearchRef}
                  className="position-relative"
                  style={{ minWidth: "280px", width: "50%", flex: "0 1 50%", maxWidth: "50%" }}
                >
                  <div className="input-group input-group-flat d-inline-flex w-100">
                    <span className="input-icon-addon">
                      <i className="ti ti-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search documents, folders, or notes..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (e.target.value.trim().length >= 2) setSearchDropdownOpen(true);
                      }}
                    onFocus={() => {
                        if (searchTerm.trim().length >= 2) setSearchDropdownOpen(true);
                      }}
                    />
                    <span className="input-group-text">
                      <kbd>CTRL + / </kbd>
                    </span>
                  </div>
                  {searchTerm.trim().length >= 2 && searchDropdownOpen && (
                    <div
                      className="dropdown-menu show w-100 shadow-sm border mt-1 p-0"
                      style={{
                        position: "absolute",
                        inset: "auto auto auto 0",
                        maxHeight: "320px",
                        overflow: "auto",
                        zIndex: 1050,
                      }}
                      role="listbox"
                    >
                      {searchLoading ? (
                        <div className="p-3 text-center text-muted small">Searching...</div>
                      ) : searchError ? (
                        <div className="p-3 text-danger small">{searchError}</div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-3 text-muted small">No results</div>
                      ) : (
                        <div className="table-responsive mb-0">
                          <table className="table table-sm table-hover mb-0">
                            <thead>
                              <tr>
                                <th className="border-0 py-1 px-2 fs-11">Type</th>
                                <th className="border-0 py-1 px-2 fs-11">Name</th>
                                <th className="border-0 py-1 px-2 fs-11">Department</th>
                                <th className="border-0 py-1 px-2 fs-11">Meta</th>
                                <th className="border-0 py-1 px-2 fs-11 text-end">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {searchResults.map((item) => {
                                const type = getEffectiveType(item);
                                const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
                                return (
                                  <tr
                                    key={`${type}-${item.id}`}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleSearchResultClick(item)}
                                  >
                                    <td className="py-1 px-2 fs-12">
                                      <div className="d-flex align-items-center gap-1">
                                        {type === "document" ? (
                                          <i className="ti ti-file text-primary" aria-hidden />
                                        ) : type === "folder" ? (
                                          <i className="ti ti-folder text-secondary" aria-hidden />
                                        ) : (
                                          <i className="ti ti-notes text-info" aria-hidden />
                                        )}
                                        <span>{typeLabel}</span>
                                      </div>
                                    </td>
                                    <td className="py-1 px-2 fs-12">{getDisplayName(item)}</td>
                                    <td className="py-1 px-2 fs-12">{item.department_name || "-"}</td>
                                    <td className="py-1 px-2 fs-12">{getMeta(item)}</td>
                                    <td className="py-1 px-2 fs-12 text-end">
                                      <span className="badge bg-light text-dark">View</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="d-inline-flex flex-shrink-0 px-4">
                </span>
              
              </div>

              <div className="d-flex align-items-center">
                <div className="me-1">
                  <Link
                    to="#"
                    onClick={toggleFullscreen}
                    className="btn btn-menubar btnFullscreen"
                  >
                    <i className="ti ti-maximize"></i>
                  </Link>
                </div>
                <div className="dropdown me-1">
                  <Link
                    to="#"
                    className="btn btn-menubar"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-layout-grid-remove"></i>
                  </Link>
                  <div className="dropdown-menu dropdown-menu-end">
                    <div className="card mb-0 border-0 shadow-none">
                      <div className="card-header">
                        <h4>Archive Actions</h4>
                      </div>
                      <div className="card-body">
                        <Link to={routes.archiveFolders} className="d-block pb-2">
                          <span className="avatar avatar-md bg-transparent-dark me-2">
                            <i className="ti ti-folder text-gray-9"></i>
                          </span>
                          Folders
                        </Link>
                        <Link to={routes.archiveDocuments} className="d-block py-2">
                          <span className="avatar avatar-md bg-transparent-dark me-2">
                            <i className="ti ti-file text-gray-9"></i>
                          </span>
                          Documents
                        </Link>
                        <Link to={routes.archiveUpload} className="d-block py-2">
                          <span className="avatar avatar-md bg-transparent-dark me-2">
                            <i className="ti ti-upload text-gray-9"></i>
                          </span>
                          Upload
                        </Link>
                        <Link to={routes.archiveTrash} className="d-block py-2">
                          <span className="avatar avatar-md bg-transparent-dark me-2">
                            <i className="ti ti-trash text-gray-9"></i>
                          </span>
                          Trash
                        </Link>
                        <Link to={routes.archiveActivity} className="d-block py-2 pb-0">
                          <span className="avatar avatar-md bg-transparent-dark me-2">
                            <i className="ti ti-activity text-gray-9"></i>
                          </span>
                          Activity
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="me-1">
                  <Link
                    to={routes.archiveUpload}
                    className="btn btn-menubar"
                  >
                    <i className="ti ti-upload"></i>
                  </Link>
                </div>
                <div className="me-1">
                  <Link to={routes.archiveFolders} className="btn btn-menubar">
                    <i className="ti ti-folder"></i>
                  </Link>
                </div>
                <div className="me-1">
                  <Link to={routes.archiveActivity} className="btn btn-menubar">
                    <i className="ti ti-activity"></i>
                  </Link>
                </div>
                <div className="dropdown profile-dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle d-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <span className="avatar avatar-sm online">
                      <ImageWithBasePath
                        src="assets/img/profiles/avatar-12.jpg"
                        alt="Img"
                        className="img-fluid rounded-circle"
                      />
                    </span>
                  </Link>
                  <div className="dropdown-menu shadow-none">
                    <div className="card mb-0">
                      <div className="card-header">
                        <div className="d-flex align-items-center">
                          <span className="avatar avatar-lg me-2 avatar-rounded">
                            <ImageWithBasePath
                              src="assets/img/profiles/avatar-12.jpg"
                              alt="img"
                            />
                          </span>
                          <div>
                            <h5 className="mb-0">Archive User</h5>
                            <p className="fs-12 fw-medium mb-0">
                              archive@example.com
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="card-body">
                        <Link
                          className="dropdown-item d-inline-flex align-items-center p-0 py-2"
                          to={routes.archiveFolders}
                        >
                          <i className="ti ti-folder me-1"></i>My Folders
                        </Link>
                        <Link
                          className="dropdown-item d-inline-flex align-items-center p-0 py-2"
                          to={routes.archiveDocuments}
                        >
                          <i className="ti ti-file me-1"></i>My Documents
                        </Link>
                        <Link
                          className="dropdown-item d-inline-flex align-items-center p-0 py-2"
                          to={routes.archiveUpload}
                        >
                          <i className="ti ti-upload me-1"></i>Upload
                        </Link>
                        <Link
                          className="dropdown-item d-inline-flex align-items-center p-0 py-2"
                          to={routes.archiveActivity}
                        >
                          <i className="ti ti-activity me-1"></i>Activity
                        </Link>
                      </div>
                      <div className="card-footer">
                        <Button
                          type="button"
                          variant="light"
                          className="dropdown-item d-inline-flex align-items-center p-0 py-2 border-0 bg-transparent w-100 text-start shadow-none"
                          onClick={handleLogout}
                        >
                          <i className="ti ti-login me-2"></i>Logout
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dropdown mobile-user-menu">
            <Link
              to="#"
              className="nav-link dropdown-toggle"
              data-bs-toggle="dropdown"
            >
              <span className="user-img">
                <ImageWithBasePath
                  src="assets/img/profiles/avatar-12.jpg"
                  alt="Img"
                  className="img-fluid rounded-circle"
                />
              </span>
            </Link>
            <div className="dropdown-menu dropdown-menu-end">
              <div className="dropdown-header">
                <div className="d-flex align-items-center">
                  <span className="avatar avatar-sm me-2">
                    <ImageWithBasePath
                      src="assets/img/profiles/avatar-12.jpg"
                      alt="Img"
                      className="img-fluid rounded-circle"
                    />
                  </span>
                  <div>
                    <h6 className="mb-0">Archive User</h6>
                    <p className="fs-12 fw-medium mb-0">archive@example.com</p>
                  </div>
                </div>
              </div>
              <Link className="dropdown-item" to={routes.archiveFolders}>
                <i className="ti ti-folder me-1"></i>My Folders
              </Link>
              <Link className="dropdown-item" to={routes.archiveDocuments}>
                <i className="ti ti-file me-1"></i>My Documents
              </Link>
              <Link className="dropdown-item" to={routes.archiveUpload}>
                <i className="ti ti-upload me-1"></i>Upload
              </Link>
              <Link className="dropdown-item" to={routes.archiveActivity}>
                <i className="ti ti-activity me-1"></i>Activity
              </Link>
              <Button
                type="button"
                variant="light"
                className="dropdown-item border-0 bg-transparent w-100 text-start shadow-none"
                onClick={handleLogout}
              >
                <i className="ti ti-login me-2"></i>Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

Header.displayName = "Header";

export default Header;
