import { Response } from 'express';
import { Body, Controller, Get, HttpStatus, Post, Req, Res, Session, UseFilters, UseGuards } from '@nestjs/common';
import { LocalGuard } from './guards/local.guard';
import { AuthService } from './auth.service';
import { AUTH_CONTROLLER, Statuses } from '../common/constants';
import { IRequest } from './interfaces/request.interface';
import { UnauthorizedFilter } from './filters/unauthorized.filter';
import { CredentialsDto } from './dto/credentials.dto';
import { BadRequestFilter } from './filters/badrequest.filter';

@Controller(AUTH_CONTROLLER)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('login')
  login(@Res() res: Response) {
    return res.render('login');
  }

  @Post('login')
  @UseGuards(LocalGuard)
  @UseFilters(UnauthorizedFilter, BadRequestFilter)
  async authenticate(@Req() req: IRequest, @Res() res: Response, @Session() session: Record<string, any>) {
    res.header('Set-Cookie', [await this.authService.getAccessCookie(req.user)]);
    res.status(HttpStatus.ACCEPTED).redirect(session.originalUrl || '/');
  }

  @Get('update')
  update(@Res() res: Response) {
    return res.render('update');
  }

  @Post('update')
  async updatePassword(@Req() req: IRequest, @Res() res: Response, @Body() body: CredentialsDto) {
    const success = await this.authService.updatePassword(body.email);
    res.render('back-to-login', { success });
  }
}
