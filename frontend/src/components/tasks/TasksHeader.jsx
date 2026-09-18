import { Plus } from "lucide-react";

const TasksHeader = ({ total = 0, onAssignTask }) => {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="mt-1 text-2xl font-bold text-ink">Tasks</h1>
        <p className="mt-0.5 text-xs text-ink-3">
          {total} tasks total
        </p>
      </div>

      <button
        type="button"
        onClick={onAssignTask}
        className="flex items-center cp gap-2 rounded-input bg-field px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-field-hover"
      >
        <Plus size={16} />
        Assign Task
      </button>
    </div>
  );
};

export default TasksHeader;
