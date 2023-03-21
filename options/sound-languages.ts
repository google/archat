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
export const LANGUAGES = [
  ['en-CA', 'English (Canada)'],
  ['en-IN', 'English (India)'],
  ['en-GB', 'English (United Kingdom)'],
  ['en-US', 'English (United States)'],
  ['es-MX', 'Español (México)'],
  ['fr-FR', 'Français'],
  ['it-IT', 'Italiano (Italia)'],
  ['it-CH', 'Italiano (Svizzera)'],
  ['pt-BR', 'Português (Brasil)'],
  ['pt-PT', 'Português (Portugal)'],
  ['cmn-Hant-TW', '中文 (台灣)'],
  ['ja-JP', '日本語'],
  ['cmn-Hans-CN', '普通话 (中国大陆)'],
  ['cmn-Hans-HK', '普通话 (香港)'],
  ['yue-Hant-HK', '粵語 (香港)'],
  ['ko-KR', '한국어'],
];

// Prefix of language codes where hyphen ('-') is supported.
export const HYPHEN_LANGUAGES = [
  'cmn', 'yue', 'ja', 'ko', 'hi', 'th', 'bn', 'si', 'ka', 'hy', 'ta', 'te', 'ur'
];
