import { lazy, Suspense, useMemo } from "react";
import type { ApexOptions } from "apexcharts";

/** Lazy-loaded to avoid blocking dashboard render; ApexCharts is ~750KB. */
const ReactApexChart = lazy(() => import("react-apexcharts"));

export interface DepartmentDonutItem {
  department: string;
  count: number;
}

interface DepartmentDonutChartProps {
  items: DepartmentDonutItem[];
}

const DEFAULT_COLORS = [
  "#84BCFF",
  "#77E2A6",
  "#C27ACF",
  "#FFDD79",
  "#7CE2F5",
  "#FE94C6",
  "#F7A37A",
  "#95B2BB",
];

function DepartmentDonutChart({ items }: DepartmentDonutChartProps) {
  const { series, options } = useMemo(() => {
    const labels = items.map((i) => i.department);
    const series = items.map((i) => i.count);
    const total = series.reduce((a, b) => a + b, 0);
    const opts: ApexOptions = {
      chart: {
        type: "donut",
        height: 320,
        toolbar: { show: false },
        fontFamily: "\"Inter\", sans-serif",
      },
      labels,
      colors: DEFAULT_COLORS.slice(0, Math.max(labels.length, 1)),
      legend: {
        position: "bottom",
        fontSize: "13px",
        fontFamily: "\"Inter\", sans-serif",
        itemMargin: {
          horizontal: 8,
          vertical: 4,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (value: number) => `${Math.round(value)}%`,
        style: {
          fontSize: "11px",
          fontWeight: 400,
          fontFamily: "\"Inter\", sans-serif",
        },
        textAnchor: "middle",
        dropShadow: {
          enabled: false,
        },
      },
      plotOptions: {
        pie: {
          dataLabels: {
            minAngleToShowLabel: 15,
            offset: 0,
          },
          donut: {
            size: "65%",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: "13px",
                fontFamily: "\"Inter\", sans-serif",
              },
              value: {
                fontSize: "18px",
                fontWeight: 500,
                fontFamily: "\"Roboto\", sans-serif",
              },
              total: {
                show: true,
                showAlways: true,
                label: "Total",
                fontSize: "14px",
                fontWeight: 500,
                fontFamily: "\"Inter\", sans-serif",
                formatter: () => String(total),
              },
            },
          },
        },
      },
    };
    return { series, options: opts };
  }, [items]);

  if (!items.length) {
    return (
      <div className="text-center text-muted py-3 small">
        No data to display
      </div>
    );
  }

  return (
    <div className="tw-p-4 tw-box-border">
      <Suspense
        fallback={
          <div
            style={{
              height: 350,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#888",
            }}
          >
            Loading chart...
          </div>
        }
      >
        <ReactApexChart
          type="donut"
          height={280}
          options={options}
          series={series}
        />
      </Suspense>
    </div>
  );
}

export default DepartmentDonutChart;
