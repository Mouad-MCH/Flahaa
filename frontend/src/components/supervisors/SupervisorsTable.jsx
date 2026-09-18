import { Eye, Pencil, Trash2, UserCog } from "lucide-react";
import { Avatar, EmptyState } from "../ui/ui";
import { Link } from 'react-router-dom'

const SUPERVISOR_COMUMN = ["Supervisor", "Email", "Phone", "Joined", ''];

const SupervisorsTable = ({ supervisors = [], isLoading=true, onEdit, onDelet }) => {

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line">
              {SUPERVISOR_COMUMN.map((c) => (
                <th key={c} className="px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-3">{c}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {
                isLoading ? (
                    <tr>
                        <td colSpan={SUPERVISOR_COMUMN.length} className="px-5 py-6 text-center text-xs text-ink-3">
                            Loading supervisors...
                        </td>
                    </tr>
                ): supervisors.length === 0 ?
                (
                    <tr>
                      <td colSpan={SUPERVISOR_COMUMN.length} className="px-5 py-6 text-center text-xs text-ink-3">
                        No supervisor found
                      </td>
                    </tr>
                ): (
                    supervisors.map((s) => (
                        <tr key={s._id} className={`border-b border-line last:border-0 hover:bg-sunken/50 ${s.status === "inactive" ? 'opacity-20': ""}`}>
                            <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                    <Avatar name={s.name} src={s.avatar} size={28} />
                                    <p className="text-xs font-medium text-ink">{s.name}</p>
                                </div>
                            </td>
                            <td className="px-5 py-3 text-xs text-ink-2">{s.email || '—'}</td>
                            <td className="px-5 py-3 text-xs text-ink-2">{s.phone || '—'}</td>
                            <td className="px-5 py-3 text-xs text-ink-3">
                                {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-5 py-3">
                                <div className="flex items-center justify-end gap-3">
                                    <Link to={`/supervisor/${s._id}`} className="text-ink-3 hover:text-field cp" title="Details">
                                        <Eye size={15}/>
                                    </Link>
                                    <button type="button" onClick={() => onEdit(s)} className="text-ink-3 hover:text-field cp" title="Edit">
                                        <Pencil size={15} />
                                    </button>
                                    <button type="button" onClick={() => onDelet(s)} className="text-ink-3 hover:text-absent cp" title="Delete">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupervisorsTable;
