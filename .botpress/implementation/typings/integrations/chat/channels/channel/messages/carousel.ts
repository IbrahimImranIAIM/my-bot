/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Carousel = {
  items: Array<{
    title: string;
    subtitle?: string;
    imageUrl?: string;
    actions: Array<{
      action: "postback" | "url" | "say";
      label: string;
      value: string;
    }>;
  }>;
  metadata?: { [key: string]: any };
};
