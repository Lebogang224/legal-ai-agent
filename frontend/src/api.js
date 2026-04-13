const API_BASE = '/api'

function getToken() {
  return localStorage.getItem('legal_ai_token')
}

function getRefreshToken() {
  return localStorage.getItem('legal_ai_refresh')
}

function setTokens(access, refresh) {
  localStorage.setItem('legal_ai_token', access)
  if (refresh) localStorage.setItem('legal_ai_refresh', refresh)
}

function clearTokens() {
  localStorage.removeItem('legal_ai_token')
  localStorage.removeItem('legal_ai_refresh')
  localStorage.removeItem('legal_ai_user')
}

function getUser() {
  const raw = localStorage.getItem('legal_ai_user')
  return raw ? JSON.parse(raw) : null
}

function setUser(user) {
  localStorage.setItem('legal_ai_user', JSON.stringify(user))
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { ...options.headers }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(options.body)
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  // Auto-refresh on 401
  if (res.status === 401 && getRefreshToken()) {
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getRefreshToken()}` },
    })

    if (refreshRes.ok) {
      const data = await refreshRes.json()
      setTokens(data.access_token, null)
      headers['Authorization'] = `Bearer ${data.access_token}`
      res = await fetch(`${API_BASE}${path}`, { ...options, headers })
    } else {
      clearTokens()
      window.location.href = '/login'
      return
    }
  }

  return res
}

// --- Auth ---
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail?.message || 'Login failed')
  }
  const data = await res.json()
  setTokens(data.access_token, data.refresh_token)
  setUser(data.user)
  return data.user
}

export async function register(email, name, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail?.message || 'Registration failed')
  }
  return res.json()
}

export function logout() {
  clearTokens()
  window.location.href = '/login'
}

export { getUser, getToken }

// --- Documents ---
export async function uploadDocument(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await request('/documents/upload', { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail?.message || 'Upload failed')
  }
  return res.json()
}

export async function listDocuments(status = null, page = 1) {
  const params = new URLSearchParams({ page, limit: 20 })
  if (status) params.set('status', status)
  const res = await request(`/documents?${params}`)
  if (!res.ok) throw new Error('Failed to load documents')
  return res.json()
}

export async function getDocument(id) {
  const res = await request(`/documents/${id}`)
  if (!res.ok) throw new Error('Document not found')
  return res.json()
}

export async function deleteDocument(id) {
  const res = await request(`/documents/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete')
}

// --- Q&A ---
export async function askQuestion(documentId, question) {
  const res = await request('/qa/ask', {
    method: 'POST',
    body: { document_id: documentId, question },
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail?.message || 'Failed to get answer')
  }
  return res.json()
}

export async function getQueryHistory(documentId, page = 1) {
  const res = await request(`/qa/history/${documentId}?page=${page}&limit=50`)
  if (!res.ok) throw new Error('Failed to load history')
  return res.json()
}
