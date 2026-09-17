import React from 'react'

const AttendanceHeader = ({date, setDate}) => {

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="mt-1 text-2xl font-bold text-ink">Attendance</h1>
        <p className="mt-0.5 text-xs text-ink-3">{new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <input type='Date' className="border border-ink px-4 py-2 rounded-md bg-card cp" value={date} onChange={(e) => setDate(e.target.value)} />
    </div>
  )
}

export default AttendanceHeader
