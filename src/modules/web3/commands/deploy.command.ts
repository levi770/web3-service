import { DeployDto } from '../dto/requests/deploy.dto';

export class DeployCommand {
  constructor(public readonly data: DeployDto) {}
}
