/**
 * @link https://github.com/lionralfs/discogs-client/blob/77a139c3b3f025316c942f5c7ea97157f7bc75e3/lib/collection.ts#L12
 */
export type BasicReleaseInfo = {
  id: number;
  title: string;
  year: number;
  resource_url: string;
  thumb: string;
  cover_image: string;
  formats: Array<{ qty: string; descriptions: Array<string>; name: string }>;
  labels: Array<{
    resource_url: string;
    entity_type: string;
    catno: string;
    id: number;
    name: string;
  }>;
  artists: Array<{
    id: number;
    name: string;
    join: string;
    resource_url: string;
    anv: string;
    tracks: string;
    role: string;
  }>;
  genres: Array<string>;
  styles: Array<string>;
};

export type Release = {
  id: number;
  instance_id: number;
  folder_id: number;
  rating: number;
  basic_information: BasicReleaseInfo;
  notes: Array<{ field_id: number; value: string }>;
};

/**
 * @link https://github.com/lionralfs/discogs-client/blob/77a139c3b3f025316c942f5c7ea97157f7bc75e3/lib/collection.ts#L35
 */
export type GetReleasesResponse = {
  releases: Array<Release>;
};

export type Collection = Record<
  string,
  Record<string, Array<Release> | Record<string, Array<Release>>>
>;
