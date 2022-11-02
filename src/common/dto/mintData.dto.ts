import { Networks } from '../constants';

export class MintDataDto {
  jobId: string;
  contractId: string;
  title: string;
  description: string;
  creators: string;
  nft_number: number;
  network: Networks;
  price: number;
  royalties: number;
  asset_url: string;
  asset_type: string;
}
