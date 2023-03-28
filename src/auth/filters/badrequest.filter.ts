import { ExceptionFilter, Catch, ArgumentsHost, HttpException, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class BadRequestFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const session = (request as any).session;

    if (!session.originalUrl) session.originalUrl = request.url;

    if (request.url === '/auth/login') {
      return response.status(status).render('login', {
        error: 'Invalid credentials',
      });
    }

    response.status(status).redirect('/auth/login');
  }
}
