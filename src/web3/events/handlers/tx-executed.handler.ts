import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ObjectTypes, OperationTypes, Statuses } from '../../../common/constants';
import { RepositoryService } from '../../../repository/repository.service';
import { TxExecutedEvent } from '../tx-executed.event';

@EventsHandler(TxExecutedEvent)
export class TxExecutedHandler implements IEventHandler<TxExecutedEvent> {
  private logger = new Logger(TxExecutedEvent.name);
  constructor(private readonly repository: RepositoryService) {}
  async handle(event: TxExecutedEvent) {
    try {
      const { payload, receipt } = event.data;
      switch (payload.operation_type) {
        case OperationTypes.DEPLOY:
          const contractModel = payload.contract_model;
          contractModel.status = Statuses.PROCESSED;
          contractModel.address = receipt.contractAddress;
          await contractModel.save();
          break;
        case OperationTypes.MINT:
          const tokenModel = payload.token_model;
          tokenModel.status = Statuses.PROCESSED;
          tokenModel.tx_receipt = receipt;
          await tokenModel.save();
          break;
        case OperationTypes.WHITELIST_ADD:
          const ids = payload.whitelist_model.map((obj) => obj.id);
          await this.repository.updateStatus(
            {
              object_id: ids,
              status: Statuses.PROCESSED,
              tx_hash: receipt.transactionHash,
              tx_receipt: receipt,
            },
            ObjectTypes.WHITELIST,
          );
          break;
      }
    } catch (err) {
      this.logger.error(err);
    }
  }
}
