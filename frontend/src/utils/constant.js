import {
  LayoutDashboard, Users, ClipboardCheck, ListTodo,
  Wallet, UserCog
} from 'lucide-react';

export const navItems = [
  { to: '/dashboard',   label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'supervisor', 'worker'] },
  { to: '/workers',     label: 'Workers',     icon: Users,          roles: ['admin', 'supervisor'] },
  { to: '/attendance',  label: 'Attendance',        icon: ClipboardCheck, roles: ['admin', 'supervisor'] },
  { to: '/tasks',       label: 'Tasks',           icon: ListTodo,       roles: ['admin', 'supervisor'] },
  { to: '/payroll',     label: 'Payroll',             icon: Wallet,         roles: ['admin', 'supervisor'] },
  { to: '/supervisors', label: 'Supervisors',     icon: UserCog,        roles: ['admin'] },
  { to: '/my-tasks',    label: 'My Tasks',       icon: ListTodo,       roles: ['worker'] },
  { to: '/my-salary',   label: 'My Salary',      icon: Wallet,         roles: ['worker'] },
];