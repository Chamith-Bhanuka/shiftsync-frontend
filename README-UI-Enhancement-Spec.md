# ShiftSync Frontend — UI Enhancement Specification

**Purpose of this document:** the current frontend is deliberately built function-first, with plain default Tailwind styling and zero visual design investment. Every feature works — every backend endpoint is wired up, toasts fire on every action, and real-time push notifications work via WebSocket. What's missing is *design*. This document is meant to be handed to an AI tool (or a human designer) as a brief for a pure visual/UX enhancement pass, without touching functionality.

---

## Rules for Whoever/Whatever Enhances This

1. **Do not change any API calls, function names, or data flow.** Every `src/api/client.js` function, every `useEffect`, every state variable's *purpose* must stay exactly as-is. Only JSX structure, class names, and purely presentational logic should change.
2. **Do not remove any conditional state.** Loading, error, and empty states must remain visually distinct and must still exist after enhancement.
3. **Do not remove any functional element.** Every button, form field, and link maps to a real backend capability.
4. **Do not touch `src/lib/usePushNotifications.js`'s connection logic** or `src/lib/ToastContext.jsx`'s `showToast` function signature — these can be reskinned visually (see the dedicated sections below) but their behavior must stay identical: same events trigger the same toasts, the connection status dot must still accurately reflect real connection state.
5. **Mobile responsiveness matters.**
6. **You may introduce a real design language** — colors, type, spacing scale, a consistent component system — this document intentionally does not prescribe one. (Reference available on request: an earlier version of this project used a "roster board / time-card stamp" concept with a warm paper background and an ink/teal/red/amber palette, if a starting point is useful — a completely different direction is equally welcome.)

---

## Global Elements

### Nav Bar (`src/components/Layout.jsx`)
**Current state:** plain white bar, links in a row, user's name/role as plain text, a "Switch user" link, and **two elements added in this version that need specific attention**:
- A small colored dot next to the username — **green when the WebSocket is connected, red-ish when reconnecting.** This is a genuinely functional status indicator, not decoration — it must remain immediately legible (color alone may not be enough; consider whether it needs a label or icon too, since color-only status indicators are also an accessibility concern worth considering).
- A small red badge on the "Notifications" link showing the unread count, which increments live as push notifications arrive. This needs to feel "alive" — consider a subtle animation on increment (a brief pulse/bounce) so it doesn't just silently change value unnoticed while a user is looking elsewhere on the page.

**What it needs to communicate:**
- The current page (active-state styling on the current nav link — currently missing entirely)
- The current user's identity clearly, ideally with some visual weight
- Manager-only links should look visually distinct from employee-facing ones
- Mobile: this currently wraps awkwardly on narrow screens — a real mobile nav pattern would help

### Toast Notifications (`src/lib/ToastContext.jsx`)
**Current state:** plain white boxes, bottom-right corner, colored left border only (green/red/blue), auto-dismiss after 5 seconds, stack vertically if multiple appear at once.

**This is a new, high-frequency UI element** — it appears after nearly every user action (swap requests, responses, claims, approvals, rejections, uploads, document reviews) *and* whenever a push notification arrives from another user's action. Two distinct sources feed the same toast system:
1. **Self-triggered** — the result of the current user's own action (e.g., "Shift added.")
2. **Push-triggered** — an event caused by someone else (e.g., a manager approving a swap while the employee is on a different page)

**Design opportunity:** currently these look identical regardless of source — consider whether push-triggered toasts (things happening *to* you, from someone else) deserve a visually distinct treatment from self-triggered ones (confirmation of something *you* just did) — e.g., a subtle icon distinguishing "you did this" vs. "this happened to you." Also worth considering: entrance/exit animations (slide-in, fade-out) rather than the current instant appear/disappear, and whether stacking multiple toasts needs a "clear all" affordance if several arrive in quick succession.

### Shared Components
- `.card`, `.row`, `.badge` (+ color variants), `.btn` / `.btn-secondary` / `.btn-danger`, `.field` — same plain component vocabulary as before, used consistently across all 6 pages. See the previous version of this document's status vocabulary table (reproduced below) for the exact meaning of every badge color.

### Status Vocabulary (Must Stay Consistent Across Every Page)
| Value | Appears On | Current Color |
|---|---|---|
| `SCHEDULED` | Shifts | blue |
| `OPEN` | Shifts | yellow |
| `COVERED` | Shifts | green |
| `PENDING` | Swap requests | yellow |
| `RESPONDED` | Swap requests | blue |
| `APPROVED` | Swap requests, documents | green |
| `REJECTED` | Swap requests, documents | gray |
| `PENDING_REVIEW` | Documents | yellow |

---

## Page 1 — Login (`src/pages/Login.jsx`)

**Route:** `/`

**Current implementation:** narrow centered column, title, subtitle, a card listing every employee with a "Continue" button (and "As Manager" for manager-role employees).

**Enhancement opportunities:** this is the first thing anyone sees and currently looks like a debug tool. Strong opportunity for a real welcome moment. Employee rows show name/role/email as plain text — consider avatars/initials and clearer hierarchy. The dual-button pattern for managers is functionally required (no auth) but worth a cleaner visual treatment than two side-by-side buttons.

---

## Page 2 — Employee Dashboard (`src/pages/EmployeeDashboard.jsx`)

**Route:** `/employee`

**Four sections, in order:**

### Section 1: "Swap Requests Needing Your Response"
**Functionally:** swap requests targeting this user with `status: PENDING`. Responding calls `respondToSwapRequest` and now **fires a toast** ("Response sent.") on success.

**Design opportunity:** the most time-sensitive section on the page — currently visually equal-weight to everything else. Now that a toast confirms the action too, consider whether the *card itself* needs a stronger "this matters" visual treatment (color, position, urgency indicator) independent of the toast, since the toast disappears after 5 seconds but the underlying decision (did I respond yet?) has lasting consequence.

### Section 2: "Upcoming Shifts"
**Functionally:** the user's own shifts; "Request Swap" reveals an inline form using **real availability-checked** coworkers (`getAvailableEmployeesForShift` — actual scheduling-conflict filtering, not a static list). Submitting now fires a toast.

**Design opportunity:** the inline expand-in-place form is visually abrupt (a box just appears). A smoother transition or modal/drawer pattern would read better. "Only showing coworkers without a conflict" is important context currently easy to miss as small gray text.

### Section 3: "Open Shifts"
**Functionally:** unassigned shifts; "Claim This Shift" calls a dedicated claim endpoint and fires a toast.

**Design opportunity:** currently visually identical to Section 2's rows aside from button label — some distinction (dashed border, different accent) would help communicate "nobody's covering this at all" vs. "this is mine, I'm offering it."

### Section 4 (functionally missing, not just visually)
No view of the employee's own resolved (approved/rejected) swap-request history exists yet. `getSwapRequestsForEmployee` already fetches this data (used for Section 1's filtering) — the full result just isn't displayed. Flag this clearly if the enhancement pass has any functional latitude; otherwise leave a placeholder noting it's planned.

---

## Page 3 — Manager Dashboard (`src/pages/ManagerDashboard.jsx`)

**Route:** `/manager` (Manager only)

### Section 1: "Shift Board"
Flat list, sorted by time. Grouping by day would help readability once there are more than a handful of shifts — a calendar/grid isn't required by the project guidelines, but day-grouping within the list format is a reasonable middle ground.

### Section 2: "Add a Shift"
Simple form; creating a shift now fires a toast. Mostly benefits from the same form-styling pass as everywhere else — the native `datetime-local` input looks visually inconsistent with the rest of the app's inputs.

### Section 3: "Swap Requests Awaiting Decision"
**This is where the employee's actual response text is shown to the manager** — a highlighted box containing their comment, or an italic "hasn't responded yet" note. Approve/Reject now fire toasts too.

**Design opportunity:** the employee's response comment is arguably the single most important piece of information on this page — currently a blue-tinted box, functional but not visually elevated to match its actual decision-making weight. Strong candidate for the page's visual focal point.

---

## Page 4 — Document Reviews (`src/pages/ManagerDocuments.jsx`)

**Route:** `/manager/documents` (Manager only)

**Functionally:** lists documents in `PENDING_REVIEW` across all employees; approve/reject now fire toasts.

**Known gap worth flagging as a real product issue, not just cosmetic:** shows "Employee #3" (raw id) instead of a name, since the backend response doesn't currently include one. A manager reviewing sensitive documents (medical certificates) should see whose they are without cross-referencing an ID — worth a backend fix (adding employee name lookup) alongside or before any visual work here.

Document type already renders as a human label via a lookup map (`MEDICAL_CERTIFICATE` → "Medical Certificate") — preserve this translation in any redesign, don't revert to showing the raw enum.

---

## Page 5 — Notifications (`src/pages/Notifications.jsx`)

**Route:** `/notifications`

**Functionally:** list, All/Unread toggle (refetches from a different endpoint), unread dot, "Mark read" (now fires a toast on failure only — success is implicit since the item visually updates immediately).

**Design opportunity:** with push notifications now arriving as toasts elsewhere in the app, this page becomes more of an "archive/history" view than the primary way users learn about new activity — worth considering whether its design should shift accordingly (e.g., emphasizing scannability of a longer history list, since urgent items are now caught via toast before the user even visits this page). Every notification currently looks identical regardless of type — icons or subtle color-coding by event type (swap approval vs. document rejection) would help scanning.

---

## Page 6 — My Documents (`src/pages/Credentials.jsx`)

**Route:** `/credentials`

**Functionally:** upload form (type, note, file) and a list of the user's own documents with review status; upload now fires a toast.

**Design opportunity:** upload form and document list are just stacked vertically with no strong separation — consider whether these deserve more distinct visual treatment (tabs, distinct panels) since they serve different intents (submitting something new vs. checking status). A rejected document with a manager's comment is important information currently rendered as plain gray text — worth surfacing more prominently.

---

## Cross-Page Consistency Checklist

- [ ] Every page's `page-title` / `section-title` hierarchy stays recognizable
- [ ] Every badge value stays visually distinguishable from every other value it could appear alongside
- [ ] Loading, empty, and error states remain visually distinct from each other on every page
- [ ] Manager-only pages/sections stay visually distinguishable, not just route-guarded
- [ ] Toast notifications remain legible and distinguishable by type (success/error/info) after any redesign
- [ ] The WebSocket connection status dot remains an accurate, immediately-readable indicator of real connection state — never purely decorative
- [ ] All existing `onClick` handlers, form submissions, `showToast` calls, and conditional renders remain wired to the exact same functions
