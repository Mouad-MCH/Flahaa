import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Field, Modal } from '../ui/ui';

const FORM_ID = 'worker-invite-form';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WorkerInviteForm = ({ worker, onSubmit, onClose, isSubmitting }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !EMAIL_REGEX.test(email)) {
      setError('Enter a valid email address');
      return;
    }

    onSubmit({
      role: 'worker',
      worker_id: worker._id,
      email: email.trim().toLowerCase(),
    });
  };

  return (
    <Modal
      title="Invite worker"
      description={`Send ${worker.name} an invitation to create their account.`}
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
            Send invitation
          </button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
        <Field
          label="Email"
          required
          error={error}
          hint="An invitation link will be sent to this address"
        >
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="worker@example.com"
            autoFocus
          />
        </Field>
      </form>
    </Modal>
  );
};

export default WorkerInviteForm;
