import { useState } from "react";
import { Link } from "react-router-dom";
import ReactApexChart from "react-apexcharts";
import { Chart } from "primereact/chart";
import { Calendar } from "primereact/calendar";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";

const AdminDashboard = () => {
  const routes = all_routes;
  const [date, setDate] = useState<Date | null>(new Date());

  const uploadTrend = {
    series: [
      {
        name: "Uploads",
        data: [24, 38, 28, 42, 35, 50, 48, 62, 55, 70, 64, 80],
      },
    ],
    options: {
      chart: { type: "area" as const, height: 280, toolbar: { show: false } },
      stroke: { curve: "smooth" as const, width: 3 },
      dataLabels: { enabled: false },
      colors: ["#03C95A"],
      xaxis: {
        categories: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
      },
      grid: { borderColor: "#E5E7EB", strokeDashArray: 5 },
    },
  };

  const storageByTeam = {
    series: [
      {
        name: "Storage (GB)",
        data: [120, 95, 80, 60, 45, 30],
      },
    ],
    options: {
      chart: { type: "bar" as const, height: 260, toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 6, horizontal: true } },
      dataLabels: { enabled: false },
      colors: ["#F26522"],
      xaxis: {
        categories: [
          "Legal",
          "Finance",
          "Contracts",
          "Operations",
          "Compliance",
          "Projects",
        ],
      },
      grid: { borderColor: "#E5E7EB", strokeDashArray: 5 },
    },
  };

  const docTypeData = {
    labels: ["PDF", "Images", "Spreadsheets", "Presentations", "Other"],
    datasets: [
      {
        data: [42, 18, 16, 12, 12],
        backgroundColor: [
          "#0C4B5E",
          "#03C95A",
          "#FFC107",
          "#1B84FF",
          "#E70D0D",
        ],
        borderWidth: 0,
      },
    ],
  };

  const docTypeOptions = {
    cutout: "65%",
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Admin Dashboard</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">Dashboard</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Admin Dashboard
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
                <p className="text-muted mb-1">Total Folders</p>
                <h4 className="mb-2">1,248</h4>
                <p className="fs-13 text-success mb-0">+8% this month</p>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="text-muted mb-1">Total Documents</p>
                <h4 className="mb-2">18,902</h4>
                <p className="fs-13 text-success mb-0">+12% this month</p>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="text-muted mb-1">Storage Used</p>
                <h4 className="mb-2">3.7 TB</h4>
                <p className="fs-13 text-warning mb-0">68% of quota</p>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="text-muted mb-1">Uploads This Week</p>
                <h4 className="mb-2">642</h4>
                <p className="fs-13 text-success mb-0">+5% vs last week</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-8 d-flex">
            <div className="card flex-fill">
              <div className="card-header">
                <h5 className="card-title mb-0">Uploads Over Time</h5>
              </div>
              <div className="card-body">
                <ReactApexChart
                  options={uploadTrend.options}
                  series={uploadTrend.series}
                  type="area"
                  height={280}
                />
              </div>
            </div>
          </div>
          <div className="col-xl-4 d-flex">
            <div className="card flex-fill">
              <div className="card-header">
                <h5 className="card-title mb-0">Document Types</h5>
              </div>
              <div className="card-body">
                <div style={{ height: 240 }}>
                  <Chart type="doughnut" data={docTypeData} options={docTypeOptions} />
                </div>
                <div className="d-flex flex-wrap mt-3">
                  {docTypeData.labels.map((label) => (
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
              <div className="card-header">
                <h5 className="card-title mb-0">Storage by Team</h5>
              </div>
              <div className="card-body">
                <ReactApexChart
                  options={storageByTeam.options}
                  series={storageByTeam.series}
                  type="bar"
                  height={260}
                />
              </div>
            </div>
          </div>
          <div className="col-xl-6 d-flex">
            <div className="card flex-fill">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Recent Activity</h5>
                <Link to={routes.archiveActivity} className="link-primary fs-13">
                  View all
                </Link>
              </div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item px-0 d-flex justify-content-between">
                    <span>Project-Alpha.pdf uploaded</span>
                    <span className="text-muted fs-12">5 mins ago</span>
                  </li>
                  <li className="list-group-item px-0 d-flex justify-content-between">
                    <span>Folder “Legal/2024” created</span>
                    <span className="text-muted fs-12">30 mins ago</span>
                  </li>
                  <li className="list-group-item px-0 d-flex justify-content-between">
                    <span>Invoice_2024_Q1.xlsx updated</span>
                    <span className="text-muted fs-12">2 hrs ago</span>
                  </li>
                  <li className="list-group-item px-0 d-flex justify-content-between">
                    <span>Archive cleanup completed</span>
                    <span className="text-muted fs-12">Yesterday</span>
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

export default AdminDashboard;
