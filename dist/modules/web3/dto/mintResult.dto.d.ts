import { TokenModel } from '../../db/models/token.model';
import { TxResultDto } from './txResult.dto';
export declare class MintResultDto {
    tx: TxResultDto;
    token: TokenModel;
}
