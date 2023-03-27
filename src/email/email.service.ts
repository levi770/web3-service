import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private sgMail: MailService;
  constructor(private configService: ConfigService) {
    this.sgMail = new MailService();
    this.sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'));
  }
  sendMail(options: any) {
    return this.sgMail.send(options);
  }
}
