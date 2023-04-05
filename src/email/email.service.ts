import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '@sendgrid/mail';
import { IEmailOptions } from './interfaces/email-options.interface';

@Injectable()
export class EmailService {
  private sgMail: MailService;
  constructor(private config: ConfigService, private readonly mailerService: MailerService) {}
  async sendMail(options: IEmailOptions) {
    return await this.mailerService.sendMail({
      to: options.to,
      subject: options.subject,
      template: options.template,
      context: {
        ...options.context,
        app_url: this.config.get('APP_URL'),
      },
    });
  }
}
