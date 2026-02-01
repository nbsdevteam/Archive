import { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

export interface DepartmentDonutItem {
  department: string;
  count: number;
}

interface DepartmentDonutChartProps {
  items: DepartmentDonutItem[];
}

const DEFAULT_COLORS = [
  "#F26522",
  "#0d6efd",
  "#198754",
  "#ffc107",
  "#6f42c1",
  "#fd7e14",
  "#20c997",
  "#dc3545",
];

export function DepartmentDonutChart({ items }: DepartmentDonutChartProps) {
  const { series, labels, options } = useMemo(() => {
    const labels = items.map((i) => i.department);
    const series = items.map((i) => i.count);
    const opts: ApexOptions = {
      chart: {
        type: "donut",
        height: 280,
        toolbar: { show: false },
      },
      labels,
      colors: DEFAULT_COLORS.slice(0, Math.max(labels.length, 1)),
      legend: {
        position: "bottom",
        fontSize: "12px",
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: "9px",
          fontWeight: 600,
        },
        textAnchor: "middle",
      },
      plotOptions: {
        pie: {
          dataLabels: {
            minAngleToShowLabel: 10,
            offset: 0,
          },
          donut: {
            size: "55%",
            labels: {
              show: true,
              name: {
                show: true,
                formatter:(val) =>"Total",
              },
              total: {
                show: true,
                showAlways: true,
                label: "Total",
                formatter: () => String(series.reduce((a, b) => a + b, 0)),
              },
            },
          },
        },
      },
    };
    return { series, labels, options: opts };
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
      <ReactApexChart
        type="donut"
        height={280}
        options={options}
        series={series}
      />
    </div>
  );
}
