import { create } from 'ipfs-http-client';
import { Injectable, Inject, OnApplicationShutdown } from '@nestjs/common';
import { IPFS_MODULE_OPTIONS } from './ipfs.constants';
import { IPFSOptions } from './ipfs-options.interface';

@Injectable()
export class IpfsService implements OnApplicationShutdown {
  private _ipfsNode: any;

  constructor(@Inject(IPFS_MODULE_OPTIONS) private _ipfsOptions?: IPFSOptions) {}

  async getNode(): Promise<any> {
    return this._ipfsNode ? this._ipfsNode : (this._ipfsNode = create(this._ipfsOptions));
  }

  async onApplicationShutdown(): Promise<void> {
    (await this._ipfsNode) && this._ipfsNode.stop();
  }
}