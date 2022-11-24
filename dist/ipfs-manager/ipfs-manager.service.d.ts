/// <reference types="node" />
import { S3 } from 'aws-sdk';
import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class IpfsManagerService implements OnModuleInit {
    private s3;
    private configService;
    private ipfs;
    constructor(s3: S3, configService: ConfigService);
    onModuleInit(): Promise<void>;
    upload(key: string): Promise<string>;
    getObjectFromS3(key: string): Promise<Buffer>;
    uploadToIpfs(file: {
        name: string;
        data: Buffer;
    }): Promise<string>;
}
