# ShiftSync — Frontend Web Application

**Student Name:** Chamith Bhanuka Widanapathirana  
**Student ID / Number:** 241711051  
**Slack Handle:** Chamith Bhanuka  
**GCP Project ID:** project-a58ee7a4-4913-4af2-a6d  
**Course:** ITS 2130 — Enterprise Cloud Architecture  

---

## Live Deployment & Access URL

- **Production Cloud Run URL**: [https://shiftsync-frontend-571322630475.asia-southeast1.run.app/](https://shiftsync-frontend-571322630475.asia-southeast1.run.app/)
- **Regional Load Balancer (HTTP)**: `http://34.1.204.172:80`

---

## Description

Modern corporate React frontend for ShiftSync — an enterprise shift roster and workforce management system. Built with React 18, Vite, and Tailwind CSS. Features real-time WebSocket/STOMP push notifications, FontAwesome vector icon system, role-based workflows for staff and managers, document verification management, and seamless integration with the ShiftSync microservices platform.

---

## Technology Stack

- **Framework**: React 18 (Vite)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS, Vanilla CSS, Plus Jakarta Sans & Inter typography
- **Icons**: FontAwesome 6 (zero emojis)
- **Real-Time Communication**: `@stomp/stompjs` + `sockjs-client`
- **HTTP Client**: Axios

---

## Architectural Highlights

- **Direct WebSocket & REST Routing**: REST requests route via the API Gateway (`/api/...`), while real-time STOMP WebSockets connect directly to the Notification Service (`/ws`), delivering instant push toasts and unread counter badges.
- **Corporate UI / UX**: Clean, neutral color palette with subtle ambient depth, distinct status badges, and intuitive schedule boards.
- **Cloud Run Deployment**: Containerized with NGINX Alpine on Google Cloud Run and exposed through Google Cloud Load Balancing (`lb-webapp`).

---

## Getting Started

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.
