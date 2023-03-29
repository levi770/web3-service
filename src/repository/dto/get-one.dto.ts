import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { ObjectTypes } from '../../common/constants';

/**
 * A data transfer object for passing parameters to retrieve a single model object.
 */
export class GetOneDto {
  @IsEnum(ObjectTypes)
  object_type: ObjectTypes;

  @IsObject()
  where: object;

  @IsOptional()
  include_child?: boolean;
}
