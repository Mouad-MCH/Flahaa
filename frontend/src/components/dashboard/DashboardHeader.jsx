const DashboardHeader = ({ title = 'Overview', subtitle = "A summary of your farm's activity" }) => {
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="mt-1 text-xl font-bold text-ink">{title}</h1>
        <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="num text-xs text-ink-3">{todayLabel}</span>
        <span className="rounded-lg border border-line bg-sunken px-3 py-1.5 text-xs text-ink-2">
          Today &#9662;
        </span>
      </div>
    </div>
  );
};

export default DashboardHeader;
