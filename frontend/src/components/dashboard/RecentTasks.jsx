import { MoreHorizontal } from 'lucide-react';
import { Pill, Avatar } from '../ui/ui';

const STATUS_PILL = {
  pending: { status: 'excused', label: 'Pending' },
  in_progress: { status: 'info', label: 'In progress' },
  done: { status: 'present', label: 'Done' },
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
};


const RecentTasks = ({ tasks = [], statusOf = (task) => task.status }) => {
  return (
    <div className="rounded-card border border-line bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold text-ink">Recent Tasks</h2>
        <button type="button" className="text-ink-3 hover:text-ink">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="px-5 py-6 text-center text-xs text-ink-3">No tasks yet</div>
      ) : (
        <ul className="divide-y divide-line">
          {tasks.map((task) => {
            const assignees = task.assignments || [];
            const visible = assignees.slice(0, 3);
            const extra = assignees.length - visible.length;
            const pill = STATUS_PILL[statusOf(task)] || STATUS_PILL.pending;

            return (
              <li key={task._id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-ink">{task.title}</p>
                  {task.description && <p className="truncate text-[11px] text-ink-3">{task.description}</p>}
                </div>

                {visible.length > 0 && (
                  <div className="flex items-center -space-x-2">
                    {visible.map((a, i) => (
                      <span key={a._id || i} className="rounded-full ring-2 ring-card">
                        <Avatar name={a.worker_id?.name} src={a.worker_id?.avatar} size={22} />
                      </span>
                    ))}
                    {extra > 0 && (
                      <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-sunken text-[9px] font-medium text-ink-3 ring-2 ring-card">
                        +{extra}
                      </span>
                    )}
                  </div>
                )}

                <span className="num w-16 shrink-0 text-right text-[11px] text-ink-3">{formatDate(task.date)}</span>

                <Pill status={pill.status}>{pill.label}</Pill>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RecentTasks;
