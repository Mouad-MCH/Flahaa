import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { MoreHorizontal } from 'lucide-react';
import { cssVar } from '../../utils/cssVar';

ChartJS.register(ArcElement, Tooltip, Legend);

const LEGEND = [
  { key: 'present', label: 'Present' },
  { key: 'absent', label: 'Absent' },
  { key: 'excused', label: 'Excused' },
  { key: 'not_recorded', label: 'Not recorded' },
];

const DOT_CLASS = {
  present: 'bg-present',
  absent: 'bg-absent',
  excused: 'bg-excused',
  not_recorded: 'bg-ink-3',
};

const AttendanceOverview = ({ attendance, totalWorkers = 0, dateLabel }) => {
  const { present = 0, absent = 0, excused = 0, not_recorded = 0 } = attendance || {};
  const rate = totalWorkers > 0 ? Math.round((present / totalWorkers) * 100) : 0;

  const data = useMemo(
    () => ({
      labels: ['Present', 'Absent', 'Excused', 'Not recorded'],
      datasets: [
        {
          data: [present, absent, excused, not_recorded],
          backgroundColor: [cssVar('--present'), cssVar('--absent'), cssVar('--excused'), cssVar('--line-strong')],
          borderColor: [cssVar('--present'), cssVar('--absent'), cssVar('--excused'), cssVar('--line')],
          borderWidth: 1,
          hoverOffset: 4,
        },
      ],
    }),
    [present, absent, excused, not_recorded]
  );

  const options = {
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: cssVar('--card'),
        titleColor: cssVar('--ink'),
        bodyColor: cssVar('--ink-2'),
        borderColor: cssVar('--line'),
        borderWidth: 1,
      },
    },
  };

  const counts = { present, absent, excused, not_recorded };

  return (
    <div className="col-span-1 rounded-card border border-line bg-card p-5 shadow-card md:col-span-2">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">Attendance Overview</h2>
          {dateLabel && <p className="mt-0.5 text-xs text-ink-3">Today — {dateLabel}</p>}
        </div>
        <button type="button" className="text-ink-3 hover:text-ink">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-8">
        <div className="relative h-36 w-36 shrink-0">
          <Doughnut data={data} options={options} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="num text-2xl font-bold text-field">{rate}%</span>
            <span className="text-[10px] text-ink-3">Attendance rate</span>
          </div>
        </div>

        <div className="flex-1 space-y-3" style={{ minWidth: 140 }}>
          {LEGEND.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${DOT_CLASS[key]}`} />
                <span className="text-xs text-ink-2">{label}</span>
              </div>
              <span className="num text-xs font-semibold text-ink">{counts[key]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendanceOverview;
