
export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface PosterConfig {
  productName: string;
  price: string;
  details: string;
  ratio: AspectRatio;
  quality: "1K" | "2K" | "4K";
}

export interface GeneratedPoster {
  id: string;
  url: string;
  timestamp: number;
  config: PosterConfig;
}

export enum AppStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  GENERATING = 'generating',
  SUCCESS = 'success',
  ERROR = 'error'
}
