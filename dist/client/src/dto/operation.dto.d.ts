import { CallDataDto } from './callData.dto';
import { DeployDataDto } from './deployData.dto';
export declare class OperationDto {
    operation: string;
    jobId?: number;
    async?: boolean;
    data: CallDataDto | DeployDataDto;
}
