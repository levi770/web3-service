import { Networks } from "../../../../common/constants";
import { ITxOptions } from "../../interfaces/txOptions.interface";

export class SendAdminDto {
    network: Networks;
    payload: ITxOptions
}