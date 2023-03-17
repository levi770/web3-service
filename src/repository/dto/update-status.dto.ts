import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ObjectTypes, Statuses } from '../../common/constants';

/**
 * A data transfer object for passing data to update the status of a model object.
 */
export class UpdateStatusDto {
  @IsEnum(ObjectTypes)
  object_type: ObjectTypes;

  @IsString()
  object_id: string;

  @IsEnum(Statuses)
  status: Statuses;

  @IsOptional()
  tx_hash?: string;

  @IsOptional()
  tx_receipt?: any;
}
