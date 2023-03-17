import { CreateWalletDto } from '../dto/create-wallet.dto';

export class CreateWalletCommand {
  constructor(public readonly data: CreateWalletDto) {}
}
