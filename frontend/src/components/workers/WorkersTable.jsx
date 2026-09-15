import { Link } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Pill, Avatar } from '../ui/ui';

const COLUMNS = ['Worker', 'CIN', 'Contract', 'Daily Rate', 'Supervisor', 'Status', ''];

const WorkersTable = ({
  workers = [],
  isLoading,
  page = 1,
  totalPages = 1,
  onPageChange,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
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
            {isLoading ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-5 py-6 text-center text-xs text-ink-3">
                  Loading workers…
                </td>
              </tr>
            ) : workers.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-5 py-6 text-center text-xs text-ink-3">
                  No workers found
                </td>
              </tr>
            ) : (
              workers.map((w) => (
                <tr key={w._id} className="border-b border-line last:border-0 hover:bg-sunken/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={w.name} src={w.avatar} size={28} />
                      <div>
                        <p className="text-xs font-medium text-ink">{w.name}</p>
                        <p className="text-[10px] text-ink-3">{w.phone || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="num px-5 py-3 text-xs text-ink-2">{w.CIN}</td>
                  <td className="px-5 py-3 text-xs capitalize text-ink-2">{w.contract_type}</td>
                  <td className="num px-5 py-3 text-xs font-medium text-ink">{w.daily_rate} MAD</td>
                  <td className="px-5 py-3 text-xs text-ink-3">{w.supervisor_id?.name || 'Unassigned'}</td>
                  <td className="px-5 py-3">
                    <Pill status={w.status === 'active' ? 'present' : 'neutral'}>{w.status}</Pill>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link to={`/workers/${w._id}`} className="text-ink-3 hover:text-field" title="View">
                        <Eye size={15} />
                      </Link>
                      <button type="button" onClick={() => onEdit(w)} className="text-ink-3 hover:text-field" title="Edit">
                        <Pencil size={15} />
                      </button>
                      <button type="button" onClick={() => onDelete(w)} className="text-ink-3 hover:text-absent" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-line px-5 py-3">
        <span className="text-xs text-ink-3">
          Page {page} of {totalPages || 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-input border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-input border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkersTable;
