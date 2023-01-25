import { Data } from '../types';

/**
 * A data transfer object for passing job result data.
 */
export class JobResult {
  jobId: string | number;
  status: string;
  data: Data;

  constructor(jobId: string | number, status: string, data: Data) {
    this.jobId = jobId;
    this.status = status;
    this.data = data;
  }
}
