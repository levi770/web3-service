import { MetaDataDto } from './metaData.dto';
import { MetadataModel } from '../../db/models/metadata.model';
import { TokenModel } from '../../db/models/token.model';
import { TxResultDto } from './txResult.dto';

/**
 * @class CallResultDto - A data transfer object for passing the result of a call.
 * @export
 *
 * @param {(TxResultDto | TxResultDto[])} [callTx] - The transaction result or an array of transaction results.
 * @param {MetaDataDto} [meta_data] - The metadata for the call.
 * @param {MetadataModel} [metadataObj] - The metadata model object for the call.
 * @param {TokenModel} [tokenObj] - The token model object for the call.
 * @param {string} [merkleRoot] - The merkle root of the call.
 * @param {object[]} [merkleProof] - The merkle proof of the call.
 */
export class CallResultDto {
  callTx?: TxResultDto | TxResultDto[];
  meta_data?: MetaDataDto;
  metadataObj?: MetadataModel;
  tokenObj?: TokenModel;
  merkleRoot?: string;
  merkleProof?: object[];
}
