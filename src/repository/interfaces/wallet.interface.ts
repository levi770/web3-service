/**
 * Represents a wallet from the database.
 */
export interface IWallet {
  id?: string;
  team_id?: string;
  address: string;
  keystore?: object;
}
