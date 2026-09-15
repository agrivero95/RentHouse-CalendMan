# RentHouse CalendMan

Property Rent Management - Calendar and Appointment Scheduling System.

## 📋 Overview

A full-stack web application for managing property rentals with appointment scheduling, calendar management, and client communication. Built with NestJS backend, Next.js frontend, and PostgreSQL database.

## 🚀 Features

### Public Features
- **Property Listings** - Browse available properties
- **Online Booking** - Schedule appointments directly from the website
- **Client Auto-Registration** - System finds or creates clients automatically

### Admin Features
- **Owner Management** - CRUD operations for property owners
- **Property Management** - CRUD operations for properties
- **Client Management** - View and manage client database
- **Appointment Management** - View, filter, and manage all appointments
- **Calendar Management** - Set available/blocked time slots per property
- **Travel Time Configuration** - Define travel times between properties
- **Real-time Notifications** - Bell icon with unread count updates every 30 seconds

### Automated Features
- **Email Reminders** - Automatic reminder emails sent 30 minutes before appointments
- **Appointment Confirmation** - Clients confirm attendance via unique email link
- **Confirmation Tracking** - Admin panel shows which appointments are confirmed
- **Token Cleanup** - Expired confirmation tokens are automatically cleaned up

## 🛠️ Tech Stack

### Backend
- **Framework:** NestJS
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (passport-jwt)
- **Email:** Nodemailer
- **Scheduling:** @nestjs/schedule (cron jobs)
- **Validation:** class-validator / class-transformer
- **API Docs:** Swagger

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **HTTP Client:** Axios
- **Date Handling:** date-fns

### Infrastructure
- **Containerization:** Docker Compose
- **Database:** PostgreSQL 16

## 📁 Project Structure

```
RentHouse-CalendMan/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/              # JWT authentication
│   │   │   ├── owner/             # Owner CRUD
│   │   │   ├── property/          # Property CRUD
│   │   │   ├── client/            # Client CRUD + findOrCreate
│   │   │   ├── appointment/       # Appointment CRUD + confirm
│   │   │   ├── travel-time/       # Travel time management
│   │   │   ├── calendar/          # Time slot management
│   │   │   └── notification/      # Email + in-app notifications
│   │   ├── config/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
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
│   │   ├── admin/page.tsx         # Admin dashboard
│   │   ├── properties/page.tsx    # Property listing
│   │   ├── properties/[id]/page.tsx  # Property detail
│   │   ├── booking/[id]/page.tsx    # Booking form
│   │   └── confirm/page.tsx       # Appointment confirmation
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── NotificationSystem.tsx
│   ├── lib/
│   │   ├── api.ts                 # Axios instance
│   │   └── types.ts               # TypeScript types + API calls
│   ├── Dockerfile
│   ├── next.config.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docker-compose.yml
├── package.json
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
git clone <repository-url>
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

### Email Setup (SMTP)

To enable email reminders, configure SMTP in `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=RentHouse CalendMan <noreply@renthouse-calendman.com>
FRONTEND_URL=http://localhost:3001
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password as `SMTP_PASS`

### JWT Configuration
```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400
```

### Database
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rent_house_calendman
```

## 📊 Database Schema

### Entities

**Owner**
- id, email, phone, name, lastName1, lastName2, picture
- Relations: has many Properties

**Property**
- id, ownerId, address, description, pictures
- Relations: belongs to Owner, has many Appointments

**Client**
- id, name, lastName1, lastName2, email, phone, picture
- Relations: has many Appointments

**Appointment**
- id, createdAt, dateSet, timeSet, duration, clientId, propertyId, status, notes
- Status: PENDING, CONFIRMED, CANCELLED, COMPLETED
- Relations: belongs to Client and Property

**TimeSlot**
- id, propertyId, date, startTime, endTime, type
- Type: AVAILABLE, RESERVED, BLOCKED

**TravelTime**
- id, propertyId1, propertyId2, duration
- Relations: connects two Properties

**Notification**
- id, appointmentId, recipientId, recipientType, type, title, message, status
- Status: PENDING, SENT, READ
- Types: APPOINTMENT_REMINDER, APPOINTMENT_CONFIRMED, APPOINTMENT_CANCELLED, SYSTEM

**EmailLog**
- id, to, subject, body, appointmentId, status, error, sentAt
- Status: pending, sent, failed

**ConfirmationToken**
- id, appointmentId, token, expiresAt, usedAt
- Tokens expire after 24 hours

**AdminUser**
- id, username, password, email, role
- Role: admin

## 🔐 Authentication

### Admin Login
1. Navigate to http://localhost:3001/login
2. Enter admin username and password
3. JWT token is stored in localStorage
4. All admin endpoints require Bearer token

### JWT Token
- Generated on login with admin role
- Stored in browser localStorage
- Used automatically by Axios interceptor
- Expires after 24 hours (configurable)

## 📱 User Flow

### Client Booking Flow
1. Visit public property listing page
2. Select a property
3. Click "Book Appointment"
4. Choose date and available time slot
5. Fill in personal information
6. System checks if client exists (findOrCreate)
7. Creates appointment with PENDING status
8. Sends reminder email 30 minutes before
9. Client receives confirmation email with link
10. Client clicks link to confirm attendance
11. Appointment status changes to CONFIRMED
12. Admin sees confirmation badge in dashboard

### Admin Workflow
1. Login to admin panel
2. Manage owners, properties, and clients
3. Set calendar availability per property
4. Block time slots for personal use
5. View all appointments with status indicators
6. See which appointments are confirmed (green badge)
7. Send manual reminder if needed
8. Monitor notifications

## 🎨 Admin Panel Features

### Dashboard
- **Total Appointments** - Card showing total count
- **Confirmed Appointments** - Card with green accent
- **Pending Appointments** - Card with yellow accent

### Appointments Tab
- Filter by status: All, Confirmed, Pending
- Confirmation column showing client confirmation status
- Green row highlight for confirmed appointments
- Client and property information

### Properties Tab
- Full property listing with owner details
- Creation date

### Clients Tab
- Client database with contact information
- Creation date

### Notifications
- Bell icon in navigation bar
- Unread count badge
- Real-time updates every 30 seconds
- Click to view notification panel

## 🔧 API Documentation

Full API documentation is available at:
- **Swagger UI:** http://localhost:3000/api/docs
- **OpenAPI JSON:** http://localhost:3000/api/docs/json

### Key Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /auth/login | POST | No | Admin login |
| /auth/register | POST | No | Register admin |
| /owners | CRUD | Admin | Owner management |
| /properties/public | GET | No | Public property list |
| /properties | CRUD | Admin | Property management |
| /clients/find-or-create | POST | No | Client lookup/create |
| /appointments | CRUD | Admin | Appointment management |
| /appointments/confirm/:token | POST | No | Public confirmation |
| /calendar/slots | CRUD | Admin | Time slot management |
| /calendar/block/:id | POST | Admin | Block property slots |
| /notifications/admin | GET | Admin | Get admin notifications |
| /notifications/pending-confirmation | GET | Admin | Pending appointments |

## 🔄 Cron Jobs

### Appointment Reminder
- **Schedule:** Every 5 minutes
- **Function:** Checks for appointments within 30 minutes
- **Action:** Sends reminder email with confirmation link
- **Tracking:** Marks appointments as checked to avoid duplicates

### Token Cleanup
- **Schedule:** Every hour
- **Function:** Deletes expired confirmation tokens
- **Condition:** Tokens not used and past expiration date

## 🐛 Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env`
2. Verify SMTP_HOST and SMTP_PORT
3. For Gmail, use App Password (not regular password)
4. Check `EmailLog` table for error messages

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Run `npx prisma generate` to regenerate client
4. Run `npx prisma migrate dev` to sync schema

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
2. Review this README
3. Check `backend/.env.example` for configuration options
