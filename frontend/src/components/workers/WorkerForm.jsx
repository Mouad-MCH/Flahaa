import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Field, Modal } from "../ui/ui";
import { useAuthStore } from "../../store/authStore";

const FORM_ID = "worker-form";

const WorkerForm = ({
  worker,
  onSubmit,
  onClose,
  isSubmitting,
  supervisors = [],
}) => {
  const isEdit = Boolean(worker);
  const user = useAuthStore((state) => state.user);

  const [form, setForm] = useState({
    name: worker?.name || "",
    CIN: worker?.CIN || "",
    phone: worker?.phone || "",
    address: worker?.address || "",
    contract_type: worker?.contract_type || "daily",
    daily_rate: worker?.daily_rate ?? "",
    status: worker?.status || "active",
    join_date: worker?.join_date ? worker.join_date.slice(0, 10) : "",
    supervisor_id: worker?.supervisor_id?._id || worker?.supervisor_id || "",
  });
  const [avatar, setAvatar] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nextErrors = {};
    if (!form.name || form.name.trim().length < 3)
      nextErrors.name = "Name must be at least 3 characters";
    if (!form.CIN || form.CIN.trim().length < 3)
      nextErrors.CIN = "CIN must be at least 3 characters";
    if (!form.daily_rate || Number(form.daily_rate) <= 0)
      nextErrors.daily_rate = "Daily rate must be greater than 0";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== "" && value !== undefined && value !== null)
        payload.append(key, value);
    });
    if (avatar) payload.append("avatar", avatar);

    onSubmit(payload);
  };

  return (
    <Modal
      title={isEdit ? "Edit Worker" : "Add Worker"}
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
            {isEdit ? "Save changes" : "Add worker"}
          </button>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <Field label="Full name" required error={errors.name}>
          <input
            type="text"
            className="input"
            value={form.name}
            onChange={handleChange("name")}
            placeholder="Ahmed Bennani"
          />
        </Field>

        <Field label="CIN" required error={errors.CIN}>
          <input
            type="text"
            className="input"
            value={form.CIN}
            onChange={handleChange("CIN")}
            placeholder="AB123456"
          />
        </Field>

        <Field label="Phone" hint="Optional">
          <input
            type="tel"
            className="input"
            value={form.phone}
            onChange={handleChange("phone")}
            placeholder="06 12 34 56 78"
          />
        </Field>

        <Field label="Address" hint="Optional">
          <input
            type="text"
            className="input"
            value={form.address}
            onChange={handleChange("address")}
          />
        </Field>

        <Field label="Contract type">
          <select
            className="select"
            value={form.contract_type}
            onChange={handleChange("contract_type")}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </Field>

        <Field label="Daily rate (MAD)" required error={errors.daily_rate}>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            value={form.daily_rate}
            onChange={handleChange("daily_rate")}
          />
        </Field>

        <Field label="Status">
          <select
            className="select"
            value={form.status}
            onChange={handleChange("status")}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>

        <Field label="Join date" hint="Optional">
          <input
            type="date"
            className="input"
            value={form.join_date}
            onChange={handleChange("join_date")}
          />
        </Field>

        <Field label="Avatar" hint="Optional">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="input"
            onChange={(e) => setAvatar(e.target.files?.[0] || null)}
          />
        </Field>
        {user?.role === "admin" && (
          <Field label="Supervisor" hint="Optional">
            <select
              className="select"
              value={form.supervisor_id}
              onChange={handleChange("supervisor_id")}
            >
              <option value="">— None —</option>
              {supervisors.map((s) => (
                <option key={s._id} value={s._id}>
                  {" "}
                  {s.name}{" "}
                </option>
              ))}
            </select>
          </Field>
        )}
      </form>
    </Modal>
  );
};

export default WorkerForm;
