import { Injectable } from '@nestjs/common';
import { Web3Service } from '../web3/web3.service';
import { RepositoryService } from '../repository/repository.service';
import { ConfigService } from '@nestjs/config';
import { ExportTypes, Networks, ObjectTypes } from '../common/constants';
import { WalletModel } from '../repository/models/wallet.model';
import { ContractModel } from '../repository/models/contract.model';
import { TokenModel } from '../repository/models/token.model';
import { MetadataModel } from '../repository/models/metadata.model';
import { WhitelistModel } from '../repository/models/whitelist.model';

import archiver from 'archiver';
archiver.registerFormat('zip-encrypted', require('archiver-zip-encrypted'));

@Injectable()
export class ExportService {
  constructor(
    private readonly config: ConfigService,
    private readonly repository: RepositoryService,
    private readonly web3Service: Web3Service,
  ) {}

  async wrapInZip(password: string, data: string, name: string) {
    let archive = (archiver as any).create('zip-encrypted', { zlib: { level: 8 }, encryptionMethod: 'zip20', password });
    archive.append(Buffer.from(data), { name });
    return archive;
  }

  async exportAccounts(type: ExportTypes) {
    switch (type) {
      case ExportTypes.WALLET: {
        const w3 = this.web3Service.getWeb3(Networks.ETHEREUM);
        const password = await this.config.get('DEFAULT_PASSWORD');
        const { rows } = await this.repository.getAllObjects<WalletModel>(ObjectTypes.WALLET);
        return (
          'id|team_id|address|private_key|created_at\n' +
          rows
            .map((e: WalletModel) => {
              const decrypted = w3.eth.accounts.decrypt(e.keystore, password);
              return [e.id, e.team_id, decrypted.address, decrypted.privateKey, e.createdAt];
            })
            .map((e) => e.join('|'))
            .join('\n')
        );
      }
      case ExportTypes.CONTRACT: {
        const { rows } = await this.repository.getAllObjects<ContractModel>(ObjectTypes.CONTRACT);
        return (
          'id|wallet_id|status|address|slug|price|created_at\n' +
          rows
            .map((e: ContractModel) => {
              return [e.id, e.wallet_id, e.status, e.address, e.slug, e.price, e.createdAt];
            })
            .map((e) => e.join('|'))
            .join('\n')
        );
      }
      case ExportTypes.TOKEN: {
        const { rows } = await this.repository.getAllObjects<TokenModel>(ObjectTypes.TOKEN);
        return (
          'id|token_ids|contract_id|metadata_id|status|qty|created_at\n' +
          rows
            .map((e: TokenModel) => {
              return [e.id, e.token_ids, e.contract_id, e.metadata_id, e.status, e.qty, e.createdAt];
            })
            .map((e) => e.join('|'))
            .join('\n')
        );
      }
      case ExportTypes.METADATA: {
        const { rows } = await this.repository.getAllObjects<MetadataModel>(ObjectTypes.METADATA);
        return (
          'id|contract_id|token_id|slug|status|type|meta_data|created_at\n' +
          rows
            .map((e: MetadataModel) => {
              return [e.id, e.contract_id, JSON.stringify(e.token_id), e.slug, e.status, e.type, JSON.stringify(e.meta_data), e.createdAt];
            })
            .map((e) => e.join('|'))
            .join('\n')
        );
      }
      case ExportTypes.WHITELIST: {
        const { rows } = await this.repository.getAllObjects<WhitelistModel>(ObjectTypes.WHITELIST);
        return (
          'id|contract_id|status|address|created_at\n' +
          rows
            .map((e: WhitelistModel) => {
              return [e.id, e.contract_id, e.status, e.address, e.createdAt];
            })
            .map((e) => e.join('|'))
            .join('\n')
        );
      }
    }
  }
}
