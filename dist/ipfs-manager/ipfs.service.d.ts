import { OnApplicationShutdown } from '@nestjs/common';
import { IPFSOptions } from './interfaces/ipfs-options.interface';
export declare class IpfsService implements OnApplicationShutdown {
    private _ipfsOptions?;
    private _ipfsNode;
    constructor(_ipfsOptions?: IPFSOptions);
    getNode(): Promise<any>;
    onApplicationShutdown(): Promise<void>;
}
