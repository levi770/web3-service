/**
 * @class WalletDto
 *
 * @property {string} team_id - The team id of the wallet
 * @property {string} address - The address of the wallet
 * @property {object} keystore - The keystore of the wallet
 */
export class WalletDto {
  team_id: string;
  address: string;
  keystore: object;
}
