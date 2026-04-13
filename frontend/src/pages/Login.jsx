import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api'

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0F172A',
  },
  card: {
    width: 400,
    background: '#1E293B',
    borderRadius: 16,
    padding: '40px 32px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 36,
    display: 'block',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 700,
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: '#94A3B8',
    marginBottom: 4,
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    background: '#0F172A',
    border: '1px solid #334155',
    borderRadius: 8,
    color: '#F8FAFC',
    outline: 'none',
    transition: 'border-color 150ms',
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: 14,
    fontWeight: 600,
    background: '#3B82F6',
    color: '#FFF',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background 150ms',
    marginTop: 8,
  },
  error: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#EF4444',
  },
  toggle: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
    color: '#64748B',
  },
  link: {
    color: '#3B82F6',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: 13,
    fontWeight: 500,
  },
}

export default function Login() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (isRegister && password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      if (isRegister) {
        await register(email, name, password)
        // Auto-login after register
        await login(email, password)
      } else {
        await login(email, password)
      }
      navigate('/documents')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>{'\u2696\uFE0F'}</span>
          <div style={styles.logoText}>Legal AI</div>
          <div style={styles.subtitle}>
            {isRegister ? 'Create your account' : 'Sign in to continue'}
          </div>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}

          {isRegister && (
            <div>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lebogang Mphaga"
                required
                onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                onBlur={(e) => (e.target.style.borderColor = '#334155')}
              />
            </div>
          )}

          <div>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              autoFocus
              onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
              onBlur={(e) => (e.target.style.borderColor = '#334155')}
            />
          </div>

          <div>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={'\u2022'.repeat(8)}
              required
              minLength={8}
              onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
              onBlur={(e) => (e.target.style.borderColor = '#334155')}
            />
          </div>

          {isRegister && (
            <div>
              <label style={styles.label}>Confirm Password</label>
              <input
                style={styles.input}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={'\u2022'.repeat(8)}
                required
                onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                onBlur={(e) => (e.target.style.borderColor = '#334155')}
              />
            </div>
          )}

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={styles.toggle}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button
            style={styles.link}
            onClick={() => {
              setIsRegister(!isRegister)
              setError('')
            }}
          >
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  )
}
