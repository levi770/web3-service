/// <reference types="node" />
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export declare class IpfsManagerService {
    private s3;
    private configService;
    private httpService;
    constructor(s3: S3, configService: ConfigService, httpService: HttpService);
    upload(key: string): Promise<string>;
    getObjectFromS3(key: string): Promise<Buffer>;
    uploadToPinata(file: {
        name: string;
        data: Buffer;
    }): Promise<string>;
}
