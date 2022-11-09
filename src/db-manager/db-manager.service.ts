import { Order } from 'sequelize';
import { HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ObjectTypes } from '../common/constants';
import { GetAllContractsDto } from './dto/getAllContracts.dto';
import { NewContractDto } from './dto/newContract.dto';
import { NewTokenDto } from './dto/newToken.dto';
import { ResponseDto } from '../common/dto/response.dto';
import { ContractModel } from './models/contract.model';
import { TokenModel } from './models/tokens.model';

@Injectable()
export class DbManagerService {
  constructor(
    @InjectModel(ContractModel) private contractRepository: typeof ContractModel,
    @InjectModel(TokenModel) private tokenRepository: typeof TokenModel,
  ) {}

  async create(params: NewContractDto | NewTokenDto, objectType: ObjectTypes) {
    switch (objectType) {
      case ObjectTypes.CONTRACT:
        return await this.contractRepository.create({ ...params });

      case ObjectTypes.TOKEN:
        return await this.tokenRepository.create({ ...params });
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

      const allContracts = await this.contractRepository.findAndCountAll(args);

      return new ResponseDto(HttpStatus.OK, null, allContracts);
    } catch (error) {
      if (error.name === 'SequelizeDatabaseError') {
        throw new InternalServerErrorException(error.original.message);
      }

      throw new InternalServerErrorException(error.message);
    }
  }

  async getMetadata(id: string) {
    const token = await this.tokenRepository.findOne({ where: { nft_number: id } });

    if (!token) {
      throw new NotFoundException('Token with this number not found');
    }

    return token.meta_data;
  }
}
