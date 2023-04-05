import { EmailTemplates } from '../../common/constants';

export interface IEmailOptions {
  to: string;
  subject: string;
  template: EmailTemplates;
  context: any;
}
