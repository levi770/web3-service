import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ContractDeployedEvent } from '../contract-deployed.event';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { MetadataTypes, ObjectTypes, Statuses } from '../../../../common/constants';
import { DbService } from '../../../db/db.service';
import { MetadataModel } from '../../../db/models/metadata.model';

@EventsHandler(ContractDeployedEvent)
export class ContractDeployedHandler implements IEventHandler<ContractDeployedEvent> {
  private logger = new Logger(ContractDeployedEvent.name);
  constructor(private readonly ipfsService: IpfsService, private readonly dbService: DbService) {}
  async handle(event: ContractDeployedEvent) {
    try {
      const { payload, contract, wallet, tx } = event.data;
      await wallet.$add('contract', contract);
      await wallet.$add('transaction', tx.txModel);
      if (payload.meta_data && payload.asset_url && payload.asset_type) {
        const meta_data = await this.ipfsService.buildMetadata(payload);
        const metadataPayload = {
          status: Statuses.CREATED,
          type: MetadataTypes.COMMON,
          address: tx.txModel.tx_receipt.contractAddress,
          slug: payload.slug,
          meta_data,
        };
        const [metadata] = await this.dbService.create<MetadataModel>([metadataPayload], ObjectTypes.METADATA);
        await this.dbService.setMetadata({ object_id: contract.id, id: metadata.id }, ObjectTypes.CONTRACT);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
