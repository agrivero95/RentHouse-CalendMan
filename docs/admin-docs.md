# Documentación Administrativa - RentHouse CalendMan

## Índice

1. [Panel de Administración](#1-panel-de-administración)
2. [Gestión de Propietarios](#2-gestión-de-propietarios)
3. [Gestión de Propiedades](#3-gestión-de-propiedades)
4. [Gestión de Clientes](#4-gestión-de-clientes)
5. [Gestión de Citas](#5-gestión-de-citas)
6. [Calendario y Horarios](#6-calendario-y-horarios)
7. [Tiempo de Desplazamiento](#7-tiempo-de-desplazamiento)
8. [Sistema de Notificaciones](#8-sistema-de-notificaciones)
9. [Recordatorios Automáticos](#9-recordatorios-automáticos)
10. [Confirmación de Citas](#10-confirmación-de-citas)
11. [Logs de Email](#11-logs-de-email)
12. [Configuración del Sistema](#12-configuración-del-sistema)

---

## 1. Panel de Administración

### Acceso
- **URL:** http://localhost:3001/login
- **Ruta:** `/login`

### Funciones del Panel
- **Dashboard** con estadísticas en tiempo real
  - Total de citas
  - Citas confirmadas
  - Citas pendientes
- **Tabs de navegación**
  - Appointments - Gestión de citas
  - Properties - Gestión de propiedades
  - Clients - Gestión de clientes
- **Notificaciones** - Campana con contador de no leídas

### Autenticación
```
POST /api/auth/login
Body: { username: string, password: string }
Response: { access_token: string, user: object }
```

### Registro de Administradores
```
POST /api/auth/register
Body: { username: string, password: string, email: string }
Response: { id: string, username: string, email: string }
```

---

## 2. Gestión de Propietarios

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/owners` | Listar todos los propietarios |
| GET | `/api/owners/:id` | Obtener propietario por ID |
| POST | `/api/owners` | Crear nuevo propietario |
| PUT | `/api/owners/:id` | Actualizar propietario |
| DELETE | `/api/owners/:id` | Eliminar propietario |

### Crear Propietario
```
POST /api/owners
Body: {
  email: string (required, unique),
  phone: string (required),
  name: string (required),
  lastName1: string (required),
  lastName2?: string (optional),
  picture?: string (optional)
}
```

### Actualizar Propietario
```
PUT /api/owners/:id
Body: {
  email?: string,
  phone?: string,
  name?: string,
  lastName1?: string,
  lastName2?: string,
  picture?: string
}
```

### Respuesta (Owner)
```json
{
  "id": "uuid",
  "email": "owner@example.com",
  "phone": "+1234567890",
  "name": "Juan",
  "lastName1": "Pérez",
  "lastName2": "García",
  "picture": "url-to-image",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "properties": []
}
```

---

## 3. Gestión de Propiedades

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/properties` | Listar todas las propiedades (admin) |
| GET | `/api/properties/public` | Listar propiedades (público) |
| GET | `/api/properties/:id` | Obtener propiedad por ID |
| POST | `/api/properties` | Crear nueva propiedad |
| PUT | `/api/properties/:id` | Actualizar propiedad |
| DELETE | `/api/properties/:id` | Eliminar propiedad |
| GET | `/api/properties/owner/:ownerId` | Obtener propiedades por propietario |

### Crear Propiedad
```
POST /api/properties
Body: {
  ownerId: string (UUID, required),
  address: string (required),
  description?: string (optional),
  pictures?: string (optional, JSON)
}
```

### Actualizar Propiedad
```
PUT /api/properties/:id
Body: {
  ownerId?: string,
  address?: string,
  description?: string,
  pictures?: string
}
```

### Respuesta (Property)
```json
{
  "id": "uuid",
  "ownerId": "uuid",
  "owner": {
    "name": "Juan",
    "lastName1": "Pérez",
    "email": "owner@example.com"
  },
  "address": "Calle Principal 123",
  "description": "Descripción de la propiedad",
  "pictures": "[\"url1\", \"url2\"]",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

## 4. Gestión de Clientes

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/clients` | Listar todos los clientes (admin) |
| GET | `/api/clients/:id` | Obtener cliente por ID |
| POST | `/api/clients` | Crear nuevo cliente (admin) |
| PUT | `/api/clients/:id` | Actualizar cliente |
| DELETE | `/api/clients/:id` | Eliminar cliente |
| GET | `/api/clients/email?email=xxx` | Buscar cliente por email |
| POST | `/api/clients/find-or-create` | Buscar o crear cliente (público) |

### Buscar o Crear Cliente (Booking Flow)
```
POST /api/clients/find-or-create
Body: {
  name: string (required),
  lastName1: string (required),
  lastName2?: string (optional),
  email: string (required, unique),
  phone: string (required),
  picture?: string (optional)
}
Response: {
  client: Client,
  created: boolean
}
```

### Respuesta (Client)
```json
{
  "id": "uuid",
  "name": "Carlos",
  "lastName1": "López",
  "lastName2": "Martínez",
  "email": "client@example.com",
  "phone": "+1234567890",
  "picture": "url-to-image",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "appointments": []
}
```

---

## 5. Gestión de Citas

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/appointments` | Listar todas las citas (admin) |
| GET | `/api/appointments/:id` | Obtener cita por ID |
| POST | `/api/appointments` | Crear nueva cita |
| PUT | `/api/appointments/:id` | Actualizar cita (admin) |
| DELETE | `/api/appointments/:id` | Eliminar cita (admin) |
| GET | `/api/appointments/property/:propertyId?startDate=&endDate=` | Citas por propiedad |
| GET | `/api/appointments/client/:clientId?startDate=&endDate=` | Citas por cliente |
| GET | `/api/appointments/available-slots/:propertyId?date=` | Slots disponibles |
| POST | `/api/appointments/confirm/:token` | Confirmar cita (público) |

### Crear Cita
```
POST /api/appointments
Body: {
  clientId: string (UUID, required),
  propertyId: string (UUID, required),
  dateSet: Date (required),
  timeSet: Date (required),
  duration?: number (default: 15),
  notes?: string (optional)
}
```

### Obtener Slots Disponibles
```
GET /api/appointments/available-slots/:propertyId?date=2024-01-15
Response: {
  slots: [
    {
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      available: true
    }
  ],
  appointments: []
}
```

### Estados de Cita
- **PENDING** - Cita agendada, pendiente de confirmación
- **CONFIRMED** - Cliente confirmó asistencia
- **CANCELLED** - Cita cancelada
- **COMPLETED** - Cita completada

### Respuesta (Appointment)
```json
{
  "id": "uuid",
  "createdAt": "2024-01-01T00:00:00Z",
  "dateSet": "2024-01-15T00:00:00Z",
  "timeSet": "2024-01-15T09:00:00Z",
  "duration": 15,
  "clientId": "uuid",
  "propertyId": "uuid",
  "status": "PENDING",
  "notes": "Notas de la cita",
  "client": { "name": "Carlos", "email": "client@example.com" },
  "property": { "address": "Calle Principal 123" },
  "confirmationToken": {
    "token": "abc123...",
    "expiresAt": "2024-01-02T00:00:00Z",
    "usedAt": null
  },
  "notifications": []
}
```

### Confirmar Cita (Público)
```
POST /api/appointments/confirm/:token
Response: {
  success: true,
  message: "Cita confirmada exitosamente",
  appointment: Appointment
}
```

---

## 6. Calendario y Horarios

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/calendar/slots` | Listar todos los time slots (admin) |
| GET | `/api/calendar/slots/property/:propertyId?startDate=&endDate=` | Slots por propiedad |
| GET | `/api/calendar/available/:propertyId?date=` | Slots disponibles |
| POST | `/api/calendar/slots` | Crear time slot (admin) |
| PUT | `/api/calendar/slots/:id` | Actualizar time slot (admin) |
| DELETE | `/api/calendar/slots/:id` | Eliminar time slot (admin) |
| POST | `/api/calendar/block/:propertyId?date=&type=` | Bloquear/reservar slots (admin) |

### Tipos de TimeSlot
- **AVAILABLE** - Tiempo disponible para agendar
- **RESERVED** - Tiempo reservado para uso personal
- **BLOCKED** - Tiempo bloqueado (no disponible)

### Bloquear/Reservar Tiempo por Propiedad
```
POST /api/calendar/block/:propertyId?date=2024-01-15&type=BLOCKED
Body: null
Response: TimeSlot
```

### Crear Time Slot
```
POST /api/calendar/slots
Body: {
  propertyId: string (UUID, required),
  date: Date (required),
  startTime: Date (required),
  endTime: Date (required),
  type: "AVAILABLE" | "RESERVED" | "BLOCKED" (required)
}
```

### Respuesta (TimeSlot)
```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "date": "2024-01-15T00:00:00Z",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T10:00:00Z",
  "type": "AVAILABLE",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

## 7. Tiempo de Desplazamiento

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/travel-times` | Listar todos los tiempos (admin) |
| GET | `/api/travel-times/property/:propertyId` | Tiempos para propiedad (admin) |
| POST | `/api/travel-times` | Crear tiempo de desplazamiento (admin) |
| DELETE | `/api/travel-times/:id` | Eliminar tiempo de desplazamiento (admin) |

### Crear Tiempo de Desplazamiento
```
POST /api/travel-times
Body: {
  propertyId1: string (UUID, required),
  propertyId2: string (UUID, required),
  duration?: number (default: 15)
}
```

### Respuesta (TravelTime)
```json
{
  "id": "uuid",
  "propertyId1": "uuid",
  "propertyId2": "uuid",
  "duration": 15,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "propertyFrom": { "address": "Calle A 123" },
  "propertyTo": { "address": "Calle B 456" }
}
```

---

## 8. Sistema de Notificaciones

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/notifications/unread/:recipientId/:recipientType` | Notificaciones no leídas |
| GET | `/api/notifications/all/:recipientId/:recipientType` | Todas las notificaciones |
| GET | `/api/notifications/admin` | Notificaciones de admin (admin) |
| GET | `/api/notifications/appointment/:appointmentId` | Notificaciones de cita |
| GET | `/api/notifications/pending-confirmation` | Citas pendientes confirmación (admin) |
| PUT | `/api/notifications/read/:id` | Marcar como leída (admin) |
| POST | `/api/notifications/send-reminder/:appointmentId` | Reenviar recordatorio (admin) |

### Tipos de Notificación
- **APPOINTMENT_REMINDER** - Recordatorio de cita enviada
- **APPOINTMENT_CONFIRMED** - Cita confirmada por cliente
- **APPOINTMENT_CANCELLED** - Cita cancelada
- **SYSTEM** - Notificación del sistema

### Estados de Notificación
- **PENDING** - Pendiente de envío
- **SENT** - Enviada exitosamente
- **READ** - Leída por el destinatario

### Destinatarios
- **CLIENT** - Cliente que agendó la cita
- **ADMIN** - Administrador del sistema

### Reenviar Recordatorio Manual
```
POST /api/notifications/send-reminder/:appointmentId
Response: { success: true }
```

---

## 9. Recordatorios Automáticos

### Configuración
- **Intervalo:** Cada 5 minutos
- **Ventana de tiempo:** Citas dentro de 30 minutos
- **Requisito:** Estado PENDING, email del cliente presente

### Proceso Automático
1. Cron verifica citas en los próximos 30 minutos
2. Para cada cita elegible:
   - Genera token de confirmación único
   - Envía email con enlace de confirmación
   - Crea notificación APPOINTMENT_REMINDER
   - Marca como checked (evita duplicados)
3. Limpieza de tokens expirados cada hora

### Email de Recordatorio
- **Asunto:** Recordatorio: Cita confirmada - [Fecha] a las [Hora]
- **Contenido:**
  - Datos del cliente
  - Fecha y hora formateada
  - Dirección de la propiedad
  - Duración de la cita
  - Botón de confirmación con enlace único
- **Expiración:** 24 horas

### Email de Confirmación
Se envía automáticamente cuando el cliente confirma:
- **Asunto:** Cita Confirmada - [Fecha] a las [Hora]
- **Contenido:**
  - Mensaje de agradecimiento
  - Datos de la cita confirmada

---

## 10. Confirmación de Citas

### Flujo de Confirmación
```
Cliente recibe email → Click en enlace → Validación de token → 
Actualización de estado → Envío de confirmación → Notificación admin
```

### Token de Confirmación
- **Generación:** 64 caracteres alfanuméricos
- **Expiración:** 24 horas desde creación
- **Uso único:** No puede ser reutilizado
- **Almacenamiento:** Tabla ConfirmationToken

### Validación del Token
1. Buscar token por valor
2. Verificar que existe
3. Verificar que no expiró
4. Verificar que no fue usado
5. Actualizar cita a CONFIRMED
6. Marcar token como usado
7. Enviar email de confirmación
8. Crear notificación para admin

### Página de Confirmación
- **URL:** `/confirm/[token]`
- **Estados:**
  - Loading - Procesando confirmación
  - Success - Cita confirmada con detalles
  - Error - Token inválido o expirado

---

## 11. Logs de Email

### Tabla EmailLog
Registra todos los emails enviados por el sistema.

| Campo | Descripción |
|-------|-------------|
| id | UUID único |
| to | Destinatario |
| subject | Asunto del email |
| body | Contenido HTML |
| appointmentId | Cita asociada (nullable) |
| status | pending, sent, failed |
| error | Mensaje de error (si falló) |
| sentAt | Fecha de envío |
| createdAt | Fecha de creación |

### Consultar Logs
```sql
-- Emails enviados exitosamente
SELECT * FROM email_logs WHERE status = 'sent';

-- Emails fallidos
SELECT * FROM email_logs WHERE status = 'failed';

-- Emails por cita
SELECT * FROM email_logs WHERE appointmentId = 'uuid';
```

---

## 12. Configuración del Sistema

### Variables de Entorno (backend/.env)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rent_house_calendman

# JWT
JWT_SECRET=change-this-to-a-secure-secret-in-production
JWT_EXPIRATION=86400

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=RentHouse CalendMan <noreply@renthouse-calendman.com>
FRONTEND_URL=http://localhost:3001

# App
PORT=3000
API_PREFIX=api
CORS_ORIGIN=http://localhost:3001
```

### Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | PostgreSQL database |
| backend | 3000 | NestJS API server |
| frontend | 3001 | Next.js web app |

### Swagger Documentation
- **URL:** http://localhost:3000/api/docs
- **Autenticación:** Click "Authorize" → Bearer token → Token JWT

---

## Guía Rápida de Uso

### 1. Configurar Administrador
```bash
# Registrar primer admin (desde frontend o API)
POST /api/auth/register
{
  "username": "admin",
  "password": "secure-password",
  "email": "admin@renthouse.com"
}
```

### 2. Crear Propietario
- Ir al panel admin → Tab Owners → Crear nuevo
- O usar API: `POST /api/owners`

### 3. Agregar Propiedad
- Ir al panel admin → Tab Properties → Crear nuevo
- Seleccionar propietario existente
- O usar API: `POST /api/properties`

### 4. Configurar Calendario
- Ir al panel admin → Tab Calendar
- Seleccionar propiedad y fecha
- Bloquear tiempo personal (RESERVED/BLOCKED)
- Dejar tiempo disponible (AVAILABLE)

### 5. Monitorear Citas
- Panel admin muestra estadísticas en cards superiores
- Tab Appointments con filtros por estado
- Columna "Confirmation" muestra badge verde si cliente confirmó
- Campana de notificaciones muestra alertas en tiempo real

### 6. Reenviar Recordatorio
- Si el cliente no recibió el email:
  - Panel admin → Notificaciones → Pending Confirmation
  - Buscar cita → Click "Send Reminder"
  - O API: `POST /api/notifications/send-reminder/:appointmentId`

---

## Troubleshooting

### Citas no se confirman
1. Verificar que el enlace en el email es correcto
2. Verificar que el token no expiró (24h)
3. Verificar que la URL frontend es correcta en `.env`

### Emails no se envían
1. Verificar credenciales SMTP en `.env`
2. Para Gmail, usar App Password (no password regular)
3. Revisar tabla `email_logs` para errores
4. Verificar conexión de red al servidor SMTP

### Notificaciones no aparecen
1. Verificar que el cron está corriendo
2. Revisar logs del backend
3. Verificar que la cita está dentro de la ventana de 30 minutos
4. Verificar que el cliente tiene email válido

### Token de confirmación no funciona
1. Verificar que la cita no está cancelada
2. Verificar que el token no fue usado previamente
3. Verificar que el token no expiró
4. Verificar que la URL frontend es correcta
