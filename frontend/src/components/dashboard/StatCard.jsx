const TONE = {
  info: { bar: 'bg-info', iconBg: 'bg-info-soft', iconText: 'text-info' },
  present: { bar: 'bg-present', iconBg: 'bg-present-soft', iconText: 'text-present' },
  absent: { bar: 'bg-absent', iconBg: 'bg-absent-soft', iconText: 'text-absent' },
  excused: { bar: 'bg-excused', iconBg: 'bg-excused-soft', iconText: 'text-excused' },
};

const StatCard = ({ label, value, sub, icon: Icon, tone = 'info' }) => {
  const t = TONE[tone] || TONE.info;

  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-card p-4 shadow-card">
      <span className={`absolute inset-y-0 left-0 w-1 ${t.bar}`} />

      <div className="flex items-start justify-between pl-2">
        <span className="text-xs font-medium text-ink-2">{label}</span>
        {Icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.iconBg} ${t.iconText}`}>
            <Icon size={16} />
          </span>
        )}
      </div>

      <div className="num mt-2 pl-2 text-2xl font-bold text-ink">{value}</div>
      {sub && <p className="mt-1 pl-2 text-[11px] text-ink-3">{sub}</p>}
    </div>
  );
};

export default StatCard;
