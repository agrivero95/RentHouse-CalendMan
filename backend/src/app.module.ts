import { Module } from '@nestjs/common';
import { OwnerModule } from './modules/owner/owner.module';
import { PropertyModule } from './modules/property/property.module';
import { ClientModule } from './modules/client/client.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { TravelTimeModule } from './modules/travel-time/travel-time.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PrismaModule } from './config/prisma.module';

@Module({
  imports: [
    PrismaModule,
    OwnerModule,
    PropertyModule,
    ClientModule,
    AppointmentModule,
    TravelTimeModule,
    CalendarModule,
    AuthModule,
    NotificationModule,
  ],
})
export class AppModule {}
