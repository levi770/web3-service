import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RepositoryService } from '../../repository.service';
import { Statuses } from '../../../common/constants';
import { HttpStatus } from '@nestjs/common';
import { ResponseDto } from '../../../common/dto/response.dto';
import { GetAllObjectsQuery } from '../get-all-objects.query';

@QueryHandler(GetAllObjectsQuery)
export class GetAllObjectsHandler implements IQueryHandler<GetAllObjectsQuery> {
  constructor(private readonly dbService: RepositoryService) {}
  async execute(query: GetAllObjectsQuery) {
    const result = await this.dbService.getAllObjects(query.data.object_type, query.data);
    return new ResponseDto(HttpStatus.OK, Statuses.COMPLETED, result);
  }
}
