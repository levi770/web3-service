import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';
import { CreateWalletCommand } from '../create-wallet.command';
import { Web3Service } from '../../web3.service';
import { RpcException } from '@nestjs/microservices';
import { ObjectTypes, Statuses } from '../../../../common/constants';
import { DbService } from '../../../db/db.service';
import { ResponseDto } from '../../../../common/dto/response.dto';

@CommandHandler(CreateWalletCommand)
export class CreateWalletHandler implements ICommandHandler<CreateWalletCommand> {
  constructor(private readonly w3Service: Web3Service, private readonly dbService: DbService) {}
  async execute(command: CreateWalletCommand) {
    try {
      const account = await this.w3Service.newWallet(command.data);
      const walletPayload = { team_id: command.data.team_id, ...account };
      const [wallet] = await this.dbService.create([walletPayload], ObjectTypes.WALLET);
      const result = { id: wallet.id, address: account.address };
      return new ResponseDto(HttpStatus.OK, [Statuses.SUCCESS], [result]);
    } catch (error) {
      throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message });
    }
  }
}
