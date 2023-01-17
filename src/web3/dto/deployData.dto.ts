import { AbiItem } from 'web3-utils'
import { FileTypes, Networks } from '../../common/constants'
import { MetaDataDto } from './metaData.dto'

/**
 * @class DeployDataDto - A data transfer object for passing deploy data.
 * @export
 * 
 * @param {boolean} execute - Indicates whether the deployment should be executed or just simulated.
 * @param {Networks} network - The network to use for the deployment.
 * @param {AbiItem[]} abi - The ABI of the contract to be deployed.
 * @param {string} bytecode - The bytecode of the contract to be deployed.
 * @param {string} arguments - The double colon separated arguments to pass to the method.
 * @param {string} [from_address] - The address of the sender.
 * @param {string} [asset_url] - The URL of the contract asset.
 * @param {FileTypes} [asset_type] - The type of the contract asset.
 * @param {MetaDataDto} [meta_data] - The metadata for the contract.
 */
export class DeployDataDto {
  execute: boolean;
  network: Networks;
  abi: AbiItem[];
  bytecode: string;
  arguments: string;
  from_address?: string;
  asset_url?: string;
  asset_type?: FileTypes;
  meta_data?: MetaDataDto;
}
