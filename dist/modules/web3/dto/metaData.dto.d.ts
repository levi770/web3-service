declare class Attribute {
    trait_type: string;
    value: string;
}
export declare class MetaDataDto {
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
export {};
