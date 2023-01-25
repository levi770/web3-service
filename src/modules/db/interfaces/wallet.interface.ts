/**
 * Represents a wallet from the database.
 */
export interface Wallet {
  id?: string;
  team_id?: string;
  address: string;
  keystore?: object;
}
