import { Plus } from 'lucide-react';

const WorkersHeader = ({ total = 0, onAddWorker }) => {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs text-ink-3">Dashboards / Workers</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Workers</h1>
        <p className="mt-0.5 text-xs text-ink-3">{total} worker{total === 1 ? '' : 's'} total</p>
      </div>

      <button
        type="button"
        onClick={onAddWorker}
        className="flex items-center gap-2 rounded-input bg-field px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-field-hover"
      >
        <Plus size={16} />
        Add Worker
      </button>
    </div>
  );
};

export default WorkersHeader;
