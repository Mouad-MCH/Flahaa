import { Download, Wallet } from "lucide-react";
import { Avatar, EmptyState, Pill } from "../ui/ui";

const COLUMNS = ["Worker", "Days", "Calculation", "Status", ""];

const STATUS_META = {
  pending: { pill: "excused", rail: "border-excused", label: "Pending" },
  paid: { pill: "present", rail: "border-present", label: "Paid" },
};

const PayrollTable = ({ records = [], isLoading, onMarkPaid }) => {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      {!isLoading && records.length === 0 ? (
        <EmptyState
          icon={<Wallet size={20} />}
          title="No payroll records"
          description="Calculate a worker's payroll for this month to see it here."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                {COLUMNS.map((c) => (
                  <th key={c} className="px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-3">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-5 py-6 text-center text-xs text-ink-3">
                    Loading payroll…
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const meta = STATUS_META[r.status] || STATUS_META.pending;
                  return (
                    <tr key={r._id} className="border-b border-line last:border-0 hover:bg-sunken/50">
                      <td className={`border-l-[3px] px-5 py-3 ${meta.rail}`}>
                        <div className="flex items-center gap-3">
                          <Avatar name={r.worker?.name} src={r.worker?.avatar} size={28} />
                          <div>
                            <p className="text-xs font-medium text-ink">{r.worker?.name}</p>
                            <p className="text-[10px] text-ink-3">{r.worker?.CIN}</p>
                          </div>
                        </div>
                      </td>
                      <td className="num px-5 py-3 text-xs text-ink-2">
                        {r.working_days} × {r.daily_rate ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <p className="num text-xs text-ink">
                          {r.base_salary} + <span className="text-present">{r.bonuses}</span> −{" "}
                          <span className="text-absent">{r.deductions}</span> ={" "}
                          <span className="font-bold text-ink">{r.net_salary} MAD</span>
                        </p>
                        <p className="text-[10px] text-ink-3">base + bonus – advance</p>
                      </td>
                      <td className="px-5 py-3">
                        <Pill status={meta.pill}>{meta.label}</Pill>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            disabled
                            title="PDF export coming soon"
                            className="cursor-not-allowed text-ink-3 opacity-40"
                          >
                            <Download size={15} />
                          </button>
                          {r.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => onMarkPaid(r)}
                              className="rounded-input border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-sunken"
                            >
                              Mark paid
                            </button>
                          )}
                        </div>
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
  );
};

export default PayrollTable;
