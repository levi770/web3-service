import { CommonHandler } from './common.handler';
import { CreateWalletHandler } from './create-wallet.handler';
import { DeployHandler } from './deploy.handler';
import { MintHandler } from './mint.handler';
import { WhitelistHandler } from './whitelist.handler';

export const CommandHandlers = [CreateWalletHandler, DeployHandler, MintHandler, WhitelistHandler, CommonHandler];
