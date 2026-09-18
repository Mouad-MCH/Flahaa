import { CheckCircle2, Loader2 } from "lucide-react";
import { Modal } from "../ui/ui";

const MarkPaidModal = ({ payroll, onConfirm, onClose, isSubmitting }) => {
  if (!payroll) return null;

  return (
    <Modal
      onClose={onClose}
      maxWidth="max-w-sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-input border border-line-strong px-4 py-2 text-sm font-medium text-ink-2 hover:bg-sunken"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-input bg-field px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-field-hover disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            Mark paid
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-present-soft text-present">
          <CheckCircle2 size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-ink">Mark as paid</h2>
          <p className="mt-1.5 text-xs text-ink-2">
            Mark <span className="font-medium text-ink">{payroll.worker?.name}</span>'s payroll of{" "}
            <span className="font-medium text-ink">{payroll.net_salary} MAD</span> as paid?
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default MarkPaidModal;
