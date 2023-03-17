import { DeployDto } from '../dto/deploy.dto';

export class DeployCommand {
  constructor(public readonly data: DeployDto) {}
}
