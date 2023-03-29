export interface ISqsMessageBody {
  requestId: string;
  command: string;
  operationName: string;
  walletAddress: string;
  data: any;
}
