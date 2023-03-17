import { EncryptedKeystoreV3Json } from 'web3-core';

export interface IWallet {
  address: string;
  keystore: EncryptedKeystoreV3Json;
}
