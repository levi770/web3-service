import { Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';

export type IPFSModuleOptions = {
  host?: string;
  port?: number;
  protocol?: string;
  headers?: Headers | Record<string, string>;
  timeout?: number | string;
  apiPath?: string;
  url?: URL | string;
};

export interface IPFSModuleOptionsFactory {
  createIPFSOptions(): Promise<IPFSModuleOptions> | IPFSModuleOptions;
}

export interface IPFSModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<IPFSModuleOptionsFactory>;
  useClass?: Type<IPFSModuleOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<IPFSModuleOptions> | IPFSModuleOptions;
  inject?: any[];
  imports?: any[];
}

export interface IPFSRelayOptions {
  enabled: boolean;
  hop: { enabled: boolean; active: boolean };
}

export interface IPFSExperimentalOptions {
  ipnsPubsub: boolean;
  sharding: boolean;
}
