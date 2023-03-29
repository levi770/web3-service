import { ContractDeployedHandler } from './contract-deployed.handler';
import { TokensMintedHandler } from './tokens-minted.handler';
import { TxExecutedHandler } from './tx-executed.handler';

export const EventHandlers = [ContractDeployedHandler, TokensMintedHandler, TxExecutedHandler];
