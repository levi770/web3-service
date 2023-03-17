import { Networks } from '../../common/constants';
import { ITxOptions } from '../interfaces/tx-options.interface';

export class SendAdminDto {
  network: Networks;
  payload: ITxOptions;
}
