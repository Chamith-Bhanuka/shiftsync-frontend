# ShiftSync — Frontend (Simple Build, with WebSocket Push + Toasts)

**Student Name:** <YOUR FULL NAME>
**Student Number:** <YOUR STUDENT ID>
**Slack Handle:** <YOUR SLACK HANDLE — optional>
**GCP Project ID:** <YOUR GCP PROJECT ID>

---

## Description

Functional-first React frontend for ShiftSync. Every backend endpoint built across the project is wired up, real-time push notifications work via WebSocket/STOMP, and every user action shows an immediate toast confirmation. Visual design is intentionally plain — see `README-UI-Enhancement-Spec.md` for the detailed brief to hand to an AI design pass later.

No JWT/RBAC in this build — uses the simple "act as" employee picker.

---

## Technology Stack

- React 18 (Vite), React Router, Tailwind CSS (default palette), Axios
- `@stomp/stompjs` + `sockjs-client` for WebSocket push notifications

---

## Important Architectural Note: WebSocket Bypasses the Gateway

Every REST call in this app goes through the API Gateway as normal (`VITE_API_BASE_URL`). **The one exception is the WebSocket connection**, which connects **directly to Notification Service** (`VITE_NOTIFICATION_WS_URL`), skipping the Gateway entirely.

**Why:** this project's API Gateway uses **Spring Cloud Gateway MVC** (the servlet/Tomcat-based flavor, configured under `spring.cloud.gateway.server.webmvc`), which — as of this writing — has no built-in support for proxying WebSocket connections. This is a real, documented limitation of that specific Gateway implementation, confirmed via Spring Cloud Gateway's own open GitHub issues, not a bug in this frontend or a missing config option.

This is a deliberate, pragmatic design choice, not an oversight — direct WebSocket connections to a specific backing service, bypassing a REST-focused API gateway, is a legitimate and fairly common real-world pattern. Be ready to explain this tradeoff if asked (it does mean Notification Service must be reachable at its own address, not hidden fully behind the Gateway — worth remembering when this gets deployed to GCP, since notification-service's VM/Instance Group needs a reachable path for this specific connection type).

---

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```
Opens at `http://localhost:5173`. Requires the full backend running: Config Server, Eureka, Gateway (with `StripPrefix=2` on its REST routes), and all 3 microservices — Notification Service specifically needs its WebSocket support added (see the separate WebSocket implementation guide) for push to work; without it, the app still functions normally for everything else, it just won't show live toasts from other users' actions.

---

## What's New in This Build vs. the Previous Simple Version

1. **Toast notifications on every action** — swap requests, responses, claims, shift creation, approve/reject, document upload/review all show an immediate success/error toast (`src/lib/ToastContext.jsx`), instead of only a small inline message that was easy to miss.
2. **Real-time push** — `src/lib/usePushNotifications.js` connects via WebSocket/STOMP directly to Notification Service and shows a toast the instant another user's action generates a notification for the current user, with a live/reconnecting status dot in the nav bar.
3. **Unread badge in the nav** — increments in real time as push notifications arrive.

---

## Pages

| Route | Page | Covers |
|---|---|---|
| `/` | Login | Pick an employee to act as |
| `/employee` | Employee Dashboard | My shifts, availability-checked swap requests, respond to swaps targeting me, claim open shifts |
| `/manager` | Manager Dashboard | Shift board, create shift, approve/reject swaps (shows employee's response) |
| `/manager/documents` | Document Reviews | Manager-only: approve/reject uploaded employee documents |
| `/notifications` | Notifications | List, filter unread, mark read |
| `/credentials` | My Documents | Upload with document type + note, view review status |

---

## Known Gaps

- No JWT — anyone can act as anyone.
- Push notifications require an open browser tab; nothing arrives if the tab is closed (this is in-app push, not OS-level push — see the WebSocket implementation guide for that distinction).
- Employee's own resolved swap-request history (approved/rejected) isn't displayed — only ones currently needing a response.

---

## Deployment

Same Cloud Run pattern as before — build with both `--build-arg VITE_API_BASE_URL=...` and `--build-arg VITE_NOTIFICATION_WS_URL=...`. The second one needs to point at wherever Notification Service is actually reachable from the public internet once deployed — this needs its own path planning during GCP deployment, since it's not simply "the same Load Balancer address as everything else."
