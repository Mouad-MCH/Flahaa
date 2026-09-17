import {Plus} from 'lucide-react'

const SupervisorsHeader = ({total, onAddSupervisor }) => {
  return (
<div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="mt-1 text-2xl font-bold text-ink">Supervisors</h1>
        <p className="mt-0.5 text-xs text-ink-3">{total} Supervisor{total === 1 ? '' : 's'} total</p>
      </div>

      <button
        type="button"
        onClick={onAddSupervisor}
        className="flex items-center cp gap-2 rounded-input bg-field px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-field-hover"
      >
        <Plus size={16} />
        Add Supervisor
      </button>
    </div>
  )
}

export default SupervisorsHeader
