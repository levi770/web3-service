/**
 * Represents a wallet from the database.
 */
export class WalletDto {
  id?: string;
  team_id?: string;
  address: string;
  keystore?: object;
}
