# DARVIS — DiAn Raha Vision v2.0
# Dokumentasi Teknis Lengkap untuk Reimplementasi

---

## 1. OVERVIEW

DARVIS adalah AI-powered thinking framework distributor. Bukan personal branding tool, bukan AI clone. Filosofi inti: **mendistribusikan framework berpikir**, bukan figur. Satu engine berpikir dengan beberapa presentation layer.

**Tujuan**: AI companion untuk strategic thinking, decision-making, dan personal development dengan multi-persona approach.

---

## 2. ARSITEKTUR SISTEM

### 2.1 Stack Teknologi
| Layer | Teknologi |
|-------|-----------|
| Frontend | React + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Express.js (Node.js) |
| Database | PostgreSQL (bisa diganti SQLite via better-sqlite3) |
| AI Provider | OpenAI (primary), Google Gemini (fallback), Ollama (last resort) |
| Realtime | Server-Sent Events (SSE) untuk streaming |
| Session | express-session dengan unique session ID per browser/device |
| PWA | manifest.json + service worker untuk installability |

### 2.2 Arsitektur High-Level
```
[Browser/PWA] ←SSE→ [Express.js Backend] ←API→ [OpenAI/Gemini/Ollama]
                            ↕
                      [PostgreSQL DB]
                            ↕
                    [Proactive System]
                    (Cron-like scheduler)
```

---

## 3. DATABASE SCHEMA

### 3.1 conversations
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'mas_dr',
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  room_id INTEGER,                    -- NULL = lobby, integer = room
  created_at TEXT NOT NULL DEFAULT (NOW()::TEXT)
);
```

### 3.2 summaries
```sql
CREATE TABLE summaries (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (NOW()::TEXT)
);
```

### 3.3 learned_preferences
Auto-learn system menyimpan preferensi user.
```sql
CREATE TABLE learned_preferences (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,            -- 12 kategori (lihat section Auto-Learn)
  insight TEXT NOT NULL,
  confidence DOUBLE PRECISION DEFAULT 0.7,
  source_summary TEXT,
  created_at TEXT, updated_at TEXT
);
```

### 3.4 persona_feedback
Passive listening — feedback user terhadap persona.
```sql
CREATE TABLE persona_feedback (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  target TEXT NOT NULL CHECK(target IN ('dr', 'broto', 'rara', 'rere')),
  feedback TEXT NOT NULL,
  sentiment TEXT DEFAULT 'neutral' CHECK(sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  confidence DOUBLE PRECISION DEFAULT 0.7,
  source_context TEXT,
  created_at TEXT
);
```

### 3.5 profile_enrichments
Fakta tentang DR yang di-extract dari percakapan.
```sql
CREATE TABLE profile_enrichments (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  fact TEXT NOT NULL,
  confidence DOUBLE PRECISION DEFAULT 0.8,
  source_quote TEXT,
  created_at TEXT
);
```

**Kategori enrichment**: `persepsi_orang`, `tokoh_idola`, `film_favorit`, `prinsip_spiritual`, `karakter_personal`, `gaya_leadership`, `pengalaman_kunci`, `relasi_penting`, `kebiasaan`, `preferensi_kerja`, `pandangan_kontroversial`, `goal_jangka_panjang`, `contributor_shared`

### 3.6 conversation_tags
Silent tagging — metadata percakapan.
```sql
CREATE TABLE conversation_tags (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  context_mode TEXT DEFAULT 'general',
  decision_type TEXT,
  emotional_tone TEXT,
  nodes_active TEXT,
  strategic_escalation INTEGER DEFAULT 0,
  fast_decision INTEGER DEFAULT 0,
  multi_persona INTEGER DEFAULT 0,
  user_message_preview TEXT,
  created_at TEXT
);
```

### 3.7 team_members
People database dengan persona profiling.
```sql
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT,
  strengths TEXT, weaknesses TEXT,
  responsibilities TEXT, active_projects TEXT,
  notes TEXT,
  aliases TEXT,                       -- comma-separated (e.g., "Tailo, Ko Nelson")
  category TEXT DEFAULT 'team' CHECK(category IN ('team', 'direksi', 'family', 'external', 'management')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  work_style TEXT,                    -- persona profiling
  communication_style TEXT,
  triggers TEXT,
  commitments TEXT,
  personality_notes TEXT,
  created_at TEXT, updated_at TEXT
);
```

### 3.8 meetings
```sql
CREATE TABLE meetings (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date_time TEXT,                     -- format: "YYYY-MM-DD HH:MM" (WIB)
  participants TEXT,
  agenda TEXT,
  status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
  summary TEXT, decisions TEXT,
  notify BOOLEAN DEFAULT false,       -- true = user minta diingatkan
  created_at TEXT, updated_at TEXT
);
```

### 3.9 action_items
```sql
CREATE TABLE action_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  assignee TEXT,
  deadline TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  source TEXT, meeting_id INTEGER,
  notes TEXT,
  created_at TEXT, updated_at TEXT, completed_at TEXT,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id)
);
```

### 3.10 projects
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT, pic TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  milestones TEXT, deadline TEXT,
  progress INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT, updated_at TEXT
);
```

### 3.11 notifications
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,                 -- 'meeting_reminder', 'overdue_alert', 'daily_briefing', 'insight', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,                          -- JSON string untuk metadata
  read INTEGER DEFAULT 0,
  created_at TEXT
);
```

### 3.12 chat_rooms
```sql
CREATE TABLE chat_rooms (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT DEFAULT 'Obrolan Baru',
  created_at TEXT, updated_at TEXT
);
```

### 3.13 app_settings, push_subscriptions
```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TEXT
);
```

---

## 4. PRESENTATION MODE ARCHITECTURE

### 4.1 Tiga Mode
| Mode | Akses | Karakteristik |
|------|-------|---------------|
| **Mirror** | Owner (password) | Multi-persona cards, akrab-gaul, referensi DR, akses secretary + enrichment + rooms |
| **Twin** | Default (semua user) | Unified voice, tanpa persona label, tanpa referensi DR, framework-first |
| **Contributor** | Password khusus | Unified voice, DARVIS tahu user kenal DR, auto-extract enrichment ke shared pool |

### 4.2 Server-Side Transformation
- `mergePersonasToUnifiedVoice(reply)` — menghapus persona labels (Broto:, Rara:, Rere:, DR:) dan menggabungkan jadi satu narasi
- `redactOwnerIdentity(text)` — menghapus referensi "mas DR", "DR", dll dari output Twin/Contributor mode

### 4.3 Login Flow
- Satu field password
- Password cocok OWNER_PASSWORD → Mirror Mode
- Password cocok CONTRIBUTOR_PASSWORD → Contributor Mode
- Salah → tetap Twin Mode + error message

### 4.4 Contributor Self-Profile
Setelah login contributor:
1. DARVIS tanya nama contributor
2. Nama dicocokkan ke `team_members` (cek nama + aliases)
3. Jika match → session simpan `contributorTeamMemberId` + `contributorTeamMemberName`
4. DARVIS jadi natural interviewer, extract persona data (work_style, communication_style, triggers, commitments, personality_notes)
5. Dual extraction: DR enrichment + self persona ke team_members

---

## 5. AI MODEL ROUTING & FALLBACK

### 5.1 Model Selection (Primary)
```
if (intent = strategic/complex/risk/audit/compliance) → GPT-5
else (casual/general) → GPT-4o-mini
```

Background tasks (auto-learn, extraction, room detection) → selalu GPT-4o-mini.

### 5.2 Fallback Chain
```
GPT-5 → (fail) → GPT-4o → (fail) → GPT-4o-mini → (fail/quota) → Gemini 2.5 Flash → (fail) → Ollama
```

Trigger fallback:
- HTTP 429 (rate limit) → retry setelah 2 detik
- HTTP 402/403 + "quota"/"billing"/"insufficient" → quota habis, pindah provider
- HTTP 404 / model_not_found → model error, pindah model

### 5.3 Gemini Integration
- Library: `@google/generative-ai`
- Model: `gemini-2.5-flash`
- Convert OpenAI message format ke Gemini format:
  - `system` → `systemInstruction` (string)
  - `assistant` → `model` role
  - `user` → `user` role
  - Image content → `inlineData` (base64)
- Streaming via `sendMessageStream()`

### 5.4 Ollama Integration
- Ollama expose OpenAI-compatible API di `/v1`
- Pakai library `openai` dengan custom `baseURL`
- Env vars: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_MS`

---

## 6. SYSTEM PROMPT ARCHITECTURE

### 6.1 Core Prompt
File: `prompts/DARVIS_CORE.md`

Isi utama:
- **Aturan panjang jawaban**: Default 1-3 kalimat. List max 5 poin hanya kalau diminta.
- **Identitas**: Framework distributor, bukan AI clone
- **Mode respons**: Mirror (akrab-gaul), Twin (santai-hangat), Contributor (penasaran)
- **Deteksi emosi**: CAPSLOCK/kasar → acknowledge dulu
- **Decision Fast Mode**: "quick"/"ringkas" → 3 poin + 1 risiko + 1 blind spot + 1 aksi
- **Anti Echo-Chamber**: High-stakes → wajib 1 counter-angle
- **Hard Rules**: Tidak karang data, tidak prediksi pasti, challenge kalau perlu

### 6.2 Profile Foundation
File: `prompts/DARVIS_PROFILE_DR.md`

Berisi profil lengkap DR: identitas, tokoh idola, gaya berpikir, struktur tim BD, direksi 5 PT, management, keluarga.

### 6.3 Node System
Modular context injected berdasarkan intent detection:

| Node | File | Fungsi |
|------|------|--------|
| NODE_BIAS | `DARVIS_NODE_BIAS.md` | Perilaku & psikologi pengambilan keputusan |
| NODE_RISK_GUARD | `DARVIS_NODE_RISK_GUARD.md` | Edukasi risiko & mitigasi |
| NODE_NM | `DARVIS_NODE_NM.md` | Market intelligence & data |
| NODE_AiSG | `DARVIS_NODE_AiSG.md` | Audit intelligence & governance |
| NODE_COMPLIANCE | `DARVIS_NODE_COMPLIANCE.md` | Kepatuhan & risiko operasional |
| NODE_SOLIDGROUP | `DARVIS_NODE_SolidGroup.md` | Identitas & trust publik |
| NODE_RESOURCES | `DARVIS_NODE_RESOURCES.md` | Sumber belajar & referensi |
| NODE_TEAM | (dynamic) | Data team members dari DB |
| NODE_MEETING | (dynamic) | Data meetings dari DB |
| NODE_PROJECTS | (dynamic) | Data projects dari DB |

**Priority**: NODE_BIAS > NODE_RISK_GUARD > NODE_NM > other nodes

### 6.4 Context Mode Engine
Auto-detect dari keyword patterns:
| Mode | Trigger | Efek |
|------|---------|------|
| STRATEGIC | strategi, investasi, ekspansi, risiko besar | Framing strategic layer di system prompt |
| TACTICAL | operasional, eksekusi, timeline, deadline | Framing tactical |
| REFLECTION | curhat, refleksi, bingung, galau | Framing empatik |
| CRISIS | darurat, urgent, masalah besar | Framing crisis management |
| GENERAL | default | No special framing |

---

## 7. FITUR-FITUR UTAMA

### 7.1 Chat Streaming (SSE)
**Endpoint**: `POST /api/chat`

**Request Body**:
```json
{
  "message": "string",
  "roomId": "number | null",
  "images": ["base64_string"],
  "fileContent": "string | null",
  "fileName": "string | null"
}
```

**SSE Response Format**:
```
data: {"type": "chunk", "content": "partial text"}
data: {"type": "chunk", "content": "more text"}
data: {"type": "done", "nodeUsed": "NODE_BIAS", "contextMode": "strategic", "presentationMode": "mirror", "fullReply": "complete text", "roomAction": {...}}
```

**Error SSE**:
```
data: {"type": "error", "message": "Kuota API habis.", "retryable": false}
```

**Heartbeat** (setiap 15 detik):
```
data: {"type": "heartbeat"}
```

### 7.2 Auto-Learn System
- Trigger: setiap 10 pesan
- Pakai GPT-4o-mini untuk extract preferensi
- 12 kategori: `gaya_komunikasi`, `topik_minat`, `preferensi_format`, `gaya_keputusan`, `pola_emosi`, `referensi_tokoh`, `prinsip_value`, `blind_spots`, `gaya_leadership`, `hobi_lifestyle`, `kebiasaan_kerja`, `spiritual_religius`
- Disimpan di `learned_preferences` table
- Diinject ke system prompt (max preference sesuai Memory Governor)

### 7.3 Profile Enrichment System
- Auto-detect saat DR cerita tentang dirinya (Mirror Mode)
- Extract via GPT-4o-mini → simpan di `profile_enrichments`
- Kategori enrichment (lihat section 3.5)
- Contributor mode: enrichment disimpan dengan kategori `contributor_shared`
- Owner prompt pulls from both own enrichments + contributor pool

### 7.4 Passive Listening System
- Detect feedback user terhadap persona (Broto, Rara, Rere, DR)
- Simpan di `persona_feedback` dengan sentiment analysis
- Top feedback diinject ke system prompt

### 7.5 Secretary System (Mirror Mode Only)

#### 7.5.1 Auto-Extraction
Dari percakapan natural, GPT extract:
- **Team profiles** (nama, posisi, alias, kategori)
- **Meetings** (judul, tanggal/jam, peserta, agenda)
- **Action items** (judul, assignee, deadline, priority)
- **Projects** (nama, deskripsi, PIC, status, milestone)
- **Team persona** (work_style, communication_style, triggers, commitments, personality_notes)

#### 7.5.2 People Database
- 31 orang pre-seeded: BD team (14), direksi 5 PT (10), management (3), family (3)
- Alias resolution: `getTeamMemberByNameOrAlias()` cek nama + comma-separated aliases
- Auto-detect nama baru di Mirror Mode → DARVIS tanya "Siapa [nama]?" → simpan
- Zero tolerance tanya ulang orang yang sudah dikenal

#### 7.5.3 Notification Rules
**PRINSIP: "dicatat ≠ dinotifkan"**
- Semua data auto-extracted dan disimpan ke database
- Notifikasi HANYA dibuat kalau user EKSPLISIT minta diingatkan
- Keyword trigger notify: "ingetin", "jangan lupa", "remind", "sapa", "catat jam X"
- Meeting yang di-extract harus punya `notify: true` untuk trigger reminder
- Field `notify` di tabel meetings menentukan apakah reminder dibuat

#### 7.5.4 Proactive Notifications
Sistem background (interval 5 menit):
- **Meeting reminders**: 30 menit sebelum meeting (hanya `notify=true`)
- **Auto-Reminder on Extraction**: Meeting dalam 35 menit → immediate reminder
- **Overdue alerts**: Action items yang lewat deadline
- **Project deadlines**: 3 hari sebelum deadline
- **Daily briefing**: Jam 6-9 pagi WIB (sekali sehari)
- **DARVIS insights**: Max 2-3x/hari

#### 7.5.5 Notification Cleanup
- Meeting reminders > 1 jam → auto-delete
- Read notifications (non-insight) > 2 jam → auto-delete
- Cleanup setiap 5 menit

### 7.6 Conversation Rooms (Owner Only)

#### 7.6.1 Konsep
- **Lobby**: Free-chat area (messages tanpa room_id)
- **Room**: Topik-spesifik (messages dengan room_id)
- **Global brain**: Preferences, enrichments, feedback, secretary data SHARED across semua room

#### 7.6.2 Auto-Room Management
GPT-powered `detectRoomAction()`:
- Analisis lobby messages vs existing room summaries
- Actions: `stay_lobby` (casual), `move_to_existing` (match room), `create_new` (topik substantif baru)
- Berjalan PARALLEL dengan chat completion (tidak tambah latency)
- Frontend auto-switch room dengan toast notification

#### 7.6.3 Room Operations
- Create, rename, delete room
- **Merge rooms**: Select 2+ rooms, first selected = target, semua messages dipindah atomically
- Auto-summary per room
- Lobby clear hanya hapus messages tanpa room_id (room messages aman)

### 7.7 Voice Features
- **Voice Input**: Web Speech API (browser) → speech-to-text
- **Voice Conversation Mode**: VAD (2.5s silence auto-send) → TTS auto-play → conversation loop
- **Per-message TTS**: Hover speaker icon → OpenAI TTS API
- **Voice selector**: 9 OpenAI voices (alloy, echo, fable, onyx, nova, shimmer, ash, ballad, coral)

### 7.8 Image Upload & Analysis
- Multi-image support
- Images di-convert ke base64
- Dikirim sebagai `image_url` content part ke OpenAI Vision API

### 7.9 File Upload & Processing
- Supported: PDF, DOCX, XLSX, TXT, CSV, MD
- PDF → `pdf-parse`
- DOCX → `mammoth`
- XLSX → `xlsx`
- Content di-extract dan dikirim sebagai konteks tambahan

### 7.10 Download Conversation
- Format: Markdown + PDF
- Professional report header/footer
- Export semua pesan dalam room/lobby aktif

---

## 8. API ENDPOINTS

### 8.1 Authentication
| Method | Path | Fungsi |
|--------|------|--------|
| POST | `/api/login` | Login (password → mode) |
| POST | `/api/logout` | Logout |
| GET | `/api/session-info` | Info session (isOwner, isContributor, mode) |
| POST | `/api/change-password` | Ganti password owner/contributor |

### 8.2 Chat
| Method | Path | Fungsi |
|--------|------|--------|
| POST | `/api/chat` | Send message (SSE streaming) |
| GET | `/api/history?roomId=X` | Get chat history (lobby jika tanpa roomId) |
| POST | `/api/clear` | Clear chat (lobby atau room) |

### 8.3 Secretary - Team
| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/api/team` | List semua team members |
| GET | `/api/team/:id` | Detail team member |
| POST | `/api/team` | Create team member |
| PATCH | `/api/team/:id` | Update team member |
| DELETE | `/api/team/:id` | Delete team member |

### 8.4 Secretary - Meetings
| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/api/meetings` | List meetings |
| GET | `/api/meetings/upcoming` | Upcoming meetings |
| GET | `/api/meetings/today` | Today's meetings |
| GET | `/api/meetings/:id` | Detail meeting |
| POST | `/api/meetings` | Create meeting |
| PATCH | `/api/meetings/:id` | Update meeting |
| DELETE | `/api/meetings/:id` | Delete meeting |

### 8.5 Secretary - Action Items
| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/api/action-items` | List action items |
| GET | `/api/action-items/overdue` | Overdue items |
| GET | `/api/action-items/pending` | Pending items |
| POST | `/api/action-items` | Create action item |
| PATCH | `/api/action-items/:id` | Update action item |
| DELETE | `/api/action-items/:id` | Delete action item |

### 8.6 Secretary - Projects
| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### 8.7 Notifications
| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/api/notifications` | List notifications |
| GET | `/api/notifications/count` | Unread count |
| POST | `/api/notifications/:id/read` | Mark read |
| POST | `/api/notifications/read-all` | Mark all read |
| DELETE | `/api/notifications/:id` | Delete notification |
| DELETE | `/api/notifications` | Delete all |

### 8.8 Rooms
| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/api/rooms` | List rooms |
| POST | `/api/rooms` | Create room |
| PATCH | `/api/rooms/:id` | Rename room |
| DELETE | `/api/rooms/:id` | Delete room |
| POST | `/api/rooms/merge` | Merge rooms |

### 8.9 Data & Enrichment
| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/api/preferences` | Get learned preferences |
| GET | `/api/profile-enrichments` | Get profile enrichments |
| GET | `/api/persona-feedback` | Get persona feedback |
| GET | `/api/conversation-tags` | Get conversation tags |
| POST | `/api/seed-profile` | Seed DR profile data |
| GET | `/api/contributor-enrichments` | Get contributor enrichments |
| POST | `/api/contributor-identify` | Identify contributor |

### 8.10 Utilities
| Method | Path | Fungsi |
|--------|------|--------|
| POST | `/api/tts` | Text-to-Speech (OpenAI) |
| POST | `/api/upload-file` | Upload file (PDF/DOCX/XLSX/etc) |
| GET | `/api/dashboard` | Secretary dashboard data |
| GET | `/api/push/vapid-key` | Get VAPID public key |
| POST | `/api/push/subscribe` | Subscribe push notification |

---

## 9. SYSTEM PROMPT CONSTRUCTION

Urutan assembly system prompt:

```
1. DARVIS_CORE.md (aturan dasar)
2. DARVIS_PROFILE_DR.md (profil DR — Mirror only)
3. Context Mode framing (strategic/tactical/reflection/crisis)
4. Active Nodes (NODE_BIAS, NODE_TEAM, etc.)
5. Learned Preferences (dari auto-learn)
6. Profile Enrichments (fakta DR + contributor pool)
7. Persona Feedback (top feedback)
8. Auto-Summary (ringkasan percakapan sebelumnya)
9. Room Summaries (konteks room lain — untuk unified brain)
10. Current date/time (WIB)
11. Presentation mode instruction
```

### Memory Governor
- Max preferences injected: disesuaikan budget token
- Scoring system: confidence × recency
- Guard context budget agar tidak overflow

---

## 10. WIB TIMEZONE

Semua operasi tanggal/waktu pakai **WIB (UTC+7)**.

### Helper Functions
```typescript
getWIBDate(): Date              // Current date in WIB
getWIBDateString(): string      // "YYYY-MM-DD"
getWIBTimeString(): string      // "HH:MM"
getWIBHour(): number            // 0-23
getWIBDayName(): string         // "Senin", "Selasa", etc.
parseWIBTimestamp(str): Date    // Parse "YYYY-MM-DD HH:MM" as WIB
```

### Implementasi
```typescript
function getWIBParts() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
    hour12: false
  });
  const parts = fmt.formatToParts(now);
  // extract year, month, day, hour, minute, second
}
```

---

## 11. PROACTIVE SYSTEM

Background scheduler yang jalan independent dari user interaction.

### Interval: 5 menit
Setiap 5 menit cek:
1. Meeting reminders (30min before, hanya `notify=true`)
2. Notification cleanup (expired reminders)

### Interval: 30 menit
1. Overdue action items alert
2. Project deadline warnings (3 hari sebelum)

### Sekali per hari (06:00-09:00 WIB)
1. Daily briefing (overview hari ini)
2. DARVIS insights (max 2-3x/hari)

---

## 12. EXTRACTION PROMPTS

### 12.1 Secretary Extraction
Dari percakapan Mirror Mode, GPT-4o-mini extract:
```json
{
  "team": [{ "name": "...", "position": "...", "aliases": "...", "category": "team|direksi|family|external|management" }],
  "meetings": [{ "title": "...", "date_time": "YYYY-MM-DD HH:MM", "participants": "...", "agenda": "...", "notify": true|false }],
  "action_items": [{ "title": "...", "assignee": "...", "deadline": "YYYY-MM-DD", "priority": "low|medium|high|urgent" }],
  "projects": [{ "name": "...", "description": "...", "pic": "...", "status": "..." }],
  "follow_ups": [{ "topic": "...", "deadline": "..." }]
}
```

### 12.2 Notify Rules dalam Extraction Prompt
- `notify: true` HANYA jika user eksplisit minta diingatkan
- Keyword: "ingetin", "jangan lupa", "remind me", "sapa gw", "catat jam X"
- Default: `notify: false`
- "ingetin gue", "jangan lupa", "catat jam X" → PAKSA masuk meetings (bukan follow_ups)

### 12.3 Auto-Learn Extraction
Setiap 10 pesan, extract ke 12 kategori preferensi.

### 12.4 Profile Enrichment Extraction
Detect self-description DR → extract fakta + kategori + confidence.

### 12.5 Room Action Detection
```json
{
  "action": "stay_lobby" | "move_to_existing" | "create_new",
  "roomId": number | null,
  "roomTitle": "string"
}
```

---

## 13. ENVIRONMENT VARIABLES

| Variable | Wajib | Deskripsi |
|----------|-------|-----------|
| OPENAI_API_KEY | Ya | API key OpenAI |
| SESSION_SECRET | Ya | Secret untuk express-session |
| OWNER_PASSWORD | Ya | Password untuk Mirror Mode |
| CONTRIBUTOR_PASSWORD | Ya | Password untuk Contributor Mode |
| DATABASE_URL | Ya | PostgreSQL connection string |
| GEMINI_API_KEY | Tidak | API key Google Gemini (fallback) |
| OLLAMA_BASE_URL | Tidak | URL server Ollama (e.g., http://localhost:11434) |
| OLLAMA_MODEL | Tidak | Model Ollama (default: llama3) |
| OLLAMA_TIMEOUT_MS | Tidak | Timeout Ollama dalam ms (default: 120000) |

---

## 14. FRONTEND COMPONENTS

| Component | Lokasi | Fungsi |
|-----------|--------|--------|
| Chat Page | `pages/chat.tsx` | Halaman utama chat |
| Secretary Dashboard | `components/secretary-dashboard.tsx` | Dashboard 4 tab (Tim, Meeting, Action Items, Projects) |
| Notification Center | `components/notification-center.tsx` | Bell icon + unread badge + notification list |
| Conversation Sidebar | `components/conversation-sidebar.tsx` | Room list + create/rename/delete/merge |

### UI Elements di Chat
- **Header**: Logo, sidebar toggle (owner), secretary icon (owner), notification bell (owner), settings, ChatGPT link, login/logout
- **Chat area**: Message bubbles dengan markdown rendering, persona cards (Mirror), context mode badge
- **Input area**: Text input, send button, voice input, image upload, file upload
- **Preferences panel**: Lightbulb icon, learned preferences + enrichments

---

## 15. KEY ALGORITHMS

### 15.1 Alias Resolution
```typescript
function getTeamMemberByNameOrAlias(name: string) {
  // 1. Exact match on name (case-insensitive)
  // 2. Check aliases (comma-separated, case-insensitive)
  // Result: prevent duplicates when DR uses different names
}
```

### 15.2 appendIfNew (Persona Profiling)
```typescript
function appendIfNew(existing: string | null, newItem: string): string {
  // Split existing by newline/semicolon
  // Check if newItem already exists (fuzzy match)
  // If not, append
  // Prevents duplicate persona entries
}
```

### 15.3 enforceFormat (Multi-Persona)
```typescript
function enforceFormat(reply: string, isMultiPersona: boolean): string {
  // Ensure response has proper persona labels (Broto:, Rara:, Rere:, DR:)
  // Only in Mirror Mode when multi-persona requested
}
```

### 15.4 mergePersonasToUnifiedVoice
```typescript
function mergePersonasToUnifiedVoice(reply: string): string {
  // Remove persona labels (Broto:, Rara:, etc.)
  // Merge into single coherent narrative
  // Used for Twin and Contributor modes
}
```

---

## 16. SEED DATA

31 orang pre-seeded saat pertama kali:

**BD Team (14)**: Franky, Anita, Pindo, Kresno, Arya, Fatur, Dessy, Newin, Marvy, Nurul, Yudis, Ayu, Cahyo, Al Apgani

**Direksi 5 PT (10)**: Nurwanto, Roy, Rijan, Mega, Agus Miten, Fadly, Lukman, Egi, Iriawan (alias: Mas Ir), Oji

**Management (3)**: Nelson Lee (alias: Tailo, Ko Nelson), Bowo, Kiki

**Family (3)**: Lisa, Vito, Veeta

---

## 17. ANTI-PATTERN & GUARDRAILS

1. **Anti Echo-Chamber**: High-stakes decision → WAJIB 1 counter-angle
2. **Strategic Challenger** (Mirror): Challenge habis-habisan sampai argumen solid
3. **Zero Tolerance Amnesia**: Orang yang sudah dikenal TIDAK BOLEH ditanya ulang
4. **No Hallucination**: Jawab dari database, jangan karang fakta
5. **Human Decision**: DARVIS tidak ambil keputusan, hanya bantu berpikir
6. **Singkat Default**: 1-3 kalimat, list max 5 poin hanya kalau diminta

---

## 18. CATATAN IMPLEMENTASI

### Token Optimization
- System prompt dioptimasi 65-70% reduction
- Prompt file caching
- SSE flush untuk faster streaming
- Memory Governor limit injected context

### Cost Efficiency
- GPT-4o-mini untuk semua background tasks (extraction, auto-learn, summaries, room detection)
- GPT-5 hanya untuk strategic/complex user-facing chat
- Fallback ke Gemini/Ollama saat kuota habis

### Data Persistence
- Semua data di PostgreSQL (persistent across deployments)
- Session-based isolation (different browser = different session)
- Global shared data: preferences, enrichments, secretary data across rooms

---

*Dokumen ini berisi spesifikasi teknis lengkap DARVIS v2.0. Developer dapat menggunakan sebagai referensi untuk reimplementasi di bahasa pemrograman atau framework apapun.*
