import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ContractDeployedEvent } from '../contract-deployed.event';
import { MetadataTypes, ObjectTypes, Statuses } from '../../../common/constants';
import { RepositoryService } from '../../../repository/repository.service';
import { MetadataModel } from '../../../repository/models/metadata.model';

@EventsHandler(ContractDeployedEvent)
export class ContractDeployedHandler implements IEventHandler<ContractDeployedEvent> {
  private logger = new Logger(ContractDeployedEvent.name);
  constructor(private readonly repository: RepositoryService) {}
  async handle(event: ContractDeployedEvent) {
    try {
      const { payload, contract, wallet, tx } = event.data;
      await wallet.$add('contract', contract);
      await wallet.$add('transaction', tx.txModel);
      if (payload.meta_data && payload.asset_url && payload.asset_type) {
        const meta_data = await this.repository.buildMetadata(payload);
        const metadataPayload = {
          status: Statuses.CREATED,
          type: MetadataTypes.COMMON,
          address: tx.txModel.tx_receipt.contractAddress,
          slug: payload.slug,
          meta_data,
        };
        const [metadata] = await this.repository.create<MetadataModel>([metadataPayload], ObjectTypes.METADATA);
        await this.repository.setMetadata({ object_id: contract.id, id: metadata.id }, ObjectTypes.CONTRACT);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
