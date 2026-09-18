import { Plus, Calculator } from "lucide-react";

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PayrollHeader = ({ total = 0, month, year, onCalculate }) => {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-ink">Payroll</h1>
        <p className="mt-0.5 text-xs text-ink-3">
          {total} records for {MONTH_NAMES[month - 1]} {year}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCalculate}
          className="flex items-center gap-2 rounded-input bg-field px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-field-hover"
        >
          <Calculator size={16} /> Calculate payroll
        </button>
      </div>
    </div>
  );
};

export default PayrollHeader;
