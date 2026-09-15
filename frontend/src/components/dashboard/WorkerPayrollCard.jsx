import { Link } from 'react-router-dom';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const WorkerPayrollCard = ({ payroll }) => {
  return (
    <div className="rounded-card border border-line bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Current Payroll</h2>
        <Link to="/my-salary" className="text-xs font-medium text-field hover:text-field-hover">
          View all
        </Link>
      </div>

      {!payroll ? (
        <p className="text-xs text-ink-3">No payroll record yet this month</p>
      ) : (
        <div>
          <p className="num text-2xl font-bold text-field">{payroll.net_salary.toFixed(0)} MAD</p>
          <p className="mt-1 text-xs text-ink-2">
            {MONTH_NAMES[payroll.month - 1]} {payroll.year} — {payroll.status === 'paid' ? 'Paid' : 'Pending'}
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkerPayrollCard;
