import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from 'sequelize';
import { ObjectTypes } from '../common/constants';
import { GetAllContractsDto } from '../common/dto/getAllContracts.dto';
import { NewContractDto } from '../common/dto/newContract.dto';
import { NewTokenDto } from '../common/dto/newToken.dto';
import { ResponseDto } from '../common/dto/response.dto';
import { Contract } from '../common/models/contract.model';
import { Token } from '../common/models/tokens.model';

@Injectable()
export class DbManagerService {
  constructor(
    @InjectModel(Contract) private contractRepository: typeof Contract,
    @InjectModel(Token) private tokenRepository: typeof Token,
  ) {}

  async create(params: NewContractDto | NewTokenDto, objectType: ObjectTypes) {
    switch (objectType) {
      case ObjectTypes.CONTRACT:
        return await this.contractRepository.create({ params });

      case ObjectTypes.TOKEN:
        return await this.tokenRepository.create({ params });
    }
  }

  async findByPk(pk: string) {
    return await this.contractRepository.findByPk(pk);
  }

  async getAllContracts(params?: GetAllContractsDto) {
    try {
      const args = {
        attributes: { exclude: ['fileId', 'updatedAt'] },
        offset: !params || !params.limit || !params.page ? null : 0 + (+params.page - 1) * +params.limit,
        limit: !params || !params.limit ? null : +params.limit,
        order: [[params.order_by || 'createdAt', params.order || 'DESC']] as Order,
        include: null,
      };

      const allObjects = await this.contractRepository.findAndCountAll(args);

      return new ResponseDto(HttpStatus.OK, null, allObjects);
    } catch (error) {
      if (error.name === 'SequelizeDatabaseError') {
        throw new RpcException(error.original.message);
      }

      throw new RpcException(error.message);
    }
  }
}
