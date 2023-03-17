import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';
import { CreateWalletCommand } from '../create-wallet.command';
import { Web3Service } from '../../web3.service';
import { RpcException } from '@nestjs/microservices';
import { ObjectTypes, Statuses } from '../../../common/constants';
import { RepositoryService } from '../../../repository/repository.service';
import { ResponseDto } from '../../../common/dto/response.dto';
import { WalletModel } from '../../../repository/models/wallet.model';

@CommandHandler(CreateWalletCommand)
export class CreateWalletHandler implements ICommandHandler<CreateWalletCommand> {
  constructor(private readonly w3Service: Web3Service, private readonly repository: RepositoryService) {}
  async execute(command: CreateWalletCommand) {
    try {
      const { data } = command;
      const account = await this.w3Service.newWallet(data);
      const walletPayload = { team_id: data.team_id, ...account };
      const [wallet] = await this.repository.create<WalletModel>([walletPayload], ObjectTypes.WALLET);
      const result = { id: wallet.id, address: account.address };
      return new ResponseDto(HttpStatus.OK, Statuses.COMPLETED, result);
    } catch (error) {
      throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
    }
  }
}
