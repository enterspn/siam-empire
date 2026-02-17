# MVP Tech Spec (Siam Empire)

## 1) Objective
Deliver a playable classroom MVP where:
1. Students login with group code
2. Students can view city resources, submit trade/war requests
3. Teacher can approve/reject and control phase
4. Classroom sees shared world news updates

## 2) In-Scope Features
- F1: Group Login + City session
- F2: Student dashboard (live resources + status)
- F3: Trade request lifecycle
- F4: War request + resolution lifecycle
- F5: World news feed from logs
- F6: Teacher admin controls (approve/reject + phase)

## 3) Out of Scope (MVP)
- Full auth/identity provider migration
- Advanced balancing simulation system
- Complex achievement/economy model

## 4) Architecture Decisions
- Use Next.js App Router server actions/route handlers for write operations
- Use Supabase as source of truth for state
- Keep student identity lightweight by mapping `group_code -> city`
- Enforce role permission via RLS + admin_accounts checks

## 5) Data Contracts (DB mapping)

### Login
- Input: `group_code`
- Query: `cities` by unique `group_code`
- Output: `city_id`, `city_name`

### Dashboard
- Read:
  - `cities`
  - `city_resources` + `resource_types`
  - `settings`

### Trade
- Create: `trades` (status=`pending`)
- Admin update: `status`, `reviewed_by`, `reviewed_at`
- On approved: apply resource transfer and append `logs`

### War
- Create: `wars` (status=`pending`)
- Admin resolve: set `status` + `result` + `resolution_note`
- On resolution: append `logs`

### News
- Read: `logs` ordered by `created_at desc`
- Optional: subscribe realtime for new log rows

## 6) API/Action Surface (proposed)
- `POST /api/login-group` -> validate group code + set session cookie
- `GET /api/student/dashboard` -> aggregate dashboard payload
- `POST /api/trades` -> create pending trade request
- `POST /api/wars` -> create pending war request
- `GET /api/news` -> latest logs
- `POST /api/admin/trades/:id/review` -> approve/reject
- `POST /api/admin/wars/:id/review` -> approve/reject/resolve
- `POST /api/admin/settings/phase` -> peace/war toggle

## 7) Session & Authorization
- Session payload (cookie): `city_id`, `role` (`student`/`admin`)
- Student role can only create requests and read world state
- Admin role can moderate and update settings

## 8) Acceptance Criteria

### AC-F1 Login
- Valid group code routes user to dashboard
- Invalid group code returns clear error

### AC-F2 Dashboard
- Resource values come from DB, not hardcoded arrays
- Current phase is visible to students

### AC-F3 Trade
- Student can submit trade request with validation
- Admin can approve/reject, and status updates immediately

### AC-F4 War
- Student can submit war request
- Admin can resolve with explicit outcome and note

### AC-F5 News
- News list displays latest logs in descending timestamp
- New approved events appear in feed (poll or realtime)

### AC-F6 Admin
- Admin can toggle phase and control trade/war activity switches

## 9) Non-Functional Requirements
- Clear Thai/English UI labels for classroom usage
- Basic input validation for all form fields
- No silent failure on write actions (error messaging required)

## 10) Risks and Mitigations
1. **RLS misconfiguration** -> add focused smoke tests for student/admin paths
2. **Session spoofing risk** -> signed cookie or server-side session verification
3. **Race conditions on approvals** -> transactional update for resource transfer

## 11) Definition of Done (MVP)
- All in-scope AC pass
- Manual end-to-end classroom flow works:
  Login -> Submit trade/war -> Admin approve/reject -> News updates
- Basic test coverage for critical write paths (trade/war/admin review)
