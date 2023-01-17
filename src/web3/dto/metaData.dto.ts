/**
 * @class Attribute - represents a trait or characteristic of something. It contains a trait_type property, which
 * describes the type of trait it is, and a value property, which holds the value of the trait.
 *
 * @param {string} trait_type - Attribute trait type.
 * @param {string} value - Attribute trait value.
 */
class Attribute {
  trait_type: string;
  value: string;
}

/**
 * @class MetaDataDto - A data transfer object for passing token metadata.
 * @export
 *
 * @param {string} name - The name of the asset.
 * @param {string} description - The description of the asset.
 * @param {string} [image] - The URL of an image for the asset.
 * @param {string} [animation_url] - The URL of an animation for the asset.
 * @param {string} [external_url] - The external URL for the asset.
 * @param {string} [preview_url] - The URL of a preview image for the asset.
 * @param {string} [concept_and_design] - The concept and design description for the asset.
 * @param {string} [model_url] - The URL of a model for the asset.
 * @param {string} [skybox_url] - The URL of a skybox for the asset.
 * @param {string} [spatial_thumbnail_url] - The URL of a thumbnail for the asset.
 * @param {string} [spatial_space_name] - The name of the spatial space for the asset.
 * @param {string} [spatial_portal_url] - The URL of the spatial portal for the asset.
 * @param {Attribute[]} [attributes] - The attributes of the asset.
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
