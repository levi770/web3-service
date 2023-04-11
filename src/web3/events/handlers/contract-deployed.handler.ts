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
      const { contract, wallet, tx } = event.data;
      await wallet.$add('contract', contract);
      await wallet.$add('transaction', tx.txModel);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
