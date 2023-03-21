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
export interface InteractiveImageOptions {
  enableButton: boolean;
  proactiveness: string;
  enableAllCaptions: boolean;
  enableEmoji: boolean;
  enablePersonal: boolean;
  model: string;
  visualSize: number;
  numVisuals: number;
  numEmojis: number;
  numWords: number;
  lastNSentences: number;
  enableLogging: boolean;
}

export const DEFAULT_INTERACTIVEIMAGE_OPTIONS = {
  enableButton: true,
  proactiveness: 'Suggestion',
  enableAllCaptions: false,
  enableEmoji: true,
  enablePersonal: true,
  model: 'davinci',
  visualSize: 1,
  numVisuals: 5,
  numEmojis: 4,
  numWords: 4,
  lastNSentences: 1,
  enableLogging: false,
}
