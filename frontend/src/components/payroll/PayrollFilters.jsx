import { MONTHS, YEARS } from "../../utils/constant";

const PayrollFilters = ({ month, onMonthChange, year, onYearChange }) => {
  return (
    <div className="mb-5 flex items-center gap-2">
      <select value={month} onChange={(e) => onMonthChange(Number(e.target.value))} className="select" style={{ width: 'auto' }}>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>{m.slice(0, 3)}</option>
        ))}
      </select>
      <select value={year} onChange={(e) => onYearChange(Number(e.target.value))} className="select" style={{ width: 'auto' }}>
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
};

export default PayrollFilters;
