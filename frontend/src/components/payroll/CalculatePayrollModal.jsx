import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Field, Modal } from "../ui/ui";

const FORM_ID = "calculate-payroll-form";

const CalculatePayrollModal = ({ mode = "calculate", workers = [], month, year, onSubmit, onClose, isSubmitting }) => {

  const [workerId, setWorkerId] = useState("");
  const [bonuses, setBonuses] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!workerId) {
      setError("Select a worker");
      return;
    }
    setError("");
    onSubmit({
      worker_id: workerId,
      month,
      year,
      bonuses: Number(bonuses) || 0,
      deductions: Number(deductions) || 0,
      notes: notes || undefined,
    });
  };

  return (
    <Modal
      title={"Calculate payroll"}
      description={
        "Computes base salary from present days in attendance, plus any bonuses or deductions."
      }
      onClose={onClose}
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
            type="submit"
            form={FORM_ID}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-input bg-field px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-field-hover disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {"Calculate"}
          </button>
        </>
      }
    >
      {error && <p className="err-text mb-3">{error}</p>}
      <form id={FORM_ID} onSubmit={handleSubmit}>
        <Field label="Worker" required>
          <select className="select" value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
            <option value="">Select a worker</option>
            {workers.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        </Field>

          <Field label="Bonuses (MAD)" hint="Optional">
            <input type="number" min="0" step="0.01" className="input" value={bonuses} onChange={(e) => setBonuses(e.target.value)} />
          </Field>

        <Field label={"Deductions (MAD)"} hint="Optional">
          <input type="number" min="0" step="0.01" className="input" value={deductions} onChange={(e) => setDeductions(e.target.value)} />
        </Field>

        <Field label="Notes" hint="Optional">
          <textarea className="input" rows={2} style={{ resize: "none" }} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
};

export default CalculatePayrollModal;
