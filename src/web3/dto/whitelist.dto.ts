/**
 * @class WhitelistDto - A data transfer object for passing whitelist data.
 * @export
 *
 * @param {string} [contract_id] - The ID of the contract to perform the whitelist operation on.
 * @param {string} [addresses] - The comma separated addresses to add or remove from the whitelist.
 * @param {string} [address] - The address to add or remove from the whitelist.
 */
export class WhitelistDto {
  contract_id?: string;
  addresses?: string;
  address?: string;
}
