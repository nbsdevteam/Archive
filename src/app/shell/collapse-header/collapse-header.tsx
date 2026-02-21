import { Link } from "react-router-dom";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useSidebarUiStore } from "../../../shared/stores/sidebarUiStore";

const CollapseHeader = () => {
  const { headerCollapse, setHeaderCollapse } = useSidebarUiStore();

  const toggleHeaderCollapse = () => {
    setHeaderCollapse(!headerCollapse);
  };

  return (
    <>
      <OverlayTrigger
        placement="bottom"
        overlay={<Tooltip id="collapse-tooltip">Collapse</Tooltip>}
      >
        <Link to="#" id="collapse-header" className={headerCollapse ? "active" : ""} onClick={toggleHeaderCollapse} aria-label="Collapse header">
          <i className="ti ti-chevrons-up" aria-hidden />
        </Link>
      </OverlayTrigger>
    </>
  );
};

export default CollapseHeader;
