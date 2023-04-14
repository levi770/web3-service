import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { MetadataTypes, ObjectTypes, Statuses } from '../../../common/constants';
import { RepositoryService } from '../../../repository/repository.service';
import { MetadataModel } from '../../../repository/models/metadata.model';
import { TokensMintedEvent } from '../tokens-minted.event';

@EventsHandler(TokensMintedEvent)
export class TokensMintedHandler implements IEventHandler<TokensMintedEvent> {
  private logger = new Logger(TokensMintedEvent.name);
  constructor(private readonly repository: RepositoryService) {}
  async handle(event: TokensMintedEvent) {
    try {
      const { payload, contract, token, ids_range } = event.data;
      
      let metadataModel: MetadataModel[];
      const isMetadataExist = payload.meta_data && payload.asset_url && payload.asset_type ? true : false;
      if (isMetadataExist) {
        const { metadata, gw_link } = await this.repository.buildMetadata(payload);
        const metadataPayload = {
          status: Statuses.CREATED,
          type: MetadataTypes.SPECIFIED,
          address: contract.address,
          slug: contract.slug,
          meta_data: metadata,
          file_link: gw_link,
          token_id: ids_range,
        };
        metadataModel = await this.repository.create<MetadataModel>([metadataPayload], ObjectTypes.METADATA);
        await this.repository.setMetadata({ object_id: token.id, id: metadataModel[0].id }, ObjectTypes.TOKEN);
        return metadataModel[0];
      }

      const metadataPayload = {
        status: Statuses.CREATED,
        type: MetadataTypes.SPECIFIED,
        address: contract.address,
        slug: contract.slug,
        meta_data: contract.metadata.meta_data,
        file_link: contract.metadata.file_link,
        token_id: ids_range,
      };
      metadataModel = await this.repository.create<MetadataModel>([metadataPayload], ObjectTypes.METADATA);
      await this.repository.setMetadata({ object_id: token.id, id: metadataModel[0].id }, ObjectTypes.TOKEN);
    } catch (err) {
      this.logger.error(err);
    }
  }
}
