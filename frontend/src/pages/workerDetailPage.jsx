import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, Briefcase, CalendarDays, MapPin, Pencil, Phone, Send, Shredder } from 'lucide-react';
import { Avatar, PageLoader, Pill } from '../components/ui/ui.jsx';
import StatCard from '../components/dashboard/StatCard';
import WorkerForm from '../components/workers/WorkerForm';
import WorkerInviteForm from '../components/workers/WorkerInviteForm';
import { useWorkerDetail } from '../hooks/useWorkerDetail.js';
import { RAIL, YEARS, CURRENT_YEAR, MONTHS } from '../utils/constant.js'


const WorkerDetailPage = () => {
  const { id } = useParams();
  const {
    worker,
    isWorkerLoading,
    month,
    setMonth,
    year,
    setYear,
    records,
    summary,
    total,
    isAttendanceLoading,
    isEditOpen,
    openEdit,
    closeEdit,
    handleUpdate,
    isUpdating,
    isInviteOpen,
    openInvite,
    closeInvite,
    handleInvite,
    isInviting,
  } = useWorkerDetail(id);

  if (isWorkerLoading) return <PageLoader title="Loading worker…" />;

  if (!worker) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-ink-2">Worker not found.</p>
      </div>
    );
  }

  const joinDateLabel = worker.join_date
    ? new Date(worker.join_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div>
      <Link to="/workers" className="mb-4 inline-flex items-center gap-2 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft size={16} />
        Back to Workers
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-card border border-line bg-card p-5 shadow-card">
        <div className="flex items-start gap-4">
          <span className="flex p-2 shrink-0 items-center justify-center rounded-full bg-field-soft text-xl font-semibold text-field">
            <Avatar name={worker.name} src={worker?.avatar} />
          </span>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-ink">{worker.name}</h1>
              <Pill status={worker.status === 'active' ? 'present' : 'neutral'}>{worker.status}</Pill>
            </div>
            <p className="num mt-1 text-xs text-ink-3">CIN: {worker.CIN}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-2">

              <span className="flex items-center gap-1.5">
                <Phone size={14} className="text-ink-3" />
                Phone: {worker.phone || '—'}
              </span>

              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-ink-3" />
                Address: {worker.address || '—'}
              </span>

              <span className="flex items-center gap-1.5 capitalize">
                <Briefcase size={14} className="text-ink-3" />
                Contract: {worker.contract_type}
              </span>

              <span className="num flex items-center gap-1.5">
                <Banknote size={14} className="text-ink-3" />
                Daily rate: {worker.daily_rate} MAD
              </span>

              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-ink-3" />
                Joined: {joinDateLabel}
              </span>

            </div>
          </div>
        </div>

      <div className='flex items-center gap-5'>
        <button
          type="button"
          onClick={openEdit}
          className="flex items-center gap-2 rounded-input border border-line-strong px-4 py-2 text-sm font-medium text-ink-2 hover:bg-sunken"
        >
          <Pencil size={15} />
          Edit
        </button>
        <button
          type="button"
          onClick={openInvite}
          className="flex items-center gap-2 rounded-input border border-line-strong px-4 py-2 text-sm font-medium text-white bg-field hover:bg-field-hover"
        >
          <Send size={15} />
          Invitation
        </button>
      </div>
      </div>

      <div className="rounded-card border border-line bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Attendance History</h2>

          <div className="flex items-center gap-2">
            <select className="select w-auto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select className="select w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
          <StatCard label="Present" value={summary.present} tone="present" />
          <StatCard label="Absent" value={summary.absent} tone="absent" />
          <StatCard label="Excused" value={summary.excused} tone="excused" />
          <StatCard label="Total" value={total} tone="info" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                {['Date', 'Status', 'Check In', 'Check Out', 'Recorded By'].map((col) => (
                  <th key={col} className="px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isAttendanceLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-xs text-ink-3">
                    Loading attendance…
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-xs text-ink-3">
                    No attendance recorded for this period
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="border-b border-line last:border-0">

                    <td className="relative px-5 py-3 text-xs text-ink">
                      <span className={`absolute inset-y-0 left-0 w-0.75 ${RAIL[r.status] || 'bg-line-strong'}`} />
                      {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>

                    <td className="px-5 py-3">
                      <Pill status={r.status}>{r.status}</Pill>
                    </td>

                    <td className="num px-5 py-3 text-xs text-ink-2">
                      {r.check_in ? new Date(r.check_in).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}
                    </td>

                    <td className="num px-5 py-3 text-xs text-ink-2">
                      {r.check_out ? new Date(r.check_out).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}
                    </td>
                    
                    <td className="px-5 py-3 text-xs text-ink-2">{r.recorded_by?.name || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditOpen && (
        <WorkerForm worker={worker} onSubmit={handleUpdate} onClose={closeEdit} isSubmitting={isUpdating} />
      )}

      {isInviteOpen && (
        <WorkerInviteForm worker={worker} onSubmit={handleInvite} onClose={closeInvite} isSubmitting={isInviting} />
      )}
    </div>
  );
};

export default WorkerDetailPage;
