import { MetaDataDto } from '../../web3/dto/metaData.dto';
import { MetadataTypes, Statuses } from '../../common/constants';
export declare class MetadataDto {
    type: MetadataTypes;
    status: Statuses;
    contract_id?: string;
    token_id?: string;
    meta_data: MetaDataDto;
}
