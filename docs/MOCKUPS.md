# Legal AI Agent — Mockup Document

**Project:** Legal Document Q&A Agent
**Author:** Lebogang Mphaga
**Date:** 2026-04-13
**Version:** 1.0

---

## 1. Design System

### 1.1 Color Palette

```
Background (primary):     #0F172A  (slate-900)
Background (secondary):   #1E293B  (slate-800)
Background (card):        #334155  (slate-700)
Border:                   #475569  (slate-600)
Text (primary):           #F8FAFC  (slate-50)
Text (secondary):         #94A3B8  (slate-400)
Text (muted):             #64748B  (slate-500)
Accent (primary):         #3B82F6  (blue-500)
Accent (hover):           #2563EB  (blue-600)
Accent (success):         #22C55E  (green-500)
Accent (warning):         #F59E0B  (amber-500)
Accent (danger):          #EF4444  (red-500)
Accent (info):            #06B6D4  (cyan-500)
```

### 1.2 Typography

```
Font family:    Inter, system-ui, sans-serif
Heading 1:      28px, 700 weight
Heading 2:      22px, 600 weight
Heading 3:      18px, 600 weight
Body:           14px, 400 weight
Small:          12px, 400 weight
Monospace:      JetBrains Mono, monospace (code/technical text)
```

### 1.3 Component Tokens

```
Border radius (buttons):   8px
Border radius (cards):     12px
Border radius (inputs):    8px
Border radius (modals):    16px
Spacing unit:              4px (multiples: 8, 12, 16, 24, 32, 48)
Shadow (card):             0 4px 6px rgba(0,0,0,0.3)
Shadow (modal):            0 8px 24px rgba(0,0,0,0.5)
Transition:                150ms ease
```

---

## 2. Screen Inventory

| # | Screen | Route | Auth Required |
|---|--------|-------|---------------|
| 1 | Login | `/login` | No |
| 2 | Register | `/register` | No |
| 3 | Documents (Library) | `/documents` | Yes |
| 4 | Chat (Q&A) | `/chat/:documentId` | Yes |
| 5 | History | `/history` | Yes |

---

## 3. Screen 1: Login

### 3.1 Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                          #0F172A background                          │
│                                                                      │
│                    ┌──────────────────────────┐                      │
│                    │                          │                      │
│                    │      ⚖️  Legal AI        │                      │
│                    │                          │                      │
│                    │  ┌──────────────────────┐│                      │
│                    │  │ Email                ││                      │
│                    │  │ user@example.com     ││                      │
│                    │  └──────────────────────┘│                      │
│                    │                          │                      │
│                    │  ┌──────────────────────┐│                      │
│                    │  │ Password             ││                      │
│                    │  │ ••••••••             ││                      │
│                    │  └──────────────────────┘│                      │
│                    │                          │                      │
│                    │  ┌──────────────────────┐│                      │
│                    │  │      Sign In         ││  blue-500 bg         │
│                    │  └──────────────────────┘│                      │
│                    │                          │                      │
│                    │  Don't have an account?  │                      │
│                    │  Register →              │  blue-500 text link  │
│                    │                          │                      │
│                    └──────────────────────────┘  slate-800 card      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Components

| Component | Type | Details |
|-----------|------|---------|
| Logo | Text + icon | "Legal AI" with scales icon, 28px, white |
| Email input | Text field | Placeholder: "user@example.com", auto-focus |
| Password input | Password field | Toggle visibility icon (eye) |
| Sign In button | Primary button | Full width, blue-500, hover: blue-600 |
| Register link | Text link | blue-500, navigates to `/register` |
| Error banner | Alert | Red background, appears above form on failure |

### 3.3 States

- **Default:** Empty form, Sign In button enabled
- **Loading:** Button shows spinner, inputs disabled
- **Error:** Red banner: "Invalid email or password"
- **Rate limited:** Red banner: "Too many attempts. Try again in X minutes."

### 3.4 User Flow

```
1. User enters email + password
2. Clicks "Sign In" (or presses Enter)
3. Loading state (spinner on button)
4. Success → redirect to /documents
   OR
   Error → show error banner, clear password field, refocus password
```

---

## 4. Screen 2: Register

### 4.1 Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    ┌──────────────────────────┐                      │
│                    │                          │                      │
│                    │      ⚖️  Legal AI        │                      │
│                    │      Create Account      │                      │
│                    │                          │                      │
│                    │  ┌──────────────────────┐│                      │
│                    │  │ Full Name            ││                      │
│                    │  └──────────────────────┘│                      │
│                    │                          │                      │
│                    │  ┌──────────────────────┐│                      │
│                    │  │ Email                ││                      │
│                    │  └──────────────────────┘│                      │
│                    │                          │                      │
│                    │  ┌──────────────────────┐│                      │
│                    │  │ Password             ││                      │
│                    │  └──────────────────────┘│                      │
│                    │                          │                      │
│                    │  ┌──────────────────────┐│                      │
│                    │  │ Confirm Password     ││                      │
│                    │  └──────────────────────┘│                      │
│                    │                          │                      │
│                    │  ┌──────────────────────┐│                      │
│                    │  │    Create Account    ││                      │
│                    │  └──────────────────────┘│                      │
│                    │                          │                      │
│                    │  Already have an account?│                      │
│                    │  Sign In →               │                      │
│                    │                          │                      │
│                    └──────────────────────────┘                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Validation (inline, real-time)

| Field | Rule | Error Message |
|-------|------|---------------|
| Name | 2-100 chars | "Name must be at least 2 characters" |
| Email | Valid format | "Please enter a valid email address" |
| Password | Min 8 chars | "Password must be at least 8 characters" |
| Confirm | Must match | "Passwords do not match" |

---

## 5. Screen 3: Documents (Library)

This is the main landing page after login. Shows all uploaded documents.

### 5.1 Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                                                             │
│  │          │  ┌────────────────────────────────────────────────────────┐  │
│  │  ⚖️      │  │  📄 My Documents                        [+ Upload]   │  │
│  │  Legal   │  ├────────────────────────────────────────────────────────┤  │
│  │  AI      │  │                                                        │  │
│  │          │  │  ┌─────────────────────────────────────────────────┐   │  │
│  ├──────────┤  │  │  📄 Employment Contract 2026.pdf                │   │  │
│  │          │  │  │  24 pages · 87 chunks · Uploaded Apr 13         │   │  │
│  │  📄 Docs │  │  │  ● Ready                        [Chat] [Delete]│   │  │
│  │          │  │  └─────────────────────────────────────────────────┘   │  │
│  │  💬 Chat │  │                                                        │  │
│  │          │  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  📜 Hist │  │  │  📄 NDA_Acme_Corp.pdf                          │   │  │
│  │          │  │  │  8 pages · 31 chunks · Uploaded Apr 12          │   │  │
│  │          │  │  │  ● Ready                        [Chat] [Delete]│   │  │
│  ├──────────┤  │  └─────────────────────────────────────────────────┘   │  │
│  │          │  │                                                        │  │
│  │  Lebo    │  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  user    │  │  │  📄 Lease_Agreement_Draft.pdf                   │   │  │
│  │  [Log    │  │  │  Processing...                                  │   │  │
│  │   out]   │  │  │  ◌ Processing              [—pulse animation—] │   │  │
│  │          │  │  └─────────────────────────────────────────────────┘   │  │
│  └──────────┘  │                                                        │  │
│    Sidebar     │  ┌─────────────────────────────────────────────────┐   │  │
│    240px       │  │  📄 Corrupted_Scan.pdf                          │   │  │
│                │  │  Failed: Could not extract text from PDF        │   │  │
│                │  │  ● Failed                       [Retry] [Delete]│   │  │
│                │  └─────────────────────────────────────────────────┘   │  │
│                │                                                        │  │
│                └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Upload Modal (triggered by [+ Upload] button)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Upload Document                    [X]  │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │     ┌────────────────────────────────────────────┐        │  │
│  │     │                                            │        │  │
│  │     │          📁 Drag & drop your PDF           │        │  │
│  │     │              or click to browse             │        │  │
│  │     │                                            │        │  │
│  │     │          Supports: PDF up to 50MB          │        │  │
│  │     │                                            │        │  │
│  │     └────────────────────────────────────────────┘        │  │
│  │         dashed border, slate-700 bg, hover: slate-600     │  │
│  │                                                            │  │
│  │     After file selected:                                   │  │
│  │     ┌────────────────────────────────────────────┐        │  │
│  │     │ 📄 contract.pdf              12.4 MB   [X] │        │  │
│  │     └────────────────────────────────────────────┘        │  │
│  │                                                            │  │
│  │     ┌──────────┐  ┌──────────┐                            │  │
│  │     │  Cancel  │  │  Upload  │                            │  │
│  │     └──────────┘  └──────────┘                            │  │
│  │      ghost btn     blue-500 btn                           │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│         dark overlay backdrop, click outside = close             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 Document Card States

| Status | Badge Color | Actions Available |
|--------|-------------|-------------------|
| Processing | amber-500, pulse animation | None (wait) |
| Ready | green-500, solid | Chat, Delete |
| Failed | red-500, solid | Retry, Delete |

### 5.4 User Flow

```
1. User clicks [+ Upload]
2. Modal opens with drag-and-drop zone
3. User drops PDF or clicks to browse
4. File name + size shown, Upload button activates
5. Click Upload → progress bar → modal closes
6. New document card appears at top with "Processing" status (pulse animation)
7. Card auto-updates to "Ready" when processing completes (poll every 3s)
8. User clicks [Chat] → navigates to /chat/:documentId
```

---

## 6. Screen 4: Chat (Q&A) — Main Feature

This is the core screen. User asks questions about a specific document.

### 6.1 Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                                                             │
│  │          │  ┌────────────────────────────────────────────────────────┐  │
│  │  ⚖️      │  │  💬 Employment Contract 2026.pdf         [← Back]    │  │
│  │  Legal   │  │  24 pages · 87 chunks · Ready                         │  │
│  │  AI      │  ├────────────────────────────────────────────────────────┤  │
│  │          │  │                                                        │  │
│  ├──────────┤  │  ┌────────────────────────────────────────────────┐    │  │
│  │          │  │  │ 🧑 What are the termination clauses?           │    │  │
│  │  📄 Docs │  │  └────────────────────────────────────────────────┘    │  │
│  │          │  │              user message — right aligned, blue-600 bg │  │
│  │  💬 Chat │  │                                                        │  │
│  │  (active)│  │  ┌────────────────────────────────────────────────┐    │  │
│  │          │  │  │ ⚖️ The contract contains three termination     │    │  │
│  │  📜 Hist │  │  │ clauses:                                       │    │  │
│  │          │  │  │                                                 │    │  │
│  │          │  │  │ 1. **Termination for convenience** — Either     │    │  │
│  │          │  │  │    party may terminate with 30 days written     │    │  │
│  │          │  │  │    notice (Section 8.1)                         │    │  │
│  │          │  │  │                                                 │    │  │
│  │          │  │  │ 2. **Termination for cause** — Upon material   │    │  │
│  │          │  │  │    breach with 15-day cure period (Section 8.2) │    │  │
│  │          │  │  │                                                 │    │  │
│  │          │  │  │ 3. **Immediate termination** — Upon insolvency │    │  │
│  │          │  │  │    of either party (Section 8.3)                │    │  │
│  │          │  │  │                                                 │    │  │
│  │          │  │  │ ┌─ Sources ──────────────────────────────────┐  │    │  │
│  │          │  │  │ │ 📄 Page 12 · 94% match                    │  │    │  │
│  │          │  │  │ │ "Either party may terminate this           │  │    │  │
│  │          │  │  │ │  Agreement for convenience upon thirty..." │  │    │  │
│  │          │  │  │ ├────────────────────────────────────────────┤  │    │  │
│  │          │  │  │ │ 📄 Page 13 · 91% match                    │  │    │  │
│  │          │  │  │ │ "In the event of a material breach by     │  │    │  │
│  │          │  │  │ │  either party, the non-breaching party..." │  │    │  │
│  │          │  │  │ └────────────────────────────────────────────┘  │    │  │
│  │          │  │  │                                                 │    │  │
│  │          │  │  │ ⏱ 2.3s · from LLM                              │    │  │
│  │          │  │  └────────────────────────────────────────────────┘    │  │
│  │          │  │        AI message — left aligned, slate-800 bg        │  │
│  │          │  │                                                        │  │
│  │          │  │  ┌────────────────────────────────────────────────┐    │  │
│  │          │  │  │ 🧑 Is there a non-compete clause?              │    │  │
│  │          │  │  └────────────────────────────────────────────────┘    │  │
│  │          │  │                                                        │  │
│  │          │  │  ┌────────────────────────────────────────────────┐    │  │
│  │          │  │  │ ⚖️ ● ● ●  (typing indicator)                  │    │  │
│  │          │  │  └────────────────────────────────────────────────┘    │  │
│  │          │  │                                                        │  │
│  ├──────────┤  ├────────────────────────────────────────────────────────┤  │
│  │  Lebo    │  │  ┌──────────────────────────────────────┐  ┌──────┐  │  │
│  │  [Logout]│  │  │ Ask a question about this document...│  │ Send │  │  │
│  └──────────┘  │  └──────────────────────────────────────┘  └──────┘  │  │
│                └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Chat Components

#### User Message Bubble

```
┌────────────────────────────────────────────────┐
│ 🧑 What are the termination clauses?           │
└────────────────────────────────────────────────┘
  - Aligned: right
  - Background: blue-600/20 (translucent blue)
  - Border-left: 3px solid blue-500
  - Border-radius: 12px
  - Padding: 16px
  - Max-width: 80%
```

#### AI Response Bubble

```
┌────────────────────────────────────────────────┐
│ ⚖️ Answer text with **markdown** support...    │
│                                                 │
│ ┌─ Sources ───────────────────────────────────┐ │
│ │ 📄 Page 12 · 94% match                     │ │
│ │ "Quoted source text..."                     │ │
│ ├─────────────────────────────────────────────┤ │
│ │ 📄 Page 13 · 91% match                     │ │
│ │ "Quoted source text..."                     │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ⏱ 2.3s · from LLM                              │
└────────────────────────────────────────────────┘
  - Aligned: left
  - Background: slate-800
  - Border-left: 3px solid cyan-500
  - Border-radius: 12px
  - Padding: 16px
  - Max-width: 80%
  - Answer: renders markdown (bold, lists, code)
  - Sources: collapsible section, default expanded
  - Footer: response time + cache indicator
```

#### Source Card (inside AI response)

```
┌─────────────────────────────────────────────────┐
│ 📄 Page 12 · Relevance: 94%      [▼ collapse]  │
│                                                  │
│ "Either party may terminate this Agreement for   │
│  convenience upon thirty (30) days prior written │
│  notice to the other party..."                   │
└─────────────────────────────────────────────────┘
  - Background: slate-700
  - Border-radius: 8px
  - Font: 12px, monospace for quoted text
  - Relevance: color-coded (green >80%, amber >60%, red <60%)
  - Clickable: could scroll to page in future version
```

#### Input Bar (bottom, sticky)

```
┌──────────────────────────────────────────┐  ┌────────┐
│ Ask a question about this document...    │  │  Send  │
└──────────────────────────────────────────┘  └────────┘
  - Full width minus Send button
  - Height: 48px, auto-expand to 120px max
  - Placeholder: "Ask a question about this document..."
  - Submit: Enter key or Send button
  - Shift+Enter: new line
  - Send button: blue-500, disabled when empty
  - Sticky to bottom of chat area
```

#### Typing Indicator

```
┌────────────────────────────────────────────────┐
│ ⚖️ ● ● ●                                       │
└────────────────────────────────────────────────┘
  - Three dots with staggered pulse animation
  - Same style as AI bubble (slate-800, cyan border)
  - Appears immediately on question submit
  - Replaced by actual response when ready
```

### 6.3 Chat States

| State | Behavior |
|-------|----------|
| Empty (first visit) | Show welcome message: "Upload complete. Ask me anything about this document." + 3 suggested questions |
| Waiting for response | Typing indicator, input disabled, Send button shows spinner |
| Cached response | Same as normal but footer says "⏱ 45ms · from cache" (green text) |
| Error | Red error bubble: "Failed to get answer. Please try again." with [Retry] button |
| Document not ready | Full-screen message: "This document is still processing. Please wait." |

### 6.4 Suggested Questions (empty state only)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ⚖️ Document loaded and ready. Ask me anything.                │
│                                                                │
│  Try one of these:                                             │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  "What are the key obligations of each party?"           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  "Summarize the termination and exit clauses"            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  "Are there any liability limitations or indemnities?"   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  Clickable — fills the input and auto-submits                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. Screen 5: Query History

### 7.1 Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                                                             │
│  │          │  ┌────────────────────────────────────────────────────────┐  │
│  │  ⚖️      │  │  📜 Query History                                     │  │
│  │  Legal   │  ├────────────────────────────────────────────────────────┤  │
│  │  AI      │  │                                                        │  │
│  │          │  │  Filter: [All Documents ▼]  [Last 7 days ▼]           │  │
│  ├──────────┤  │                                                        │  │
│  │          │  │  ┌────────────────────────────────────────────────┐    │  │
│  │  📄 Docs │  │  │ 📄 Employment Contract 2026.pdf                │    │  │
│  │          │  │  │                                                 │    │  │
│  │  💬 Chat │  │  │ Q: What are the termination clauses?           │    │  │
│  │          │  │  │ A: The contract contains three termination...  │    │  │
│  │  📜 Hist │  │  │ ⏱ 2.3s · LLM · Apr 13, 14:30                 │    │  │
│  │  (active)│  │  └────────────────────────────────────────────────┘    │  │
│  │          │  │                                                        │  │
│  │          │  │  ┌────────────────────────────────────────────────┐    │  │
│  │          │  │  │ 📄 Employment Contract 2026.pdf                │    │  │
│  │          │  │  │                                                 │    │  │
│  │          │  │  │ Q: Is there a non-compete clause?              │    │  │
│  │          │  │  │ A: Yes, Section 12.3 contains a non-compete...│    │  │
│  │          │  │  │ ⏱ 180ms · cached · Apr 13, 14:32              │    │  │
│  │          │  │  └────────────────────────────────────────────────┘    │  │
│  │          │  │                                                        │  │
│  │          │  │  ┌────────────────────────────────────────────────┐    │  │
│  │          │  │  │ 📄 NDA_Acme_Corp.pdf                           │    │  │
│  │          │  │  │                                                 │    │  │
│  │          │  │  │ Q: What information is considered confidential?│    │  │
│  │          │  │  │ A: According to Section 2, confidential...     │    │  │
│  │          │  │  │ ⏱ 3.1s · LLM · Apr 12, 09:15                 │    │  │
│  │          │  │  └────────────────────────────────────────────────┘    │  │
│  │          │  │                                                        │  │
│  │          │  │  ── Showing 3 of 12 ── [Load More]                    │  │
│  │          │  │                                                        │  │
│  └──────────┘  └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 History Card

```
┌────────────────────────────────────────────────────┐
│ 📄 Employment Contract 2026.pdf                     │
│                                                     │
│ Q: What are the termination clauses?                │  slate-50 text
│ A: The contract contains three termination          │  slate-400 text
│    clauses: (1) Termination for convenience...      │  truncated 2 lines
│                                                     │
│ ⏱ 2.3s · from LLM · Apr 13, 14:30                 │  slate-500 text
└────────────────────────────────────────────────────┘
  - Background: slate-800
  - Border-radius: 12px
  - Hover: slate-700 (clickable — opens full Q&A in chat view)
  - Answer truncated to 2 lines with "..." overflow
  - Cache indicator: "from LLM" (cyan) or "from cache" (green)
```

---

## 8. Sidebar (Shared Component)

```
┌──────────────┐
│              │
│  ⚖️ Legal AI  │  Logo area — 64px height
│              │
├──────────────┤
│              │
│  📄 Documents│  Nav item — active: blue-500 bg/10, blue-500 text
│              │             inactive: slate-400 text
│  💬 Chat     │             hover: slate-700 bg
│              │
│  📜 History  │  Icon + label, 14px
│              │
│              │
│              │
│              │
├──────────────┤
│              │
│  👤 Lebogang │  User area — 64px height
│  user        │  Role badge
│  [Logout]    │  Logout: ghost button, red on hover
│              │
└──────────────┘

Width: 240px (desktop)
Collapsed: icon-only 64px (< 900px viewport)
Hidden: hamburger menu (< 640px viewport)
Background: slate-900
Border-right: 1px solid slate-700
```

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Desktop | > 1024px | Full sidebar (240px) + content area |
| Tablet | 640-1024px | Collapsed sidebar (64px, icons only) + content |
| Mobile | < 640px | No sidebar, hamburger menu top-left, full-width content |

### Mobile Chat View

```
┌────────────────────────────────┐
│ ☰  Employment Contract  [←]   │  48px top bar
├────────────────────────────────┤
│                                │
│  🧑 What are the termination  │  Messages take full width
│     clauses?                   │  Max-width: 90% (instead of 80%)
│                                │
│  ⚖️ The contract contains...   │
│                                │
│  ┌─ Sources ────────────────┐  │  Sources collapsed by default
│  │ 3 sources [▶ expand]     │  │  on mobile (tap to expand)
│  └──────────────────────────┘  │
│                                │
├────────────────────────────────┤
│ ┌────────────────────┐ [Send] │  Input bar, sticky bottom
│ │ Ask a question...  │        │
│ └────────────────────┘        │
└────────────────────────────────┘
```

---

## 10. Loading & Empty States

### 10.1 Document Library — Empty

```
┌────────────────────────────────────────────────┐
│                                                │
│            📄                                   │
│            No documents yet                    │
│                                                │
│   Upload your first legal document to get      │
│   started. We support PDF files up to 50MB.    │
│                                                │
│          ┌──────────────────┐                  │
│          │   + Upload PDF   │                  │
│          └──────────────────┘                  │
│                                                │
└────────────────────────────────────────────────┘
```

### 10.2 Document Card — Skeleton Loading

```
┌────────────────────────────────────────────────┐
│  ████████████████████████████  (shimmer)        │
│  ████████████  ██████  ████████████             │
│  ████████                       ████  ████     │
└────────────────────────────────────────────────┘
  - Slate-700 blocks with left-to-right shimmer animation
  - Shown while document list is loading
```

### 10.3 Chat — Thinking Skeleton

```
┌────────────────────────────────────────────────┐
│ ⚖️                                              │
│ ████████████████████████████████████  (shimmer) │
│ ████████████████████████                        │
│ ██████████████████████████████                  │
└────────────────────────────────────────────────┘
  - Same shimmer animation
  - Shows while waiting for LLM response (alongside typing indicator)
```

---

## 11. Animations & Microinteractions

| Element | Animation | Duration |
|---------|-----------|----------|
| Page transitions | Fade in + slide up 8px | 200ms ease-out |
| Modal open | Fade in backdrop + scale card from 95% to 100% | 200ms ease-out |
| Modal close | Fade out + scale to 95% | 150ms ease-in |
| Toast notification | Slide in from top-right | 300ms ease-out |
| Toast dismiss | Fade out + slide right | 200ms ease-in |
| Document status change | Badge color crossfade | 300ms |
| Processing pulse | Badge opacity 0.5 ↔ 1.0 | 1.5s infinite |
| Skeleton shimmer | Background gradient sweep left-to-right | 1.5s infinite |
| Chat message appear | Fade in + slide up 4px | 150ms ease-out |
| Typing indicator dots | Staggered opacity pulse (0.3 → 1.0) | 1.2s infinite, 200ms stagger |
| Send button | Scale 95% on press, 100% on release | 100ms |
| Source card expand | Height auto with 200ms transition | 200ms ease |
| Sidebar collapse | Width 240px → 64px | 200ms ease |

---

## 12. User Flow Summary

```
                    ┌─────────┐
                    │  Login  │
                    └────┬────┘
                         │
                    ┌────▼────┐
              ┌─────│Documents│─────┐
              │     └────┬────┘     │
              │          │          │
         ┌────▼───┐ ┌────▼────┐    │
         │ Upload │ │  Chat   │    │
         │ Modal  │ │  (Q&A)  │    │
         └────┬───┘ └────┬────┘    │
              │          │         │
              │     ┌────▼────┐    │
              └─────│ History │────┘
                    └─────────┘

Primary flow:  Login → Documents → Upload → Chat → Ask questions
Secondary flow: History → Review past queries → Click to reopen chat
```

---

*Next step: Implementation — Brick 1: Project skeleton + FastAPI app*
