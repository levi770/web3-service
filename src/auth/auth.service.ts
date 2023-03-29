import * as bcrypt from 'bcrypt';
import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { newPasswordTemplate } from '../email/templates/new-password.template';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { IAccessTokenPayload } from './interfaces/access-token-payload.interface';
import { IUser } from './interfaces/user.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(User) private readonly userRepository: typeof User,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const emails_list = this.config.get('EMAILS_LIST');
    for (const email of emails_list.split(',')) {
      const { password, hash } = await this.newPassword(email);
      const [_, isCreated] = await this.userRepository.findOrCreate({ where: { email }, defaults: { email, password: hash } });
      if (isCreated) await this.sendEmail(email, password, 'New account created');
    }
  }

  public async getAuthenticatedUser(email: string, plainTextPassword: string) {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      await this.verifyPassword(plainTextPassword, user.password);
      return { id: user.id, email: user.email };
    } catch (error) {
      throw new BadRequestException('Wrong credentials provided');
    }
  }

  private async verifyPassword(plainPassword: string, hashedPassword: string) {
    const isMatching = await bcrypt.compare(plainPassword, hashedPassword);
    if (!isMatching) throw new BadRequestException('Wrong credentials provided');
  }

  public async newPassword(email: string) {
    const password = Math.random().toString(36).slice(-11);
    const hash = await bcrypt.hash(password, 10);
    return { password, hash };
  }

  public async updatePassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('User not found');
    const password = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.setNewUserPassword(hashedPassword, user.id);
    await this.sendEmail(email, password, 'Password updated');
    return 'Your temporary password has been sent to your email. Please use it to log back into the login form.';
  }

  async setNewUserPassword(password: string, id: string) {
    const [isUpdated] = await this.userRepository.update({ password }, { where: { id } });
    return !!isUpdated;
  }

  async sendEmail(to: string, password: string, subject: string) {
    await this.emailService.sendMail({
      to,
      subject,
      from: { name: 'Highloop.io Web3Service', email: this.config.get('EMAIL_USER') },
      html: newPasswordTemplate(this.config.get('APP_URL'), password),
    });
  }

  public async getAccessCookie(user: IUser) {
    const payload: IAccessTokenPayload = { id: user.id, email: user.email };
    const exp = this.config.get('JWT_EXPIRATION');
    const token = this.jwtService.sign(payload, { secret: this.config.get('JWT_SECRET'), expiresIn: `${exp}s` });
    return `Authentication=${token}; SameSite=None; Secure; HttpOnly; Path=/; Max-Age=${exp}`;
  }

  async getUserById(id: string) {
    return await this.userRepository.findByPk(id, { attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }, raw: true });
  }
}
