import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Mail, Phone } from 'lucide-react';
import { Avatar, PageLoader, Pill } from '../components/ui/ui.jsx';
import StatCard from '../components/dashboard/StatCard';
import { useSupervisorDetail } from '../hooks/useSupervisorDetail.js';

const STATUS_RAIL = { active: 'bg-present', inactive: 'bg-absent' };

const SupervisorDetailPage = () => {
  const { id } = useParams();
  const {
    supervisor,
    isSupervisorLoading,
    workers,
    isWorkersLoading,
    totalWorkers,
    activeWorkers,
  } = useSupervisorDetail(id);

  console.log(supervisor)

  if (isSupervisorLoading) return <PageLoader title="Loading supervisor…" />;

  if (!supervisor) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-ink-2">Supervisor not found.</p>
      </div>
    );
  }

  const joinDateLabel = supervisor.createdAt
    ? new Date(supervisor.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div>
      <Link to="/supervisors" className="mb-4 inline-flex items-center gap-2 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft size={16} />
        Back to Supervisors
      </Link>

      <div className="mb-6 flex flex-wrap items-start gap-4 rounded-card border border-line bg-card p-5 shadow-card">
        <span className="flex p-2 shrink-0 items-center justify-center rounded-full bg-field-soft text-xl font-semibold text-field">
          <Avatar name={supervisor.name} src={supervisor?.avatar} />
        </span>

        <div>
          <h1 className="text-lg font-bold text-ink">{supervisor.name}</h1>
          <p className="mt-0.5 text-xs text-ink-3">Supervisor</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-2">
            <span className="flex items-center gap-1.5">
              <Mail size={14} className="text-ink-3" />
              Email: {supervisor.email || '—'}
            </span>

            <span className="flex items-center gap-1.5">
              <Phone size={14} className="text-ink-3" />
              Phone: {supervisor.phone || '—'}
            </span>

            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-ink-3" />
              Joined: {joinDateLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total workers" value={totalWorkers} tone="info" />
        <StatCard label="Active workers" value={activeWorkers} tone="present" />
      </div>

      <div className="rounded-card border border-line bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Workers</h2>
          <Link to="/workers" className="text-xs font-medium text-field hover:text-field-hover">
            Manage workers
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                {['Worker', 'CIN', 'Contract', 'Daily Rate', 'Status'].map((col) => (
                  <th key={col} className="px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isWorkersLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-xs text-ink-3">
                    Loading workers…
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-xs text-ink-3">
                    No workers found
                  </td>
                </tr>
              ) : (
                workers.map((w) => (
                  <tr key={w._id} className="border-b border-line last:border-0">
                    <td className="relative px-5 py-3">
                      <span className={`absolute inset-y-0 left-0 w-0.75 ${STATUS_RAIL[w.status] || 'bg-line-strong'}`} />
                      <div className="flex items-center gap-3">
                        <Avatar name={w.name} src={w.avatar} size={28} />
                        <p className="text-xs font-medium text-ink">{w.name}</p>
                      </div>
                    </td>

                    <td className="num px-5 py-3 text-xs text-ink-2">{w.CIN}</td>

                    <td className="px-5 py-3 text-xs capitalize text-ink-2">{w.contract_type}</td>

                    <td className="num px-5 py-3 text-xs font-medium text-ink">{w.daily_rate} MAD</td>

                    <td className="px-5 py-3">
                      <Pill status={w.status === 'active' ? 'present' : 'neutral'}>{w.status}</Pill>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDetailPage;
