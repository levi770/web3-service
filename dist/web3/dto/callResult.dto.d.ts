import { TxResultDto } from './txResult.dto';
export declare class CallResultDto {
    tx?: TxResultDto | TxResultDto[];
    merkleRoot?: string;
    merkleProof?: object[];
}
