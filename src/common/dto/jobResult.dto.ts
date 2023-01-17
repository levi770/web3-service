import { Data } from '../types';

/**
 * @class JobResultDto - A data transfer object for passing job result data.
 * @export
 *
 * @param {string | number} jobId - The ID of the job.
 * @param {string} status - The status of the job.
 * @param {Data} data - The data for the job result.
 */
export class JobResultDto {
  jobId: string | number;
  status: string;
  data: Data;

  constructor(jobId: string | number, status: string, data: Data) {
    this.jobId = jobId;
    this.status = status;
    this.data = data;
  }
}
