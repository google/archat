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
import {html, LitElement} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';

import {DEFAULT_SOUND_LOGS, SoundLogs} from '../scenes/Sound/sound_logs';
import {DEFAULT_SOUND_OPTIONS, SoundOptions} from '../scenes/Sound/sound_options';

import {COMMON_CSS} from './common-css';
import {LANGUAGES} from './sound-languages';


@customElement('sound-options')
class SoundOptionsWidget extends LitElement {
  @property({type: Boolean}) open = false;
  @property({type: Boolean}) registeredKey = false;
  currentFontSizeIndex = 17;
  currentCaptionSizeIndex = 15;
  currentMaxLines = 5;

  static get styles() {
    return COMMON_CSS;
  }

  private _keydownHandler(e: Event) {
    const OVERLAY_MOVEMENT_STEP = 8;
    const DF1_SCREEN_SIZE = 0.465;
    const DF1_DEFAULT_FONT_SIZE_INDEX = 17;
    const DF1_DEFAULT_CAPTION_SIZE_INDEX = 15;
    const RB_DEFAULT_FONT_SIZE_INDEX = 13;
    const RB_DEFAULT_CAPTION_SIZE_INDEX = 12;
    const NREAL_DEFAULT_FONT_SIZE_INDEX = 13;
    const NREAL_DEFAULT_CAPTION_SIZE_INDEX = 12;
    const FONT_SIZE_OPTIONS = [
      9,  12, 15, 16, 18, 20, 21, 24, 25, 27,
      30, 32, 35, 40, 45, 48, 50, 56, 64, 72
    ];

    switch ((e as KeyboardEvent).code) {
      case 'KeyS':
      case 'ArrowDown':
        // Handle "back"
        this.rangeScreenY.value =
            String(Number(this.rangeScreenY.value) + OVERLAY_MOVEMENT_STEP);
        this.updateSettings();
        break;
      case 'KeyW':
      case 'ArrowUp':
        // Handle "forward"
        this.rangeScreenY.value =
            String(Number(this.rangeScreenY.value) - OVERLAY_MOVEMENT_STEP);
        this.updateSettings();
        break;
      case 'KeyA':
      case 'ArrowLeft':
        // Handles "turn left"
        this.rangeScreenX.value =
            String(Number(this.rangeScreenX.value) - OVERLAY_MOVEMENT_STEP);
        this.updateSettings();
        break;
      case 'KeyD':
      case 'ArrowRight':
        // Handle "turn right"
        this.rangeScreenX.value =
            String(Number(this.rangeScreenX.value) + OVERLAY_MOVEMENT_STEP);
        this.updateSettings();
        break;
      case 'KeyQ':
        // Handle "zoom out"
        this.rangeScreenSize.value =
            String(Number(this.rangeScreenSize.value) - 0.01);
        console.log(this.rangeScreenSize.value);
        this.updateSettings();
        break;
      case 'KeyE':
        // Handle "zoom in"
        this.rangeScreenSize.value =
            String(Number(this.rangeScreenSize.value) + 0.01);
        console.log(this.rangeScreenSize.value);
        this.updateSettings();
        break;
      case 'KeyF':
        document.getElementById('video-cam').requestFullscreen();
        break;
      case 'Digit1':
        this.rangeScreenX.value = String((1920 / 2 - 42 - 210) / 1.5);
        this.rangeScreenY.value = String((1080 / 2 + 336 - 210) / 1.5);
        this.rangeScreenSize.value = String(DF1_SCREEN_SIZE);
        this.fontSize.value =
            String(FONT_SIZE_OPTIONS[DF1_DEFAULT_FONT_SIZE_INDEX]);
        this.captionSize.value =
            String(FONT_SIZE_OPTIONS[DF1_DEFAULT_CAPTION_SIZE_INDEX]);
        this.currentFontSizeIndex = DF1_DEFAULT_FONT_SIZE_INDEX;
        this.currentCaptionSizeIndex = DF1_DEFAULT_CAPTION_SIZE_INDEX;
        this.updateSettings();
        break;
      case 'Digit2':
        console.log('RB3 specs');
        this.rangeScreenX.value = String((1920 / 2 + 378 - 588 / 2) / 1.5);
        this.rangeScreenY.value = String((1080 / 2 + 252 - 588 / 2) / 1.5);
        this.rangeScreenSize.value = String(DF1_SCREEN_SIZE * 588 / 420);
        this.fontSize.value =
            String(FONT_SIZE_OPTIONS[RB_DEFAULT_FONT_SIZE_INDEX]);
        this.captionSize.value =
            String(FONT_SIZE_OPTIONS[RB_DEFAULT_CAPTION_SIZE_INDEX]);
        this.currentFontSizeIndex = RB_DEFAULT_FONT_SIZE_INDEX;
        this.currentCaptionSizeIndex = RB_DEFAULT_CAPTION_SIZE_INDEX;
        this.updateSettings();
        break;
      case 'Digit3':
        console.log('RB4 specs');
        this.rangeScreenX.value = String((1920 / 2 + 504 - 588 / 2) / 1.5);
        this.rangeScreenY.value = String((1080 / 2 + 252 - 588 / 2) / 1.5);
        this.rangeScreenSize.value = String(DF1_SCREEN_SIZE * 588 / 420);
        this.fontSize.value =
            String(FONT_SIZE_OPTIONS[NREAL_DEFAULT_FONT_SIZE_INDEX]);
        this.captionSize.value =
            String(FONT_SIZE_OPTIONS[NREAL_DEFAULT_CAPTION_SIZE_INDEX]);
        this.currentFontSizeIndex = NREAL_DEFAULT_FONT_SIZE_INDEX;
        this.currentCaptionSizeIndex = NREAL_DEFAULT_CAPTION_SIZE_INDEX;
        this.updateSettings();
        break;
      case 'Equal':
        console.log('Increase Font Size');
        if (this.currentFontSizeIndex < FONT_SIZE_OPTIONS.length - 1 &&
            this.currentCaptionSizeIndex < FONT_SIZE_OPTIONS.length - 1) {
          this.currentFontSizeIndex++;
          this.currentCaptionSizeIndex++;
          this.fontSize.value =
              String(FONT_SIZE_OPTIONS[this.currentFontSizeIndex]);
          this.captionSize.value =
              String(FONT_SIZE_OPTIONS[this.currentCaptionSizeIndex]);
        }
        this.updateSettings();
        break;
      case 'Minus':
        console.log('Decrease Font Size');
        if (this.currentFontSizeIndex > 0 && this.currentCaptionSizeIndex > 0) {
          this.currentFontSizeIndex--;
          this.currentCaptionSizeIndex--;
          this.fontSize.value =
              String(FONT_SIZE_OPTIONS[this.currentFontSizeIndex]);
          this.captionSize.value =
              String(FONT_SIZE_OPTIONS[this.currentCaptionSizeIndex]);
        }
        this.updateSettings();
        break;
      case 'KeyL':
        console.log('Cycle the maximum lines');
        this.currentMaxLines = (this.currentMaxLines % 5) + 1;
        this.maxLines.value = String(this.currentMaxLines);
        this.updateSettings();
        break;
      case 'KeyB':
        console.log('Switch background mode');
        if (this.backgroundImage.value == 'Black') {
          this.backgroundImage.value = 'Camera';
        } else {
          this.backgroundImage.value = 'Black';
        }
        this.updateSettings();
        break;
      case 'Escape':
        console.log('Escape is pressed');
        break;
    }
  }

  updated() {
    console.log('updated' + this.open);
    if (this.open && !this.registeredKey) {
      document.addEventListener('keyup', (e: Event) => this._keydownHandler(e));
      this.registeredKey = true;
    } else if (!this.open && this.registeredKey) {
      document.removeEventListener(
          'keyup', (e: Event) => this._keydownHandler(e));
      this.registeredKey = false;
    }
  }

  render() {
    this.open = true;
    const languages = LANGUAGES.map(languagePair => html`
      <option value="${languagePair[0]}">
        ${languagePair[1]}
      </option>
    `);
    return html`
        <div class="title m24 mb12">Augmented Language Settings</div>
        <div class="m40 mb12 left-right">
            <select     id="source-language"
                        @change="${this.updateSettings}"
                        .value="${this.soundOptions?.sourceLanguage}">
              ${languages}
            </select>
            <span>→</span>
            <select     id="target-language"
                        @change="${this.updateSettings}"
                        .value="${this.soundOptions?.targetLanguage}" disabled>
              ${languages}
            </select>
        </div>
        <div class="m40 mb12 left-right">
          <span>Summarization Mode</span>
          <select   id="summarization-mode"
                    @change="${this.updateSettings}"
                    .value="${this.soundOptions?.summarizationMode}">
            <option value="Automatic">Automatic</option>
            <option value="SummaryOnly">Summary Only</option>
            <option value="Disabled">No Summary</option>
            <option value="OnTap">On-Tap</option>
          </select>
        </div>

        <div class="mb12" style="width:50%; margin-left:25%; position: relative">
            <button style="width:100%;" @click="${
        this.buttonOnTap}">Tap</button>
            <div class="mask" ?hidden="${
        this.soundOptions?.summarizationMode === 'OnTap'}"></div>
        </div>

        <div class="divider mb12"></div>

        <div class="m24 mb12 left-right">
            <span>Advanced settings</span>
            <span @click="${this.toggleAdvancedSettings}"
                  style="padding-right: 3px; cursor: pointer;">
              ${this.showAdvancedSettings ? 'Hide' : 'Show'}
            </span>
        </div>

        <div style="position: relative;">

            <div class="m40 mb12">Screen</div>

            <div class="m60 mb12 left-right">
              <span>Position x</span>
              <input type="range"
                class="range-input"
                id="range-screenX"
                min="0"
                max="1280"
                step="1"
                value="${this.soundOptions?.screenX}"
                @input="${this.updateSettings}"
                @change="${this.updateSettings}">
            </div>
            <div class="m60 mb12 left-right">
              <span>Position y</span>
              <input type="range"
                class="range-input"
                id="range-screenY"
                min="0"
                max="720"
                step="1"
                value="${this.soundOptions?.screenY}"
                @input="${this.updateSettings}"
                @change="${this.updateSettings}">
            </div>

            <div class="m60 mb12 left-right">
              <span>Size</span>
              <input type="range"
                  class="range-input"
                  id="range-screenSize"
                  min="0.1"
                  max="1.2"
                  step="0.01"
                  value="${this.soundOptions?.zoomRatio}"
                  @input="${this.updateSettings}"
                  @change="${this.updateSettings}">
            </div>

            <div class="m40 mb12">Text</div>

            <div class="m60 mb12 left-right">
              <span>Font family</span>
              <select   id="font-family"
                        @change="${this.updateSettings}"
                        .value="${this.soundOptions?.fontFamily}">
                <option value="Arial">Arial</option>
                <option value="Google Sans">Google Sans</option>
                <option value="Google Sans GRAD50">Google Sans GRAD50</option>
                <option value="Roboto">Roboto</option>
                <option value="Roboto Condensed">Roboto (Condensed)</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>

            <div class="m60 mb12 left-right">
              <span>Font color</span>
              <select   id="font-color"
                        @change="${this.updateSettings}"
                        .value="${this.soundOptions?.fontColor}">
                <option value="#ffffff">White</option>
                <option value="#fbdd3a">Orange</option>
                <option value="#fcc5c0">Pink</option>
                <option value="#FF00FF">Fuchsia</option>
                <option value="#df73ff">Purple</option>
                <option value="#ffff00">Yellow</option>
                <option value="#d2b48c">Tan</option>
                <option value="#f5f5dc">Beige</option>
                <option value="#ffffe0">Light Yellow</option>
                <option value="#00ffff">Cyan</option>
                <option value="#F0F8FF">Alice blue</option>
                <option value="#Aaf0d1">Mint</option>
                <option value="#ff0000">Red</option>
                <option value="#00ff00">Green</option>
                <option value="#0000ff">Blue</option>
              </select>
            </div>

            <div class="m60 mb12 left-right">
              <span>Text size</span>
              <select   id="font-size"
                        @change="${this.updateSettings}"
                        .value="${String(this.soundOptions?.fontSize)}">
                <option value="9">9px</option>
                <option value="12">12px</option>
                <option value="15">15px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
                <option value="21">21px</option>
                <option value="24">24px</option>
                <option value="25">25px</option>
                <option value="27">27px</option>
                <option value="30">30px</option>
                <option value="32">32px</option>
                <option value="35">35px</option>
                <option value="40">40px</option>
                <option value="45">45px</option>
                <option value="48">48px</option>
                <option value="50">50px</option>
                <option value="56">56px</option>
                <option value="64">64px</option>
                <option value="72">72px</option>
              </select>
            </div>

            <div class="m60 mb12 left-right">
              <span>Caption size</span>
              <select   id="caption-size"
                        @change="${this.updateSettings}"
                        .value="${String(this.soundOptions?.captionSize)}">
                <option value="0">Hide</option>
                <option value="9">9px</option>
                <option value="12">12px</option>
                <option value="15">15px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
                <option value="21">21px</option>
                <option value="24">24px</option>
                <option value="25">25px</option>
                <option value="27">27px</option>
                <option value="30">30px</option>
                <option value="32">32px</option>
                <option value="35">35px</option>
                <option value="40">40px</option>
                <option value="45">45px</option>
                <option value="48">48px</option>
                <option value="50">50px</option>
                <option value="56">56px</option>
                <option value="64">64px</option>
                <option value="72">72px</option>
              </select>
            </div>

            <div class="m60 mb12 left-right">
              <span>Max line(s)</span>
              <select   id="max-lines"
                        @change="${this.updateSettings}"
                        .value="${String(this.soundOptions?.maxLines)}">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
              </select>
            </div>

            <div class="m40 mb12">Summary</div>
            <div class="m60 mb12 left-right">
              <span>Language model</span>
              <select   id="language-model"
                        @change="${this.updateSettings}"
                        .value="${this.soundOptions?.languageModel}">
                <option value="PromptA">Prompt A</option>
                <option value="PromptB">Prompt B</option>
                <option value="OneSentence">One Sentence</option>
                <option value="Terse">Terse</option>
                <option value="GenericSummarizer">Generic</option>
                <option value="BulletList">Bullet List</option>
              </select>
            </div>
            <div class="m60 mb12 left-right">
              <span>Background color</span>
              <select   id="background-color"
                        @change="${this.updateSettings}"
                        .value="${this.soundOptions?.backgroundColor}">
                <option value="#00000000">Transparent</option>
                <option value="#00000044">25% Black</option>
                <option value="#00000088">50% Black</option>
                <option value="#000000aa">60% Black</option>
                <option value="#000000cc">75% Black</option>
                <option value="#000000dd">85% Black</option>
                <option value="#000000ff">Solid Black</option>
              </select>
            </div>

            <div class="m60 mb12 left-right">
              <span>Show summary after</span>
               <select label="Summaray Show Time"
                        id="summary-show-time"
                        @change="${this.updateSettings}"
                        .value="${String(this.soundOptions?.lamdaShowTimeMs)}">
                <option value="500">0.5s</option>
                <option value="1000">1s</option>
                <option value="1500">1.5s</option>
                <option value="2000">2s</option>
                <option value="2500">2.5s</option>
                <option value="3000">3s</option>
                <option value="3500">3.5s</option>
                <option value="4000">4s</option>
                <option value="4500">4.5s</option>
                <option value="5000">5s</option>
              </select>
            </div>

            <div class="m60 mb12 left-right">
              <span>Summary display time</span>
               <select label="Summaray Delay"
                        id="summary-delay"
                        @change="${this.updateSettings}"
                        .value="${String(this.soundOptions?.summaryDelay)}">
                <option value="3000">3s</option>
                <option value="4000">4s</option>
                <option value="5000">5s</option>
                <option value="6000">6s</option>
                <option value="7000">7s</option>
                <option value="8000">8s</option>
                <option value="9000">9s</option>
                <option value="10000">10s</option>
                <option value="12000">12s</option>
                <option value="14000">14s</option>
                <option value="16000">16s</option>
                <option value="20000">20s</option>
              </select>
            </div>
            <div class="m60 mb12 left-right">
              <span>Min words to summarize</span>
              <select label="Min Words to Summarize"
                        id="summary-min-chars"
                        @change="${this.updateSettings}"
                        .value="${String(this.soundOptions?.summaryMinWords)}">
                <option value="0">No limits</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="75">75</option>
                <option value="100">100</option>
                <option value="125">125</option>
                <option value="150">150</option>
                <option value="200">200</option>
              </select>
            </div>
            <div class="m60 mb12 left-right">
              <span>Max words to summarize</span>
              <select label="Max Words to Summarize"
                        id="summary-max-chars"
                        @change="${this.updateSettings}"
                        .value="${String(this.soundOptions?.summaryMaxWords)}">
                <option value="100000">No limits</option>
                <option value="1000">1000</option>
                <option value="750">750</option>
                <option value="500">500</option>
                <option value="400">400</option>
                <option value="300">300</option>
                <option value="250">250</option>
                <option value="200">200</option>
                <option value="150">150</option>
                <option value="100">100</option>
                <option value="100">50</option>
                <option value="100">10</option>
              </select>
            </div>
            <div class="m60 mb12 left-right">
              <span>Summary color</span>
              <select label="Summary Color"
                        id="summary-color"
                        @change="${this.updateSettings}"
                        .value="${this.soundOptions?.summaryColor}">
                <option value="#ffffff">White</option>
                <option value="#fbdd3a">Orange</option>
                <option value="#fcc5c0">Pink</option>
                <option value="#FF00FF">Fuchsia</option>
                <option value="#df73ff">Purple</option>
                <option value="#ffff00">Yellow</option>
                <option value="#d2b48c">Tan</option>
                <option value="#f5f5dc">Beige</option>
                <option value="#ffffe0">Light Yellow</option>
                <option value="#00ffff">Cyan</option>
                <option value="#F0F8FF">Alice blue</option>
                <option value="#Aaf0d1">Mint</option>
                <option value="#ff0000">Red</option>
                <option value="#00ff00">Green</option>
                <option value="#0000ff">Blue</option>
              </select>
            </div>

            <div class="m60 mb12 left-right">
              <span>Caption color</span>
              <select label="Caption color"
                        id="caption-color"
                        @change="${this.updateSettings}"
                        .value="${this.soundOptions?.captionColor}">
                <option value="#ffffff">White</option>
                <option value="#fbdd3a">Orange</option>
                <option value="#fcc5c0">Pink</option>
                <option value="#FF00FF">Fuchsia</option>
                <option value="#df73ff">Purple</option>
                <option value="#ffff00">Yellow</option>
                <option value="#d2b48c">Tan</option>
                <option value="#f5f5dc">Beige</option>
                <option value="#ffffe0">Light Yellow</option>
                <option value="#00ffff">Cyan</option>
                <option value="#F0F8FF">Alice blue</option>
                <option value="#Aaf0d1">Mint</option>
                <option value="#ff0000">Red</option>
                <option value="#00ff00">Green</option>
                <option value="#0000ff">Blue</option>
              </select>
            </div>

            <div class="m60 mb12 left-right">
            <span>Use meet captions</span>
              <select label="Use Meet Captions"
                        id="use-meet-captions"
                        @change="${this.updateSettings}"
                        .value="${this.soundOptions?.useMeetCaptions}">
              <option value="Yourself">Yourself</option>
              <option value="Everyone">Everyone</option>
              <option value="Disabled">Disabled</option>
              </select>
            </div>

            <div class="m60 mb12 left-right">
            <span>Auto Capitalization</span>
              <select label="Auto Capitalization"
                        id="auto-capitalization"
                        @change="${this.updateSettings}"
                        .value="${this.soundOptions?.autoCapitalization}">
              <option value="Enabled">Enabled</option>
              <option value="Disabled">Disabled</option>
              </select>
            </div>

            <div class="m60 mb12 left-right">
            <span>Emphasizing Mode</span>
              <select label="Emphasizing Mode"
                        id="emphasizing-mode"
                        @change="${this.updateSettings}"
                        .value="${this.soundOptions?.emphasizingMode}">
              <option value="Enabled">Enabled</option>
              <option value="Disabled">Disabled</option>
              <option value="None">None</option>
              </select>
            </div>

            <div class="m60 mb12 left-right">
            <span>Background Image</span>
              <select label="Background Image"
                        id="background-image"
                        @change="${this.updateSettings}"
                        .value="${this.soundOptions?.backgroundImage}">
              <option value="Camera">Camera</option>
              <option value="Black">Black</option>
              </select>
            </div>

            <div class="m60 mb12 left-right">
              <span @click="${this.updateLogs}">System logs</span>
              <textarea rows="2"
              id="text-log-meet"
              @click="${this.updateLogs}"
              @mouseover="${this.selectLogs}"
              >click (twice) to reveal logs</textarea>
            </div>
            <div class="mask" ?hidden="${this.showAdvancedSettings}">
            </div>
        </div>
    `;
  }

  @query('#source-language') sourceLanguage!: HTMLSelectElement;
  @query('#target-language') targetLanguage!: HTMLSelectElement;
  @query('#summarization-mode') summarizationMode!: HTMLSelectElement;
  @query('#language-model') languageModel!: HTMLSelectElement;
  @query('#font-size') fontSize!: HTMLSelectElement;
  @query('#caption-size') captionSize!: HTMLSelectElement;
  @query('#font-family') fontFamily!: HTMLSelectElement;
  @query('#font-color') fontColor!: HTMLSelectElement;
  @query('#max-lines') maxLines!: HTMLSelectElement;
  @query('#background-color') backgroundColor!: HTMLSelectElement;
  @query('#summary-delay') summaryDelay!: HTMLSelectElement;
  @query('#summary-max-chars') summaryMaxWords!: HTMLSelectElement;
  @query('#summary-min-chars') summaryMinWords!: HTMLSelectElement;
  @query('#summary-color') summaryColor!: HTMLSelectElement;
  @query('#caption-color') captionColor!: HTMLSelectElement;
  @query('#text-layout') textLayout!: HTMLSelectElement;
  @query('#summary-layout') summaryLayout!: HTMLSelectElement;
  @query('#summary-show-time') summaryShowTime!: HTMLSelectElement;
  @query('#use-meet-captions') useMeetCaptions!: HTMLSelectElement;
  @query('#auto-capitalization') autoCapitalization!: HTMLSelectElement;
  @query('#emphasizing-mode') emphasizingMode!: HTMLSelectElement;
  @query('#background-image') backgroundImage!: HTMLSelectElement;
  @query('#range-screenX') rangeScreenX!: HTMLInputElement;
  @query('#range-screenY') rangeScreenY!: HTMLInputElement;
  @query('#range-screenSize') rangeScreenSize!: HTMLInputElement;
  @query('#text-log-meet') textLogMeet!: HTMLTextAreaElement;

  @property({attribute: false}) soundOptions?: SoundOptions;
  @property({attribute: false}) soundLogs?: SoundLogs;

  @state() showAdvancedSettings = false;

  toggleAdvancedSettings() {
    this.showAdvancedSettings = !this.showAdvancedSettings;
  }

  updateLogs() {
    // Hack: update the settings to trigger writing logs.
    this.soundOptions.numLogs++;
    this.updateSettings();

    // Hack: Retrieves the logs.
    chrome.storage.local.get({soundLogs: DEFAULT_SOUND_LOGS}, (response) => {
      console.log('Loading logs', response.soundLogs);
      this.soundLogs = response.soundLogs;
      this.textLogMeet.value = '# Google Meet Yourself\n' +
          this.soundLogs.meetCaptions + '\n\n# Google Meet Everyone (Beta)\n' +
          this.soundLogs.meetCaptionsEveryone + '\n\n# Web Audio API\n' +
          this.soundLogs.webAudioText + '\n\n# Summary\n' +
          this.soundLogs.summary + '\n\n# System\n' + this.soundLogs.system;
      this.textLogMeet.select();
    });
  }

  buttonOnTap() {
    this.soundOptions = {
      ...this.soundOptions,
      tapTimestamp: performance.now(),
    };

    // console.log('Saving options', this.soundOptions);
    chrome.storage.local.set({soundOptions: this.soundOptions});
  }

  selectLogs() {
    this.textLogMeet.select();
  }

  updateSettings() {
    this.soundOptions = {
      ...this.soundOptions,
      sourceLanguage: this.sourceLanguage.value,
      targetLanguage: this.targetLanguage.value,
      summarizationMode: this.summarizationMode.value,
      languageModel: this.languageModel.value,
      fontSize: Number(this.fontSize.value),
      captionSize: Number(this.captionSize.value),
      fontFamily: this.fontFamily.value,
      fontColor: this.fontColor.value,
      maxLines: Number(this.maxLines.value),
      backgroundColor: this.backgroundColor.value,
      summaryDelay: Number(this.summaryDelay.value),
      lamdaShowTimeMs: Number(this.summaryShowTime.value),
      summaryMaxWords: Number(this.summaryMaxWords.value),
      summaryMinWords: Number(this.summaryMinWords.value),
      summaryColor: this.summaryColor.value,
      captionColor: this.captionColor.value,
      screenX: Number(this.rangeScreenX.value),
      screenY: Number(this.rangeScreenY.value),
      zoomRatio: Number(this.rangeScreenSize.value),
      useMeetCaptions: this.useMeetCaptions.value,
      autoCapitalization: this.autoCapitalization.value,
      emphasizingMode: this.emphasizingMode.value,
      backgroundImage: this.backgroundImage.value,
    };

    console.log('Saving options X', this.soundOptions.screenX);
    console.log('Saving options Y', this.soundOptions.screenY);
    console.log('Saving options size', this.soundOptions.zoomRatio);
    // console.log('Saving options', this.soundOptions);
    chrome.storage.local.set({soundOptions: this.soundOptions});
  }

  connectedCallback() {
    super.connectedCallback();
    chrome.storage.local.get(
        {soundOptions: DEFAULT_SOUND_OPTIONS}, (response) => {
          this.soundOptions = response.soundOptions;
        });
  }
}
