import { CreateWalletDto } from '../dto/requests/createWallet.dto';

export class CreateWalletCommand {
  constructor(public readonly data: CreateWalletDto) {}
}
