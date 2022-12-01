import { ObjectTypes } from '../common/constants';
import { GetAllDto } from './dto/getAll.dto';
import { NewContractDto } from './dto/newContract.dto';
import { NewTokenDto } from './dto/newToken.dto';
import { ResponseDto } from '../common/dto/response.dto';
import { ContractModel } from './models/contract.model';
import { TokenModel } from './models/token.model';
import { MetaDataDto } from '../web3-manager/dto/metaData.dto';
import { GetOneDto } from './dto/getOne.dto';
import { AllObjectsDto } from './dto/allObjects.dto';
import { UpdateMetadataDto } from './dto/updateMetadata.dto';
import { WhitelistDto } from '../web3-manager/dto/whitelist.dto';
import { WhitelistModel } from './models/whitelist.model';
export declare class DbManagerService {
    private contractRepository;
    private tokenRepository;
    private whitelistRepository;
    constructor(contractRepository: typeof ContractModel, tokenRepository: typeof TokenModel, whitelistRepository: typeof WhitelistModel);
    create(params: NewContractDto | NewTokenDto | WhitelistDto, objectType: ObjectTypes): Promise<ContractModel | TokenModel | WhitelistModel>;
    delete(params: string | WhitelistDto, objectType: ObjectTypes): Promise<number>;
    findById(id: string, objectType: ObjectTypes): Promise<ContractModel | TokenModel | WhitelistModel>;
    getAllObjects(objectType: ObjectTypes, params?: GetAllDto): Promise<AllObjectsDto>;
    getOneObject(objectType: ObjectTypes, params: GetOneDto): Promise<ContractModel | TokenModel | WhitelistModel>;
    getMetadata(id: string): Promise<MetaDataDto>;
    updateMetadata(data: UpdateMetadataDto): Promise<ResponseDto>;
}
