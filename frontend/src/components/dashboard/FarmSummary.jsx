import { Pill } from '../ui/ui';

const FarmSummary = ({ summary = {} }) => {
  const total = summary.total_workers || 0;

  const rows = [
    { label: 'Active Workers', value: summary.total_workers || 0, bar: 'bg-present', text: 'text-present' },
    { label: 'Checked In', value: summary.today_present || 0, bar: 'bg-info', text: 'text-info' },
    { label: 'Missing Today', value: summary.attendance_not_recorded || 0, bar: 'bg-excused', text: 'text-excused' },
  ];

  return (
    <div className="flex flex-col justify-between rounded-card border border-line bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Farm Summary</h2>
        <Pill status="present">Live</Pill>
      </div>

      <div className="space-y-4">
        {rows.map(({ label, value, bar, text }) => {
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <div key={label}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-ink-2">{label}</span>
                <span className={`num text-sm font-bold ${text}`}>{value}</span>
              </div>
              <div className="h-1 rounded-pill bg-line">
                <div className={`h-1 rounded-pill transition-all ${bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-input border border-line bg-field-soft p-3 text-center">
        <p className="text-xs font-medium text-field">Flahaa</p>
        <p className="mt-0.5 text-[10px] text-ink-3">Farm management system</p>
      </div>
    </div>
  );
};

export default FarmSummary;
