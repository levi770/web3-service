import { SqsProcess } from '@nestjs-packages/sqs';
import { SQS_PRODUCER_NAME } from '../../common/constants';

@SqsProcess(SQS_PRODUCER_NAME)
export class SqsProducerHandler {}
