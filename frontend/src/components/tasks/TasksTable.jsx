import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, ListTodo, Plus, Star, Trash2, UserPlus, X } from "lucide-react";
import { Avatar, EmptyState, Pill } from "../ui/ui";

const COLUMNS = ["", "Task", "Assignees", "Date", "Status", ""];

// Roll-up / per-assignment status → Pill variant + label. `done` reads as
// "present" (positive/complete), `pending` as neutral, `in_progress` as info —
// per the design system's status-color mapping.
const TASK_STATUS_META = {
  pending: { pill: "neutral", label: "Pending" },
  in_progress: { pill: "info", label: "In progress" },
  done: { pill: "present", label: "Done" },
};

const PILL_STYLES = {
  present: "bg-present-soft text-present",
  info: "bg-info-soft text-info",
  neutral: "bg-sunken text-ink-3",
};

const PILL_DOT = {
  present: "bg-present",
  info: "bg-info",
  neutral: "bg-ink-3",
};

function AssigneeAvatars({ assignments }) {
  const shown = assignments.slice(0, 4);
  const overflow = assignments.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((a, i) => (
        <div
          key={a.worker_id?._id || i}
          title={a.worker_id?.name}
          className="rounded-full border-2 border-card"
          style={{ marginLeft: i === 0 ? 0 : -8, zIndex: shown.length - i }}
        >
          <Avatar name={a.worker_id?.name} src={a.worker_id?.avatar} size={24} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-card bg-sunken text-[9px] font-bold text-ink-3"
          style={{ marginLeft: -8 }}
        >
          +{overflow}
        </div>
      )}
      <span className="ml-2 text-xs text-ink-2">
        {assignments.length} {assignments.length === 1 ? "worker" : "workers"}
      </span>
    </div>
  );
}

function StatusDropdown({ current, onUpdate }) {
  const [open, setOpen] = useState(false);
  const meta = TASK_STATUS_META[current] || TASK_STATUS_META.pending;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-pill border-none px-2.5 py-1 text-[11px] font-medium capitalize ${PILL_STYLES[meta.pill]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${PILL_DOT[meta.pill]}`} />
        {meta.label} <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute left-0 top-7 z-20 overflow-hidden rounded-card border border-line bg-card shadow-card" style={{ minWidth: 140 }}>
          {Object.entries(TASK_STATUS_META).map(([val, m]) => (
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

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="cursor-pointer border-none bg-transparent p-0.5"
        >
          <Star size={14} className={n <= (hover || value || 0) ? "text-ink" : "text-line-strong"} fill={n <= (hover || value || 0) ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

function AddAssigneesRow({ workers, task, onAdd }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  const assignedIds = new Set(task.assignments.map((a) => String(a.worker_id?._id || a.worker_id)));
  const available = workers.filter((w) => !assignedIds.has(String(w._id)));

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async () => {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      await onAdd(selected);
      setSelected([]);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={available.length === 0}
        className="flex items-center gap-1.5 px-1 py-1 text-xs font-medium text-ink-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UserPlus size={13} /> Add worker
      </button>
    );
  }

  return (
    <div className="rounded-card border border-line bg-card p-3">
      {available.length === 0 ? (
        <p className="text-xs text-ink-3">All active workers are already assigned.</p>
      ) : (
        <div className="mb-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
          {available.map((w) => (
            <label
              key={w._id}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md border border-line px-2 py-1 text-xs text-ink-2 ${selected.includes(w._id) ? "bg-field-soft" : "bg-card"}`}
            >
              <input type="checkbox" checked={selected.includes(w._id)} onChange={() => toggle(w._id)} />
              {w.name}
            </label>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy || selected.length === 0}
          className="rounded-input bg-field px-3 py-1.5 text-xs font-medium text-white hover:bg-field-hover disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setSelected([]);
          }}
          className="rounded-input px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-sunken"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function TaskAssignments({ task, workers, onStatusUpdate, onRating, onRemove, onAdd }) {
  return (
    <div className="space-y-2 px-5 py-4">
      {task.assignments.map((a) => {
        const workerId = a.worker_id?._id || a.worker_id;
        return (
          <div key={workerId} className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-card px-3 py-2">
            <div className="flex min-w-35 items-center gap-2">
              <Avatar name={a.worker_id?.name} src={a.worker_id?.avatar} size={24} />
              <span className="text-xs text-ink">{a.worker_id?.name}</span>
            </div>
            <StatusDropdown current={a.status} onUpdate={(status) => onStatusUpdate(workerId, status)} />
            <StarRating value={a.rating} onChange={(r) => onRating(workerId, r)} />
            <button
              type="button"
              onClick={() => onRemove(workerId)}
              disabled={task.assignments.length <= 1}
              title={task.assignments.length <= 1 ? "Cannot remove the last worker" : "Remove from task"}
              className="text-ink-3 transition-colors hover:text-absent disabled:cursor-not-allowed disabled:opacity-30"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
      <AddAssigneesRow workers={workers} task={task} onAdd={(workerIds) => onAdd(workerIds)} />
    </div>
  );
}

const TasksTable = ({
  tasks = [],
  workers = [],
  isLoading,
  expandedTaskId,
  onToggleExpand,
  onDelete,
  onStatusUpdate,
  onRating,
  onAddAssignees,
  onRemoveAssignee,
  onAssignTask,
}) => {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      {!isLoading && tasks.length === 0 ? (
        <EmptyState
          icon={<ListTodo size={20} />}
          title="No tasks for this day"
          description="Assign work to a worker and it'll show up here."
          action={
            <button
              type="button"
              onClick={onAssignTask}
              className="flex items-center gap-1.5 rounded-input bg-field px-3 py-2 text-xs font-medium text-white hover:bg-field-hover"
            >
              <Plus size={14} /> Assign a task
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                {COLUMNS.map((col, i) => (
                  <th key={col + i} className="px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-5 py-6 text-center text-xs text-ink-3">
                    Loading tasks…
                  </td>
                </tr>
              ) : (
                tasks.map((t) => {
                  const isExpanded = expandedTaskId === t._id;
                  return (
                    <Fragment key={t._id}>
                      <tr className="border-b border-line hover:bg-sunken/50">
                        <td className="px-5 py-3">
                          <button type="button" onClick={() => onToggleExpand(t._id)} className="text-ink-3">
                            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </button>
                        </td>
                        <td className="max-w-55 px-5 py-3">
                          <p className="truncate text-xs font-medium text-ink">{t.title}</p>
                          {t.description && <p className="mt-0.5 truncate text-[10px] text-ink-3">{t.description}</p>}
                        </td>
                        <td className="px-5 py-3">
                          <AssigneeAvatars assignments={t.assignments} />
                        </td>
                        <td className="num px-5 py-3 text-xs text-ink-2">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          <Pill status={(TASK_STATUS_META[t.status] || TASK_STATUS_META.pending).pill}>
                            {(TASK_STATUS_META[t.status] || TASK_STATUS_META.pending).label}
                          </Pill>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button type="button" onClick={() => onDelete(t._id)} className="text-ink-3 transition-colors hover:text-absent">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={COLUMNS.length} className="bg-sunken p-0">
                            <TaskAssignments
                              task={t}
                              workers={workers}
                              onStatusUpdate={(workerId, status) => onStatusUpdate(t._id, workerId, status)}
                              onRating={(workerId, rating) => onRating(t._id, workerId, rating)}
                              onRemove={(workerId) => onRemoveAssignee(t._id, workerId)}
                              onAdd={(workerIds) => onAddAssignees(t._id, workerIds)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TasksTable;
