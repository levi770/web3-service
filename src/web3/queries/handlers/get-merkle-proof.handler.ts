import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetMerkleProofQuery } from '../get-merkle-proof.query';
import { RepositoryService } from '../../../repository/repository.service';
import { WhitelistModel } from '../../../repository/models/whitelist.model';
import { ObjectTypes, Statuses } from '../../../common/constants';
import { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';
import { Web3Service } from '../../web3.service';
import { ResponseDto } from '../../../common/dto/response.dto';

@QueryHandler(GetMerkleProofQuery)
export class GetMerkleProofHandler implements IQueryHandler<GetMerkleProofQuery> {
  constructor(private readonly w3Service: Web3Service, private readonly dbService: RepositoryService) {}
  async execute(query: GetMerkleProofQuery) {
    try {
      const whitelist = await this.dbService.getAllObjects<WhitelistModel>(ObjectTypes.WHITELIST, {
        where: { contract_id: query.data.contract_id },
      });
      if (!whitelist.rows.length)
        throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'No whitelist found for this contract' });
      const root = await this.w3Service.getMerkleRoot(whitelist.rows);
      const proof = await this.w3Service.getMerkleProof(whitelist.rows, query.data.addresses);
      return new ResponseDto(HttpStatus.OK, Statuses.COMPLETED, { root, proof });
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }
}
