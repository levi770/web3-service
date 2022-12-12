import { MetaDataDto } from '../../web3-manager/dto/metaData.dto'
import { MetadataTypes, Statuses } from '../../common/constants'


export class NewMetadataDto {
  type: MetadataTypes;
  status: Statuses;
  contract_id?: string;
  token_id?: string;
  meta_data: MetaDataDto;
}
