import { Order } from 'sequelize';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ObjectTypes } from '../common/constants';
import { GetAllDto } from './dto/getAll.dto';
import { NewContractDto } from './dto/newContract.dto';
import { NewTokenDto } from './dto/newToken.dto';
import { ResponseDto } from '../common/dto/response.dto';
import { ContractModel } from './models/contract.model';
import { TokenModel } from './models/token.model';
import { MetaDataDto } from '../web3-manager/dto/metaData.dto';
import { GetOneDto } from './dto/getOne.dto';
import { DbArgsPayload } from './interfaces/dbArgsPayload.interface';
import { AllObjectResults } from './interfaces/allObjectsResult.interface';
import { RpcException } from '@nestjs/microservices';
import { UpdateMetadataDto } from './dto/updateMetadata.dto';

@Injectable()
export class DbManagerService {
  constructor(
    @InjectModel(ContractModel) private contractRepository: typeof ContractModel,
    @InjectModel(TokenModel) private tokenRepository: typeof TokenModel,
  ) {}

  async create(params: NewContractDto | NewTokenDto, objectType: ObjectTypes): Promise<ContractModel | TokenModel> {
    switch (objectType) {
      case ObjectTypes.CONTRACT:
        return await this.contractRepository.create({ ...params });

      case ObjectTypes.TOKEN:
        const contract = await this.findByPk((params as NewTokenDto).contract_id);
        const token = await this.tokenRepository.create({ ...params });
        await contract.$add('tokens', [token.id]);
        return token;
    }
  }

  async findByPk(pk: string): Promise<ContractModel> {
    return await this.contractRepository.findByPk(pk);
  }

  async getAllObjects(objectType: ObjectTypes, params?: GetAllDto): Promise<ResponseDto> {
    try {
      const args: DbArgsPayload = {
        attributes: { exclude: ['updatedAt'] },
        offset: !params || !params.limit || !params.page ? null : 0 + (+params.page - 1) * +params.limit,
        limit: !params || !params.limit ? null : +params.limit,
        order: [[params.order_by || 'createdAt', params.order || 'DESC']] as Order,
      };

      let allObjects: AllObjectResults;

      switch (objectType) {
        case ObjectTypes.TOKEN:
          args.attributes = { exclude: ['contract_id', 'updatedAt'] };
          allObjects = await this.tokenRepository.findAndCountAll(args);
          break;

        case ObjectTypes.CONTRACT:
          if (params.include_child) {
            args.include = [
              {
                model: TokenModel,
                attributes: { exclude: ['contract_id', 'updatedAt'] },
              },
            ];
          }

          allObjects = await this.contractRepository.findAndCountAll(args);
          break;
      }

      return new ResponseDto(HttpStatus.OK, null, allObjects);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async getOneObject(objectType: ObjectTypes, params: GetOneDto) {
    try {
      if (!params) {
        throw new RpcException('params can not be empty');
      }

      if (!params.id && !params.address) {
        throw new RpcException('id or address is required');
      }

      let args: DbArgsPayload = {
        attributes: { exclude: ['updatedAt'] },
        where: params.id
          ? { id: params.id }
          : params.address
          ? { address: params.address }
          : { contract_id: params.contract_id },
      };

      let result: TokenModel | ContractModel;

      switch (objectType) {
        case ObjectTypes.TOKEN:
          args.attributes = { exclude: ['updatedAt'] };
          result = await this.tokenRepository.findOne(args);
          break;

        case ObjectTypes.CONTRACT:
          if (params.include_child) {
            args.include = [
              {
                model: TokenModel,
                attributes: { exclude: ['updatedAt'] },
              },
            ];
          }

          result = await this.contractRepository.findOne(args);
          break;
      }

      return new ResponseDto(HttpStatus.OK, null, result);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async getMetadata(id: string): Promise<MetaDataDto> {
    const token = await this.tokenRepository.findOne({ where: { nft_number: id } });

    if (!token) {
      throw new RpcException('Token with this number not found');
    }

    return token.meta_data;
  }

  async updateMetadata(data: UpdateMetadataDto): Promise<ResponseDto> {
    const token = await this.tokenRepository.update(data.meta_data, { where: { nft_number: data.id } });

    if (!token[0]) {
      throw new RpcException('data not updated');
    }

    return new ResponseDto(HttpStatus.OK, null, 'data updated');
  }
}
