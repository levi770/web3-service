import { MetaDataDto } from '../../web3-manager/dto/metaData.dto';
import { Statuses } from '../../common/constants';
export declare class NewMetadataDto {
    status: Statuses;
    contract_id?: string;
    token_id?: string;
    meta_data: MetaDataDto;
}
