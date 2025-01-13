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
import {Entity, entityDetection, getEntityThumbnail} from './external_apis';

export class EntityLocator {
  private lastText?: string;

  entity?: Entity;
  entityImgUrl?: string;
  entityImg?: HTMLImageElement;

  async processText(text: string) {
    if (this.lastText === text) return;
    this.lastText = text;

    const response = await entityDetection({
      'encodingType': 'UTF8',
      'document': {'type': 'PLAIN_TEXT', 'language': 'en', 'content': text}
    });
    const entity = response.entities.sort(compareSa).find(
        entity => entity.metadata.wikipedia_url);
    if (!entity) return;
    const wikiName = entity.metadata.wikipedia_url!.split('/').slice(-1)[0];

    console.log('-- Detected Entity --');
    console.log(entity.name);
    console.log(wikiName);

    if (entity.name === this.entity?.name) return;

    this.entity = entity;

    this.entityImgUrl = await getEntityThumbnail(wikiName, this.entity.name);
    if (!this.entityImgUrl) return;

    console.log(this.entityImgUrl)

    return new Promise<void>(resolve => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        console.log('image loaded');
        this.entityImg = img;
        resolve();
      };
      img.src = this.entityImgUrl!;
    });
  }
}

function compareSa(a: Entity, b: Entity) {
  return b.salience - a.salience;
}
