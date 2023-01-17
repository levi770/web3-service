import { TransactionReceipt } from 'web3-core';

/**
 * @class NewTokenDto - A data transfer object for passing data for a new token.
 * @export
 *
 * @param {string} status - The status of the token.
 * @param {number} token_id - The token ID.
 * @param {string} [contract_id] - The ID of the contract the token is for.
 * @param {string} address - The address of the token.
 * @param {string} nft_number - The number of NFTs in the token.
 * @param {object} mint_data - The mint data for the token.
 * @param {object} meta_data - The metadata for the token.
 * @param {string} tx_hash - The transaction hash of the token mint.
 * @param {TransactionReceipt} tx_receipt - The transaction receipt of the token mint.
 */
export class TokenDto {
  status: string;
  token_id: number;
  contract_id?: string;
  address: string;
  nft_number: string;
  mint_data: object;
  meta_data: object;
  tx_hash: string;
  tx_receipt: TransactionReceipt;
}
