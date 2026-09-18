# RentHouse CalendMan

Property Rent Management - Calendar and Appointment Scheduling System.

## 📋 Overview

Full-stack web application for managing property rentals with appointment scheduling, real-time calendar management, client communication, and automated email reminders. Built with a NestJS backend, Next.js frontend, and PostgreSQL database, wired together with WebSockets for instant admin panel updates.

## 🚀 Features

### Public Features
- **Property Listings** - Browse available properties on the landing page
- **Online Booking** - 4-step wizard (date → time slot → personal data → confirm) with a monthly availability map
- **Available Days** - Calendar only highlights days that actually have free slots
- **Client Auto-Registration** - The system finds or creates clients automatically
- **Appointment Confirmation** - Clients confirm attendance via a unique link (`/confirm/[token]`)

### Admin Features
- **Owner Management** - Full CRUD via the dedicated `/admin/owners` page
- **Property Management** - Full CRUD via the dedicated `/admin/properties` page (filterable by owner)
- **Client Management** - View and manage the client database
- **Appointment Management** - View, filter (All / Confirmed / Pending), cancel or delete appointments
- **Calendar Management** - Month and day views per property
  - Color-coded days (available / reserved / blocked / mixed)
  - Reserved blocks shown with time range and property address
  - Bulk actions: set whole day as available, reserved, or blocked
  - Custom time slots: generate N slots of X minutes from a time range
  - Click a slot to cycle its type (AVAILABLE → RESERVED → BLOCKED)
- **Travel Time Configuration** - Define travel times between properties
- **Real-time Notifications** - Bell icon with unread badge; instant updates over WebSocket
- **In-app Documentation** - `/admin/docs` page (also available at `docs/admin-docs.md`)

### Real-time (WebSocket)
- **Push events** over `ws://localhost:3000/ws` (JWT-authenticated, admin only)
- Events: `admin:notification`, `appointment:created`, `appointment:updated`, `appointment:cancelled`, `appointment:confirmed`, `appointment:reminder`, `property:updated`, `slot:updated`
- Heartbeat every 30s to purge stale connections; frontend auto-reconnects with exponential backoff
- Admin panel refreshes automatically when data changes anywhere in the system

### Automated Features
- **Email Reminders** - Automatic reminder emails sent 30 minutes before appointments
- **Appointment Confirmation** - Clients confirm attendance via unique email link
- **Confirmation Tracking** - Admin panel shows which appointments are confirmed (green badge)
- **Appointment Cancellation** - Admin can cancel an appointment; the slot is freed and the client is notified
- **Token Cleanup** - Expired confirmation tokens are automatically cleaned every hour

## 🛠️ Tech Stack

### Backend
- **Framework:** NestJS 12
- **Database:** PostgreSQL 16 with Prisma ORM
- **Authentication:** JWT (passport-jwt)
- **Real-time:** `ws` WebSocketServer (mounted on the same HTTP server at `/ws`)
- **Email:** Nodemailer
- **Scheduling:** @nestjs/schedule (cron jobs)
- **Validation:** class-validator / class-transformer
- **API Docs:** Swagger
- **Other:** bcrypt, uuid

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS 3
- **HTTP Client:** Axios (with JWT interceptor)
- **Forms:** React Hook Form
- **Date Handling:** date-fns + custom `lib/date.ts` (DD-MM-YYYY)
- **Utility:** clsx, tailwind-merge

### Infrastructure
- **Containerization:** Docker Compose (PostgreSQL, Backend, Frontend)
- **Database:** PostgreSQL 16

## 📁 Project Structure

```
RentHouse-CalendMan/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/              # JWT authentication + admin guard
│   │   │   ├── owner/             # Owner CRUD
│   │   │   ├── property/          # Property CRUD (public + admin)
│   │   │   ├── client/            # Client CRUD + findOrCreate
│   │   │   ├── appointment/       # Appointment CRUD + confirm + cancel
│   │   │   ├── travel-time/       # Travel time management
│   │   │   ├── calendar/          # Time slots + month view + bulk actions
│   │   │   └── notification/      # Email reminders + cron + notifications
│   │   ├── gateway/               # WebSocket gateway (ws + JWT + heartbeat)
│   │   │   ├── websocket.module.ts
│   │   │   └── websocket.service.ts
│   │   ├── config/
│   │   │   ├── prisma.module.ts
│   │   │   ├── prisma.service.ts
│   │   │   └── date.utils.ts
│   │   ├── app.module.ts
│   │   └── main.ts               # Bootstraps HTTP + WebSocket + Swagger
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   ├── Dockerfile
│   ├── nest-cli.json
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── layout.tsx             # Root layout with providers
│   │   ├── globals.css            # Global styles
│   │   ├── login/page.tsx         # Admin login
│   │   ├── admin/
│   │   │   ├── page.tsx           # Admin dashboard (tabs: Appointments, Owners, Properties, Clients, Calendar)
│   │   │   ├── docs/page.tsx      # In-app documentation
│   │   │   ├── owners/page.tsx    # Owner management (CRUD)
│   │   │   └── properties/page.tsx# Property management (CRUD)
│   │   ├── properties/page.tsx    # Public property listing
│   │   ├── properties/[id]/page.tsx # Property detail
│   │   ├── booking/[id]/page.tsx  # Public 4-step booking wizard
│   │   └── confirm/[token]/page.tsx # Appointment confirmation (public)
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── NotificationSystem.tsx # Notification bell + WebSocket wiring
│   ├── src/hooks/
│   │   └── useWebSocket.ts         # WebSocket hook (auth, reconnect, events)
│   ├── lib/
│   │   ├── api.ts                 # Axios instance + JWT interceptor
│   │   ├── date.ts                # DD-MM-YYYY <-> ISO conversions
│   │   └── types.ts               # TypeScript types + API calls
│   ├── Dockerfile
│   ├── next.config.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docs/
│   └── admin-docs.md              # Full administrative documentation (Spanish)
├── docker-compose.yml
├── package.json                   # Root monorepo config (npm workspaces)
├── AGENTS.md
└── README.md
```

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 16+
- Docker & Docker Compose (optional)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/agrivero95/RentHouse-CalendMan.git
cd RentHouse-CalendMan
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Backend:
```bash
cd backend
cp .env.example .env
# Edit .env with your database and email settings
```

4. **Set up database**
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

5. **Start development servers**

Option A - Both (recommended):
```bash
cd ..
npm run dev
```

Option B - Backend only:
```bash
npm run dev:backend
```

Option B - Frontend only:
```bash
npm run dev:frontend
```

6. **Access the application**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api
- WebSocket: ws://localhost:3000/ws
- Swagger Docs: http://localhost:3000/api/docs

### Docker Deployment

1. **Configure environment variables**
```bash
cd backend
cp .env.example .env
# Edit SMTP settings in .env
```

2. **Start with Docker Compose**
```bash
npm run docker:up
```

3. **Set up database in Docker**
```bash
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma generate
```

4. **Access the application**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api
- Database: localhost:5432

## ⚙️ Configuration

### Environment Variables (`backend/.env`)

```env
# Server
PORT=3000
API_PREFIX=api
CORS_ORIGIN=http://localhost:3001

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rent_house_calendman?schema=public"

# JWT
JWT_SECRET=change-this-to-a-secure-secret-in-production
JWT_EXPIRATION=86400

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=RentHouse CalendMan <noreply@renthouse-calendman.com>
FRONTEND_URL=http://localhost:3001

# Email Reminders
REMINDER_ENABLED=true
REMINDER_INTERVAL_MINUTES=5
REMINDER_MINUTES_BEFORE=30
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password as `SMTP_PASS`

## 📅 Date Convention

All date values are handled as **DD-MM-YYYY** (4-digit year), converted to/from ISO on the frontend with `lib/date.ts` (`toBackend` / `toFrontend`). Time values are plain `HH:mm` strings.

## 📊 Database Schema

### Entities

- **Owner** - email, phone, name, lastName1, lastName2, picture → has many Properties
- **Property** - ownerId, address, description, pictures → belongs to Owner; has many Appointments, TimeSlots, TravelTimes
- **Client** - name, lastName1, lastName2, email, phone, picture → has many Appointments
- **Appointment** - dateSet, timeSet, duration, clientId, propertyId, status, notes
  - Status: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`
- **TimeSlot** - propertyId, date, startTime, endTime, type
  - Type: `AVAILABLE`, `RESERVED`, `BLOCKED`
- **TravelTime** - propertyId1, propertyId2, duration (connects two Properties)
- **Notification** - appointmentId, recipientId, recipientType, type, title, message, status, data
  - Status: `PENDING`, `SENT`, `READ`
  - Types: `APPOINTMENT_REMINDER`, `APPOINTMENT_CONFIRMED`, `APPOINTMENT_CANCELLED`, `SYSTEM`
- **EmailLog** - to, subject, body, appointmentId, status (pending/sent/failed), error, sentAt
- **ConfirmationToken** - appointmentId, token, expiresAt, usedAt (tokens expire after 24h)
- **AdminUser** - username, password, email, role

## 🔐 Authentication

### Admin Login
1. Navigate to http://localhost:3001/login
2. Enter admin username and password
3. JWT token is stored in localStorage
4. All admin endpoints require a Bearer token; the WebSocket requires the same token via `?token=` query param on `ws://.../ws`

### JWT Token
- Generated on login with the `admin` role
- Stored in browser localStorage and sent by the Axios interceptor
- Expires after 24 hours (configurable via `JWT_EXPIRATION`)

## ⚡ WebSocket Events

| Event | Trigger |
|-------|---------|
| `admin:notification` | New admin notification created |
| `appointment:created` | Appointment created (booking) |
| `appointment:updated` | Appointment updated |
| `appointment:cancelled` | Appointment cancelled |
| `appointment:confirmed` | Client confirmed an appointment |
| `appointment:reminder` | Reminder email sent by cron |
| `property:updated` | Property created/updated/deleted |
| `slot:updated` | Time slot changed / calendar modified |

The frontend listens to these events and refreshes the admin panel or the notification bell instantly.

## 📱 User Flow

### Client Booking Flow
1. Visit the public property listing page
2. Select a property
3. Click "Agendar Cita"
4. **Step 1:** Pick an available date from the monthly availability map
5. **Step 2:** Choose a free time slot
6. **Step 3:** Fill in personal information (system does `findOrCreate` on submit)
7. **Step 4:** Review and confirm → appointment created with `PENDING` status
8. Confirmation email with a unique link is generated (sent ~30 min before the appointment)
9. Client clicks the link (`/confirm/[token]`) to mark attendance
10. Status changes to `CONFIRMED`; admin sees a green badge and a real-time notification

### Admin Workflow
1. Login to the admin panel
2. Manage owners (`/admin/owners`) and properties (`/admin/properties`)
3. Configure calendar availability per property (month/day views, bulk actions, custom slots)
4. Block time slots for personal use (RESERVED) or make them unavailable (BLOCKED)
5. View all appointments with status indicators and confirmation badges
6. Cancel or delete appointments as needed
7. Re-send reminders manually if needed
8. Monitor notifications via the bell (real-time)

## 🎨 Admin Panel Features

### Dashboard
- **Total Appointments** - Card showing the total count
- **Confirmed Appointments** - Card with green accent
- **Pending Appointments** - Card with yellow accent

### Appointments Tab
- Filter by status: All, Confirmed, Pending
- Confirmation column showing whether the client confirmed
- Green row highlight for confirmed appointments
- Client, property, date and time columns
- **Cancel** (frees the slot + notifies the client) and **Delete** (permanent) actions

### Calendar Tab
- **Month view:** color-coded days per property; reserved/blocked blocks show time range + address
- **Day view:** property + date picker, "Load Slots", quick actions per day
- Quick actions: set all day as Available / Reserved / Blocked, or create custom time slots
- Click a slot to cycle AVAILABLE → RESERVED → BLOCKED; delete slots individually
- "Slots by Property" summary grid per month

### Owners / Properties Tabs
- Summary tables linking to the dedicated management pages with full CRUD forms

### Clients Tab
- Client database with contact information and creation date

### Notifications
- Bell icon in the navigation bar
- Unread count badge
- Real-time updates via WebSocket (plus a 30s polling fallback)
- Click to view the notification panel and mark items as read

## 🔧 API Documentation

Full API documentation is available at:
- **Swagger UI:** http://localhost:3000/api/docs
- **OpenAPI JSON:** http://localhost:3000/api/docs-json

### Key Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /auth/login | POST | No | Admin login |
| /auth/register | POST | No | Register admin |
| /owners | CRUD | Admin | Owner management |
| /properties/public | GET | No | Public property list |
| /properties | CRUD | Admin | Property management |
| /properties/owner/:ownerId | GET | Admin | Properties by owner |
| /clients/find-or-create | POST | No | Client lookup/create |
| /clients/email?email= | GET | Admin | Find client by email |
| /appointments | CRUD | Admin | Appointment management |
| /appointments/:id/cancel | POST | Admin | Cancel appointment (frees slot, notifies client) |
| /appointments/confirm/:token | POST | No | Public confirmation |
| /appointments/available-slots/:propertyId?date= | GET | No | Available slots for a date |
| /calendar/slots | CRUD | Admin | Time slot management |
| /calendar/block/:propertyId?date=&type= | POST | Admin | Block/reserve whole day |
| /calendar/custom-slots | POST | Admin | Generate N custom slots |
| /calendar/month?startDate=&endDate= | GET | Admin | All slots in a month range |
| /calendar/available-days/:propertyId?startDate=&endDate= | GET | No | Days with free slots |
| /travel-times | CRUD | Admin | Travel time management |
| /notifications/admin | GET | Admin | Admin notifications |
| /notifications/pending-confirmation | GET | Admin | Pending appointments |
| /notifications/send-reminder/:appointmentId | POST | Admin | Re-send reminder |

## 🔄 Cron Jobs

### Appointment Reminder
- **Schedule:** Every 5 minutes (`*/5 * * * *`)
- **Function:** Checks for appointments within the next 30–120 minutes
- **Action:** Sends the reminder email with the confirmation link and broadcasts `appointment:reminder`
- **Tracking:** Keeps an in-memory set to avoid duplicate sends (entries expire after the appointment)

### Token Cleanup
- **Schedule:** Every hour (`0 * * * *`)
- **Function:** Deletes expired confirmation tokens
- **Condition:** Tokens not used and past their expiration date

## 🐛 Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env`
2. Verify `SMTP_HOST` and `SMTP_PORT`
3. For Gmail, use an App Password (not your regular password)
4. Check the `EmailLog` table for error messages

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Run `npx prisma generate` to regenerate the client
4. Run `npx prisma migrate dev` to sync the schema

### Real-time Updates Not Appearing
1. Confirm you are logged in as admin (WebSocket requires a JWT token)
2. Check the backend logs for `WebSocket server initialized on /ws`
3. Verify `NEXT_PUBLIC_API_URL` points to the correct origin (the client derives the WS URL from it)
4. The bell still polls every 30s as a fallback

### Docker Issues
1. Run `docker-compose down -v` to clean up
2. Run `docker-compose build --no-cache` to rebuild
3. Check `docker-compose logs backend` for errors

### Port Conflicts
- Backend default: 3000
- Frontend default: 3001
- Database default: 5432
- Change in `.env` and `docker-compose.yml` if needed

## 📝 Development Notes

### Running Prisma Studio
```bash
cd backend
npx prisma studio
```

### Generating Prisma Client
```bash
cd backend
npx prisma generate
```

### Creating Migration
```bash
cd backend
npx prisma migrate dev --name migration_name
```

### Resetting Database
```bash
cd backend
npx prisma migrate reset
```

## 📄 License

This project is private and confidential.

## 👥 Support

For issues or questions:
1. Check Swagger docs at `/api/docs`
2. Review `docs/admin-docs.md` (Spanish) or the in-app `/admin/docs` page
3. Review this README
4. Check `backend/.env.example` for configuration options