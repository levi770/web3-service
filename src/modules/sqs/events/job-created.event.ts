import { Observable } from 'rxjs';
import { JobResult } from '../../../common/dto/jobResult.dto';
import { ISqsMessageBody } from '../interfaces/ISqsMessageBody.interface.';

export class JobCreatedEvent {
  job: Observable<JobResult>;
  msg: ISqsMessageBody;
  constructor(job: Observable<JobResult>, msg: ISqsMessageBody) {
    this.job = job;
    this.msg = msg;
  }
}
