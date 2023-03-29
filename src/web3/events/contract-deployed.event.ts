import { ContractModel } from '../../repository/models/contract.model';
import { WalletModel } from '../../repository/models/wallet.model';
import { DeployDto } from '../dto/deploy.dto';
import { TxResultDto } from '../dto/txResult.dto';

export class ContractDeployedEvent {
  constructor(public readonly data: { payload: DeployDto; contract: ContractModel; wallet: WalletModel; tx: TxResultDto }) {}
}
