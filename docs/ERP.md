# Radix ERP — Release 1 (Foundation + Attendance)

The ERP is a protected area at `/erp` inside the existing Next.js app. The public
website, the curriculum portal (`/curriculum`, `/student`), and the legacy admin
pages (`/super-admin`, `/school-admin`) are unchanged apart from the security
fixes listed below.

## Architecture

| Layer | Where | Notes |
|---|---|---|
| Database schema | `supabase/migrations/*.sql` | Six ordered migrations. RLS on every ERP table. |
| Authorisation in the database | `erp_private.*` helpers, RLS policies, `public.erp_*` functions | Writes that touch several tables (attendance saves, corrections, member creation, role grants) run in `SECURITY DEFINER` functions that re-check permissions and run as one transaction. |
| Data access (server only) | `lib/erp/context.ts` | Uses the **user's own Supabase session**, so RLS applies to every query. The service-role key is used only to create Supabase Auth logins. |
| Validation | `lib/erp/validation.ts` (zod) | Mirrors the database CHECK constraints with friendly messages. |
| UI | `app/erp/**` | Server Components and Server Actions; client components only for interactive forms and the register editor. |

### Two operating categories, one codebase

`institutions.institution_type` is `school`, `learning_center` or `head_office`
(Radix's own organisation, for employees). The top-bar selector (All Operations /
Schools / Radix Learning Centers) is stored in an `erp_category` cookie and
filters the dashboard, institutions, people, classes and batches, registers,
corrections, leave and reports. Schools' class sections and centres' batches
share one `learning_groups` table, so enrolment, attendance and reporting logic
exists once.

A person is stored once in `people`. Each role they hold at an institution is an
`institution_memberships` row (student, teacher, instructor, staff, employee).
Login accounts (`profiles`) can be linked to a person, which is how a teacher's
login finds their classes.

### Roles and permissions

Roles are assigned either platform-wide (`institution_id IS NULL`, e.g. Director,
HR Manager) or for one institution (e.g. School Admin, Teacher, Centre Manager,
Front Desk, Student). The full matrix is visible at **/erp/admin/roles** and is
defined in `20261013090200_erp_rbac_seed.sql`.

Key rules enforced by the database:

- School and centre users only see institutions they are assigned to.
- Teachers and instructors see and mark only students in classes or batches assigned to them.
- Guardian contacts need full `students.view` (teachers don't see them).
- HR details (`employee_profiles`) need `hr.view`. Radix head-office employees are invisible to schools and centres.
- Institution admins can grant only limited institution roles (not School Admin or Centre Manager) and only at their own institution.
- No one can approve their own correction or leave request. The last Super Admin cannot be removed.
- Composite foreign keys make it impossible to link a record to a parent in another institution, even for privileged writers.

### Attendance model

- `attendance_sessions` = one register (a class or batch on a date and optional period, or the staff roster for a date). Status: `draft → submitted → finalized`.
- `attendance_records` = one row per person per register, enforced by `UNIQUE (session_id, membership_id)`.
- Statuses: Present, Absent, Late, Excused, Half Day, On Leave (staff only). Check-in and check-out are stored as `timestamptz` and entered and shown in the institution's time zone.
- **Rate** = (present + late + ½ half-day) ÷ (entries − excused − on leave). Only people on a register are counted, so unscheduled people never dilute the rate.
- A register's roster = students enrolled in the group on that date, or active non-student members for staff registers.
- Markers may edit registers within the institution's back-date window (default 7 days) until they are finalised. After that, changes need `*.correct` (direct correction with a mandatory reason) or a correction request approved by someone with `*.approve`. Institutions can require approval for every correction.
- Every change to records, registers, memberships, enrolments, role assignments, leave and corrections is written to `audit_logs` by trigger, with old and new values, actor and reason. CSV exports are audited as well.
- `attendance_records.method` (`manual | qr | rfid`) is reserved for future QR or RFID check-in. Only manual marking is implemented. Biometrics are intentionally not supported.

### Inventory (Super Admin only)

`/erp/inventory` tracks electronics kits and components (migration 9, `20261016090000_erp_inventory.sql`).

- **Access** is tied to the platform-wide `super_admin` role (`erp_private.is_super_admin()`), not to a permission, so no other role can be given inventory access by accident. The migration also removes `inventory.manage` from the Inventory Manager role. Pages return 404 and actions are refused for everyone else.
- **Items** are components or kits, with SKU, category, unit, storage location, unit cost and reorder level. A kit lists the components (and quantities) that make one kit.
- **Stock is a ledger.** `quantity_on_hand` cannot be written directly; it changes only through `erp_inventory_move` (receive, issue, return, stock count, write-off) and `erp_inventory_build_kits` (build kits from components, or break them up), which lock rows, refuse negative stock, and write an append-only `inventory_movements` row with the running balance. Stock counts and write-offs need a reason.
- **Issued to Sites** shows what is out with each school or learning centre (issued minus returned); returns cannot exceed what is out.
- Item, category and kit-content changes are in the audit log. The movement ledger exports to CSV.

### Spreadsheet imports (students, inventory)

**Students → Import from Excel / Sheets** (`/erp/people/import`, needs `students.manage` at the chosen institution) and **Inventory → Import** (`/erp/inventory/import`, Super Admin only) accept an Excel `.xlsx` file, a CSV, or a Google Sheets link. Each page offers a template download and lists the columns; header names are matched loosely ("Roll Number", "Qty", "Parent Mobile"…) and other columns are ignored.

- **Check, then import.** "Check sheet" validates every cell and then runs the whole import as a database dry run (`erp_import_students`, `erp_inventory_import`, migration 10) that is rolled back, so duplicates, unknown classes and permission problems show against their row before anything is saved.
- **All or nothing** by default: if any row has a problem nothing is imported, unless "Skip rows with problems" is ticked.
- **Students** go through `erp_create_member` (same rules as the Add student form). Optional class/batch name enrols them; optional guardian columns add a primary guardian. Blank roll numbers are generated (`STU-XXXXXX`). Dates may be Excel dates, `DD/MM/YYYY` or `YYYY-MM-DD`.
- **Inventory**: a new SKU creates an item; an existing SKU updates it (blank cells keep current values). `Quantity` is stock received now and is recorded as a "Spreadsheet import" movement. Missing categories are created. `Kit Components` (`MCU-UNO x1; SEN-HCSR04 x2`) replaces a kit's contents.
- **Google Sheets** must be shared as "Anyone with the link (Viewer)". The server only fetches the CSV export URL built from the sheet ID on `docs.google.com`.
- Limits: 5 MB, 2000 rows per import, 30 imports per minute per user. Old `.xls` files must be re-saved as `.xlsx`. The Excel reader is `read-excel-file`, pinned to an exact version.


## Dashboards

The Operations Dashboard, Attendance Overview, Inventory overview and My Attendance pages are interactive:
GitHub-style year heatmaps (click a day for its figures; arrow keys move between days), today-by-status donuts,
ranked institution bars, a weekly units-in/out chart and sparklines on the key tiles. The year heatmaps read
`erp_attendance_calendar` and `erp_inventory_calendar` (migration 11, `20261025090000_erp_dashboard_analytics.sql`),
both SECURITY INVOKER so RLS limits the totals to what the viewer may see. Until that migration is applied the
heatmap cards show a notice and the rest of each page works as before.

## Setup

1. **Environment.** Copy `.env.example` to `.env.local` and fill in the Supabase values.
2. **Rotate the service-role key.** A service-role key was committed in `check_db.ts` in earlier commits. It has been removed from the file, but it is still in git history. Rotate it in Supabase (Settings → API → service_role → Rotate) and update `.env.local` and your hosting provider.
3. **Apply migrations** (staging first) with either:
   - Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`, or
   - the SQL editor: run the eleven files in `supabase/migrations/` in filename order.

   The migrations assume the legacy `schools` and `user_roles` tables already exist (they do in production). The bridge migration first gives every existing `<school id>@radix.school` login an explicit `school_admin` row in `user_roles` (the app no longer infers roles from email addresses), then creates an ERP school for each legacy school, gives legacy super admins the ERP **Super Admin** role, and gives legacy school admins **School Admin** of their school. It also creates the "Radix Robotics Head Office" institution.
4. **Bootstrap a Super Admin** (only if no legacy super admin exists):
   ```sql
   insert into public.user_role_assignments (user_id, role_key)
   select id, 'super_admin' from auth.users where email = 'you@example.com';
   ```
5. Sign in at `/login` (Staff & Admin tab) and open `/erp`. Users who only have ERP roles are sent there automatically.

### Adding schools and Radix Learning Centers

Use **Super Admin → New School / Center** and pick the category. Each gets an ID + password login (School tab on `/login`) and curriculum access, exactly like schools. Database triggers (migration 8) mirror every add, rename and delete into the ERP: a school becomes an ERP **School** with its login as **School Admin**; a center becomes an ERP **Radix Learning Center** with its login as **Centre Manager**. Deleting in the portal archives the ERP institution so attendance history is kept.

### Typical first steps in the ERP

1. Institutions → create schools and learning centres (a primary campus is added automatically).
2. People → add teachers or instructors and students. On a person page, **Create login** gives them an account linked to their record.
3. Classes & Batches → create groups, enrol students and assign teachers.
4. Attendance → Daily Register → open a register, mark it, then submit. Admins finalise it.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` (the build skips type checking via `next.config.ts`) |
| `npm test` | Vitest: unit tests plus database tests that apply every migration to an in-process Postgres 17 (PGlite) with a Supabase-like `auth` schema and run RLS and isolation scenarios as different users |

## Security fixes to existing code

- `app/actions/superAdminActions.ts`, `projectActions.ts`, `schoolAdminActions.ts` and `progressActions.ts` performed privileged service-role operations with **no authentication**. Server actions are public POST endpoints, so anyone could create or delete schools or approve students. Each action now verifies the session and role (`lib/auth/legacy.ts`).
- `autoAssignSuperAdmin(email, userId)` trusted a client-supplied email, which allowed privilege escalation. It now reads identity from the session only.
- `getUserRoleById` returns only the caller's own role.
- `check_db.ts` no longer contains a hard-coded service-role key (see setup step 2).
- Roles are no longer inferred from email addresses (`@radix.school`, the owner email) in the middleware, login page, navbar or curriculum page. They come only from `user_roles`. The owner bootstrap email is now the `SUPER_ADMIN_EMAIL` environment variable.
- `queueStudentForApproval` only accepts the caller's own account (signed in, or created in the last 15 minutes), never one that already has a role, and rejects `@radix.school` emails. The registration form receives opaque school tokens instead of school IDs, which are also school login names.
- The ERP user form rejects `@radix.school` emails.
- Rate limits (saves, exports, account creation) are stored in the database (`public.erp_rate_limit`), so they hold across server instances.

## Known limitations

- **Not yet run against a real Supabase project.** Migrations, RLS and functions are tested on PGlite (Postgres 17) with a Supabase-like stub. The Next.js pages compile and type-check, and the public site was smoke-tested, but the ERP screens have not been exercised end to end against live data. Apply to a staging project and click through before production.
- Student self-service relies on the student having an ERP **Student** role and a linked person record. Legacy portal students are not automatically migrated into `people`.
- Leave can be requested for oneself in the UI. The database also allows staff managers to request leave on someone's behalf, but there is no screen for it yet.
- No academic calendar or holiday table yet. "Expected registers" use working and meeting days only.
- No email or in-app notifications yet.
- Not built yet, and deliberately absent from navigation: CRM, projects and lab installations, inventory and assets, procurement, finance, support and maintenance, curriculum and assessments. Their permissions are reserved in the catalogue.
- Finance is not, and should not be presented as, a statutory accounting system.

## Next milestone

1. Apply to staging, run a pilot with one school and one centre, and fix any issues found.
2. Holiday calendar and term dates; monthly and term attendance summaries per class.
3. Notifications (missing registers, pending approvals) by email and in-app.
4. Serial-numbered assets and lab allocation on top of the inventory ledger.
5. Projects and lab installations, then support tickets and maintenance.
