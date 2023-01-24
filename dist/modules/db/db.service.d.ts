import { AllObjectsDto } from './dto/allObjects.dto';
import { ContractModel } from './models/contract.model';
import { GetAllDto } from './dto/getAll.dto';
import { GetOneDto } from './dto/getOne.dto';
import { MetadataModel } from './models/metadata.model';
import { ObjectTypes } from '../../common/constants';
import { SetMetadataDto } from './dto/setMetadata.dto';
import { TokenModel } from './models/token.model';
import { UpdateMetadataDto } from './dto/updateMetadata.dto';
import { UpdateStatusDto } from './dto/updateStatus.dto';
import { WhitelistModel } from './models/whitelist.model';
import { CreateObjects, CreatedObjects, FindModelResult } from '../../common/types';
import { WalletModel } from './models/wallet.model';
import { TransactionModel } from './models/transaction.model';
import { MetaDataDto } from '../web3/dto/metaData.dto';
import { GetMetadataDto } from './dto/getMetadata.dto';
export declare class DbService {
    private contractRepository;
    private tokenRepository;
    private whitelistRepository;
    private metadataRepository;
    private walletsRepository;
    private transactionsRepository;
    constructor(contractRepository: typeof ContractModel, tokenRepository: typeof TokenModel, whitelistRepository: typeof WhitelistModel, metadataRepository: typeof MetadataModel, walletsRepository: typeof WalletModel, transactionsRepository: typeof TransactionModel);
    create(objects: CreateObjects, objectType: ObjectTypes): Promise<CreatedObjects>;
    delete(params: string[] | object, objectType: ObjectTypes): Promise<number>;
    findOneById(id: string, objectType: ObjectTypes): Promise<FindModelResult>;
    findOneByAddress(address: string, objectType: ObjectTypes): Promise<FindModelResult>;
    getAllObjects(objectType: ObjectTypes, params?: GetAllDto): Promise<AllObjectsDto>;
    getOneObject(objectType: ObjectTypes, params: GetOneDto): Promise<FindModelResult>;
    updateStatus(data: UpdateStatusDto, objectType: ObjectTypes): Promise<any>;
    getTokenId(contract_id: string): Promise<number>;
    setMetadata(params: SetMetadataDto, objectType: ObjectTypes): Promise<boolean>;
    getMetadata(params: GetMetadataDto): Promise<MetaDataDto>;
    updateMetadata(data: UpdateMetadataDto): Promise<MetadataModel>;
    getRepository(objectType: ObjectTypes): any;
    getIncludeModels(objectType: ObjectTypes): any[];
    createSpecifiedMetadata(token_id: string, metadata: MetadataModel): object;
}
