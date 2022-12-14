import { TransactionReceipt } from 'web3-core'

export class NewTokenDto {
  status: string;
  contract_id?: string;
  address: string;
  nft_number: string;
  mint_data: object;
  meta_data: object;
  tx_hash: string;
  tx_receipt: TransactionReceipt;
}
