import { useState } from "react";
import { Link } from "react-router-dom";
import ReactApexChart from "react-apexcharts";
import { Chart } from "primereact/chart";
import { Calendar } from "primereact/calendar";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";

const EmployeeDashboard = () => {
  const routes = all_routes;
  const [date, setDate] = useState<Date | null>(new Date());

  const activityTrend = {
    series: [
      {
        name: "My Uploads",
        data: [6, 10, 8, 12, 9, 15, 18],
      },
    ],
    options: {
      chart: { type: "line" as const, height: 260, toolbar: { show: false } },
      stroke: { curve: "smooth" as const, width: 3 },
      dataLabels: { enabled: false },
      colors: ["#1B84FF"],
      xaxis: {
        categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
      grid: { borderColor: "#E5E7EB", strokeDashArray: 5 },
    },
  };

  const statusData = {
    labels: ["Approved", "Pending", "Needs Review"],
    datasets: [
      {
        data: [48, 14, 8],
        backgroundColor: ["#03C95A", "#FFC107", "#E70D0D"],
        borderWidth: 0,
      },
    ],
  };

  const statusOptions = {
    cutout: "60%",
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Employee Dashboard</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">Dashboard</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Employee Dashboard
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="me-2 mb-2">
              <div className="input-icon position-relative">
                <span className="input-icon-addon">
                  <i className="ti ti-calendar text-gray-9" />
                </span>
                <Calendar
                  value={date}
                  onChange={(e: any) => setDate(e.value)}
                  view="year"
                  dateFormat="yy"
                  className="Calendar-form"
                />
              </div>
            </div>
            <div className="ms-2 head-icons">
              <CollapseHeader />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="text-muted mb-1">My Uploads</p>
                <h4 className="mb-2">128</h4>
                <p className="fs-13 text-success mb-0">+6 this week</p>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="text-muted mb-1">Pending Review</p>
                <h4 className="mb-2">9</h4>
                <p className="fs-13 text-warning mb-0">2 due soon</p>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="text-muted mb-1">Shared With Me</p>
                <h4 className="mb-2">54</h4>
                <p className="fs-13 text-success mb-0">+4 this week</p>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="text-muted mb-1">Storage Used</p>
                <h4 className="mb-2">46 GB</h4>
                <p className="fs-13 text-muted mb-0">of 100 GB</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-8 d-flex">
            <div className="card flex-fill">
              <div className="card-header">
                <h5 className="card-title mb-0">Weekly Upload Activity</h5>
              </div>
              <div className="card-body">
                <ReactApexChart
                  options={activityTrend.options}
                  series={activityTrend.series}
                  type="line"
                  height={260}
                />
              </div>
            </div>
          </div>
          <div className="col-xl-4 d-flex">
            <div className="card flex-fill">
              <div className="card-header">
                <h5 className="card-title mb-0">Document Status</h5>
              </div>
              <div className="card-body">
                <div style={{ height: 220 }}>
                  <Chart type="doughnut" data={statusData} options={statusOptions} />
                </div>
                <div className="d-flex flex-wrap mt-3">
                  {statusData.labels.map((label) => (
                    <span key={label} className="badge bg-light text-dark me-2 mb-2">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-6 d-flex">
            <div className="card flex-fill">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Recent Folders</h5>
                <Link to={routes.archiveFolders} className="link-primary fs-13">
                  View all
                </Link>
              </div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item px-0 d-flex justify-content-between">
                    <span>Contracts / Q1 2024</span>
                    <span className="text-muted fs-12">Updated today</span>
                  </li>
                  <li className="list-group-item px-0 d-flex justify-content-between">
                    <span>HR / Policies</span>
                    <span className="text-muted fs-12">Updated yesterday</span>
                  </li>
                  <li className="list-group-item px-0 d-flex justify-content-between">
                    <span>Finance / Invoices</span>
                    <span className="text-muted fs-12">Updated 3 days ago</span>
                  </li>
                  <li className="list-group-item px-0 d-flex justify-content-between">
                    <span>Legal / Compliance</span>
                    <span className="text-muted fs-12">Updated last week</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="col-xl-6 d-flex">
            <div className="card flex-fill">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Recent Documents</h5>
                <Link to={routes.archiveDocuments} className="link-primary fs-13">
                  View all
                </Link>
              </div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item px-0 d-flex justify-content-between">
                    <span>Invoice_2024_Q1.xlsx</span>
                    <span className="text-muted fs-12">Approved</span>
                  </li>
                  <li className="list-group-item px-0 d-flex justify-content-between">
                    <span>Service_Agreement.pdf</span>
                    <span className="text-muted fs-12">Pending</span>
                  </li>
                  <li className="list-group-item px-0 d-flex justify-content-between">
                    <span>Policy_Update.docx</span>
                    <span className="text-muted fs-12">Needs review</span>
                  </li>
                  <li className="list-group-item px-0 d-flex justify-content-between">
                    <span>Project_Alpha_Brief.pptx</span>
                    <span className="text-muted fs-12">Approved</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
