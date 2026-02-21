import { Link } from "react-router-dom";
import { useSidebarUiStore } from "../../../shared/stores/sidebarUiStore";

/** Collapse/expand the top header bar. Native title replaces react-bootstrap Tooltip. */
const CollapseHeader = () => {
  const { headerCollapse, setHeaderCollapse } = useSidebarUiStore();

  const toggleHeaderCollapse = () => {
    setHeaderCollapse(!headerCollapse);
  };

  return (
    <Link
      to="#"
      id="collapse-header"
      className={headerCollapse ? "active" : ""}
      onClick={toggleHeaderCollapse}
      aria-label="Collapse header"
      title="Collapse"
    >
      <i className="ti ti-chevrons-up" aria-hidden />
    </Link>
  );
};

export default CollapseHeader;
