import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { listDocuments, uploadDocument, deleteDocument } from '../api'

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
  },
  uploadBtn: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    background: '#3B82F6',
    color: '#FFF',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background 150ms',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    background: '#1E293B',
    borderRadius: 12,
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background 150ms',
  },
  cardLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  filename: {
    fontSize: 16,
    fontWeight: 600,
    color: '#F8FAFC',
  },
  meta: {
    fontSize: 13,
    color: '#64748B',
  },
  badge: (status) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    background:
      status === 'ready' ? 'rgba(34,197,94,0.15)' :
      status === 'processing' ? 'rgba(245,158,11,0.15)' :
      'rgba(239,68,68,0.15)',
    color:
      status === 'ready' ? '#22C55E' :
      status === 'processing' ? '#F59E0B' :
      '#EF4444',
  }),
  actions: {
    display: 'flex',
    gap: 8,
  },
  chatBtn: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    background: 'rgba(59,130,246,0.15)',
    color: '#3B82F6',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  deleteBtn: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    background: 'rgba(239,68,68,0.1)',
    color: '#EF4444',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  // Upload modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    background: '#1E293B',
    borderRadius: 16,
    padding: 32,
    width: 480,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 20,
  },
  dropzone: (dragging) => ({
    border: `2px dashed ${dragging ? '#3B82F6' : '#475569'}`,
    borderRadius: 12,
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    background: dragging ? 'rgba(59,130,246,0.05)' : '#0F172A',
    transition: 'all 200ms',
  }),
  dropText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  dropHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  filePreview: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#0F172A',
    borderRadius: 8,
    padding: '12px 16px',
    marginTop: 16,
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    padding: '10px 20px',
    fontSize: 14,
    background: 'transparent',
    color: '#94A3B8',
    border: '1px solid #334155',
    borderRadius: 8,
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#64748B',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  processing: {
    animation: 'pulse 1.5s ease-in-out infinite',
  },
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function Documents() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await listDocuments()
      setDocs(data.documents)
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // Poll for processing docs
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [load])

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    try {
      await uploadDocument(selectedFile)
      setShowUpload(false)
      setSelectedFile(null)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this document? This cannot be undone.')) return
    try {
      await deleteDocument(id)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    }
  }

  function handleFileSelect(e) {
    setSelectedFile(e.target.files[0])
  }

  return (
    <div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>

      <div style={styles.header}>
        <h1 style={styles.title}>{'\u{1F4C4}'} My Documents</h1>
        <button
          style={styles.uploadBtn}
          onClick={() => setShowUpload(true)}
          onMouseEnter={(e) => (e.target.style.background = '#2563EB')}
          onMouseLeave={(e) => (e.target.style.background = '#3B82F6')}
        >
          + Upload
        </button>
      </div>

      {loading ? (
        <div style={styles.empty}>Loading...</div>
      ) : docs.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>{'\u{1F4C4}'}</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#94A3B8', marginBottom: 8 }}>
            No documents yet
          </div>
          <div>Upload your first legal document to get started.</div>
          <button
            style={{ ...styles.uploadBtn, marginTop: 20 }}
            onClick={() => setShowUpload(true)}
          >
            + Upload PDF
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {docs.map((doc) => (
            <div
              key={doc.id}
              style={styles.card}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#243044')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#1E293B')}
            >
              <div style={styles.cardLeft}>
                <div style={styles.filename}>{'\u{1F4C4}'} {doc.filename}</div>
                <div style={styles.meta}>
                  {doc.page_count ? `${doc.page_count} pages` : ''}
                  {doc.chunk_count ? ` \u00B7 ${doc.chunk_count} chunks` : ''}
                  {' \u00B7 '}{formatSize(doc.file_size_bytes)}
                  {' \u00B7 '}{formatDate(doc.uploaded_at)}
                </div>
                <div>
                  <span
                    style={{
                      ...styles.badge(doc.status),
                      ...(doc.status === 'processing' ? styles.processing : {}),
                    }}
                  >
                    {doc.status === 'ready' ? '\u25CF Ready' :
                     doc.status === 'processing' ? '\u25CB Processing...' :
                     '\u25CF Failed'}
                  </span>
                </div>
              </div>
              <div style={styles.actions}>
                {doc.status === 'ready' && (
                  <button
                    style={styles.chatBtn}
                    onClick={() => navigate(`/chat/${doc.id}`)}
                  >
                    Chat
                  </button>
                )}
                <button
                  style={styles.deleteBtn}
                  onClick={() => handleDelete(doc.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div style={styles.overlay} onClick={() => { setShowUpload(false); setSelectedFile(null) }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Upload Document</div>

            <div
              style={styles.dropzone(dragging)}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <div style={{ fontSize: 32 }}>{'\u{1F4C1}'}</div>
              <div style={styles.dropText}>Drag & drop your PDF or click to browse</div>
              <div style={styles.dropHint}>Supports: PDF up to 50MB</div>
              <input
                id="file-input"
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>

            {selectedFile && (
              <div style={styles.filePreview}>
                <span style={{ fontSize: 14, color: '#F8FAFC' }}>
                  {'\u{1F4C4}'} {selectedFile.name}
                </span>
                <span style={{ fontSize: 13, color: '#64748B' }}>
                  {formatSize(selectedFile.size)}
                </span>
              </div>
            )}

            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => { setShowUpload(false); setSelectedFile(null) }}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.uploadBtn,
                  opacity: !selectedFile || uploading ? 0.5 : 1,
                }}
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
