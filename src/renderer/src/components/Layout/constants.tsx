import {
  BadgeCheck,
  CircleDollarSign,
  LayoutDashboardIcon,
  NotebookPen,
  Settings,
  SquareChartGantt,
  Users
} from 'lucide-react'

export const menuItems = [
  { path: '/', icon: <LayoutDashboardIcon />, label: 'nav.dashboard' },
  { path: '/members', icon: <Users />, label: 'nav.members' },
  { path: '/plans', icon: <SquareChartGantt />, label: 'nav.plans' },
  { path: '/memberships', icon: <CircleDollarSign />, label: 'nav.memberships' },
  { path: '/checkin', icon: <BadgeCheck />, label: 'nav.checkin' },
  { path: '/reports', icon: <NotebookPen />, label: 'nav.reports' },
  { path: '/settings', icon: <Settings />, label: 'nav.settings' }
]
