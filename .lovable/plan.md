
## Plan: Wire Email Confirm / Email Ready buttons to detailed mailto

Replace the current generic `sendEmail` flow in `src/components/admin/AdminOrders.tsx` with two purpose-built builders that produce the exact subject/body specified, open via `mailto:` in a new tab, and add lightweight UX polish.

### Scope (single file)
- **Edit:** `src/components/admin/AdminOrders.tsx`

### Changes

1. **Add two body builders** inside the component:
   - `buildConfirmEmail(order)` → returns `{ subject, body }` matching the Confirm template (order details, itemized lines with subtotals, payment, scheduled date, pickup vs delivery block with the JayCee Abanico Rd address + Google Maps link, invoice URL, WhatsApp contact).
   - `buildReadyEmail(order)` → returns `{ subject, body }` matching the Ready template (pickup vs delivery block, condensed item summary, total, invoice URL).
   - Both use real fields from the existing `orders` row: `customer_name`, `id`, `items` (array of `{name, quantity, price}`), `total_price`, `payment_method`, `delivery_type`, `delivery_address`, `customer_email`, `invoice_number`. Where the user's spec references `subtotal` / `total_amount` / `scheduled_date` / `customer_address` (which don't exist in our schema), map to nearest equivalents: `total_price` for both subtotal & total, `delivery_address` for address, and omit `scheduled_date` line if not present.
   - Invoice URL uses `${window.location.origin}/invoice/${order.invoice_number || order.id}` to match existing `/invoice/:id` route convention used elsewhere in the file.

2. **Replace `sendEmail(order, type)`** with a single dispatcher that:
   - Picks the right builder by `type`.
   - Calls `window.open(\`mailto:${order.customer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}\`, "_blank")`.
   - Marks the corresponding `email_confirmation_sent` / `email_ready_sent` flag in Supabase (preserve existing behavior).
   - Fires `toast.success("Gmail compose opened—click Send!")`.

3. **Loading state on the two buttons**:
   - Add local state `const [emailLoading, setEmailLoading] = useState<{id: string, type: "confirm"|"ready"} | null>(null)`.
   - On click: set loading, call dispatcher, `setTimeout(() => setEmailLoading(null), 2000)`.
   - Button label swaps to `"Opening Gmail..."` while active; icon stays.

4. **Disabled + tooltip when no email**:
   - Wrap each Email button with shadcn `Tooltip` (already in `components/ui/tooltip.tsx`, `TooltipProvider` is mounted in `App.tsx`).
   - When `!o.customer_email`, render the button `disabled` with tooltip text `"No email on file"`. Otherwise render plain button (no tooltip wrapper, or tooltip with empty content suppressed).
   - Currently the email buttons are only rendered inside `{o.customer_email && (...)}` — change to always render so the disabled-with-tooltip state is reachable, gated only by status logic.

5. **Preserve existing styling**: keep `variant="outline"`, `size="sm"`, `gap-1 text-xs`, and the `Mail` icon. Keep the `✓` suffix when `email_*_sent` is true. Keep WhatsApp buttons untouched.

### Technical notes
- `encodeURIComponent` already preserves `\n` correctly for `mailto:` body — most clients (Gmail web, Apple Mail, Outlook) honor them as line breaks.
- No schema changes, no new queries, no new dependencies.
- Mobile layout unaffected — buttons stay in the existing `flex flex-wrap gap-2` row.

### Out of scope
- WhatsApp buttons, status buttons, payment buttons — unchanged.
- No new "Send via Gmail API" integration.
- No changes to invoice page routing.
