import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserService } from '../../user.service';
import { GetUserQuery } from '../impl';
import { Logger } from '@nestjs/common';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  logger = new Logger('GetUserQuery');
  constructor(private repository: UserService) {}

  async execute(query: GetUserQuery) {
    this.logger.log('Async GetUserQuery...');
    return this.repository.getUserById(query);
  }
}
