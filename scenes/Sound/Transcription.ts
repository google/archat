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
 * Live transcription experiences.
 **/
import {Scene} from '../scene';
import {SCENE_NAMES} from '../scene_names';
import {breakLines, drawCircle, drawSine, roundRect} from '../utils/canvas_utils';
import {percentageToHex} from '../utils/color_utils';
import {mix} from '../utils/math_utils';
import {MovingAverage} from '../utils/moving_average';
import {areTokensNew, EASTERN_CHARACTER, findTheFirstPunctuationBeforeLineBreak, getStringFromTokensToRender, mergeLog, mergeText, postprocessNoPunctuationString, removeLastWord, testDifferentWords, Token, tokenizedMerge, tokens2str} from '../utils/nlp_utils';

import {CAPTION_LANGUAGES, CAPTION_SUMMARIZING, CAPTION_SUMMARY} from './caption_languages';
import {config} from './sound_config';
import {SoundEngine} from './sound_engine';
import {DEFAULT_SOUND_LOGS, SoundLogs} from './sound_logs';
import {BackgroundImage, CaptionMode, Colors, DEFAULT_SOUND_OPTIONS, SoundOptions, SummaryMode} from './sound_options';
import {Stage} from './sound_stages';


interface ImageLibrary {
  dir: string;
  summarySphereFileName: string;
  translationIconFileName: string;
  summarySphere: HTMLImageElement,
}

export class SummarizationScene extends Scene {
  name = SCENE_NAMES.Sound;

  finalText = 'clear';

  soundEngine = new SoundEngine();

  bubbleX = new MovingAverage();

  bubbleY = new MovingAverage();

  soundOptions: SoundOptions = DEFAULT_SOUND_OPTIONS;
  soundLogs: SoundLogs = DEFAULT_SOUND_LOGS;

  lastFinalizedTranscription = '';
  showSummary = false;
  numFrames = 0;
  FPS = 30;

  caption = 'English';
  // Dictionary of capitalize_me, lower case to higher case.
  capitalize_me: {[x: string]: string;};
  text = '';
  lastBuffer = '';
  persist = '';
  // historicalTokens: Token[] = [];
  historicalString = '';
  persistTokens: Token[] = [];
  buffer = '';
  tokens: Token[] = [];
  bufferRaw = '';
  lastEngine = 'WebAudio';
  currentEngine = 'WebAudio';
  lastMeetCaption = '';
  lastTextUpdatedMs = 0;
  lastAutoSummaryTextUpdateMs = 0;
  lastTrascriptionPageShownMs = -1;
  lastSummarizeMs = 0;

  canvasWidth = 1280;
  canvasHeight = 720;
  screenWidth = 600;
  screenHeight = 600;
  screenPadding = 0;
  showSummaryPage = false;
  selectedMode = 'Automatic';
  lastSummaryTimeMs = -1;
  updateTimeMs = 16;
  textToSummarize = '';
  lastTextToSummarize = '';
  lastTextShownOnSummarize = '';
  lastSummaryShown = '';

  noDisplayAreaHeight = 0;
  numLines = 0;
  iconX = 0;
  iconY = 0;
  iconMinY = 0;
  iconWidth = 0;
  iconHeight = 0;
  captionX = 0;
  captionY = 0;
  captionMinY = 0;
  textX = 0;
  textY = 0;
  fontSize = 0;
  captionFontSize = 0;
  lineSpacing = 0;
  lineHeight = 0;
  textWidth = 0;
  textRatio = 1.0;
  captionRatio = 1.0;
  image: HTMLCanvasElement = null;
  canvas: HTMLCanvasElement = null;
  ctx: CanvasRenderingContext2D = null;

  lines: string[] = [];
  summaryLines: string[] = [];

  startLineId = 0;
  lastStartLineId = 0;
  currentDeltaY = 0;
  targetDeltaY = 0;

  stage = Stage.transcription;

  paddingMinHeight = 0;

  /**
   * summarization
   */
  lastSummaryEventTime = -1;
  summaryEventDurationMs = 0;
  summaryEventPercentage = 0;

  /**
   * Translation
   */
  lastTranslationEventTime = -1;
  translationDurationMs = 0;
  translationPercentage = 0;

  /**
   * Animation
   */
  currentTextY = 0;
  targetTextY = 0;
  deltaFirstLineY = 0;
  underLineX = new MovingAverage();
  underLineW = new MovingAverage();
  lastUnderlineY = -1;

  /**
   * Last word
   */
  lastWord = '';
  underlineLastTimeMs = 0;

  lastTapTimestamp = -1;

  images: ImageLibrary = {
    dir: './images/',
    summarySphereFileName: 'summary-sphere.png',
    translationIconFileName: 'sphere-translation-in',
    summarySphere: null,
  };

  lang = {
    transcription: 'English',
    summary: 'Summary',
    summarizing: 'Summarizing...',
    listening: 'Listening...'
  }

  constructor() {
    super();
  }

  setOptions(newOptions: SoundOptions) {
    // Triggers when new options are set.
    if (!newOptions) return;

    // Restarts the sound engine.
    this.soundEngine.setSourceLanguage(newOptions.sourceLanguage);
    this.soundOptions = newOptions;
    this.soundEngine.setLanguageModel(newOptions.languageModel);

    const lower = newOptions.sourceLanguage.toLowerCase();
    this.lang.transcription = CAPTION_LANGUAGES[lower];
    this.lang.summary = CAPTION_SUMMARY[lower];
    this.lang.summarizing = CAPTION_SUMMARIZING[lower];

    // Saves the sound logs.
    chrome.storage.local.set({soundLogs: this.soundLogs});
    // console.log('saving logs', this.soundLogs);
  }

  async init() {
    if (!this.readyState) {
      this.soundEngine.start();
    }

    // Loads any deps.
    this.readyState = true;

    this.soundLogs = DEFAULT_SOUND_LOGS;
    this.stage = Stage.transcription;
    this.currentTextY = 0;
    this.lastTextUpdatedMs = performance.now();

    this.images.summarySphere = document.createElement('img');
    this.images.summarySphere.src =
        this.images.dir + this.images.summarySphereFileName;
    document.body.appendChild(this.images.summarySphere);

    const CAPITALIZE_FILE_NAME = 'capitalize_me.txt';
    let response = await fetch('./nlp/' + CAPITALIZE_FILE_NAME);
    let raw_cap = await response.text();

    let capitalize_me_array = raw_cap.split('\n');
    let capitalize_me_array_lower = capitalize_me_array.map(element => {
      return element.toLowerCase();
    });

    // Makes a dictionary with two arrays.
    this.capitalize_me = Object.assign(
        {},
        ...capitalize_me_array_lower.map(
            (n, index) => ({[n]: capitalize_me_array[index]})))
  }

  async stop() {
    if (this.readyState) {
      this.soundEngine.stop();
      this.readyState = false;
    }
  }

  async render(
      canvasCamImg: HTMLCanvasElement, mlPredictions: unknown,
      effectOutputCanvas: HTMLCanvasElement) {
    // this.renderSound(canvasCamImg, effectOutputCanvas,
    // mlPredictions.MoveNet);
    this.renderSound(canvasCamImg, effectOutputCanvas);
  }

  /**
   * Whether the summarization page is shown.
   * @returns
   */
  isSummaryShown() {
    return this.stage >= Stage.toSummarization &&
        this.stage < Stage.fadeOutSummarization;
  }

  isSummarizing() {
    return this.stage == Stage.summarizing;
  }

  isSummaryFading() {
    return this.stage == Stage.summarizing ||
        this.stage == Stage.fadeOutSummarization;
  }

  isSummaryMoving() {
    return this.stage == Stage.toSummarization ||
        this.stage == Stage.endSummarization
  }

  /**
   * Updates the layout of the page.
   */
  updateLayout() {
    let o = this.soundOptions;

    // https://stackoverflow.com/questions/47963844/why-does-the-canvas-filltext-method-seem-to-use-the-wrong-coordinates
    this.ctx.textBaseline = 'top';

    this.textRatio = o.fontSize / o.unifiedFontSize;
    this.captionRatio = o.captionSize / o.unifiedFontSize;

    // Overall canvas and screen.
    this.canvasHeight = this.canvas.height;
    this.canvasWidth = this.canvas.width;

    this.screenWidth = o.unifiedScreenWidth * o.zoomRatio;
    this.screenHeight = o.unifiedScreenHeight * o.zoomRatio;

    // Top bottom left right padding.
    this.screenPadding = o.unifiedScreenPadding * o.zoomRatio;

    // Switches stages.
    switch (this.stage) {
      case Stage.summarizing:
        this.summaryEventDurationMs =
            performance.now() - this.lastSummaryEventTime;
        this.summaryEventPercentage = 0;
        this.summaryEventPercentage =
            this.summaryEventDurationMs / config.fadeInTimeMs;
        if (this.summaryEventPercentage >= 1.0 &&
            this.soundEngine.isSummarized) {
          this.stage = Stage.toSummarization;
          this.lastSummaryTimeMs = performance.now();
          this.lastSummaryEventTime = performance.now();
          this.summaryEventDurationMs = 0;
          this.soundLogs.summary += '[' +
              (this.lastSummaryTimeMs / 1000).toFixed(0) + '-out] ' +
              this.soundEngine.summaryText + '\n';
        }
        break;

      case Stage.toSummarization:
        this.summaryEventDurationMs =
            performance.now() - this.lastSummaryEventTime;
        if (this.summaryEventDurationMs > config.summaryMoveTimeMs) {
          this.stage = Stage.showSummarization;
          this.lastSummaryEventTime = performance.now();
          this.summaryEventDurationMs = 0;
        }
        this.summaryEventPercentage =
            this.summaryEventDurationMs / config.summaryMoveTimeMs;
        break;

      case Stage.showSummarization:
        this.lastSummaryTimeMs = performance.now();
        this.summaryEventDurationMs =
            this.lastSummaryTimeMs - this.lastSummaryEventTime;
        const timeOutMs =
            o.summaryTimeOutMs / o.maxLines * this.summaryLines.length;
        this.summaryEventPercentage = this.summaryEventDurationMs / timeOutMs;
        if (this.summaryEventDurationMs > timeOutMs) {
          this.stage = Stage.endSummarization;
          this.lastSummaryEventTime = performance.now();
          this.summaryEventDurationMs = 0;
          this.summaryEventPercentage = 1;
        }
        break;

      case Stage.endSummarization:
        this.summaryEventDurationMs =
            performance.now() - this.lastSummaryEventTime;
        this.summaryEventPercentage =
            1 - this.summaryEventDurationMs / config.summaryMoveTimeMs;
        if (this.summaryEventDurationMs > config.summaryMoveTimeMs) {
          this.stage = Stage.fadeOutSummarization;
          this.lastSummaryEventTime = performance.now();
          this.summaryEventDurationMs = 0;
          this.summaryEventPercentage = 1;
        }
        break;

      case Stage.fadeOutSummarization:
        this.summaryEventDurationMs =
            performance.now() - this.lastSummaryEventTime;
        this.summaryEventPercentage =
            1 - this.summaryEventDurationMs / config.fadeOutTimeMs;
        if (this.summaryEventDurationMs > config.fadeOutTimeMs) {
          this.stage = Stage.transcription;
          this.lastSummaryEventTime = performance.now();
          this.summaryEventDurationMs = 0;
        }
        break;

      case Stage.toTranslation:
        this.translationDurationMs =
            performance.now() - this.lastTranslationEventTime;
        this.translationPercentage =
            this.translationDurationMs / config.translationFadeTimeMs;
        if (this.translationDurationMs > config.translationFadeTimeMs) {
          this.stage = Stage.showTranslation;
          this.lastTranslationEventTime = performance.now();
          this.translationDurationMs = 0;
        }
        break;

      case Stage.showTranslation:
        this.translationDurationMs =
            performance.now() - this.lastTranslationEventTime;
        this.translationPercentage =
            this.translationDurationMs / config.translationStayTimeMs;
        if (this.translationDurationMs > config.translationStayTimeMs) {
          this.stage = Stage.endTranslation;
          this.lastTranslationEventTime = performance.now();
          this.translationDurationMs = 0;
        }
        break;

      case Stage.endTranslation:
        this.translationDurationMs =
            performance.now() - this.lastTranslationEventTime;

        this.translationPercentage =
            1 - this.translationDurationMs / config.translationFadeTimeMs;
        if (this.translationDurationMs > config.translationFadeTimeMs) {
          this.stage = Stage.translation;
          this.lastTranslationEventTime = performance.now();
          this.translationDurationMs = 0;
        }
        break;
    }

    // Computes the no display area and changes the caption.
    if (!this.isSummaryShown()) {
      // If no transcription, no numLines.
      if (this.text == '') {
        this.numLines = 0;
      }

      // deltaFirstLineY indicates the offset where the frist line is started
      // with smooth transition.
      this.noDisplayAreaHeight = this.screenHeight -
          (o.unifiedTop * 2 +
           (o.unifiedFontSize * this.textRatio + o.unifiedLineSpacing) *
               Math.min(o.maxLines, this.numLines) +
           this.deltaFirstLineY + o.unifiedCaptionSpacing +
           o.unifiedIconSize * this.captionRatio) *
              o.zoomRatio;
      this.paddingMinHeight = this.noDisplayAreaHeight;
    } else {
      // Summary always shows the maximum number of lines.
      this.noDisplayAreaHeight = this.screenHeight -
          (o.unifiedTop * 2 +
           (o.unifiedFontSize * this.textRatio + o.unifiedLineSpacing) *
               config.maxSumLines +
           o.unifiedCaptionSpacing + o.unifiedIconSize * this.captionRatio) *
              o.zoomRatio;
      this.paddingMinHeight = this.screenHeight -
          (o.unifiedTop * 2 +
           (o.unifiedFontSize * this.textRatio + o.unifiedLineSpacing) *
               config.minLines +
           o.unifiedCaptionSpacing + o.unifiedIconSize * this.captionRatio) *
              o.zoomRatio;
    }

    if (o.summarizationMode == SummaryMode.SUMMARY_ONLY) {
      // Summary always shows the maximum number of lines.
      this.noDisplayAreaHeight = this.screenHeight -
          (o.unifiedTop * 2 +
           (o.unifiedFontSize * this.textRatio + o.unifiedLineSpacing) *
               config.maxSumLines +
           o.unifiedCaptionSpacing + o.unifiedIconSize * this.captionRatio) *
              o.zoomRatio;
      this.paddingMinHeight = this.screenHeight -
          (o.unifiedTop * 2 +
           (o.unifiedFontSize * this.textRatio + o.unifiedLineSpacing) *
               config.minLines +
           o.unifiedCaptionSpacing + o.unifiedIconSize * this.captionRatio) *
              o.zoomRatio;
    }

    // Updates the tapping event.
    if (this.lastTapTimestamp == -1) {
      this.lastTapTimestamp = o.tapTimestamp;
    }

    if (this.lastTapTimestamp != o.tapTimestamp) {
      this.showSummaryPage = !this.showSummaryPage;
      this.lastSummaryTimeMs = -1;
      this.lastTapTimestamp = o.tapTimestamp;
    }

    // Updates layouts of icon and caption.
    this.iconX = o.screenX + o.unifiedLeft * o.zoomRatio;
    this.iconY = o.screenY + this.noDisplayAreaHeight +
        (o.unifiedTop + o.unifiedLineSpacing / 2) * o.zoomRatio;
    this.iconMinY = o.screenY + this.paddingMinHeight +
        (o.unifiedTop + o.unifiedLineSpacing / 2) * o.zoomRatio;

    this.iconWidth = o.unifiedIconSize * o.zoomRatio * this.captionRatio;
    this.iconHeight = o.unifiedIconSize * o.zoomRatio * this.captionRatio;
    this.captionX = o.screenX + this.iconWidth +
        (o.unifiedLeft + o.unifiedCaptionOffset) * o.zoomRatio;
    this.captionY = this.iconY + o.unifiedCaptionOffset * o.zoomRatio;
    this.captionMinY = this.iconMinY + o.unifiedCaptionOffset * o.zoomRatio;

    // Updates layout of text area.
    this.textX = o.screenX + (o.unifiedLeft) * o.zoomRatio;
    this.textY =
        this.iconY + this.iconHeight + o.unifiedCaptionSpacing * o.zoomRatio;

    if (config.scrollFirstLines && !this.isSummaryShown()) {
      this.targetTextY = this.textY;

      if (this.currentTextY == 0) {
        this.currentTextY = this.textY;
      } else {
        this.textY = this.currentTextY;
      }
      this.iconY += this.currentTextY - this.targetTextY;
      this.captionY += this.currentTextY - this.targetTextY;
    }

    this.fontSize = o.unifiedFontSize * this.textRatio * o.zoomRatio;
    this.captionFontSize = o.unifiedFontSize * o.zoomRatio;
    this.lineSpacing = o.unifiedLineSpacing * o.zoomRatio;
    this.lineHeight =
        (o.unifiedFontSize * this.textRatio + o.unifiedLineSpacing) *
        o.zoomRatio;
    this.textWidth = this.screenWidth - this.screenPadding * 3;

    this.ctx.font = o.fontStyle + ' ' + o.fontWeight + ' ' + this.fontSize +
        'px ' + o.fontFamily;
  }

  /**
   * Updates the buffer and the text.
   */
  updateText() {
    this.numFrames = (this.numFrames + 1) % this.FPS;

    if (!this.isSummaryShown()) {
      this.updateTranscriptionByToken();
    } else {
      this.updateSummary();
    }

    this.updateNumLines();
  }

  updateNumLines() {
    const o = this.soundOptions;
    this.lines = this.text.split('\n');

    if (!this.isSummaryShown()) {
      this.startLineId = Math.max(0, this.lines.length - o.maxLines);
      this.numLines = this.lines.length - this.lastStartLineId;
    } else {
      this.numLines = this.lines.length;
    }
  }

  isUsingWebAudio() {
    const o = this.soundOptions;
    return o.useMeetCaptions == CaptionMode.WEB_AUDIO || !this.gCaptionsEnabled;
  }

  // Our main stabilization technique.
  updateTranscriptionByToken() {
    const o = this.soundOptions, e = this.soundEngine;
    let incomingText = '';
    if (!this.isUsingWebAudio()) {
      incomingText = (o.useMeetCaptions == CaptionMode.GMEET_SELF) ?
          this.gSelfCaptions :
          this.gCaptions;

    } else {
      // If using Web Audio.
      // Hack: add breaks to the logs.
      if (this.soundEngine.isOutDated() && e.finalText.length > 0) {
        e.finalText = 'CLEAR';
      }
      if (e.finalText == 'CLEAR') {
        e.finalText = '';
      }

      if (this.numFrames % config.skipWebAudioMod == 0) {
        incomingText = postprocessNoPunctuationString(e.finalText, e.isFinal);
      } else {
        return;
      }
    }  // END of WebAudio

    let newTokens = tokenizedMerge(this.tokens, incomingText);
    let newBuffer = tokens2str(this.tokens);

    // Checks if we want to clear the screen and remove all historical tokens.
    const CLEAR_SCREEN_AFTER_NO_TEXT_TIME_MS = 3000;
    if (incomingText.length == 0 &&
        performance.now() - this.lastTextUpdatedMs >
            CLEAR_SCREEN_AFTER_NO_TEXT_TIME_MS) {
      this.historicalString += tokens2str(this.persistTokens) + '\n';
      this.persistTokens = [];
    }

    if (areTokensNew(this.tokens, newTokens)) {
      // console.log('areTokensNew', this.tokens, incomingText, newTokens);
      this.persistTokens =
          this.persistTokens.concat(this.tokens, [new Token('\n')]);
    }

    // Auto capitalization.
    if (o.autoCapitalization !== 'Disabled') {
      for (let i in newTokens) {
        let raw = newTokens[i].raw;
        if (this.capitalize_me[raw] !== undefined) {
          newTokens[i].raw = this.capitalize_me[raw];
          // Logs capitalization update:
          // this.soundLogs.system += raw + ' -> ' + newTokens[i].raw + '\n';
        }
      }
    }

    this.tokens = newTokens;
    this.buffer = newBuffer;

    const BREAK_LINE_AFTER_MS = 1000;

    if ((this.lastBuffer.length == 0 && this.buffer.length > 0) ||
        this.lastBuffer !== this.buffer) {
      this.lastTextUpdatedMs = performance.now();
    } else {
      if (performance.now() - this.lastTextUpdatedMs > BREAK_LINE_AFTER_MS) {
        // Adds a line break if not.
        const L = this.tokens.length;
        if (L > 0 && this.tokens[L - 1].raw != '\n') {
          this.tokens.push(new Token('\n'));
        }
      }
    }
    this.lastBuffer = this.buffer;

    // Update the text to render using persistTokens and currentTokens.
    if (this.persistTokens.length > 0) {
      this.text = getStringFromTokensToRender(
          this.ctx, this.persistTokens, this.textWidth);
      this.text += '\n';
    } else {
      this.text = '';
    }
    this.text +=
        getStringFromTokensToRender(this.ctx, this.tokens, this.textWidth);
  }

  /**
   * Deprecated method.
   */
  updateTranscriptionByCharacter() {
    const o = this.soundOptions, e = this.soundEngine;

    if (!this.isUsingWebAudio()) {
      // If using Google Meet
      if (o.useMeetCaptions == CaptionMode.GMEET_SELF) {
        // Note that one sentence in gSelfCaptions may be broken into parts.
        // We fix it by merging algorithm.
        this.buffer = mergeText(this.lastMeetCaption, this.gSelfCaptions);
        this.bufferRaw = this.buffer;
      } else {
        // Note that we haven't fully parsed everyone's captions.
        this.buffer = this.gCaptions;
        this.bufferRaw = this.gAllCaptions;
      }

      e.finalText = this.bufferRaw;
      this.lastMeetCaption = this.buffer;

      // Logging.
      this.soundLogs.meetCaptions =
          mergeLog(this.soundLogs.meetCaptions, this.gSelfCaptions);

      const gCaption = this.gAllCaptions.replaceAll('\n', '');
      this.soundLogs.meetCaptionsEveryone =
          mergeLog(this.soundLogs.meetCaptionsEveryone, gCaption);
    } else {
      // If using Web Audio.
      // Hack: add breaks to the logs.
      if (this.soundEngine.isOutDated() && e.finalText.length > 0) {
        e.finalText = 'CLEAR';
      }
      if (e.finalText == 'CLEAR') {
        e.finalText = '';
        this.soundLogs.webAudioText += '\n';
      }

      if (this.numFrames % config.skipWebAudioMod == 0) {
        this.buffer = e.finalText;
        this.buffer = postprocessNoPunctuationString(this.buffer, e.isFinal);
        this.bufferRaw = this.buffer;

        this.soundLogs.webAudioText =
            mergeLog(this.soundLogs.webAudioText, this.buffer);
      }
    }  // END of WebAudio

    // console.log(this.buffer);
    if (this.buffer.length > 0 && this.textToSummarize.length < 10) {
      this.textToSummarize = this.bufferRaw;
      // this.soundLogs.summary += '**' + this.textToSummarize + '\n';
    } else {
      // this.soundLogs.summary +=
      //     '$' + this.textToSummarize + ' $ ' + this.buffer + '\n';
      this.textToSummarize = mergeLog(this.textToSummarize, this.buffer);
      // this.soundLogs.summary += '*' + this.textToSummarize + '\n';
    }

    if (o.useMeetCaptions == CaptionMode.GMEET_SELF) {
      this.textToSummarize = this.gSelfCaptions;
    }

    // Updates lastTextUpdatedMs if text is updated.
    if ((this.lastBuffer.length == 0 && this.buffer.length > 0) ||
        this.lastBuffer !== this.buffer) {
      this.lastTextUpdatedMs = performance.now();
    }
    this.lastBuffer = this.buffer;

    // this.tryTriggerSummarizer();

    this.text = breakLines(this.ctx, this.buffer.trim(), this.textWidth);
  }

  updateSummary() {
    const o = this.soundOptions, e = this.soundEngine;
    // this.buffer = this.lastTextToSummarize + '->' + e.summaryText;
    this.buffer = e.summaryText;
    this.lastSummaryShown = e.summaryText;

    if (e.summaryText === null || e.summaryText === undefined) {
      this.buffer = this.lastTextToSummarize;
    }

    this.buffer = postprocessNoPunctuationString(this.buffer, false);
    this.buffer = breakLines(this.ctx, this.buffer, this.textWidth);
    this.text = findTheFirstPunctuationBeforeLineBreak(this.buffer, o.maxLines);

    let summaryTextWithBreaks = breakLines(this.ctx, this.text, this.textWidth);

    if (config.postprocessSummary) {
      summaryTextWithBreaks = findTheFirstPunctuationBeforeLineBreak(
          summaryTextWithBreaks, config.maxSumLines);
    }

    this.summaryLines = summaryTextWithBreaks.split('\n');
  }

  clearScreen() {
    const o = this.soundOptions;
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.renderBackground(0, 0, this.canvasWidth, this.canvasHeight);

    // Renders the screen.
    this.ctx.fillStyle = o.backgroundColor;
    this.ctx.fillRect(
        o.screenX, o.screenY, this.screenWidth,
        this.screenHeight - this.screenPadding + config.underlineHeight);
  }

  ifWordShouldBeHighlighted(word: string) {
    return word.toLowerCase().indexOf('google') >= 0;
  }

  /**
   * Renders the text
   * @returns
   */
  renderText() {
    const o = this.soundOptions;

    // Draws scrolling text.
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = o.fontColor;

    if (this.isSummaryShown()) {
      // Renders summary.
      const maxLineId = Math.min(this.summaryLines.length, config.maxSumLines);

      for (let i = 0; i < maxLineId; ++i) {
        const x = this.textX;
        const y = this.textY + i * this.lineHeight;

        // Fades out the summarization when it's moving.
        if (this.isSummaryMoving()) {
          const alpha = percentageToHex(this.summaryEventPercentage);
          this.ctx.fillStyle = o.fontColor + alpha;
        }

        this.ctx.fillText(this.summaryLines[i], x, y);
      }
    } else {
      // Corner Case: Back-traces to the previous line if text is shorter.
      if (this.startLineId < this.lastStartLineId) {
        this.lastStartLineId = this.startLineId;
        this.currentDeltaY = 0;
        this.targetDeltaY = 0;
      }

      // Gets a target delta.
      if (this.startLineId > this.lastStartLineId) {
        this.targetDeltaY =
            this.lineHeight * (this.startLineId - this.lastStartLineId);
      }

      // Scrolls first lines from bottom to top.
      if (config.scrollFirstLines) {
        if (this.currentTextY > this.targetTextY) {
          const delta = Math.max(
              (this.currentTextY - this.targetTextY) * config.scrollingSpeed,
              1);
          this.currentTextY =
              Math.max(this.currentTextY - delta, this.targetTextY);
        } else {
          this.currentTextY = this.targetTextY;
        }
      }

      // Advances the delta.
      const delta = Math.max(
          (this.targetDeltaY - this.currentDeltaY) * config.scrollingSpeed, 1);
      this.currentDeltaY += delta;
      if (this.currentDeltaY > this.targetDeltaY) {
        this.currentDeltaY = this.targetDeltaY;
      }

      if (!config.scrollFullLines) {
        this.currentDeltaY = this.targetDeltaY;
      }

      // When currentDelta is larger than a line's heigiht.
      while (this.currentDeltaY > this.lineHeight) {
        this.currentDeltaY -= this.lineHeight;
        if (this.currentDeltaY < 0) {
          this.currentDeltaY = 0;
        }

        this.lastStartLineId += 1;
      }

      const maxLineId =
          Math.min(this.lines.length, this.lastStartLineId + o.maxLines + 1);
      let lastY = 0;

      if (!(o.summarizationMode === SummaryMode.SUMMARY_ONLY)) {
        for (let i = this.lastStartLineId; i < maxLineId; ++i) {
          const x = this.textX;
          const y = this.textY +
              ((i - this.lastStartLineId) * this.lineHeight) -
              this.currentDeltaY;
          lastY = y;

          if (o.emphasizingMode == 'Enabled') {
            // Render by word if highlighting is enabled.
            let line = this.lines[i];
            if (config.fadeInLastWord && i == maxLineId - 1) {
              line = removeLastWord(this.lines[i]);
            }
            let lines = line.split(' ');
            let prior = '';
            for (let word of lines) {
              let highlighting = false;
              // An example of highlighting:
              if (this.ifWordShouldBeHighlighted(word)) {
                highlighting = true;
                this.ctx.fillStyle = o.captionColor;
              }
              this.ctx.fillText(word, x + this.ctx.measureText(prior).width, y);
              prior += ' ' + word;

              // Restores to the original color.
              if (highlighting) {
                this.ctx.fillStyle = o.fontColor;
              }
            }
          } else {
            if (config.fadeInLastWord && i == maxLineId - 1) {
              this.ctx.fillText(removeLastWord(this.lines[i]), x, y);
            } else {
              this.ctx.fillText(this.lines[i], x, y);
            }
          }
        }

        this.renderAnimatedUnderline(lastY);
      }
    }

    this.renderBlackMasks();
    this.renderIconAndCaption();

    if (o.showBorder == 'Enabled') {
      // Renders the screen.
      this.ctx.strokeStyle = o.captionColor;
      this.ctx.fillStyle = Colors.TRANSPARENT;
      this.ctx.fillRect(
          o.screenX, o.screenY, this.screenWidth,
          this.screenHeight - this.screenPadding + config.underlineHeight);
    }
  }

  renderLayoutDebug() {
    let o = this.soundOptions;
    // Renders the top
    this.ctx.fillStyle = '#ff8000ff';
    this.ctx.fillRect(
        this.textX, o.screenY, this.screenWidth - this.screenPadding * 2,
        this.screenPadding);

    // Renders the no display area.
    this.ctx.fillStyle = '#ff8000aa';
    // console.log(this.noDisplayAreaHeight);
    this.ctx.fillRect(
        this.textX, o.screenY + this.screenPadding,
        this.screenWidth - this.screenPadding * 2, this.noDisplayAreaHeight);

    // Renders the area below the caption.
    this.ctx.fillStyle = '#ff8000ff';
    this.ctx.fillRect(
        this.textX,
        o.screenY + this.screenPadding + this.noDisplayAreaHeight +
            this.iconHeight,
        this.screenWidth - this.screenPadding * 2, this.screenPadding);


    // Renders the area below the caption.
    this.ctx.fillStyle = '#ff8000ff';
    this.ctx.fillRect(
        this.textX, o.screenY + this.screenHeight - this.screenPadding,
        this.screenWidth - this.screenPadding * 2, this.screenPadding);
  }

  /**
   * Renders the background image: live camera, image preset, or solid color.
   * @param x
   * @param y
   * @param w
   * @param h
   */
  renderBackground(x: number, y: number, w: number, h: number) {
    let o = this.soundOptions;
    this.ctx.strokeStyle = this.soundOptions.backgroundColor;

    switch (o.backgroundImage) {
      case BackgroundImage.CAMERA:
        // Renders the background.
        this.ctx.drawImage(this.image, x, y, w, h, x, y, w, h);
        break;

      case BackgroundImage.BLACK:
        this.ctx.fillStyle = Colors.BLACK;
        this.ctx.fillRect(x, y, w, h);
        break;
    }
  }

  renderBackgroundDebugger(x: number, y: number, w: number, h: number) {
    this.ctx.fillStyle = this.soundOptions.captionColor;
    this.ctx.fillRect(x, y, w, h);
  }

  renderBlackMasks() {
    const o = this.soundOptions;
    this.ctx.fillStyle = o.backgroundColor;

    // Renders the black mask between text and the above for scrolling effects.
    let x = o.screenX;
    let y = o.screenY;
    let w = this.screenWidth;
    let h = (this.textY - o.screenY) | 0;
    // The first pass to draw the camer image to mask out the exceeding top
    // line. The second pass to draw the background to make sure it appears the
    // same as the rest o fthe background.
    this.renderBackground(x, y, w, h);
    this.ctx.fillRect(x, y, w, h);

    // Fills in the padding at the bottom.
    y = o.screenY + this.screenHeight - this.screenPadding +
        config.underlineHeight;
    h = this.screenPadding - config.underlineHeight + 1;
    this.renderBackground(x, y, w, h);

    // Renders the rest of the screen.
    y = o.screenY + this.screenHeight;
    w = this.screenWidth;
    h = this.canvasHeight - o.screenY - this.screenHeight;
    this.renderBackground(x, y, w, h);

    x = o.screenX + this.screenWidth;
    y = 0;
    w = this.canvasWidth - x;
    h = this.canvasHeight;
    this.renderBackground(x, y, w, h);
  }

  /**
   * Renders icon and caption.
   */
  renderIconAndCaption() {
    const o = this.soundOptions, e = this.soundEngine;

    switch (o.summarizationMode) {
      case SummaryMode.NONE:
        this.caption = this.lang.transcription;
        break;
      case SummaryMode.SUMMARY_ONLY:
        if (this.stage == Stage.transcription &&
            e.loudness > config.minLoudness) {
          this.caption = this.lang.listening;
        } else if (this.isSummarizing()) {
          this.caption = this.lang.summarizing;
        } else if (this.isSummaryShown() || this.isSummaryFading()) {
          this.caption = this.lang.summary;
        } else {
          this.caption = this.lang.transcription;
        }
        break;
      case SummaryMode.ON_TAP:
      case SummaryMode.AUTOMATIC:
        if (this.stage == Stage.transcription) {
          this.caption = this.lang.transcription;
        } else if (this.isSummarizing()) {
          this.caption = this.lang.summarizing;
        } else if (this.isSummaryShown() || this.isSummaryFading()) {
          this.caption = this.lang.summary;
        } else {
          this.caption = this.lang.transcription;
        }
        break;
    }

    this.ctx.fillStyle = o.captionColor;
    const captionSize = Math.floor(
        this.captionFontSize * this.captionRatio * config.captionSize);
    this.ctx.font = o.fontStyle + ' ' + o.fontWeight + ' ' + captionSize +
        'px ' + o.fontFamily;

    if (this.isSummaryFading()) {
      // this.summaryEventPercentage
      const alpha = percentageToHex(this.summaryEventPercentage);
      this.ctx.fillStyle = config.captionColor + alpha;
      if (this.summaryEventPercentage < 0.5 &&
          this.ctx.fillStyle == config.captionColor) {
        this.ctx.fillStyle = config.captionColor + '00';
      }
    }
  }

  /**
   * Renders text from sound.
   **/
  renderSound(inputImage: HTMLCanvasElement, outputCanvas: HTMLCanvasElement) {
    this.image = inputImage;
    this.canvas = outputCanvas;
    this.ctx = outputCanvas.getContext('2d');

    this.updateText();
    this.updateLayout();
    this.clearScreen();
    this.renderText();

    // this.renderLayoutDebug();
  }

  // Renders animated underlines.
  renderAnimatedUnderline(lastY: number) {
    let skipLastLine = false;
    const o = this.soundOptions, e = this.soundEngine;

    if (!config.tryUnderline || !this.lines || this.lines.length == 0) {
      this.lastWord = '';
      this.underlineLastTimeMs = performance.now();
      // console.log(this.lines.length, this.lastWord);
      return;
    }

    let lastLine = this.lines[this.lines.length - 1];
    if (!lastLine) {
      if (lastLine.length == 0 && this.lines.length > 1) {
        lastLine = this.lines[this.lines.length - 2];
        skipLastLine = true;
      }
      if (!lastLine) {
        this.lastWord = '';
        this.underlineLastTimeMs = performance.now();
        return;
      }
    }

    const byCharacter = EASTERN_CHARACTER.test(lastLine);

    let lastWord = '';
    let lastPosition = 0;
    if (byCharacter) {
      lastWord = lastLine[lastLine.length - 1];
      lastPosition = lastLine.length - 1;
    } else {
      let words = lastLine.split(' ');
      lastWord = words[words.length - 1];
      lastPosition = lastLine.lastIndexOf(lastWord);
    }

    if (testDifferentWords(lastWord, this.lastWord)) {
      // console.log(lastWord, this.lastWord, lastPosition);
      this.underlineLastTimeMs = performance.now();
    }
    this.lastWord = lastWord;

    const restWords = lastLine.substring(0, lastPosition);
    let uX = this.textX + this.ctx.measureText(restWords).width;
    let uY = lastY + this.lineHeight - config.underlineOffsetY * o.zoomRatio;
    // console.log(lastY, this.lineHeight, config.underlineOffsetY);
    let uW = this.ctx.measureText(lastWord).width;


    let duration = performance.now() - this.underlineLastTimeMs;
    let movedToNextLine = false;
    // Whether or not let the underline go next.
    if (config.underlineMoveNext && this.underlineLastTimeMs > 0 &&
        duration > config.underlineMoveToNextMs) {
      uX += uW + config.underlineNextOffsetX * o.zoomRatio;
      uW = Math.min(
          config.underlineMaxNextWidth * o.zoomRatio,
          this.textWidth - this.ctx.measureText(lastLine).width);
      movedToNextLine = true;
    }

    // Fades in the last word.
    if (config.fadeInLastWord) {
      const tX = this.textX + this.ctx.measureText(restWords).width;
      let tY = lastY;
      if (skipLastLine) {
        tY -= this.lineHeight;
      }

      const alpha = percentageToHex(duration / config.lastWordFadeInTimeMs);
      const eraseH = config.underLineEraseOffset * o.zoomRatio;
      // Adds an offset to the line height to avoid white artifacts.
      // this.renderBackground(
      //     tX - 1, tY - eraseH - 2, uW + 2, this.lineHeight + 4 + eraseH);

      const nY = tY + eraseH * (1 - duration / config.lastWordFadeInTimeMs);

      let color = o.fontColor;
      if (this.ifWordShouldBeHighlighted(this.lastWord)) {
        color = o.captionColor;
      }

      if (duration < config.lastWordFadeInTimeMs) {
        this.ctx.fillStyle = color + alpha;
      } else {
        this.ctx.fillStyle = color;
      }

      this.ctx.fillText(
          /*text=*/ this.lastWord,
          /*x=*/ tX,
          /*y=*/ nY);
    }

    if (config.renderUnderline) {
      if (skipLastLine) {
        uY -= this.lineHeight;
      }

      if (config.interpolateUnderline) {
        if (uY != this.lastUnderlineY) {
          this.lastUnderlineY = uY;
          this.underLineX = new MovingAverage(config.interNumUnderline);
          this.underLineW = new MovingAverage(config.interNumUnderline);
        }

        this.underLineX.add(uX);
        uX = this.underLineX.get();
        this.underLineW.add(uW);
        uW = this.underLineW.get();
      }

      this.ctx.fillStyle = config.captionColor;
      this.ctx.strokeStyle = config.captionColor;

      if (duration > config.underlineFadeOutAfterMs) {
        let percentage = 1.0 -
            Math.min(
                (duration - config.underlineFadeOutAfterMs) /
                    config.underlineFadeOutDurationMs,
                1.0);
        this.ctx.fillStyle += percentageToHex(percentage);
        this.ctx.strokeStyle += percentageToHex(percentage);
      }
      this.ctx.lineWidth = config.underlineHeight * o.zoomRatio;

      if (config.underlineSineWave && movedToNextLine &&
          duration > config.underlineSineWaveWait) {
        const normalizedLoudness = Math.max(
            0.1,
            Math.min(
                (e.loudness - config.minLoudness) /
                    (config.maxLoudness - config.minLoudness),
                1.0));

        drawSine(
            this.ctx, uX, uY, uW,
            config.underlineSineWaveHeight * normalizedLoudness);
      } else {
        roundRect(
            this.ctx, uX, uY, uW, config.underlineHeight * o.zoomRatio,
            config.underlineRadius * o.zoomRatio,
            /*fill=*/ true, /*stroke=*/ false);
      }
      // console.log(uX, uY, uW, config.underlineHeight,
      // config.underlineRadius);
    }
  }

  renderAudioGlyph() {
    const o = this.soundOptions, e = this.soundEngine;
    const EPSILON = 1e-4;
    const normalizedLoudness = Math.max(
        config.minNormalizedLoudness,
        Math.min(
            (e.loudness - config.minLoudness) /
                (config.maxLoudness - config.minLoudness),
            config.maxNormalizedLoudness));
    // const loudnessPercentage = (1.0 - normalizedLoudness) * 0.5;
    // console.log(loudnessPercentage);

    // Renders Audio Glyph.
    const maxBarHeight = o.zoomRatio * this.captionRatio * config.barHeight;
    let barHeight =
        o.zoomRatio * this.captionRatio * config.barHeight * normalizedLoudness;
    let shortBarHeight = o.zoomRatio * this.captionRatio *
        (config.barHeight - config.barDiff) * normalizedLoudness;

    if (normalizedLoudness < config.minNormalizedLoudness + EPSILON) {
      barHeight = shortBarHeight;
    }

    const barWidth = config.barWidth * o.zoomRatio * this.captionRatio;
    shortBarHeight = Math.max(barWidth, shortBarHeight);
    barHeight = Math.max(barWidth, barHeight);

    const barIndentX = config.barIndentX * o.zoomRatio * this.captionRatio;
    const barIndentY = config.barIndentY * o.zoomRatio * this.captionRatio;
    let barX = this.iconX + barIndentX;
    let barY = this.iconY + (maxBarHeight - barHeight) * 0.5 + barIndentY;
    let sBarY = this.iconY + (maxBarHeight - shortBarHeight) * 0.5 + barIndentY;
    const barRadius = config.barRadius * o.zoomRatio * this.captionRatio;


    drawCircle(
        this.ctx, this.iconX + this.iconWidth / 2,
        this.iconY + this.iconWidth / 2, this.iconWidth / 2, o.captionColor,
        o.captionColor);

    this.ctx.fillStyle = config.blackColor;

    roundRect(
        this.ctx, barX, sBarY, barWidth, shortBarHeight, barRadius,
        /*fill=*/ true, /*stroke=*/ false);
    barX += config.barGap * o.zoomRatio * this.captionRatio;

    roundRect(
        this.ctx, barX, barY, barWidth, barHeight, barRadius,
        /*fill=*/ true, /*stroke=*/ false);
    barX += config.barGap * o.zoomRatio * this.captionRatio;

    roundRect(
        this.ctx, barX, sBarY, barWidth, shortBarHeight, barRadius,
        /*fill=*/ true, /*stroke=*/ false);

    this.ctx.fillStyle = config.captionColor;
  }

  renderSummaryIcon() {
    const o = this.soundOptions, e = this.soundEngine;
    const NUM_SPHERE_IMGS = 20;

    let iY = this.iconY, iX = this.iconX;
    if (config.stopMovingSummary) {
      iX = this.iconX + config.sphereOffset * o.zoomRatio;
      iY = this.iconY + config.sphereOffset * o.zoomRatio;
      if (this.stage == Stage.toSummarization) {
        const i = Math.floor(this.summaryEventPercentage * NUM_SPHERE_IMGS);
        this.renderSphere(i, iX, iY);
      } else if (this.stage == Stage.endSummarization) {
        const i = Math.floor(this.summaryEventPercentage * NUM_SPHERE_IMGS);
        this.renderSphere(i, iX, iY);
      } else {
        this.renderSphere(NUM_SPHERE_IMGS, iX, iY);
      }

    } else {
      if (this.isSummaryMoving()) {
        iY = mix(this.iconMinY, this.iconY, this.summaryEventPercentage);
      }
      this.renderSphere(NUM_SPHERE_IMGS, iX, iY);

      if (this.isSummaryMoving()) {
        this.captionY =
            mix(this.captionMinY, this.captionY, this.summaryEventPercentage);
      }
    }
  }

  /**
   * Renders the 3D sphere of the summarization icon.
   * @param img_id
   * @param iX
   * @param iY
   */
  renderSphere(img_id: number, iX: number, iY: number) {
    const SPHERE_DIM = 480;
    const sphere = this.images.summarySphere;
    this.ctx.drawImage(
        sphere, img_id * SPHERE_DIM, 0, SPHERE_DIM, SPHERE_DIM, iX, iY,
        this.iconWidth * config.sphereScale,
        this.iconHeight * config.sphereScale);
  }
}
