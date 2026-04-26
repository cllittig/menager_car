import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { SentMessageInfo } from 'nodemailer';
import type { MaintenanceNotificationDetails, PaymentReminderDetails } from './notification.types';

type CreateTransportFn = (options: Record<string, unknown>) => MailTransport;

type MailTransport = {
  sendMail: (options: Record<string, unknown>) => Promise<SentMessageInfo>;
};

@Injectable()
export class NotificationService {
  private readonly transporter: MailTransport;

  constructor() {
    const nm = nodemailer as unknown as { createTransport: CreateTransportFn };
    this.transporter = nm.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<SentMessageInfo> {
    return this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to,
      subject,
      text,
      html,
    });
  }

  async sendAlert(subject: string, message: string) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    await this.sendEmail(adminEmail, `[ALERTA] ${subject}`, message);
  }

  async sendMaintenanceNotification(
    _vehicleId: string,
    maintenanceDetails: MaintenanceNotificationDetails,
  ) {
    const subject = 'Manutenção Programada';
    const content = `
            <h2>Manutenção Programada</h2>
            <p>Veículo: ${maintenanceDetails.vehicle}</p>
            <p>Data: ${maintenanceDetails.date}</p>
            <p>Descrição: ${maintenanceDetails.description}</p>
        `;

    await this.sendEmail(maintenanceDetails.clientEmail, subject, content);
  }

  async sendPaymentReminder(transactionId: string, paymentDetails: PaymentReminderDetails) {
    void transactionId;
    const subject = 'Lembrete de Pagamento';
    const content = `
            <h2>Lembrete de Pagamento</h2>
            <p>Valor: R$ ${paymentDetails.amount}</p>
            <p>Vencimento: ${paymentDetails.dueDate}</p>
            <p>Detalhes: ${paymentDetails.description}</p>
        `;

    await this.sendEmail(paymentDetails.clientEmail, subject, content);
  }
}
