import { EncryptedKeystoreV3Json } from 'web3-core';

export interface Wallet {
  address: string;
  keystore: EncryptedKeystoreV3Json;
}
