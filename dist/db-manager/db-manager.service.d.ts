import { ObjectTypes } from '../common/constants';
import { GetAllDto } from './dto/getAll.dto';
import { NewContractDto } from './dto/newContract.dto';
import { NewTokenDto } from './dto/newToken.dto';
import { ResponseDto } from '../common/dto/response.dto';
import { ContractModel } from './models/contract.model';
import { TokenModel } from './models/token.model';
import { MetaDataDto } from '../web3-manager/dto/metaData.dto';
import { GetOneDto } from './dto/getOne.dto';
import { UpdateMetadataDto } from './dto/updateMetadata.dto';
export declare class DbManagerService {
    private contractRepository;
    private tokenRepository;
    constructor(contractRepository: typeof ContractModel, tokenRepository: typeof TokenModel);
    create(params: NewContractDto | NewTokenDto, objectType: ObjectTypes): Promise<ContractModel | TokenModel>;
    findByPk(pk: string): Promise<ContractModel>;
    getAllObjects(objectType: ObjectTypes, params?: GetAllDto): Promise<ResponseDto>;
    getOneObject(objectType: ObjectTypes, params: GetOneDto): Promise<ResponseDto>;
    getMetadata(id: string): Promise<MetaDataDto>;
    updateMetadata(data: UpdateMetadataDto): Promise<ResponseDto>;
}
