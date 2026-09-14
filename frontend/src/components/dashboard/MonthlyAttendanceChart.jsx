import { useMemo } from 'react';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { cssVar } from '../../utils/cssVar';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MonthlyAttendanceChart = ({ data = [] }) => {
  const hasData = data.some((m) => m.present + m.absent + m.excused > 0);

  const chartData = useMemo(
    () => ({
      labels: data.map((m) => `${MONTH_NAMES[m.month - 1]} ${m.year}`),
      datasets: [
        { label: 'Present', data: data.map((m) => m.present), backgroundColor: cssVar('--present'), borderRadius: 4 },
        { label: 'Absent', data: data.map((m) => m.absent), backgroundColor: cssVar('--absent'), borderRadius: 4 },
        { label: 'Excused', data: data.map((m) => m.excused), backgroundColor: cssVar('--excused'), borderRadius: 4 },
      ],
    }),
    [data]
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: cssVar('--ink-3'), font: { size: 10 } } },
      y: {
        beginAtZero: true,
        grid: { color: cssVar('--line') },
        ticks: { color: cssVar('--ink-3'), font: { size: 10 }, precision: 0 },
      },
    },
    plugins: {
      legend: { position: 'bottom', labels: { color: cssVar('--ink-2'), boxWidth: 10, font: { size: 11 } } },
      tooltip: {
        backgroundColor: cssVar('--card'),
        titleColor: cssVar('--ink'),
        bodyColor: cssVar('--ink-2'),
        borderColor: cssVar('--line'),
        borderWidth: 1,
      },
    },
  };

  return (
    <div className="rounded-card border border-line bg-card p-5 shadow-card">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-ink">Monthly Attendance</h2>
        <p className="mt-0.5 text-xs text-ink-3">Last 6 months</p>
      </div>

      <div className="h-56">
        {!hasData ? (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink-3">
            No attendance data recorded yet
          </div>
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default MonthlyAttendanceChart;
