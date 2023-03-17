import { GetAllDto } from '../dto/get-all.dto';

export class GetAllObjectsQuery {
  constructor(public readonly data: GetAllDto) {}
}
