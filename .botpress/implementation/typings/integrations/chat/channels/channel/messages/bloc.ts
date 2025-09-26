/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Bloc = {
  items: Array<
    | { type: "text"; payload: { text: string } }
    | { type: "markdown"; payload: { markdown: string } }
    | { type: "image"; payload: { imageUrl: string } }
    | { type: "audio"; payload: { audioUrl: string } }
    | { type: "video"; payload: { videoUrl: string } }
    | { type: "file"; payload: { fileUrl: string; title?: string } }
    | {
        type: "location";
        payload: {
          latitude: number;
          longitude: number;
          address?: string;
          title?: string;
        };
      }
  >;
  metadata?: { [key: string]: any };
};
