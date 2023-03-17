import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RepositoryService } from '../../repository.service';
import { Statuses } from '../../../common/constants';
import { HttpStatus } from '@nestjs/common';
import { ResponseDto } from '../../../common/dto/response.dto';
import { GetOneObjectQuery } from '../get-one-object.query';

@QueryHandler(GetOneObjectQuery)
export class GetOneObjectHandler implements IQueryHandler<GetOneObjectQuery> {
  constructor(private readonly dbService: RepositoryService) {}
  async execute(query: GetOneObjectQuery) {
    const result = await this.dbService.getOneObject(query.data.object_type, query.data);
    return new ResponseDto(HttpStatus.OK, Statuses.COMPLETED, result);
  }
}
