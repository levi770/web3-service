import { Job, DoneCallback } from 'bull';
declare function txWorker(job: Job, doneCallback: DoneCallback): Promise<void>;
export default txWorker;
