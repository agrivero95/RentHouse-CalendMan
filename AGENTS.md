# Opencode Agents Instructions

## Project Overview
RentHouse CalendMan - Property Rent Management Calendar and Appointment Scheduling System.
Monorepo with NestJS backend (port 3000) and Next.js frontend (port 3001).

## Tech Stack
- **Backend:** NestJS, Prisma, PostgreSQL, JWT Auth, Nodemailer, @nestjs/schedule
- **Frontend:** Next.js 14 (App Router), React, TailwindCSS, Axios
- **Infrastructure:** Docker Compose (PostgreSQL, Backend, Frontend)

## Commands
```bash
# Install dependencies
npm install

# Run both dev servers
npm run dev

# Run only backend
npm run dev:backend

# Run only frontend
npm run dev:frontend

# Docker
npm run docker:up
npm run docker:down
npm run docker:build

# Database
cd backend && npx prisma generate
cd backend && npx prisma migrate dev
cd backend && npx prisma studio
```

## Project Structure
```
├── backend/src/
│   ├── modules/
│   │   ├── auth/          # JWT login, admin guard
│   │   ├── owner/         # Owner CRUD
│   │   ├── property/      # Property CRUD (public + admin)
│   │   ├── client/        # Client CRUD + findOrCreate
│   │   ├── appointment/   # Appointment CRUD + confirm endpoint
│   │   ├── travel-time/   # Travel time between properties
│   │   ├── calendar/      # Time slot management
│   │   └── notification/  # Email reminders + in-app notifications
│   ├── config/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── app.module.ts
│   └── main.ts
├── frontend/app/
│   ├── page.tsx           # Landing page
│   ├── login/page.tsx     # Admin login
│   ├── admin/page.tsx     # Admin panel
│   ├── properties/page.tsx
│   ├── properties/[id]/
│   ├── booking/[id]/      # Public booking form
│   └── confirm/page.tsx   # Appointment confirmation page
├── docker-compose.yml
└── package.json           # Root monorepo config
```

## API Endpoints
### Auth
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - Register admin user

### Owners
- `GET /api/owners` - List all owners (admin)
- `GET /api/owners/:id` - Get owner (admin)
- `POST /api/owners` - Create owner (admin)
- `PUT /api/owners/:id` - Update owner (admin)
- `DELETE /api/owners/:id` - Delete owner (admin)

### Properties
- `GET /api/properties` - List all properties (admin)
- `GET /api/properties/public` - List public properties (no auth)
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property (admin)
- `PUT /api/properties/:id` - Update property (admin)
- `DELETE /api/properties/:id` - Delete property (admin)
- `GET /api/properties/owner/:ownerId` - Get properties by owner (admin)

### Clients
- `GET /api/clients` - List all clients (admin)
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create client (admin)
- `PUT /api/clients/:id` - Update client (admin)
- `DELETE /api/clients/:id` - Delete client (admin)
- `GET /api/clients/email?email=xxx` - Find client by email
- `POST /api/clients/find-or-create` - Find or create client (used in booking)

### Appointments
- `GET /api/appointments` - List all appointments (admin)
- `GET /api/appointments/:id` - Get appointment details
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment (admin)
- `DELETE /api/appointments/:id` - Delete appointment (admin)
- `GET /api/appointments/property/:propertyId?startDate=&endDate=` - Get by property
- `GET /api/appointments/client/:clientId?startDate=&endDate=` - Get by client
- `GET /api/appointments/available-slots/:propertyId?date=` - Get available slots
- `POST /api/appointments/confirm/:token` - Confirm appointment by token (public)

### Calendar / Time Slots
- `GET /api/calendar/slots` - List all time slots (admin)
- `GET /api/calendar/slots/property/:propertyId?startDate=&endDate=` - Slots by property
- `GET /api/calendar/available/:propertyId?date=` - Available slots
- `POST /api/calendar/slots` - Create time slot (admin)
- `PUT /api/calendar/slots/:id` - Update time slot (admin)
- `DELETE /api/calendar/slots/:id` - Delete time slot (admin)
- `POST /api/calendar/block/:propertyId?date=&type=` - Block/reserve property slots (admin)

### Travel Time
- `GET /api/travel-times` - List all travel times (admin)
- `GET /api/travel-times/property/:propertyId` - Travel times for property (admin)
- `POST /api/travel-times` - Create travel time (admin)
- `DELETE /api/travel-times/:id` - Delete travel time (admin)

### Notifications
- `GET /api/notifications/unread/:recipientId/:recipientType` - Get unread notifications
- `GET /api/notifications/all/:recipientId/:recipientType` - Get all notifications
- `GET /api/notifications/admin` - Get admin notifications (admin)
- `GET /api/notifications/appointment/:appointmentId` - Get appointment notifications
- `GET /api/notifications/pending-confirmation` - Pending confirmations (admin)
- `PUT /api/notifications/read/:id` - Mark as read (admin)
- `POST /api/notifications/send-reminder/:appointmentId` - Resend reminder (admin)

## Key Files
- Prisma schema: `backend/src/prisma/schema.prisma`
- Environment: `backend/.env.example`
- Docker: `docker-compose.yml`

## Important Notes
- All admin endpoints require JWT Bearer token with admin role
- Booking flow: find/create client → create appointment → generate confirmation token → send email
- Cron job runs every 5 minutes to send reminders 30 min before appointments
- Confirmation tokens expire after 24 hours
- SMTP configuration required in .env for email functionality
- Frontend proxies API requests to backend via next.config.js rewrites
