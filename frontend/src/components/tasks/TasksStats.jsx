import { Pill } from "../ui/ui"

const TasksStats = ({counts}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5 mt-7">
      <Pill status="neutral">{counts.pending} pending</Pill>
      <Pill status="info">{counts.in_progress} in progress</Pill>
      <Pill status="present">{counts.done} done</Pill>
    </div>
  )
}

export default TasksStats
