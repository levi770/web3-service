import { Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';

export type IPFSOptions = {
  host?: string;
  port?: number;
  protocol?: string;
  headers?: Headers | Record<string, string>;
  timeout?: number | string;
  apiPath?: string;
  url?: URL | string;
};
