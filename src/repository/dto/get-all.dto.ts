import { IsEnum, IsOptional } from 'class-validator';
import { ObjectTypes } from '../../common/constants';

/**
 * A data transfer object for passing parameters to retrieve multiple model objects.
 */
export class GetAllDto {
  @IsEnum(ObjectTypes)
  object_type: ObjectTypes;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  sort?: string;

  @IsOptional()
  order_by?: string;

  @IsOptional()
  include_child?: boolean;

  @IsOptional()
  where?: object;
}
