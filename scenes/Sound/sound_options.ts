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
export const LANGUAGES = Object.freeze({
  EN_US: 'en-US',
});

export const DEFAULT_INPUT_LANGUAGE = LANGUAGES.EN_US;

export enum TranscriptionLayout {
  NONE = 'NONE',
  FOLLOW_SHOULDER = 'Follow Shoulder',
  RIGHT_TO_FACE = 'Left to Face',
  LEFT_TO_FACE = 'Right to Face',
  FOLLOW_FACE = 'Follow Face',
  BOTTOM = 'Bottom',
  TOP = 'Top',
  TOP_LEFT = 'Top Left',
  TOP_RIGHT = 'Top Right',
}

export enum LambdaLayout {
  NONE = 'None',
  TOP_LEFT = 'Top Left',
}

export enum SummaryMode {
  NONE = 'Disabled',
  AUTOMATIC = 'Automatic',
  SUMMARY_ONLY = 'SummaryOnly',
  ON_TAP = 'OnTap',
}

export enum CaptionMode {
  WEB_AUDIO = 'Disabled',
  GMEET_SELF = 'Yourself',
  GMEET_EVERYONE = 'Everyone',
}

export enum BackgroundImage {
  CAMERA = 'Camera',
  BLACK = 'Black',
}

export enum EmphasizingMode {
  ENABLED = 'Enabled',
  DISABLED = 'Disabled',
}

export enum AutoCapitalization {
  ENABLED = 'Enabled',
  DISABLED = 'Disabled',
}

export enum Colors {
  BLACK = '#000000',
  WHITE = '#ffffff',
  GOLD = '#fbdd3a',
  GREY60P = '#000000aa',
  TRANSPARENT = '#00000000',
}

export interface SoundOptions {
  sourceLanguage: string;
  targetLanguage: string;
  fontSize: number;
  fontColor: string;
  lineSpacing: number;
  backgroundColor: string;
  backgroundWidth: number;
  stability: number;
  scrolling: boolean;
  transcriptionLayout: TranscriptionLayout;
  lambdaLayout: LambdaLayout;
  summaryDelay: number;
  summaryMinWords: number;
  summaryMaxWords: number;
  summaryColor: string;
  summaryLayout: string;
  textLayout: string;
  summarizationMode: string;
  languageModel: string;
  useMeetCaptions: string;
  meetCaptions: string;
  webAudioCaptions: string;
  speakerDiarization: string;
  summaryTopMargin: number;
  summaryPrefix: string;

  screenX: number;
  screenY: number;
  zoomRatio: number;
  // textRatio: number;
  maxLines: number;

  unifiedTop: number;
  unifiedLeft: number;
  unifiedScreenPadding: number;
  unifiedIconSize: number;
  unifiedFontSize: number;
  unifiedLineSpacing: number;
  unifiedCaptionSpacing: number;
  unifiedCaptionOffset: number;
  unifiedScreenWidth: number;
  unifiedScreenHeight: number;

  canvasBackgroundColor: string;
  captionColor: string;
  fontWeight: string;
  fontStyle: string;
  fontFamily: string;

  numLogs: number;
  lamdaTriggerPauseMs: number;
  lamdaShowTimeMs: number;
  summaryTimeOutMs: number;
  tapTimestamp: number;
  captionSize: number;

  emphasizingMode: string;
  autoCapitalization: string;
  backgroundImage: string;
  showBorder: string;
}

export const DEFAULT_SOUND_OPTIONS: SoundOptions = {
  sourceLanguage: LANGUAGES.EN_US,
  targetLanguage: LANGUAGES.EN_US,
  fontSize: 56,
  fontColor: Colors.WHITE,
  lineSpacing: 8,
  backgroundColor: Colors.GREY60P,
  backgroundWidth: 400,
  stability: 0.8,
  scrolling: false,
  transcriptionLayout: TranscriptionLayout.FOLLOW_FACE,
  lambdaLayout: LambdaLayout.TOP_LEFT,
  summaryDelay: 8000,
  summaryMinWords: 25,
  summaryMaxWords: 150,
  summaryColor: Colors.WHITE,
  captionColor: Colors.GOLD,
  summaryLayout: 'Bubble',
  textLayout: 'FixedTopRight',
  summarizationMode: SummaryMode.NONE,
  languageModel: 'GenericSummarizer',
  useMeetCaptions: CaptionMode.GMEET_EVERYONE,
  meetCaptions: '',
  webAudioCaptions: '',
  speakerDiarization: 'SpeakerOnly',
  summaryTopMargin: 0,
  summaryPrefix: 'Summary: ',
  emphasizingMode: EmphasizingMode.DISABLED,
  autoCapitalization: AutoCapitalization.ENABLED,
  showBorder: AutoCapitalization.DISABLED,
  backgroundImage: BackgroundImage.CAMERA,

  screenX: 150,
  screenY: 10,
  zoomRatio: 0.6,
  maxLines: 5,

  unifiedTop: 24,
  unifiedLeft: 24,
  unifiedScreenPadding: 48,
  unifiedIconSize: 72,
  unifiedFontSize: 48,
  unifiedLineSpacing: 14,
  unifiedCaptionSpacing: 30,
  unifiedCaptionOffset: 10,
  unifiedScreenWidth: 600,
  unifiedScreenHeight: 600,

  canvasBackgroundColor: 'grey',
  fontWeight: 'normal',
  fontStyle: 'normal',
  fontFamily: 'Roboto',

  numLogs: 0,
  captionSize: 40,

  lamdaTriggerPauseMs: 1000,
  lamdaShowTimeMs: 1500,
  summaryTimeOutMs: 6000,
  tapTimestamp: 0,
}
