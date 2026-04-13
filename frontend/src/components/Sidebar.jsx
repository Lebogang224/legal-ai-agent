import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout, getUser } from '../api'

const styles = {
  sidebar: {
    width: 240,
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    background: '#0F172A',
    borderRight: '1px solid #1E293B',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
  },
  logo: {
    padding: '20px 16px',
    borderBottom: '1px solid #1E293B',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#F8FAFC',
  },
  nav: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  navItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: active ? '#3B82F6' : '#94A3B8',
    background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
    transition: 'all 150ms',
    border: 'none',
    width: '100%',
    textAlign: 'left',
  }),
  userArea: {
    padding: '16px',
    borderTop: '1px solid #1E293B',
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#F8FAFC',
  },
  userRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 8,
    padding: '6px 12px',
    fontSize: 12,
    color: '#94A3B8',
    background: 'transparent',
    border: '1px solid #334155',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 150ms',
  },
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser()

  const navItems = [
    { path: '/documents', icon: '\u{1F4C4}', label: 'Documents' },
  ]

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>{'\u2696\uFE0F'}</span>
        <span style={styles.logoText}>Legal AI</span>
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => (
          <button
            key={item.path}
            style={styles.navItem(location.pathname.startsWith(item.path))}
            onClick={() => navigate(item.path)}
            onMouseEnter={(e) => {
              if (!location.pathname.startsWith(item.path))
                e.target.style.background = '#1E293B'
            }}
            onMouseLeave={(e) => {
              if (!location.pathname.startsWith(item.path))
                e.target.style.background = 'transparent'
            }}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div style={styles.userArea}>
        <div style={styles.userName}>{user?.name || 'User'}</div>
        <div style={styles.userRole}>{user?.role || 'user'}</div>
        <button
          style={styles.logoutBtn}
          onClick={logout}
          onMouseEnter={(e) => {
            e.target.style.color = '#EF4444'
            e.target.style.borderColor = '#EF4444'
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#94A3B8'
            e.target.style.borderColor = '#334155'
          }}
        >
          Log out
        </button>
      </div>
    </div>
  )
}
