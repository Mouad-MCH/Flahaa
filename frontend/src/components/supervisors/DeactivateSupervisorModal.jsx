import { AlertTriangle, Loader2 } from 'lucide-react'
import { Modal } from '../ui/ui'

const DeactivateSupervisorModal = ({ supervisor, onConfirm, onClose, isDeleting }) => {
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
            onClick={() => onConfirm(supervisor)}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-input bg-absent px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {isDeleting && <Loader2 size={15} className="animate-spin" />}
            Delete
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-absent-soft text-absent">
          <AlertTriangle size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-ink">Delete Supervisor</h2>
          <p className="mt-1.5 text-xs text-ink-2">
            Are you sure you want to delete <span className="font-medium text-ink">{supervisor.name}</span>? This action cannot be undone.
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default DeactivateSupervisorModal
