import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDocument, askQuestion, getQueryHistory } from '../api'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 48px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottom: '1px solid #1E293B',
    marginBottom: 16,
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  docTitle: {
    fontSize: 18,
    fontWeight: 600,
  },
  docMeta: {
    fontSize: 13,
    color: '#64748B',
  },
  backBtn: {
    padding: '8px 16px',
    fontSize: 13,
    color: '#94A3B8',
    background: 'transparent',
    border: '1px solid #334155',
    borderRadius: 6,
    cursor: 'pointer',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingBottom: 16,
  },
  userMsg: {
    alignSelf: 'flex-end',
    maxWidth: '75%',
    background: 'rgba(59,130,246,0.15)',
    borderLeft: '3px solid #3B82F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    lineHeight: 1.6,
    color: '#F8FAFC',
  },
  aiMsg: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    background: '#1E293B',
    borderLeft: '3px solid #06B6D4',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    lineHeight: 1.6,
    color: '#E2E8F0',
  },
  aiFooter: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
  },
  sourcesContainer: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sourcesLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceCard: {
    background: '#334155',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 12,
  },
  sourceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sourcePage: {
    fontWeight: 600,
    color: '#F8FAFC',
  },
  sourceScore: (score) => ({
    fontWeight: 600,
    color: score > 0.8 ? '#22C55E' : score > 0.6 ? '#F59E0B' : '#EF4444',
  }),
  sourceContent: {
    color: '#94A3B8',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  inputBar: {
    display: 'flex',
    gap: 12,
    paddingTop: 16,
    borderTop: '1px solid #1E293B',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: 14,
    background: '#1E293B',
    border: '1px solid #334155',
    borderRadius: 8,
    color: '#F8FAFC',
    outline: 'none',
    transition: 'border-color 150ms',
  },
  sendBtn: (disabled) => ({
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 600,
    background: disabled ? '#334155' : '#3B82F6',
    color: disabled ? '#64748B' : '#FFF',
    border: 'none',
    borderRadius: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 150ms',
  }),
  typing: {
    alignSelf: 'flex-start',
    background: '#1E293B',
    borderLeft: '3px solid #06B6D4',
    borderRadius: 12,
    padding: '16px 20px',
    fontSize: 20,
    letterSpacing: 4,
    color: '#64748B',
  },
  welcome: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  welcomeIcon: {
    fontSize: 48,
  },
  welcomeText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  suggestion: {
    padding: '10px 20px',
    background: '#1E293B',
    border: '1px solid #334155',
    borderRadius: 8,
    color: '#94A3B8',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 150ms',
    textAlign: 'left',
    width: '100%',
    maxWidth: 500,
  },
  error: {
    alignSelf: 'flex-start',
    background: 'rgba(239,68,68,0.1)',
    borderLeft: '3px solid #EF4444',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#EF4444',
  },
}

const SUGGESTIONS = [
  'What are the key obligations of each party?',
  'Summarize the termination and exit clauses',
  'Are there any liability limitations or indemnities?',
]

export default function Chat() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    getDocument(documentId)
      .then(setDoc)
      .catch(() => navigate('/documents'))

    // Load history
    getQueryHistory(documentId).then((data) => {
      const history = data.queries.reverse().flatMap((q) => [
        { type: 'user', text: q.question },
        {
          type: 'ai',
          text: q.answer,
          sources: q.sources || [],
          time: q.response_time_ms,
          cached: q.from_cache,
        },
      ])
      setMessages(history)
    })
  }, [documentId, navigate])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleAsk(q) {
    const text = q || question.trim()
    if (!text || loading) return

    setQuestion('')
    setMessages((prev) => [...prev, { type: 'user', text }])
    setLoading(true)

    try {
      const result = await askQuestion(documentId, text)
      setMessages((prev) => [
        ...prev,
        {
          type: 'ai',
          text: result.answer,
          sources: result.sources,
          time: result.response_time_ms,
          cached: result.from_cache,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: 'error', text: err.message },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.docTitle}>
            {'\u{1F4AC}'} {doc?.filename || 'Loading...'}
          </div>
          <div style={styles.docMeta}>
            {doc?.page_count && `${doc.page_count} pages`}
            {doc?.chunk_count && ` \u00B7 ${doc.chunk_count} chunks`}
            {doc?.status && ` \u00B7 ${doc.status}`}
          </div>
        </div>
        <button style={styles.backBtn} onClick={() => navigate('/documents')}>
          {'\u2190'} Back
        </button>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 && !loading ? (
          <div style={styles.welcome}>
            <div style={styles.welcomeIcon}>{'\u2696\uFE0F'}</div>
            <div style={styles.welcomeText}>
              Document loaded and ready.<br />Ask me anything.
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 8 }}>
              Try one of these:
            </div>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                style={styles.suggestion}
                onClick={() => handleAsk(s)}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#3B82F6'
                  e.target.style.color = '#F8FAFC'
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#334155'
                  e.target.style.color = '#94A3B8'
                }}
              >
                "{s}"
              </button>
            ))}
          </div>
        ) : (
          messages.map((msg, i) => {
            if (msg.type === 'user') {
              return (
                <div key={i} style={styles.userMsg}>
                  {'\u{1F9D1}'} {msg.text}
                </div>
              )
            }
            if (msg.type === 'error') {
              return (
                <div key={i} style={styles.error}>
                  {msg.text}
                </div>
              )
            }
            return (
              <div key={i} style={styles.aiMsg}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {'\u2696\uFE0F'} {msg.text}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div style={styles.sourcesContainer}>
                    <div style={styles.sourcesLabel}>Sources</div>
                    {msg.sources.map((src, j) => (
                      <div key={j} style={styles.sourceCard}>
                        <div style={styles.sourceHeader}>
                          <span style={styles.sourcePage}>
                            {'\u{1F4C4}'} Page {src.page}
                          </span>
                          <span style={styles.sourceScore(src.relevance_score)}>
                            {Math.round(src.relevance_score * 100)}% match
                          </span>
                        </div>
                        <div style={styles.sourceContent}>
                          "{src.content}"
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={styles.aiFooter}>
                  {'\u23F1'} {msg.time ? `${(msg.time / 1000).toFixed(1)}s` : '?'}
                  {' \u00B7 '}
                  <span style={{ color: msg.cached ? '#22C55E' : '#06B6D4' }}>
                    {msg.cached ? 'from cache' : 'from LLM'}
                  </span>
                </div>
              </div>
            )
          })
        )}

        {loading && (
          <div style={styles.typing}>
            <style>{`
              @keyframes dot { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }
            `}</style>
            <span style={{ animation: 'dot 1.2s ease-in-out infinite' }}>{'\u25CF'}</span>
            {' '}
            <span style={{ animation: 'dot 1.2s ease-in-out 0.2s infinite' }}>{'\u25CF'}</span>
            {' '}
            <span style={{ animation: 'dot 1.2s ease-in-out 0.4s infinite' }}>{'\u25CF'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={styles.inputBar}>
        <input
          style={styles.input}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this document..."
          disabled={loading}
          onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
          onBlur={(e) => (e.target.style.borderColor = '#334155')}
        />
        <button
          style={styles.sendBtn(!question.trim() || loading)}
          onClick={() => handleAsk()}
          disabled={!question.trim() || loading}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
