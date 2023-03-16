import { ModelQueryDto } from '../../../common/dto/model-query.dto';

export class GetUserQuery {
  constructor(public id: string, public args?: ModelQueryDto) {}
}
