import { Link } from "react-router-dom";
import { IconChevronsUp } from "@tabler/icons-react";
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
      <IconChevronsUp size={20} aria-hidden />
    </Link>
  );
};

export default CollapseHeader;
