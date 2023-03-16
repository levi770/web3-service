import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { MetadataTypes, ObjectTypes, OperationTypes, Statuses } from '../../../../common/constants';
import { DbService } from '../../../db/db.service';
import { MetadataModel } from '../../../db/models/metadata.model';
import { TxExecutedEvent } from '../tx-executed.event';


@EventsHandler(TxExecutedEvent)
export class TxExecutedHandler implements IEventHandler<TxExecutedEvent> {
  private logger = new Logger(TxExecutedEvent.name);
  constructor(private readonly ipfsService: IpfsService, private readonly dbService: DbService) {}
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
          await this.dbService.updateStatus(
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
