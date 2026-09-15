'use client';

import { useState } from 'react';
import Link from 'next/link';

const sections = [
  {
    id: 'panel',
    title: 'Panel de Administración',
    icon: '🏠',
    content: [
      {
        subtitle: 'Acceso',
        items: [
          'URL: /login',
          'Ruta: http://localhost:3001/login',
        ],
      },
      {
        subtitle: 'Funciones del Panel',
        items: [
          'Dashboard con estadísticas en tiempo real',
          'Tabs de navegación: Appointments, Properties, Clients',
          'Notificaciones con campana y contador',
          'Actualización automática cada 30 segundos',
        ],
      },
      {
        subtitle: 'Cards de Estadísticas',
        items: [
          'Total de citas - Card con borde azul',
          'Citas confirmadas - Card con borde verde',
          'Citas pendientes - Card con borde amarillo',
        ],
      },
    ],
  },
  {
    id: 'auth',
    title: 'Autenticación',
    icon: '🔐',
    content: [
      {
        subtitle: 'Login de Administrador',
        items: [
          'POST /api/auth/login',
          'Body: { username, password }',
          'Response: { access_token, user }',
        ],
      },
      {
        subtitle: 'Registro de Administradores',
        items: [
          'POST /api/auth/register',
          'Body: { username, password, email }',
          'Response: { id, username, email }',
        ],
      },
      {
        subtitle: 'Token JWT',
        items: [
          'Generado en el login con rol admin',
          'Almacenado en localStorage del navegador',
          'Usado automáticamente por Axios interceptor',
          'Expira después de 24 horas (configurable)',
          'Todos los endpoints admin requieren Bearer token',
        ],
      },
    ],
  },
  {
    id: 'owners',
    title: 'Gestión de Propietarios',
    icon: '👤',
    content: [
      {
        subtitle: 'Endpoints',
        items: [
          'GET /api/owners - Listar todos (admin)',
          'GET /api/owners/:id - Obtener por ID (admin)',
          'POST /api/owners - Crear nuevo (admin)',
          'PUT /api/owners/:id - Actualizar (admin)',
          'DELETE /api/owners/:id - Eliminar (admin)',
        ],
      },
      {
        subtitle: 'Crear Propietario',
        items: [
          'email: string (required, unique)',
          'phone: string (required)',
          'name: string (required)',
          'lastName1: string (required)',
          'lastName2?: string (optional)',
          'picture?: string (optional)',
        ],
      },
      {
        subtitle: 'Estructura de Datos',
        items: [
          'id: UUID autogenerado',
          'email: correo único',
          'phone: número de teléfono',
          'name: primer nombre',
          'lastName1: primer apellido',
          'lastName2: segundo apellido (opcional)',
          'picture: URL de foto (opcional)',
          'createdAt: fecha de creación',
          'updatedAt: fecha de actualización',
        ],
      },
    ],
  },
  {
    id: 'properties',
    title: 'Gestión de Propiedades',
    icon: '🏢',
    content: [
      {
        subtitle: 'Endpoints',
        items: [
          'GET /api/properties - Listar todas (admin)',
          'GET /api/properties/public - Listar público (sin auth)',
          'GET /api/properties/:id - Obtener por ID',
          'POST /api/properties - Crear nueva (admin)',
          'PUT /api/properties/:id - Actualizar (admin)',
          'DELETE /api/properties/:id - Eliminar (admin)',
          'GET /api/properties/owner/:ownerId - Por propietario (admin)',
        ],
      },
      {
        subtitle: 'Crear Propiedad',
        items: [
          'ownerId: UUID del propietario (required)',
          'address: dirección completa (required)',
          'description?: texto descriptivo (optional)',
          'pictures?: array de URLs JSON (optional)',
        ],
      },
      {
        subtitle: 'Relaciones',
        items: [
          'Pertenece a un Owner (ownerId)',
          'Tiene muchas Appointments',
          'Relación bidireccional con TravelTime',
        ],
      },
    ],
  },
  {
    id: 'clients',
    title: 'Gestión de Clientes',
    icon: '👥',
    content: [
      {
        subtitle: 'Endpoints',
        items: [
          'GET /api/clients - Listar todos (admin)',
          'GET /api/clients/:id - Obtener por ID',
          'POST /api/clients - Crear nuevo (admin)',
          'PUT /api/clients/:id - Actualizar (admin)',
          'DELETE /api/clients/:id - Eliminar (admin)',
          'GET /api/clients/email?email=xxx - Buscar por email',
          'POST /api/clients/find-or-create - Buscar o crear (público)',
        ],
      },
      {
        subtitle: 'Buscar o Crear (Booking Flow)',
        items: [
          'POST /api/clients/find-or-create',
          'Primero busca por email',
          'Si existe: retorna el cliente existente',
          'Si no existe: crea nuevo y lo retorna',
          'Response: { client, created: boolean }',
        ],
      },
      {
        subtitle: 'Estructura de Datos',
        items: [
          'id: UUID autogenerado',
          'name: primer nombre (required)',
          'lastName1: primer apellido (required)',
          'lastName2?: segundo apellido (optional)',
          'email: correo único (required)',
          'phone: número de teléfono (required)',
          'picture?: URL de foto (optional)',
        ],
      },
    ],
  },
  {
    id: 'appointments',
    title: 'Gestión de Citas',
    icon: '📅',
    content: [
      {
        subtitle: 'Endpoints',
        items: [
          'GET /api/appointments - Listar todas (admin)',
          'GET /api/appointments/:id - Obtener por ID',
          'POST /api/appointments - Crear nueva',
          'PUT /api/appointments/:id - Actualizar (admin)',
          'DELETE /api/appointments/:id - Eliminar (admin)',
          'GET /api/appointments/property/:id?startDate=&endDate= - Por propiedad',
          'GET /api/appointments/client/:id?startDate=&endDate= - Por cliente',
          'GET /api/appointments/available-slots/:id?date= - Slots disponibles',
          'POST /api/appointments/confirm/:token - Confirmar (público)',
        ],
      },
      {
        subtitle: 'Crear Cita',
        items: [
          'clientId: UUID del cliente (required)',
          'propertyId: UUID de la propiedad (required)',
          'dateSet: fecha de la cita (required)',
          'timeSet: hora de la cita (required)',
          'duration?: minutos, default 15 (optional)',
          'notes?: texto libre (optional)',
        ],
      },
      {
        subtitle: 'Estados de Cita',
        items: [
          'PENDING - Agendada, pendiente de confirmación',
          'CONFIRMED - Cliente confirmó asistencia',
          'CANCELLED - Cita cancelada',
          'COMPLETED - Cita completada',
        ],
      },
      {
        subtitle: 'Indicadores Visuales en Admin',
        items: [
          'Card verde: Total de citas confirmadas',
          'Card amarilla: Citas pendientes',
          'Badge verde en tabla: ✓ Cliente confirmó',
          'Fila resaltada en verde: citas confirmadas',
          'Columna "Confirmation": estado de confirmación',
        ],
      },
    ],
  },
  {
    id: 'calendar',
    title: 'Calendario y Horarios',
    icon: '🗓️',
    content: [
      {
        subtitle: 'Endpoints',
        items: [
          'GET /api/calendar/slots - Listar todos (admin)',
          'GET /api/calendar/slots/property/:id?startDate=&endDate= - Por propiedad',
          'GET /api/calendar/available/:id?date= - Slots disponibles',
          'POST /api/calendar/slots - Crear slot (admin)',
          'PUT /api/calendar/slots/:id - Actualizar (admin)',
          'DELETE /api/calendar/slots/:id - Eliminar (admin)',
          'POST /api/calendar/block/:id?date=&type= - Bloquear (admin)',
        ],
      },
      {
        subtitle: 'Tipos de TimeSlot',
        items: [
          'AVAILABLE - Tiempo disponible para agendar',
          'RESERVED - Tiempo reservado para uso personal',
          'BLOCKED - Tiempo bloqueado (no disponible)',
        ],
      },
      {
        subtitle: 'Bloquear/Reservar Tiempo',
        items: [
          'POST /api/calendar/block/:propertyId',
          'Query params: date, type (BLOCKED o RESERVED)',
          'Bloquea todo el día de la propiedad',
          'Admin puede decidir qué tiempo es personal vs disponible',
        ],
      },
      {
        subtitle: 'Horario de Negocio',
        items: [
          'Mañana: 9:00 AM - 12:00 PM',
          'Tarde: 2:00 PM - 6:00 PM',
          'Slots de 1 hora de duración',
          'Se calculan automáticamente al consultar disponibles',
        ],
      },
    ],
  },
  {
    id: 'travel-time',
    title: 'Tiempo de Desplazamiento',
    icon: '🚗',
    content: [
      {
        subtitle: 'Endpoints',
        items: [
          'GET /api/travel-times - Listar todos (admin)',
          'GET /api/travel-times/property/:id - Por propiedad (admin)',
          'POST /api/travel-times - Crear (admin)',
          'DELETE /api/travel-times/:id - Eliminar (admin)',
        ],
      },
      {
        subtitle: 'Configurar Tiempo de Desplazamiento',
        items: [
          'propertyId1: UUID de propiedad origen (required)',
          'propertyId2: UUID de propiedad destino (required)',
          'duration?: minutos, default 15 (optional)',
          'Define el tiempo de viaje entre dos propiedades',
          'Usado para calcular disponibilidad real',
        ],
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Sistema de Notificaciones',
    icon: '🔔',
    content: [
      {
        subtitle: 'Endpoints',
        items: [
          'GET /api/notifications/unread/:id/:type - No leídas',
          'GET /api/notifications/all/:id/:type - Todas',
          'GET /api/notifications/admin - Admin (admin)',
          'GET /api/notifications/appointment/:id - Por cita',
          'GET /api/notifications/pending-confirmation - Pendientes (admin)',
          'PUT /api/notifications/read/:id - Marcar leída (admin)',
          'POST /api/notifications/send-reminder/:id - Reenviar (admin)',
        ],
      },
      {
        subtitle: 'Tipos de Notificación',
        items: [
          'APPOINTMENT_REMINDER - Recordatorio enviado al cliente',
          'APPOINTMENT_CONFIRMED - Cliente confirmó asistencia',
          'APPOINTMENT_CANCELLED - Cita cancelada',
          'SYSTEM - Notificación del sistema',
        ],
      },
      {
        subtitle: 'Estados de Notificación',
        items: [
          'PENDING - Pendiente de envío',
          'SENT - Enviada exitosamente',
          'READ - Leída por el destinatario',
        ],
      },
      {
        subtitle: 'Destinatarios',
        items: [
          'CLIENT - Cliente que agendó la cita',
          'ADMIN - Administrador del sistema',
        ],
      },
      {
        subtitle: 'Notificación en Frontend',
        items: [
          'Campana en la barra de navegación',
          'Contador de no leídas en tiempo real',
          'Actualización automática cada 30 segundos',
          'Panel desplegable al hacer clic',
        ],
      },
    ],
  },
  {
    id: 'reminders',
    title: 'Recordatorios Automáticos',
    icon: '⏰',
    content: [
      {
        subtitle: 'Cron Job - Appointment Reminder',
        items: [
          'Ejecución: Cada 5 minutos',
          'Busca citas con estado PENDING',
          'Ventana: Citas dentro de 30 minutos a 2 horas',
          'Para cada cita elegible:',
        ],
      },
      {
        subtitle: 'Proceso de Envío',
        items: [
          '1. Genera token de confirmación único (64 caracteres)',
          '2. Crea URL de confirmación: /confirm/[token]',
          '3. Envía email HTML con template profesional',
          '4. Crea notificación APPOINTMENT_REMINDER',
          '5. Marca como checked (evita duplicados)',
        ],
      },
      {
        subtitle: 'Email de Recordatorio',
        items: [
          'Asunto: Recordatorio: Cita confirmada - [Fecha] a las [Hora]',
          'Contenido:',
          '- Datos del cliente',
          '- Fecha y hora formateada',
          '- Dirección de la propiedad',
          '- Duración de la cita',
          '- Botón verde "Confirmar Asistencia"',
          '- Enlace único con token',
          '- Nota: "Este enlace expira en 24 horas"',
        ],
      },
      {
        subtitle: 'Cron Job - Token Cleanup',
        items: [
          'Ejecución: Cada hora',
          'Elimina tokens expirados no usados',
          'Condición: expiresAt < now AND usedAt IS NULL',
        ],
      },
      {
        subtitle: 'Configuración',
        items: [
          'SMTP_HOST - Servidor SMTP',
          'SMTP_PORT - Puerto (587 TLS)',
          'SMTP_USER - Usuario SMTP',
          'SMTP_PASS - Contraseña/App Password',
          'SMTP_FROM - Remitente',
          'FRONTEND_URL - URL del frontend',
          'REMINDER_ENABLED - Activar/desactivar',
          'REMINDER_INTERVAL_MINUTES - Intervalo (default 5)',
          'REMINDER_MINUTES_BEFORE - Minutos antes (default 30)',
        ],
      },
    ],
  },
  {
    id: 'confirmation',
    title: 'Confirmación de Citas',
    icon: '✅',
    content: [
      {
        subtitle: 'Flujo de Confirmación',
        items: [
          '1. Cliente recibe email de recordatorio',
          '2. Click en botón "Confirmar Asistencia"',
          '3. Redirección a /confirm/[token]',
          '4. Validación del token por backend',
          '5. Actualización de estado a CONFIRMED',
          '6. Envío de email de confirmación',
          '7. Notificación al admin',
        ],
      },
      {
        subtitle: 'Validación del Token',
        items: [
          'POST /api/appointments/confirm/:token',
          'Verifica que el token existe',
          'Verifica que no expiró (24 horas)',
          'Verifica que no fue usado previamente',
          'Si válido: actualiza cita y envía confirmación',
          'Si inválido: error con mensaje descriptivo',
        ],
      },
      {
        subtitle: 'Página de Confirmación (/confirm/[token])',
        items: [
          'Estado LOADING: Procesando confirmación',
          'Estado SUCCESS: Cita confirmada con detalles',
          'Estado ERROR: Token inválido o expirado',
          'Diseño centrado con icono y mensaje',
          'Enlace para volver al inicio',
        ],
      },
      {
        subtitle: 'Email de Confirmación',
        items: [
          'Asunto: Cita Confirmada - [Fecha] a las [Hora]',
          'Contenido:',
          '- Mensaje de agradecimiento',
          '- Datos de la cita confirmada',
          '- Dirección de la propiedad',
          '- Diseño profesional con colores verdes',
        ],
      },
    ],
  },
  {
    id: 'email-logs',
    title: 'Logs de Email',
    icon: '📧',
    content: [
      {
        subtitle: 'Tabla EmailLog',
        items: [
          'Registra todos los emails del sistema',
          'Permite auditoría y troubleshooting',
        ],
      },
      {
        subtitle: 'Campos',
        items: [
          'id: UUID único',
          'to: Destinatario del email',
          'subject: Asunto del email',
          'body: Contenido HTML',
          'appointmentId: Cita asociada (nullable)',
          'status: pending, sent, failed',
          'error: Mensaje de error (si falló)',
          'sentAt: Fecha de envío exitoso',
          'createdAt: Fecha de creación del registro',
        ],
      },
      {
        subtitle: 'Estados de Envío',
        items: [
          'pending - Email en cola de envío',
          'sent - Email enviado exitosamente',
          'failed - Email falló al enviar',
        ],
      },
      {
        subtitle: 'Consultas Útiles',
        items: [
          'Emails exitosos: WHERE status = "sent"',
          'Emails fallidos: WHERE status = "failed"',
          'Por cita: WHERE appointmentId = "uuid"',
        ],
      },
    ],
  },
  {
    id: 'booking-flow',
    title: 'Flujo de Booking Público',
    icon: '📝',
    content: [
      {
        subtitle: 'Paso a Paso',
        items: [
          '1. Cliente visita /properties (público)',
          '2. Selecciona una propiedad',
          '3. Click en "Book Appointment"',
          '4. Elige fecha disponible',
          '5. Sistema muestra slots disponibles',
          '6. Cliente selecciona hora',
          '7. Llena formulario con datos personales',
          '8. Sistema busca cliente por email',
          '9. Si no existe: crea nuevo cliente',
          '10. Crea cita con estado PENDING',
          '11. Genera token de confirmación',
          '12. Bloquea el slot en el calendario',
        ],
      },
      {
        subtitle: 'Validaciones',
        items: [
          'Email debe ser único (verifica existencia)',
          'Fecha no puede ser en el pasado',
          'Slot debe estar disponible',
          'No puede haber cita duplicada en mismo horario',
          'Duración mínima: 5 minutos',
        ],
      },
      {
        subtitle: 'URLs de Booking',
        items: [
          '/properties - Listado público',
          '/properties/[id] - Detalle de propiedad',
          '/booking/[id] - Formulario de booking',
        ],
      },
    ],
  },
  {
    id: 'docker',
    title: 'Despliegue con Docker',
    icon: '🐳',
    content: [
      {
        subtitle: 'Comandos',
        items: [
          'npm run docker:up - Levantar todos los servicios',
          'npm run docker:down - Detener servicios',
          'npm run docker:build - Reconstruir imágenes',
        ],
      },
      {
        subtitle: 'Servicios',
        items: [
          'postgres:5432 - PostgreSQL 16',
          'backend:3000 - NestJS API',
          'frontend:3001 - Next.js App',
        ],
      },
      {
        subtitle: 'Configuración Post-Deploy',
        items: [
          'docker-compose exec backend npx prisma generate',
          'docker-compose exec backend npx prisma migrate dev',
        ],
      },
      {
        subtitle: 'Volumes',
        items: [
          'postgres_data - Datos de PostgreSQL',
          'backend_uploads - Archivos subidos',
        ],
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: '🔧',
    content: [
      {
        subtitle: 'Citas no se confirman',
        items: [
          'Verificar enlace en email sea correcto',
          'Verificar token no expiró (24h)',
          'Verificar URL frontend en .env',
        ],
      },
      {
        subtitle: 'Emails no se envían',
        items: [
          'Verificar credenciales SMTP en .env',
          'Para Gmail: usar App Password (no password regular)',
          'Revisar tabla email_logs para errores',
          'Verificar conexión de red al servidor SMTP',
        ],
      },
      {
        subtitle: 'Notificaciones no aparecen',
        items: [
          'Verificar que el cron está corriendo',
          'Revisar logs del backend',
          'Verificar cita dentro de ventana de 30 minutos',
          'Verificar cliente tiene email válido',
        ],
      },
      {
        subtitle: 'Token no funciona',
        items: [
          'Verificar cita no está cancelada',
          'Verificar token no usado previamente',
          'Verificar token no expiró',
          'Verificar URL frontend es correcta',
        ],
      },
      {
        subtitle: 'Conexión a Base de Datos',
        items: [
          'Verificar PostgreSQL está corriendo',
          'Verificar DATABASE_URL en .env',
          'Ejecutar npx prisma generate',
          'Ejecutar npx prisma migrate dev',
        ],
      },
      {
        subtitle: 'Puertos en Conflicto',
        items: [
          'Backend: 3000 (cambiar en .env)',
          'Frontend: 3001 (cambiar en next.config.js)',
          'Database: 5432 (cambiar en docker-compose.yml)',
        ],
      },
    ],
  },
];

export default function AdminDocsPage() {
  const [activeSection, setActiveSection] = useState('panel');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-700">
                ← Volver al Panel
              </Link>
              <h1 className="text-xl font-bold text-blue-600">📚 Documentación Administrativa</h1>
            </div>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-3">Contenido</h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {sections.map((section) => (
              activeSection === section.id && (
                <div key={section.id} className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {section.icon} {section.title}
                    </h2>
                  </div>

                  {section.content.map((block, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                        {block.subtitle}
                      </h3>
                      <ul className="space-y-2">
                        {block.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start text-gray-700">
                            <span className="text-blue-500 mr-2 mt-1">•</span>
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
