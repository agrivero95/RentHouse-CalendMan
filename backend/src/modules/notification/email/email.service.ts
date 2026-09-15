import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '@/config/prisma.service';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  appointmentId?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@renthouse-calendman.com',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      await this.prisma.emailLog.create({
        data: {
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.html,
          appointmentId: emailData.appointmentId || null,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      this.logger.log(`Email sent to ${emailData.to}. Message ID: ${info.messageId}`);
      return true;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send email to ${emailData.to}: ${errorMsg}`, errorStack);
      
      await this.prisma.emailLog.create({
        data: {
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.html,
          appointmentId: emailData.appointmentId || null,
          status: 'failed',
          error: errorMsg,
        },
      });

      return false;
    }
  }

  async sendAppointmentReminder(appointmentId: string): Promise<boolean> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true, property: true },
    });

    if (!appointment || !appointment.client.email) {
      this.logger.warn(`No client email for appointment ${appointmentId}`);
      return false;
    }

    const confirmToken = await this.prisma.confirmationToken.create({
      data: {
        appointmentId,
        token: this.generateToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const confirmUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/confirm/${confirmToken.token}`;
    const appointmentDateTime = new Date(appointment.dateSet);
    const formattedDate = appointmentDateTime.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">RentHouse CalendMan</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Recordatorio de Cita</h2>
          <p style="color: #666; font-size: 16px;">Estimado/a <strong>${appointment.client.name} ${appointment.client.lastName1}</strong>,</p>
          <p style="color: #666; font-size: 16px;">Este es un recordatorio de su cita programada:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="margin: 10px 0; color: #333;"><strong>📅 Fecha:</strong> ${formattedDate}</p>
            <p style="margin: 10px 0; color: #333;"><strong>🕐 Hora:</strong> ${formattedTime}</p>
            <p style="margin: 10px 0; color: #333;"><strong>📍 Dirección:</strong> ${appointment.property.address}</p>
            <p style="margin: 10px 0; color: #333;"><strong>⏱️ Duración:</strong> ${appointment.duration} minutos</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" 
               style="background: #28a745; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              ✓ Confirmar Asistencia
            </a>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center;">
            Si no puede asistir, por favor contactenos con anticipación.<br>
            Este enlace expira en 24 horas.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: appointment.client.email,
      subject: `Recordatorio: Cita confirmada - ${formattedDate} a las ${formattedTime}`,
      html,
      appointmentId,
    });
  }

  async sendConfirmationEmail(appointmentId: string): Promise<boolean> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true, property: true },
    });

    if (!appointment || !appointment.client.email) return false;

    const appointmentDateTime = new Date(appointment.dateSet);
    const formattedDate = appointmentDateTime.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">✓ Cita Confirmada</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">¡Gracias por confirmar!</h2>
          <p style="color: #666;">Su cita ha sido confirmada exitosamente:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0; color: #333;"><strong>📅 Fecha:</strong> ${formattedDate}</p>
            <p style="margin: 10px 0; color: #333;"><strong>🕐 Hora:</strong> ${formattedTime}</p>
            <p style="margin: 10px 0; color: #333;"><strong>📍 Dirección:</strong> ${appointment.property.address}</p>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center;">
            Nos vemos en la cita. ¡Buen día!
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: appointment.client.email,
      subject: `Cita Confirmada - ${formattedDate} a las ${formattedTime}`,
      html,
      appointmentId,
    });
  }

  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
