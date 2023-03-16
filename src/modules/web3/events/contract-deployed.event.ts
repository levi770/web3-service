import { ContractModel } from '../../db/models/contract.model';
import { WalletModel } from '../../db/models/wallet.model';
import { DeployDto } from '../dto/requests/deploy.dto';
import { TxResultDto } from '../interfaces/txResult.dto';

export class ContractDeployedEvent {
  constructor(public readonly data: { payload: DeployDto; contract: ContractModel; wallet: WalletModel; tx: TxResultDto }) {}
}
