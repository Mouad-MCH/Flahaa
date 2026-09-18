import { useState } from "react";
import { ChevronDown, ListTodo, Star } from "lucide-react";
import { EmptyState, Pill } from "../components/ui/ui";
import TasksFilters from "../components/tasks/TasksFilters";
import { useMyTasks } from "../hooks/useMyTasks";

const COLUMNS = ["Task", "Assigned By", "Date", "Status", "Rating"];

const STATUS_META = {
  pending: { pill: "excused", rail: "border-excused", label: "Pending" },
  in_progress: { pill: "info", rail: "border-info", label: "In Progress" },
  done: { pill: "present", rail: "border-present", label: "Done" },
};

const PILL_STYLES = {
  excused: "bg-excused-soft text-excused",
  info: "bg-info-soft text-info",
  present: "bg-present-soft text-present",
};

const PILL_DOT = {
  excused: "bg-excused",
  info: "bg-info",
  present: "bg-present",
};

function StatusDropdown({ current, onUpdate, disabled }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[current] || STATUS_META.pending;
  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-pill border-none px-2.5 py-1 text-[11px] font-medium disabled:opacity-60 ${PILL_STYLES[meta.pill]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${PILL_DOT[meta.pill]}`} />
        {meta.label} <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute left-0 top-7 z-20 overflow-hidden rounded-card border border-line bg-card shadow-card" style={{ minWidth: 130 }}>
          {Object.entries(STATUS_META).map(([val, m]) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                onUpdate(val);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-sunken ${current === val ? "text-ink" : "text-ink-2"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RatingCell({ rating }) {
  if (!rating) return <span className="text-xs italic text-ink-3">Not rated yet</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={13} className={n <= rating ? "text-present" : "text-line-strong"} fill={n <= rating ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

const MyTasksPage = () => {
  const {
    date, setDate,
    status, setStatus,
    tasks, total, counts,
    isFetching,
    handleStatusUpdate,
    updatingTaskId,
  } = useMyTasks();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">My Tasks</h1>
        <p className="mt-0.5 text-xs text-ink-3">{total} tasks total</p>
      </div>

      <div className="mb-5">
        <TasksFilters date={date} onDateChange={setDate} status={status} onStatusChange={setStatus} />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Pill status="excused">{counts.pending} Pending</Pill>
        <Pill status="info">{counts.in_progress} In Progress</Pill>
        <Pill status="present">{counts.done} Done</Pill>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
        {!isFetching && tasks.length === 0 ? (
          <EmptyState
            icon={<ListTodo size={20} />}
            title="No tasks found"
            description="Tasks assigned to you will show up here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line">
                  {COLUMNS.map((col) => (
                    <th key={col} className="px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-3">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isFetching && tasks.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-5 py-6 text-center text-xs text-ink-3">
                      Loading tasks…
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => {
                    const meta = STATUS_META[t.my_assignment?.status] || STATUS_META.pending;
                    return (
                      <tr key={t._id} className="border-b border-line last:border-0 hover:bg-sunken/50">
                        <td className={`border-l-[3px] px-5 py-3 ${meta.rail}`}>
                          <p className="truncate text-xs font-medium text-ink">{t.title}</p>
                          {t.description && <p className="mt-0.5 truncate text-[10px] text-ink-3">{t.description}</p>}
                        </td>
                        <td className="px-5 py-3 text-xs text-ink-2">{t.assigned_by?.name || "—"}</td>
                        <td className="num px-5 py-3 text-xs text-ink-2">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          <StatusDropdown
                            current={t.my_assignment?.status}
                            onUpdate={(next) => handleStatusUpdate(t._id, next)}
                            disabled={updatingTaskId === t._id}
                          />
                        </td>
                        <td className="px-5 py-3">
                          <RatingCell rating={t.my_assignment?.rating} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasksPage;
