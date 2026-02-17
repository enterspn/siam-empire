# Story Backlog (Priority Ordered)

## Epic A: Classroom Core Gameplay Loop (MVP)

### Story A1 (P0) - Group Login and Session Bootstrap
**Goal:** Student login by `group_code` and persist city session.

**Tasks**
- Create login action/API to validate group code against `cities`
- Set session cookie with `city_id` and `role=student`
- Redirect to `/dashboard` on success
- Show error message for invalid code

**Depends on:** None

**Done when**
- Valid code logs in and reaches dashboard
- Invalid code does not create session

---

### Story A2 (P0) - Dashboard Live Data Binding
**Goal:** Replace hardcoded dashboard with live city data.

**Tasks**
- Fetch city info from session city id
- Fetch resources via `city_resources` + `resource_types`
- Fetch phase/status from `settings`
- Render loading/error/empty states

**Depends on:** A1

**Done when**
- Dashboard values match DB records

---

### Story A3 (P0) - Trade Request Submission
**Goal:** Student can submit trade request (`pending`).

**Tasks**
- Add form validation (target city, resource, amount > 0)
- Insert into `trades` with `from_city_id` from session
- Surface success/error feedback

**Depends on:** A1

**Done when**
- New pending trade appears in DB and can be reviewed by admin

---

### Story A4 (P0) - Admin Trade Moderation
**Goal:** Teacher approves/rejects pending trades.

**Tasks**
- Add admin list for pending trades
- Approve/reject action writes `status`, reviewer metadata
- On approval: transactional resource updates + log entry

**Depends on:** A3

**Done when**
- Approve/reject updates status correctly and affects resources only on approve

---

### Story A5 (P1) - War Request and Resolution
**Goal:** Student creates war request; teacher resolves with outcome.

**Tasks**
- Student war request form writes pending row to `wars`
- Admin panel resolves outcome/result/note
- Add world log entries for outcomes

**Depends on:** A1

**Done when**
- War rows transition through pending -> resolved/rejected and news reflects results

---

### Story A6 (P1) - World News Feed from Logs
**Goal:** Replace static news with DB-backed feed.

**Tasks**
- Read `logs` in descending `created_at`
- Render feed with timestamp formatting
- Add polling or Supabase realtime subscription

**Depends on:** A4 (for meaningful events)

**Done when**
- Student news page shows latest game events from DB

---

### Story A7 (P1) - Admin Phase and Rule Controls
**Goal:** Teacher controls phase (`peace/war`) and trade/war activity.

**Tasks**
- Admin controls for `settings` fields
- Guard student actions based on active toggles
- Clear user feedback when action is disabled

**Depends on:** A1

**Done when**
- Phase/toggle changes are persisted and enforced

---

## Epic B: Reliability and Quality

### Story B1 (P1) - Role Authorization Hardening
**Goal:** Enforce student/admin boundaries consistently.

**Tasks**
- Centralize role check helper
- Verify RLS policy behavior for student/admin scenarios
- Block unauthorized admin routes/actions

**Depends on:** A1, A4

---

### Story B2 (P2) - Critical Path Tests
**Goal:** Protect MVP loop with tests.

**Tasks**
- Unit tests for trade/war validation logic
- Integration tests for admin moderation actions
- Smoke tests for login -> dashboard -> submit flow

**Depends on:** A1-A6

---

## Suggested Sprint Cut

### Sprint 1 (Must ship)
- A1, A2, A3, A4

### Sprint 2 (High value follow-up)
- A5, A6, A7

### Sprint 3 (Hardening)
- B1, B2
