import React from 'react'
import StatCard from '../dashboard/StatCard'

const AttendanceStats = ({state : {totalWorkers, totalPresent, notRecorded}}) => {
  return (
    <div className='mb-4 grid grid-cols-3 gap-2 max-sm:grid-cols-1'>
      <StatCard label="Total workers" value={totalWorkers} tone="info" />
      <StatCard label="Presnet today" sub={'of 10 ative'} value={totalPresent} tone="present" />
      <StatCard label="Not recorded" sub={'Mark attedance below'} value={notRecorded} tone="" />
    </div>
  )
}

export default AttendanceStats
