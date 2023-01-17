import { Data } from '../types';
export declare class JobResultDto {
    jobId: string | number;
    status: string;
    data: Data;
    constructor(jobId: string | number, status: string, data: Data);
}
