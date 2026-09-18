import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Field, Modal } from "./ui";

const FORM_ID = "farm-form";

const FarmModal = ({ onSubmit, onClose, isSubmitting }) => {
  const [form, setForm] = useState({ name: "", address: "" });
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || form.name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    setError("");
    onSubmit(form);
  };

  return (
    <Modal
      title="Add farm"
      description="Create a new farm you'll manage."
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
            Add farm
          </button>
        </>
      }
    >
      {error && <p className="err-text mb-3">{error}</p>}
      <form id={FORM_ID} onSubmit={handleSubmit}>
        <Field label="Farm name" required>
          <input
            className="input"
            value={form.name}
            onChange={handleChange("name")}
            placeholder="e.g. Ferme Al Baraka"
            autoFocus
          />
        </Field>

        <Field label="Address" hint="Optional">
          <input
            className="input"
            value={form.address}
            onChange={handleChange("address")}
            placeholder="e.g. Beni Mellal, Morocco"
          />
        </Field>
      </form>
    </Modal>
  );
};

export default FarmModal;
