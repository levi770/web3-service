/**
 * An interface representing the payload of a transaction.
 *
 * @param {string} [to] - The address of the contract to call or the recipient of the value.
 * @param {string} [from] - The address of the sender.
 * @param {string} [data] - The data to send to the contract or message to sign.
 * @param {number} [gas] - The amount of gas to use for the transaction.
 * @param {number} [value] - The value to send in wei.
 * @param {number} [nonce] - The nonce to use for the transaction.
 * @param {number} [chainId] - The chain ID to use for the transaction.
 * @param {string} [maxPriorityFeePerGas] - The maximum priority fee to pay per gas unit.
 *
 * @export
 * @interface TxPayload
 */
export interface TxPayload {
  to?: string;
  from?: string;
  data?: string;
  gas?: number;
  value?: number;
  nonce?: number;
  chainId?: number;
  maxPriorityFeePerGas?: string;
}
