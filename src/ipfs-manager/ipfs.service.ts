import { create } from 'ipfs-http-client';
import { Injectable, Inject, OnApplicationShutdown } from '@nestjs/common';
import { IPFSOptions } from './interfaces/ipfs-options.interface';
import { IPFS_MODULE_OPTIONS } from '../common/constants';

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
