import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Field, Modal } from "../ui/ui";

const FORM_ID = 'supervisor-form';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SupervisorForm = ({ supervisor, onSubmit, onClose, isSubmitting }) => {
  const isEdit = Boolean(supervisor);

  const [form, setForm] = useState({
    name: supervisor?.name || '',
    email: supervisor?.email || '',
    phone: supervisor?.phone || '',
    status: supervisor?.status || 'active',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nextErrors = {};
    if (!form.name || form.name.trim().length < 2) nextErrors.name = 'Name must be at least 2 characters';
    if (!form.email || !EMAIL_REGEX.test(form.email)) nextErrors.email = 'Enter a valid email address';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (isEdit) {
      onSubmit({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        status: form.status,
      });
    } else {
      onSubmit({
        role: 'supervisor',
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      });
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit supervisor' : 'Add supervisor'}
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
            {isEdit ? 'Save changes' : 'Send invitation'}
          </button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
        <Field label="Full name" required error={errors.name}>
          <input
            type="text"
            className="input"
            value={form.name}
            onChange={handleChange('name')}
            placeholder="Karim Alaoui"
          />
        </Field>

        <Field
          label="Email"
          required
          error={errors.email}
          hint={!isEdit ? 'An invitation link will be sent to this address' : undefined}
        >
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={handleChange('email')}
            placeholder="karim@example.com"
          />
        </Field>

        <Field label="Phone" hint="Optional">
          <input
            type="tel"
            className="input"
            value={form.phone}
            onChange={handleChange('phone')}
            placeholder="06 12 34 56 78"
          />
        </Field>
        {
            isEdit && (
                <Field label="Status">
                  <select className="select" value={form.status} onChange={handleChange('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Field>
            )
        }
      </form>
    </Modal>
  );
};

export default SupervisorForm;
