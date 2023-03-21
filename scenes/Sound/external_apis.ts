/*
 Copyright 2023 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
import {bingApiKey, googleApiKey, hfApiKey} from '../../api_keys';

interface EntityMetadata {
  wikipedia_url?: string;
}

export interface Entity {
  name: string;
  type: string;
  salience: number;
  metadata: EntityMetadata;
  mentions: any;
}

interface EntityDetectionResponse {
  entities: Entity[];
}


export async function entityDetection(data: any) {
  const url =
      'https://language.googleapis.com/v1/documents:analyzeEntities?key=' +
      googleApiKey;
  const response = await fetch(url, {
    headers: {},
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json() as Promise<EntityDetectionResponse>;
}

// Emotion analysis
export async function emotionAnalysis(data: any) {
  const url =
      'https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base';
  const response = await fetch(url, {
    headers: {Authorization: 'Bearer ' + hfApiKey},
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

////////////////////////
// VISUAL RETRIEVAL
////////////////////////

export async function getWikipediaThumbnail(searchTerm: string) {
  const title = encodeURI(searchTerm);
  const url =
      `https://en.wikipedia.org/w/api.php?&origin=*&action=query&format=json&formatversion=2&prop=pageimages|pageterms&piprop=thumbnail&pithumbsize=500&titles=${
          title}`;
  const response = await fetch(url);
  const result = await response.json();
  if (result.query.pages[0].thumbnail) {
    return result.query.pages[0].thumbnail.source;
  }
  return '';
}

export async function getBingSearchThumbnail(searchTerm: string) {
  const query = encodeURI(searchTerm);
  const url = `https://api.bing.microsoft.com/v7.0/images/search?q=${
      query}&mkt=en-us&safeSearch=moderate&count=1&offset=0`;
  const response = await fetch(url, {
    headers: {'Ocp-Apim-Subscription-Key': bingApiKey},
    method: 'GET',
  });
  const result = await response.json();
  return result.value.map((val: {thumbnailUrl: string}) => val.thumbnailUrl)
      .shift();
}

export async function getEntityThumbnail(
    entityWikiName: string, entityName: string) {
  const wikiThumbnail = await getWikipediaThumbnail(entityWikiName);
  console.log('DEBUG', wikiThumbnail);
  if (wikiThumbnail.length > 0) return wikiThumbnail;
  return getBingSearchThumbnail(entityName);
}
