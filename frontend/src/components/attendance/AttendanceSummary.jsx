import { Pill } from "../ui/ui";

const AttendanceSummary = ({counts}) => {
  return (
    <div className="flex gap-2 items-center mt-7 flex-wrap">
      <Pill status="present">{counts.present} present</Pill>
      <Pill status="absent">{counts.absent} absent</Pill>
      <Pill status="excused">{counts.excused} excused</Pill>
      <Pill>{counts.notRecorded} not Recorded</Pill>
    </div>
  );
};

export default AttendanceSummary;
