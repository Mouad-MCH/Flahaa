import TasksFilters from "../components/tasks/TasksFilters"
import TasksHeader from "../components/tasks/TasksHeader"
import TasksStats from "../components/tasks/TasksStats"
import TasksTable from "../components/tasks/TasksTable"
import TaskForm from "../components/tasks/TaskForm"
import { useTasks } from "../hooks/useTasks"

const TasksPage = () => {
  const {
    date, setDate,
    status, setStatus,
    tasks, total, counts, workers,
    isFetching,
    expandedTaskId, toggleExpand,
    isFormOpen, openForm, closeForm,
    handleCreateTask, isCreating,
    handleDelete,
    handleAddAssignees,
    handleRemoveAssignee,
    handleStatusUpdate,
    handleRating,
  } = useTasks()

  return (
    <div>
        <TasksHeader total={total} onAssignTask={openForm} />
        <TasksFilters date={date} onDateChange={setDate} status={status} onStatusChange={setStatus} />
        <TasksStats
          counts={counts}
        />
        <TasksTable
          tasks={tasks}
          workers={workers}
          isLoading={isFetching}
          expandedTaskId={expandedTaskId}
          onToggleExpand={toggleExpand}
          onDelete={handleDelete}
          onStatusUpdate={handleStatusUpdate}
          onRating={handleRating}
          onAddAssignees={handleAddAssignees}
          onRemoveAssignee={handleRemoveAssignee}
          onAssignTask={openForm}
        />

        {isFormOpen && (
          <TaskForm
            workers={workers}
            onSubmit={handleCreateTask}
            onClose={closeForm}
            isSubmitting={isCreating}
          />
        )}
    </div>
  )
}

export default TasksPage
