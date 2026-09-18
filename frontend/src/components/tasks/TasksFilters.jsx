const TasksFilters = ({ date, onDateChange, status, onStatusChange }) => {
  return (
    <div className='flex items-center gap-2'>
      <input
        type='date'
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        className='bg-card border border-ink-3 px-3 py-2 rounded-md font-medium text-ink-2'
      />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className='bg-card border border-ink-3 px-3 py-2 rounded-md font-medium text-ink-2'
      >
        <option value=''>All statuses</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In progress</option>
        <option value="done">Done</option>
      </select>
    </div>
  )
}

export default TasksFilters
