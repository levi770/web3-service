import { AllObjectsDto } from './dto/allObjects.dto';
import { ContractModel } from './models/contract.model';
import { GetAllDto } from './dto/getAll.dto';
import { GetOneDto } from './dto/getOne.dto';
import { MetadataModel } from './models/metadata.model';
import { ObjectTypes } from '../common/constants';
import { NewContractDto } from './dto/newContract.dto';
import { NewMetadataDto } from './dto/newMetadata.dto';
import { NewTokenDto } from './dto/newToken.dto';
import { ResponseDto } from '../common/dto/response.dto';
import { SetMetadataDto } from './dto/setMetadata.dto';
import { TokenModel } from './models/token.model';
import { UpdateMetadataDto } from './dto/updateMetadata.dto';
import { UpdateStatusDto } from './dto/updateStatus.dto';
import { WhitelistDto } from '../web3-manager/dto/whitelist.dto';
import { WhitelistModel } from './models/whitelist.model';
export declare class DbManagerService {
    private contractRepository;
    private tokenRepository;
    private whitelistRepository;
    private metadataRepository;
    constructor(contractRepository: typeof ContractModel, tokenRepository: typeof TokenModel, whitelistRepository: typeof WhitelistModel, metadataRepository: typeof MetadataModel);
    create(objects: NewContractDto[] | NewTokenDto[] | WhitelistDto[] | NewMetadataDto[], objectType: ObjectTypes): Promise<ContractModel[] | TokenModel[] | WhitelistModel[] | MetadataModel[]>;
    delete(params: string[] | object, objectType: ObjectTypes): Promise<number>;
    findById(id: string, objectType: ObjectTypes): Promise<ContractModel | TokenModel | WhitelistModel | MetadataModel>;
    getAllObjects(objectType: ObjectTypes, params?: GetAllDto): Promise<AllObjectsDto>;
    getOneObject(objectType: ObjectTypes, params: GetOneDto): Promise<any>;
    updateStatus(data: UpdateStatusDto): Promise<ResponseDto>;
    getTokenId(contract_id: string): Promise<number>;
    setMetadata(params: SetMetadataDto, objectType: ObjectTypes): Promise<boolean>;
    getMetadata(id: string): Promise<any>;
    updateMetadata(data: UpdateMetadataDto): Promise<ResponseDto>;
    createSpecifiedMetadata(token: TokenModel, metadata: MetadataModel): object;
}
