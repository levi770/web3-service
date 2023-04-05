import * as AWS from 'aws-sdk';
import { join } from 'path';
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          SES: new AWS.SES({
            region: config.get<string>('AWS_REGION'),
            accessKeyId: config.get<string>('AWS_ACCESS_KEY'),
            secretAccessKey: config.get<string>('AWS_SECRET_KEY'),
            paramValidation: false,
          }),
          host: config.get<string>('AWS_SES_SMTP_HOST'),
          port: config.get<string>('AWS_SES_SMTP_PORT'),
          secure: true,
          ignoreTLS: false,
          requireTLS: true,
          auth: {
            user: config.get<string>('AWS_SES_SMTP_USERNAME'),
            pass: config.get<string>('AWS_SES_SMTP_PASSWORD'),
          },
        },
        preview: config.get<string>('NODE_ENV') === 'production' ? false : true,
        defaults: {
          from: `"${config.get('EMAIL_FROM_NAME')}" <${config.get('EMAIL_FROM_ADDRESS')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
