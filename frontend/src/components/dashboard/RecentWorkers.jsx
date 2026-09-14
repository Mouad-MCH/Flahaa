import { Link } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { Pill, Avatar } from '../ui/ui';

const COLUMNS = ['Name', 'CIN', 'Contract', 'Daily Rate', 'Status'];

const RecentWorkers = ({ workers = [] }) => {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold text-ink">Recent Workers</h2>
        <button type="button" className="text-ink-3 hover:text-ink">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
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
            {workers.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-5 py-6 text-center text-xs text-ink-3">
                  No workers yet
                </td>
              </tr>
            ) : (
              workers.map((w) => (
                <tr key={w._id} className="border-b border-line last:border-0">
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
                  <td className="px-5 py-3">
                    <Pill status={w.status === 'active' ? 'present' : 'neutral'}>{w.status}</Pill>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end border-t border-line px-5 py-3">
        <Link to="/workers" className="text-xs font-medium text-field hover:text-field-hover">
          View all workers →
        </Link>
      </div>
    </div>
  );
};

export default RecentWorkers;
