import { Statuses } from '../../common/constants';
export declare class ContractDto {
    status: Statuses;
    address?: string;
    deploy_data: object;
}
