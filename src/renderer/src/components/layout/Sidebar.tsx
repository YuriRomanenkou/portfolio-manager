import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Wallet, BarChart3, Lightbulb, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Обзор' },
  { to: '/assets', icon: Wallet, label: 'Активы' },
  { to: '/analytics', icon: BarChart3, label: 'Аналитика' },
  { to: '/recommendations', icon: Lightbulb, label: 'Рекомендации' },
  { to: '/settings', icon: Settings, label: 'Настройки' }
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">Portfolio Manager</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-item${isActive ? ' active' : ''}`
            }
            end={item.to === '/'}
          >
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
