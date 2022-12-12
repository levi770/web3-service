import { Statuses } from '../../common/constants';
export declare class NewContractDto {
    status: Statuses;
    address: string;
    deploy_data: object;
    deploy_tx: object;
}
