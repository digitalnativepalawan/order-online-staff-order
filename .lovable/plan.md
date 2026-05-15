Do I know what the issue is? Yes.

The immediate failure is not staff login or tables. The waitstaff order is created successfully, but when they click “Send to Kitchen” the app updates `order_status` to `preparing`. The database rejects that with:

```text
new row for relation "orders" violates check constraint "orders_order_status_check"
```

The cloned database already allows staff workflow statuses like `seated`, `ordering`, `ordered`, `served`, `ready_to_pay`, `paid`, and `closed`, but the newly-added staff UI code uses `preparing`, which is not allowed. That mismatch is why the toast says “Failed to save”.

Plan:

1. Fix the waitstaff send-to-kitchen status path
   - In `src/pages/StaffOrder.tsx`, change the send-to-kitchen update from `preparing` to the database-supported `ordered` status.
   - Keep `ordered_at` set when the food is sent.
   - Improve the toast error to show the real save error in development/logs instead of hiding it behind only “Failed to save”.

2. Fix the kitchen queue to match the cloned workflow
   - In `src/pages/StaffKitchen.tsx`, load orders with status `ordered` instead of `preparing`.
   - Keep “Mark Ready” moving orders to `ready`, which is already allowed by the database.
   - Make the badge/status display match the actual workflow.

3. Audit the staff POS flow for other cloned-code mismatches
   - Check staff table opening, order editing, kitchen ready, cashier payment, and admin order filters against the allowed database statuses.
   - Update admin order source/status filters so staff orders are visible and not hidden behind only `online` / `pos` assumptions.
   - Avoid unnecessary database changes because the database already has the correct staff statuses; the frontend code is what drifted.

4. Validate the full workflow after implementation
   - Open a table as waiter.
   - Add items.
   - Send to kitchen.
   - Confirm the order status becomes `ordered` and appears in the kitchen queue.
   - Mark ready.
   - Confirm cashier/admin can see and complete payment.

Files to change:

```text
src/pages/StaffOrder.tsx
src/pages/StaffKitchen.tsx
src/components/admin/AdminOrders.tsx
```

No schema migration should be needed for the main fix unless a later audit finds another real database constraint mismatch.