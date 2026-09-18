import { ClipboardList } from "lucide-react";
import React from "react";
import { Avatar, EmptyState } from "../ui/ui";

const BAR_COLOR = {
  present: "bg-present",
  absent: "bg-absent",
  excused: "bg-excused",
};

const STATUSES = [
  { key: "present", label: "Present" },
  { key: "absent", label: "Absent" },
  { key: "excused", label: "Excused" },
];

const STATUS_STYLES = {
  present: {
    active: "bg-card text-present",
    idle: "bg-transparent text-ink-3 hover:bg-present-soft hover:text-present",
  },
  absent: {
    active: "bg-card text-absent",
    idle: "bg-transparent text-ink-3 hover:bg-absent-soft hover:text-absent",
  },
  excused: {
    active: "bg-card text-excused",
    idle: "bg-transparent text-ink-3 hover:bg-excused-soft hover:text-excused",
  },
};

const formatTime = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const AttendanceList = ({ workers, onMark, markingWorkerId }) => {
  return (
    <div className="mt-5 bg-card rounded-md overflow-hidden border border-line">
      {workers.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={20} />}
          title="No active workers found"
          description="Add workers to your farm and they'll show up here for daily attendance."
        />
      ) : (
        <ul>
          {workers.map((item) => {
            const worker = item.worker_id || item;
            const status = item.worker_id ? item.status : null;
            const isPending = markingWorkerId === worker._id;
            const checkIn = formatTime(item.check_in);
            const checkOut = formatTime(item.check_out);

            return (
              <li
                key={worker._id}
                className="relative flex px-3 py-4 items-center gap-2 border-b border-line last:border-b-0"
              >
                <span className={`absolute inset-y-0 left-0 w-1 ${BAR_COLOR[status] || "bg-ink-3"}`} />

                <Avatar name={worker.name} src={worker.avatar} />
                <span className="who">
                  <span className="n">{worker.name}</span>
                  <span className="c">{worker.CIN}</span>
                </span>

                <span className="ml-auto flex items-center gap-3">
                  {status === "present" && (checkIn || checkOut) && (
                    <span className="text-[11px] text-ink-3">
                      {checkIn || "--"} – {checkOut || "--"}
                    </span>
                  )}

                  <span className="inline-flex rounded-md border border-line overflow-hidden bg-ink/5">
                    {STATUSES.map((s) => {
                      const active = status === s.key;
                      return (
                        <button
                          key={s.key}
                          type="button"
                          disabled={isPending}
                          onClick={() => !active && onMark?.(worker._id, s.key)}
                          className={`cp px-3 py-2.5 text-xs font-medium transition-colors rounded-md disabled:opacity-50 ${
                            active ? STATUS_STYLES[s.key].active : STATUS_STYLES[s.key].idle
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AttendanceList;
