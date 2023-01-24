/**
 * Represents a trait or characteristic of something. It contains a trait_type property, which
 * describes the type of trait it is, and a value property, which holds the value of the trait.
 */
class Attribute {
  trait_type: string;
  value: string;
}

/**
 * A data transfer object for passing token metadata.
 */
export class MetaDataDto {
  name: string;
  description: string;
  image?: string;
  animation_url?: string;
  external_url?: string;
  preview_url?: string;
  concept_and_design?: string;
  model_url?: string;
  skybox_url?: string;
  spatial_thumbnail_url?: string;
  spatial_space_name?: string;
  spatial_portal_url?: string;
  attributes?: Attribute[];
}
