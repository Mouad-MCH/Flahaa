import React from 'react'
import AttendanceHeader from '../components/attendance/AttendanceHeader'
import { useAttendance } from '../hooks/useAttendance.js'
import AttendanceStats from '../components/attendance/AttendanceStats.jsx'
import AttendanceSummary from '../components/attendance/AttendanceSummary.jsx'
import AttendanceList from '../components/attendance/AttendanceList.jsx'
import { PageLoader } from '../components/ui/ui.jsx'

const AttendancePage = () => {

    const {
        workers,
        date,
        setDate,
        counts,
        state,
        markAttendance,
        markingWorkerId,
        isLoading
    } = useAttendance()


    if(isLoading) return <PageLoader />

  return (
    <div>
      <AttendanceHeader
        date={date}
        setDate={setDate}
      />
      <AttendanceStats 
        state={state}
      />
      <AttendanceSummary
        counts={counts}
      />

      <AttendanceList
        workers={workers}
        onMark={markAttendance}
        markingWorkerId={markingWorkerId}
      />
    </div>
  )
}

export default AttendancePage
