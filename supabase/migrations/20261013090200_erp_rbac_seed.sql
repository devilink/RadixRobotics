-- =============================================================================
-- RADIX ERP — Migration 3: roles and permissions catalogue
-- =============================================================================
-- Reference data only (no personal information). Re-runnable via ON CONFLICT.

insert into public.permissions (key, module, description) values
  ('dashboard.view',            'overview',    'View the ERP dashboard'),
  ('institutions.view',         'institutions','View institutions the user is assigned to'),
  ('institutions.manage',       'institutions','Create and edit institutions, campuses and shifts'),
  ('students.view',             'people',      'View all students of an institution'),
  ('students.view_assigned',    'people',      'View students in assigned classes or batches only'),
  ('students.manage',           'people',      'Create and edit students, guardians and enrolments'),
  ('staff.view',                'people',      'View teachers, instructors and staff'),
  ('staff.manage',              'people',      'Create and edit teachers, instructors and staff'),
  ('hr.view',                   'hr',          'View HR details (department, manager, shift, qualifications)'),
  ('groups.view',               'learning',    'View classes, sections and batches'),
  ('groups.manage',             'learning',    'Create classes/batches and manage enrolments and assignments'),
  ('attendance.view',           'attendance',  'View all student attendance for an institution'),
  ('attendance.view_assigned',  'attendance',  'View student attendance for assigned groups only'),
  ('attendance.mark',           'attendance',  'Mark student attendance for any group'),
  ('attendance.mark_assigned',  'attendance',  'Mark student attendance for assigned groups only'),
  ('attendance.correct',        'attendance',  'Correct finalised student attendance (with reason)'),
  ('attendance.approve',        'attendance',  'Approve or reject attendance correction requests'),
  ('attendance.finalize',       'attendance',  'Finalise submitted student registers'),
  ('staff_attendance.view',     'attendance',  'View staff and employee attendance'),
  ('staff_attendance.mark',     'attendance',  'Mark staff and employee attendance'),
  ('staff_attendance.correct',  'attendance',  'Correct finalised staff attendance (with reason)'),
  ('staff_attendance.approve',  'attendance',  'Finalise staff registers and approve staff corrections'),
  ('leave.view',                'hr',          'View leave requests'),
  ('leave.approve',             'hr',          'Approve or reject leave requests'),
  ('self.view',                 'self',        'View own attendance and submit own leave requests'),
  ('reports.export',            'reports',     'Export reports containing personal data'),
  ('users.manage',              'admin',       'Manage user accounts and role assignments'),
  ('audit.view',                'admin',       'View audit logs'),
  -- Reserved for upcoming modules; no UI or data yet.
  ('crm.manage',                'crm',         'Manage leads, contacts and contracts'),
  ('projects.manage',           'operations',  'Manage installation projects, tasks and milestones'),
  ('inventory.manage',          'inventory',   'Manage stock, assets and movements'),
  ('procurement.manage',        'procurement', 'Manage vendors, purchase requests and orders'),
  ('finance.view',              'finance',     'View financial records'),
  ('finance.manage',            'finance',     'Manage invoices, payments and expenses'),
  ('support.manage',            'support',     'Manage support tickets and maintenance')
on conflict (key) do update set module = excluded.module, description = excluded.description;

insert into public.roles (key, name, scope, applies_to, description, sort_order) values
  ('super_admin',         'Super Admin',          'platform', null, 'Complete system administration', 1),
  ('director',            'Director',             'platform', null, 'Company-wide overview, reports and approvals', 2),
  ('operations_manager',  'Operations Manager',   'platform', null, 'Institutions, schedules, people and delivery', 3),
  ('hr_manager',          'HR Manager',           'platform', null, 'Employees, staff attendance and leave', 4),
  ('finance_manager',     'Finance Manager',      'platform', null, 'Financial records (module upcoming)', 5),
  ('procurement_manager', 'Procurement Manager',  'platform', null, 'Vendors and purchasing (module upcoming)', 6),
  ('inventory_manager',   'Inventory Manager',    'platform', null, 'Stock and assets (module upcoming)', 7),
  ('project_manager',     'Project Manager',      'platform', null, 'Projects and milestones (module upcoming)', 8),
  ('support_staff',       'Support Staff',        'platform', null, 'Service tickets and maintenance (module upcoming)', 9),
  ('school_admin',        'School Admin',         'institution', '{school}', 'Manages one school''s people, classes and attendance', 20),
  ('teacher',             'Teacher',              'institution', '{school}', 'Marks attendance for assigned classes', 21),
  ('centre_manager',      'Centre Manager',       'institution', '{learning_center}', 'Manages one learning centre''s operations', 30),
  ('instructor',          'Instructor',           'institution', '{learning_center,school}', 'Runs assigned batches or sessions', 31),
  ('front_desk',          'Reception / Front Desk','institution', '{learning_center}', 'Registrations and check-in/check-out', 32),
  ('student',             'Student',              'institution', '{school,learning_center}', 'Views own attendance', 40),
  ('employee',            'Employee (self-service)','institution', null, 'Views own attendance and requests leave', 41)
on conflict (key) do update set name = excluded.name, scope = excluded.scope,
  applies_to = excluded.applies_to, description = excluded.description, sort_order = excluded.sort_order;

-- Rebuild the mapping from the arrays below so this file stays the source of truth.
delete from public.role_permissions;

insert into public.role_permissions (role_key, permission_key)
select 'super_admin', key from public.permissions;

insert into public.role_permissions (role_key, permission_key)
select r.role_key, p.perm
from (values
  ('director', array['dashboard.view','institutions.view','students.view','staff.view','hr.view','groups.view',
                     'attendance.view','attendance.approve','staff_attendance.view','staff_attendance.approve',
                     'leave.view','leave.approve','reports.export','audit.view','finance.view','self.view']),
  ('operations_manager', array['dashboard.view','institutions.view','institutions.manage','students.view','students.manage',
                     'staff.view','staff.manage','groups.view','groups.manage','attendance.view','attendance.mark',
                     'attendance.correct','attendance.finalize','staff_attendance.view','staff_attendance.mark',
                     'leave.view','reports.export','projects.manage','support.manage','self.view']),
  ('hr_manager',     array['dashboard.view','institutions.view','staff.view','staff.manage','hr.view',
                     'staff_attendance.view','staff_attendance.mark','staff_attendance.correct','staff_attendance.approve',
                     'leave.view','leave.approve','reports.export','self.view']),
  ('finance_manager',     array['dashboard.view','institutions.view','finance.view','finance.manage','reports.export','self.view']),
  ('procurement_manager', array['dashboard.view','institutions.view','procurement.manage','self.view']),
  ('inventory_manager',   array['dashboard.view','institutions.view','inventory.manage','self.view']),
  ('project_manager',     array['dashboard.view','institutions.view','projects.manage','self.view']),
  ('support_staff',       array['dashboard.view','institutions.view','support.manage','self.view']),
  ('school_admin',   array['dashboard.view','institutions.view','students.view','students.manage','staff.view','staff.manage','hr.view',
                     'groups.view','groups.manage','attendance.view','attendance.mark','attendance.correct','attendance.approve',
                     'attendance.finalize','staff_attendance.view','staff_attendance.mark','staff_attendance.correct',
                     'staff_attendance.approve','leave.view','leave.approve','reports.export','users.manage','audit.view','self.view']),
  ('centre_manager', array['dashboard.view','institutions.view','students.view','students.manage','staff.view','staff.manage','hr.view',
                     'groups.view','groups.manage','attendance.view','attendance.mark','attendance.correct','attendance.approve',
                     'attendance.finalize','staff_attendance.view','staff_attendance.mark','staff_attendance.correct',
                     'staff_attendance.approve','leave.view','leave.approve','reports.export','users.manage','audit.view','self.view']),
  ('teacher',        array['dashboard.view','institutions.view','students.view_assigned','groups.view',
                     'attendance.view_assigned','attendance.mark_assigned','self.view']),
  ('instructor',     array['dashboard.view','institutions.view','students.view_assigned','groups.view',
                     'attendance.view_assigned','attendance.mark_assigned','self.view']),
  ('front_desk',     array['dashboard.view','institutions.view','students.view','students.manage','groups.view',
                     'attendance.view','attendance.mark','self.view']),
  ('student',        array['self.view']),
  ('employee',       array['self.view'])
) as r(role_key, perms)
cross join lateral unnest(r.perms) as p(perm);
