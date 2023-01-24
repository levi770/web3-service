import { IsString } from 'class-validator';

/**
 * A data transfer object for passing the ID of a job to retrieve.
 */
export class GetJobRequest {
  @IsString()
  jobId: string;
}
