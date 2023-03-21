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
/**
 * Stage of the current sound visualization.
 */
export const Stage = {
  toTranslation: -2,
  showTranslation: -3,
  endTranslation: -4,

  translation: -1,

  transcription: 0,

  summarizing: 1,
  toSummarization: 2,
  showSummarization: 3,
  endSummarization: 4,
  fadeOutSummarization: 5,
};
