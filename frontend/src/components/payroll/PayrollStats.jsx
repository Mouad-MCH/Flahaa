const TONE_BAR = { info: 'bg-info', present: 'bg-present', excused: 'bg-excused' };

function StatBlock({ label, value, tone }) {
  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-card p-4 shadow-card">
      <span className={`absolute inset-y-0 left-0 w-1 ${TONE_BAR[tone]}`} />
      <p className="pl-2 text-xs text-ink-2">{label}</p>
      <p className="num mt-2 pl-2 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

const PayrollStats = ({ totalNet = 0, paidCount = 0, pendingCount = 0 }) => {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatBlock label="Total net" value={`${totalNet} MAD`} tone="info" />
      <StatBlock label="Paid" value={paidCount} tone="present" />
      <StatBlock label="Pending" value={pendingCount} tone="excused" />
    </div>
  );
};

export default PayrollStats;
