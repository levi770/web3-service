import { GetOneDto } from '../dto/get-one.dto';

export class GetOneObjectQuery {
  constructor(public readonly data: GetOneDto) {}
}
