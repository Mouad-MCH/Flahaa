import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Field, Modal } from "../ui/ui";

const FORM_ID = "task-form";

const TaskForm = ({ workers = [], onSubmit, onClose, isSubmitting }) => {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ title: "", description: "", date: today });
  const [workerIds, setWorkerIds] = useState([]);
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleWorker = (id) =>
    setWorkerIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (workerIds.length === 0) {
      setError("Select at least one worker");
      return;
    }
    setError("");
    onSubmit({ ...form, worker_ids: workerIds });
  };

  return (
    <Modal
      title="Assign task"
      description="Create a task and assign it to one or more workers."
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
            Assign task
          </button>
        </>
      }
    >
      {error && <p className="err-text mb-3">{error}</p>}
      <form id={FORM_ID} onSubmit={handleSubmit}>
        <Field label="Workers" required hint={`${workerIds.length} selected`}>
          <div className="max-h-36 space-y-1 overflow-y-auto rounded-input border border-line-strong bg-sunken p-2">
            {workers.length === 0 && <p className="px-1 py-1 text-xs text-ink-3">No active workers</p>}
            {workers.map((w) => (
              <label
                key={w._id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs text-ink-2"
              >
                <input type="checkbox" checked={workerIds.includes(w._id)} onChange={() => toggleWorker(w._id)} />
                {w.name}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Title" required>
          <input
            name="title"
            className="input"
            value={form.title}
            onChange={handleChange("title")}
            required
            placeholder="e.g. Harvest field A"
          />
        </Field>

        <Field label="Description">
          <textarea
            name="description"
            className="input"
            value={form.description}
            onChange={handleChange("description")}
            rows={2}
            style={{ resize: "none" }}
          />
        </Field>

        <Field label="Date" required>
          <input type="date" name="date" className="input" value={form.date} onChange={handleChange("date")} required />
        </Field>
      </form>
    </Modal>
  );
};

export default TaskForm;
