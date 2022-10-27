import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from 'sequelize';
import { GetAllContractsDto } from '../common/dto/getAllContracts.dto';
import { NewContractDto } from '../common/dto/newContract.dto';
import { NewTokenDto } from '../common/dto/newToken.dto';
import { Contract } from '../common/models/contract.model';
import { Token } from '../common/models/tokens.model';

@Injectable()
export class DbManagerService {
  constructor(
    @InjectModel(Contract) private contractRepository: typeof Contract,
    @InjectModel(Token) private tokenRepository: typeof Token,
  ) {}

  async create(params: NewContractDto | NewTokenDto) {
    if (typeof params === typeof NewContractDto) {
      return await this.contractRepository.create({ params });
    }

    if (typeof params === typeof NewTokenDto) {
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

      const result = await this.contractRepository.findAndCountAll(args);

      return {
        status: HttpStatus.OK,
        message: null,
        result,
      };
    } catch (error) {
      if (error.name === 'SequelizeDatabaseError') {
        return {
          status: error.original.code,
          message: error.original.message,
          result: null,
        };
      }

      return {
        status: error.status,
        message: error.message,
        result: null,
      };
    }
  }
}
