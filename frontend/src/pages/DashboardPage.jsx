import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { useDashboard } from '../hooks/useDashboard.js';
import { PageLoader } from '../components/ui/ui.jsx';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatCard from '../components/dashboard/StatCard';
import AttendanceOverview from '../components/dashboard/AttendanceOverview';
import FarmSummary from '../components/dashboard/FarmSummary';
import MonthlyAttendanceChart from '../components/dashboard/MonthlyAttendanceChart';
import RecentWorkers from '../components/dashboard/RecentWorkers';
import RecentTasks from '../components/dashboard/RecentTasks';
import WorkerPayrollCard from '../components/dashboard/WorkerPayrollCard';

const AdminDashboard = ({ dashboard }) => {
  const { summary, attendance, monthly_attendance, recent_workers, recent_tasks } = dashboard;
  const todayLabel = new Date().toISOString().split('T')[0];

  const presentRate = summary.total_workers > 0 ? Math.round((summary.today_present / summary.total_workers) * 100) : 0;
  const absentRate = summary.total_workers > 0 ? Math.round((summary.today_absent / summary.total_workers) * 100) : 0;

  return (
    <div>
      <DashboardHeader subtitle="A summary of your farm's activity" />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Total Workers"
          value={summary.total_workers}
          sub="All workers on this farm"
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Present Today"
          value={summary.today_present}
          sub={`of ${summary.total_workers} active (${presentRate}%)`}
          icon={UserCheck}
          tone="present"
        />
        <StatCard
          label="Absent Today"
          value={summary.today_absent}
          sub={`${absentRate}% absence rate`}
          icon={UserX}
          tone="absent"
        />
        <StatCard
          label="Not Recorded"
          value={summary.attendance_not_recorded}
          sub="Mark attendance below"
          icon={Clock}
          tone="excused"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <AttendanceOverview attendance={attendance} totalWorkers={summary.total_workers} dateLabel={todayLabel} />
        <FarmSummary summary={summary} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentWorkers workers={recent_workers} />
        <div className="flex flex-col gap-4">
          <MonthlyAttendanceChart data={monthly_attendance} />
          <RecentTasks tasks={recent_tasks} />
        </div>
      </div>
    </div>
  );
};

const SupervisorDashboard = ({ dashboard }) => {
  const { summary, attendance, recent_tasks } = dashboard;

  return (
    <div>
      <DashboardHeader subtitle="A summary of your team's activity" />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Workers" value={summary.total_workers} sub="Workers you supervise" icon={Users} tone="info" />
        <StatCard label="Present Today" value={summary.today_present} icon={UserCheck} tone="present" />
        <StatCard label="Absent Today" value={summary.today_absent} icon={UserX} tone="absent" />
        <StatCard label="Not Recorded" value={summary.attendance_not_recorded} sub="Mark attendance below" icon={Clock} tone="excused" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AttendanceOverview attendance={attendance} totalWorkers={summary.total_workers} />
        <div className="md:col-span-2">
          <RecentTasks tasks={recent_tasks} />
        </div>
      </div>
    </div>
  );
};

const WorkerDashboard = ({ dashboard, name }) => {
  const { summary, current_payroll, recent_tasks } = dashboard;

  return (
    <div>
      <DashboardHeader title="Overview" subtitle={`Welcome back, ${name || 'there'}`} />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Pending Tasks" value={summary.tasks_pending} icon={Clock} tone="excused" />
        <StatCard label="Completed Tasks" value={summary.tasks_done} icon={UserCheck} tone="present" />
        <StatCard label="Present This Month" value={summary.present_days_this_month} icon={Users} tone="info" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RecentTasks tasks={recent_tasks} statusOf={(task) => task.assignments?.[0]?.status} />
        <WorkerPayrollCard payroll={current_payroll} />
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const { dashboard, isLoading, isError } = useDashboard();

  if (isLoading) return <PageLoader title="Loading your dashboard…" />;
  if (isError || !dashboard) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-ink-2">Failed to load the dashboard. Please try again.</p>
      </div>
    );
  }

  if (dashboard.role === 'admin') return <AdminDashboard dashboard={dashboard} />;
  if (dashboard.role === 'supervisor') return <SupervisorDashboard dashboard={dashboard} />;
  if (dashboard.role === 'worker') return <WorkerDashboard dashboard={dashboard} name={user?.name?.split(' ')[0]} />;

  return null;
};

export default DashboardPage;
