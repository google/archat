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
export const config = {
  skipWebAudioMod: 10,
  clearScreenAfterMs: 5000,
  minCharsToSummarize: 10,

  soundIndicatorSpeed: 0.5,
  screenSize: 1.0,
  screenX: 50,
  screenY: 50,
  maxLines: 5,
  maxSumLines: 7,
  textSize: 0.67,
  iconSize: 0.60,
  captionSize: 0.85,
  renderUpdateMs: 1000.0 / 60.0,
  scrollingSpeed: 0.04 * 4,

  scrollFirstLines: true,
  scrollFullLines: true,
  drawIndicator: true,
  stopMovingSummary: true,

  barIndentX: 17.5,
  barIndentY: 16.5,
  barWidth: 7.5,
  barHeight: 39,
  barGap: 16,
  barDiff: 15,
  barRadius: 4.2,

  enablePlaybackChange: true,
  playbackSpeed: 1.0,

  tryUnderline: true,
  renderUnderline: false,
  lastWordFadeInOffset: 0,
  underlineOffsetY: 10,
  underlineHeight: 5,
  underlineRadius: 4,
  underlineMoveNext: true,
  underlineMoveToNextMs: 800,
  underlineNextOffsetX: 10,
  underlineMaxNextWidth: 100,
  fadeInLastWord: true,
  lastWordFadeInTimeMs: 350,
  underLineEraseOffset: 0,
  interpolateUnderline: true,
  interNumUnderline: 4,
  underlineSineWave: false,
  underlineSineWaveHeight: 5,
  underlineSineWaveWait: 1500,
  underlineFadeOutAfterMs: 3000,
  underlineFadeOutDurationMs: 500,
  filterPaddings: true,
  use3Dcaption: true,

  minLines: 0,
  textColor: '#ffffff',
  blackColor: '#000000',
  captionColor: '#FDF000',
  fontFamily: 'Roboto',
  summarizationMode: 'AUTO',
  summaryMacro: '',
  postprocessSummary: true,
  postprocessText: true,

  sourceLanguage: 'en-us',
  targetLanguage: 'en-us',
  textUnknownLanguage: 'Listening...',
  useDisplayedText: true,
  removePeriodForIncomplete: false,
  showTranscriptionForTranslation: false,

  lamdaTimeMs: 1000,
  fadeInTimeMs: 200,
  fadeOutTimeMs: 200,
  translationFadeTimeMs: 800,
  translationStayTimeMs: 2000,
  sphereOffset: -7,
  sphereScale: 1.35,
  summaryMoveTimeMs: 800,
  summaryLastTimeMs: 7000,

  minLoudness: 10.0,
  maxLoudness: 30.0,
  rangeLoudness: 20.0,
  maxNormalizedLoudness: 1.0,
  minNormalizedLoudness: 0.1,

  minEditDistanceForSummary: 10,

  resetStartTimeS: 6.5,

  replaceAbbreviation: true,
};

export const SAMPLE_RATE = 44100;
