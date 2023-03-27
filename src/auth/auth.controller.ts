import { Response } from 'express';
import { Body, Controller, Get, HttpStatus, Post, Req, Res, UseFilters, UseGuards } from '@nestjs/common';
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
  async authenticate(@Req() req: IRequest, @Res() res: Response) {
    res.header('Set-Cookie', [await this.authService.getAccessCookie(req.user)]);
    res.redirect(req.headers.referer || '/');
  }

  @Get('update')
  update(@Res() res: Response) {
    return res.render('update');
  }

  @Post('update')
  async updatePassword(@Req() req: IRequest, @Res() res: Response, @Body() body: CredentialsDto) {
    const success = await this.authService.updatePassword(body.email);
    req.flash('success', success);
    res.redirect('/auth/login');
  }
}
