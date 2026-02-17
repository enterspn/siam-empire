# Project Baseline (Siam Empire)

## 1) Current Technical Stack
- Framework: Next.js 15 + React 19 + TypeScript
- Styling: TailwindCSS
- Backend/data: Supabase (client SDK)

## 2) Current App Surface

### Public
- `/` Landing page with links to Login/Admin
- `/login` Group code login form (UI only, no real submit flow)

### Student Area
- `/dashboard` Resource overview UI (static mock data)
- `/trade` Trade request form (UI placeholder)
- `/war` War calculator form (UI placeholder)
- `/news` World news feed (static mock list)

### Teacher/Admin
- `/admin` Admin panel sections (overview card placeholders)

## 3) Data Layer Status (Supabase)
The schema is already substantial and includes:
- Core: `cities`, `resource_types`, `city_resources`
- Game flow: `trades`, `wars`, `laws`, `logs`, `settings`, `admin_accounts`
- Realtime publication setup for key tables
- Row Level Security enabled with baseline policies

## 4) Gaps Between UI and Data
1. Login is not connected to `cities.group_code`
2. Dashboard is not reading `city_resources` / `settings`
3. Trade flow is not creating `trades` rows
4. War flow is not writing to `wars` or resolving outcomes
5. News is not reading realtime `logs`
6. Admin page is not connected to moderation/update actions

## 5) Readiness Assessment
- **Architecture readiness:** Medium-High (DB prepared)
- **Implementation readiness:** Medium (frontend routes exist)
- **Production readiness:** Low-Medium (business logic, auth/session, tests missing)

## 6) Priority Constraints
- Must keep classroom flow simple (fast login, clear city state, quick teacher controls)
- Must preserve game fairness (approval workflow + transparent logs)
- Must enforce permission boundaries (students vs admins)

## 7) Recommended Implementation Sequence
1. Group login + city session
2. Live dashboard data binding
3. Trade submit + admin approve/reject
4. War calculate + admin resolve
5. Realtime world news
6. Test automation + quality gates
