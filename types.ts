export type MediaType = 'image' | 'audio' | 'auto';

export interface AnalysisRequest {
  mediaUrl?: string;
  mediaType: MediaType;
  fileData?: string; // base64 string
  mimeType?: string;
  targetLanguage: string;
  apiKey?: string;
}

export interface AnalysisResponse {
  script: string;
  success: boolean;
  error?: string;
}

export interface MetadataResult {
  title: string;
  description: string;
  hashtags: string;
  thumbnailText: string;
}

export interface MetadataRequest {
  script: string;
  apiKey?: string;
}

export interface MetadataResponse {
  metadata: MetadataResult;
  success: boolean;
  error?: string;
}

export interface CodeSnippet {
  model: string;
  apiKeyPlaceholder: string;
  fetchApiExample: string;
  sdkServerExample: string;
}
