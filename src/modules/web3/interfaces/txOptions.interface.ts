/**
 * An interface representing the payload of a transaction.
 */
export interface ITxOptions {
  to?: string;
  from?: string;
  data?: string;
  gas?: number;
  value?: number;
  nonce?: number;
  chainId?: number;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
}
