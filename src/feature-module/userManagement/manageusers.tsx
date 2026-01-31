import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import Table from "../../core/common/dataTable/index";
import { manageusersData } from "../../core/data/json/manageuser";
import PredefinedDateRanges from "../../core/common/datePicker";
import CommonSelect from "../../core/common/commonSelect";
import { Reason } from "../../core/common/selectoption/selectoption";
import { all_routes } from "../../router/all_routes";
import TooltipOption from "../../core/common/tooltipOption";

type ManageUserRow = {
  id: string;
  name: string;
  class: string;
  section: string;
  dateOfJoined: string;
  status: string;
  key: number;
};

const PAGE_SIZE = 50; // Number of users to load per page

const Manageusers = () => {
  const routes = all_routes;
  const [allData] = useState<ManageUserRow[]>(manageusersData);
  const [visibleData, setVisibleData] = useState<ManageUserRow[]>(
    allData.slice(0, PAGE_SIZE)
  );
  const [hasMore, setHasMore] = useState<boolean>(allData.length > PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      render: (_text: string, record: ManageUserRow) => (
        <Link to="#" className="link-primary">
          {record.id}
        </Link>
      ),
      sorter: (a: ManageUserRow, b: ManageUserRow) => a.id.length - b.id.length,
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a: ManageUserRow, b: ManageUserRow) =>
        a.name.length - b.name.length,
    },
    {
      title: "Class",
      dataIndex: "class",
      sorter: (a: ManageUserRow, b: ManageUserRow) =>
        a.class.length - b.class.length,
    },
    {
      title: "Section",
      dataIndex: "section",
      sorter: (a: ManageUserRow, b: ManageUserRow) =>
        a.section.length - b.section.length,
    },
    {
      title: "DateOfJoined",
      dataIndex: "dateOfJoined",
      sorter: (a: ManageUserRow, b: ManageUserRow) =>
        a.dateOfJoined.length - b.dateOfJoined.length,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: ManageUserRow["status"]) => (
        <>
          {text === "Active" ? (
            <span className="badge badge-soft-success d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              {text}
            </span>
          ) : (
            <span className="badge badge-soft-danger d-inline-flex align-items-center">
              <i className="ti ti-circle-filled fs-5 me-1"></i>
              {text}
            </span>
          )}
        </>
      ),
      sorter: (a: ManageUserRow, b: ManageUserRow) =>
        a.status.length - b.status.length,
    },
    {
      title: "Action",
      dataIndex: "action",
      render: () => (
        <div className="d-flex align-items-center">
          <div className="dropdown">
            <Link
              to="#"
              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="ti ti-dots-vertical fs-14" />
            </Link>
            <ul className="dropdown-menu dropdown-menu-right p-3">
              <li>
                <Link className="dropdown-item rounded-1" to="#">
                  <i className="ti ti-trash-x me-2" />
                  Delete
                </Link>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const handleLoadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    setTimeout(() => {
      setVisibleData((prev) => {
        const next = allData.slice(prev.length, prev.length + PAGE_SIZE);
        if (next.length < PAGE_SIZE) setHasMore(false);
        return [...prev, ...next];
      });
      setLoading(false);
    }, 500); // Simulate network delay
  }, [loading, hasMore, allData]);


  return (
    <div>
      <>
        {/* Page Wrapper */}
        <div className="page-wrapper">
          <div className="content">
            {/* Page Header */}
            <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
              <div className="my-auto mb-2">
                <h3 className="page-title mb-1">Users</h3>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={routes.adminDashboard}>Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="#">User Management</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Users
                    </li>
                  </ol>
                </nav>
              </div>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                <TooltipOption />
              </div>
            </div>
            {/* /Page Header */}
            {/* Filter Section */}
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap pb-0">
                <h4 className="mb-3">Users List</h4>
                <div className="d-flex align-items-center flex-wrap">
                  <div className="input-icon-start mb-3 me-2 position-relative">
                    <PredefinedDateRanges />
                  </div>
                  <div className="dropdown mb-3 me-2">
                    <Link
                      to="#"
                      className="btn btn-outline-light bg-white dropdown-toggle"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="outside"
                    >
                      <i className="ti ti-filter me-2" />
                      Filter
                    </Link>
                    <div className="dropdown-menu drop-width">
                      <form>
                        <div className="d-flex align-items-center border-bottom p-3">
                          <h4>Filter</h4>
                        </div>
                        <div className="p-3 border-bottom">
                          <div className="row">
                            <div className="col-md-12">
                              <div className="mb-0">
                                <label className="form-label">Users</label>
                                <CommonSelect
                                  className="select"
                                  options={Reason}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 d-flex align-items-center justify-content-end">
                          <Link to="#" className="btn btn-light me-3">
                            Reset
                          </Link>
                          <Link to="#" className="btn btn-primary">
                            Apply
                          </Link>
                        </div>
                      </form>
                    </div>
                  </div>
                  <div className="dropdown mb-3">
                    <Link
                      to="#"
                      className="btn btn-outline-light bg-white dropdown-toggle"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-sort-ascending-2 me-2" />
                      Sort by A-Z
                    </Link>
                    <ul className="dropdown-menu p-3">
                      <li>
                        <Link to="#" className="dropdown-item rounded-1 active">
                          Ascending
                        </Link>
                      </li>
                      <li>
                        <Link to="#" className="dropdown-item rounded-1">
                          Descending
                        </Link>
                      </li>
                      <li>
                        <Link to="#" className="dropdown-item rounded-1">
                          Recently Viewed
                        </Link>
                      </li>
                      <li>
                        <Link to="#" className="dropdown-item rounded-1">
                          Recently Added
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* User List */}
              <div className="card-body p-0 py-3">
                <Table columns={columns} dataSource={visibleData} Selection={false} />
              </div>
              {/* /User List */}
            </div>
            {/* /Filter Section */}
            <div className="row align-items-center">
              <div className="col-md-12">
                <div className="datatable-paginate mt-4" />
              </div>
            </div>
          </div>
        </div>
        {/* /Page Wrapper */}
      </>
    </div>
  );
};

export default Manageusers;
