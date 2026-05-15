## Staff POS Rebuild

Restoring the full staff system that was previously removed, plus a new admin "Staff" management page and a Staff button in the main header.

### 1. Database
The existing `staff_users` table already has `name`, `passkey`, `role`, `is_active`. No schema migration needed.
Add a check that `role` is one of: `waiter`, `kitchen`, `cashier`, `manager` (handled in app, not DB constraint).
Seed one demo user per role on first load if table is empty (manager passkey: `9999`).

### 2. Auth helper — `src/lib/staff-auth.ts`
- `signIn(passkey)` → query `staff_users`, store `{ id, name, role }` in `sessionStorage` under `staff_session`.
- `getSession()`, `signOut()`, `hasRole(roles[])`.

### 3. Routes (added to `App.tsx`)
- `/staff` — passkey login screen (`StaffLogin.tsx`)
- `/staff/tables` — grid of `restaurant_tables`, tap to start/resume order (waiter, manager)
- `/staff/order/:orderId` — product picker + cart, send to kitchen (waiter, manager)
- `/staff/kitchen` — live queue of pending orders, mark items ready (kitchen, manager)
- `/staff/pay/:orderId` — payment screen, select method, mark paid (cashier, manager)
All wrapped in `<StaffGuard requiredRoles={[...]}>` which redirects to `/staff` if not signed in or wrong role.

### 4. Components
- `src/components/staff/StaffGuard.tsx` — role gate
- `src/components/staff/StaffTopBar.tsx` — shows name, role, sign out, links to permitted screens
- Pages listed above

### 5. Header Staff button
Add a `Users` icon button in `src/components/Header.tsx` (next to cart/admin) that links to `/staff`. Visibility controlled by existing `header_settings.show_admin_icon` pattern — adds `show_staff_icon` (defaulting on, no migration; treat missing as true).

### 6. Admin Staff management
- New `src/components/admin/AdminStaff.tsx` — list / add / edit / deactivate staff users.
- New route `/admin/staff` and nav entry in `AdminLayout.tsx` and `Admin.tsx` tabs.

### 7. Order flow integration
Staff orders use the existing `orders` table:
- `order_source = 'staff'`
- `staff_id`, `table_number` set
- `payment_status` toggled by cashier screen
Existing admin Orders view will show them automatically.

### Files to create
- `src/lib/staff-auth.ts`
- `src/components/staff/StaffGuard.tsx`
- `src/components/staff/StaffTopBar.tsx`
- `src/pages/StaffLogin.tsx`
- `src/pages/StaffTables.tsx`
- `src/pages/StaffOrder.tsx`
- `src/pages/StaffKitchen.tsx`
- `src/pages/StaffPayment.tsx`
- `src/components/admin/AdminStaff.tsx`

### Files to edit
- `src/App.tsx` — add staff routes + admin/staff route
- `src/components/Header.tsx` — add Staff button
- `src/components/admin/AdminLayout.tsx` — add Staff nav item
- `src/pages/Admin.tsx` — add Staff tab

### Out of scope
- Stripe/online payment for staff (cash/card/qr only, recorded manually)
- Per-staff sales reports (can add later)
- Real-time presence

Approve to build, or tell me what to trim.