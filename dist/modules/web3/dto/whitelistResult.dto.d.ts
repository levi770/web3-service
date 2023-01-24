import { TxResultDto } from './txResult.dto';
export declare class WhitelistResultDto {
    tx?: TxResultDto | TxResultDto[];
    root?: string;
    proof?: object[];
}
