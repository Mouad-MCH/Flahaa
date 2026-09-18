import PayrollHeader from "../components/payroll/PayrollHeader";
import PayrollFilters from "../components/payroll/PayrollFilters";
import PayrollStats from "../components/payroll/PayrollStats";
import PayrollTable from "../components/payroll/PayrollTable";
import CalculatePayrollModal from "../components/payroll/CalculatePayrollModal";
import MarkPaidModal from "../components/payroll/MarkPaidModal";
import { usePayroll } from "../hooks/usePayroll";

const PayrollPage = () => {
  const {
    month, setMonth,
    year, setYear,
    records, total, workers,
    isFetching,
    totalNet, paidCount, pendingCount,
    calculateMode, openCalculate, closeCalculate, handleCalculate, isCalculating,
    markingPayroll, setMarkingPayroll, handleMarkPaid, isMarkingPaid,
  } = usePayroll();

  return (
    <div>
      <PayrollHeader total={total} month={month} year={year} onCalculate={openCalculate} />

      <PayrollFilters month={month} onMonthChange={setMonth} year={year} onYearChange={setYear} />

      <PayrollStats totalNet={totalNet} paidCount={paidCount} pendingCount={pendingCount} />

      <PayrollTable records={records} isLoading={isFetching} onMarkPaid={setMarkingPayroll} />

      {calculateMode && (
        <CalculatePayrollModal
          mode={calculateMode}
          workers={workers}
          month={month}
          year={year}
          onSubmit={handleCalculate}
          onClose={closeCalculate}
          isSubmitting={isCalculating}
        />
      )}

      {markingPayroll && (
        <MarkPaidModal
          payroll={markingPayroll}
          onConfirm={handleMarkPaid}
          onClose={() => setMarkingPayroll(null)}
          isSubmitting={isMarkingPaid}
        />
      )}
    </div>
  );
};

export default PayrollPage;
