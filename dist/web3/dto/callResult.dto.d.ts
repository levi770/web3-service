import { MetaDataDto } from './metaData.dto';
import { MetadataModel } from '../../db/models/metadata.model';
import { TokenModel } from '../../db/models/token.model';
import { TxResultDto } from './txResult.dto';
export declare class CallResultDto {
    callTx?: TxResultDto | TxResultDto[];
    meta_data?: MetaDataDto;
    metadataObj?: MetadataModel;
    tokenObj?: TokenModel;
    merkleRoot?: string;
    merkleProof?: object[];
}
