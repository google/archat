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
import {customElement, property, query} from 'lit/decorators.js';

import {DEFAULT_INTERACTIVEIMAGE_OPTIONS, InteractiveImageOptions} from '../scenes/Sound/InteractiveImage_options';

import {COMMON_CSS} from './common-css';

@customElement('interactive-image-options')
class InteractiveImageOptionsWidget extends LitElement {
  static get styles() {
    return COMMON_CSS;
  }

  render() {
    return html`
    <div class="title m24 mb12">Visual Captions Settings</div>
    <div class="m40 mb12 left-right">
      <span>Enable Visual Captions</span>
      <label class="switch">
        <input type="checkbox" id="enable-button" name="enableButton" checked
        @click="${this.updateSettings}">
      </label>
    </div>

    <div class="m40 mb12 left-right">
      <span>AI Proactiveness</span>
      <select   id="proactiveness"
                @change="${this.updateSettings}"
                .value="${this.interactiveImageOptions?.proactiveness}">
        <option value="Automatic">Automatic</option>
        <option value="Suggestion">Suggestion</option>
        <option value="OnTap">On-Tap</option>
      </select>
    </div>


    <div class="divider mb12"></div>

    <div class="m24 mb12 left-right">
      <span><b>Advanced Settings</b></span>
    </div>

    <div class="m40 mb12"><i>Algorithm</i></div>

    <div class="m60 mb12 left-right">
      <span>All Participants' Captions</span>
      <label class="switch">
        <input type="checkbox" id="enable-all-captions" name="enableAllCaptions"
        @click="${this.updateSettings}">
      </label>
    </div>

    <div class="m60 mb12 left-right">
      <span>Suggest Emojis</span>
      <label class="switch">
        <input type="checkbox" id="enable-emoji" name="enableEmoji" checked
        @click="${this.updateSettings}">
      </label>
    </div>

    <div class="m60 mb12 left-right">
      <span>Suggest Personal</span>
      <label class="switch">
        <input type="checkbox" id="enable-personal" name="enablePersonal" checked
        @click="${this.updateSettings}">
      </label>
    </div>

    <div class="m60 mb12 left-right">
      <span>Model</span>
      <select   id="model"
                @change="${this.updateSettings}"
                .value="${this.interactiveImageOptions?.model}">
        <option value="davinci">Most Capable</option>
        <option value="curie">Very capable but faster</option>
        <option value="ada">Very fast but less capable</option>
      </select>
    </div>

    <div class="m60 mb12">
      <span class="left-right">
        <span>
        Min num words: <output>${
        this.interactiveImageOptions?.numWords}</output>
        </span>
        <input type="range"
          class="range-input"
          id="range-num-words"
          min="1"
          max="20"
          step="1"
          value="${this.interactiveImageOptions?.numWords}"
          @change="${this.updateSettings}"
          oninput="this.previousElementSibling.value = this.value">
      </span>
    </div>

    <div class="m60 mb12">
      <span class="left-right">
        <span>
        Last N Sentences: <output>${
        this.interactiveImageOptions?.lastNSentences}</output>
        </span>
        <input type="range"
          class="range-input"
          id="range-last-n-sentences"
          min="1"
          max="5"
          step="1"
          value="${this.interactiveImageOptions?.lastNSentences}"
          @change="${this.updateSettings}"
          oninput="this.previousElementSibling.value = this.value">
      </span>
    </div>


    <div class="m40 mb12"><i>Scrolling View</i></div>

    <div class="m60 mb12">
    <span class="left-right">
      <span>
        # Max Visuals: <output>${
        this.interactiveImageOptions?.numVisuals}</output>
      </span>
      <input type="range"
        class="range-input"
        id="range-num-visuals"
        min="1"
        max="6"
        step="1"
        value="${this.interactiveImageOptions?.numVisuals}"
        @change="${this.updateSettings}"
        oninput="this.previousElementSibling.value = this.value">
      </span>
    </div>

    <div class="m60 mb12">
    <span class="left-right">
      <span>
        # Max Emojis: <output>${
        this.interactiveImageOptions?.numEmojis}</output>
      </span>
      <input type="range"
        class="range-input"
        id="range-num-emojis"
        min="1"
        max="6"
        step="1"
        value="${this.interactiveImageOptions?.numEmojis}"
        @change="${this.updateSettings}"
        oninput="this.previousElementSibling.value = this.value">
      </span>
    </div>

    <div class="m60 mb12">
      <span class="left-right">
        <span>
          Visual Size: <output>${
        this.interactiveImageOptions?.visualSize}</output>
        </span>
        <input type="range"
          class="range-input"
          id="range-visual-size"
          min="0"
          max="2"
          step="0.1"
          value="${this.interactiveImageOptions?.visualSize}"
          @change="${this.updateSettings}"
          oninput="this.previousElementSibling.value = this.value">
      </span>
    </div>

    <div class="divider mb12"></div>
    <div class="m24 mb12 left-right">
      <span><b>Logging</b></span>
    </div>

    <div class="m40 mb12 left-right">
      <span>Enable Logging</span>
      <label class="switch">
        <input type="checkbox" id="enable-logging" name="enableLogging"
        @click="${this.updateSettings}">
      </label>
    </div>

    <div class="mb12" style="width:50%; margin-left:25%; position: relative">
          <button style="width:100%;" @click="${
        this.downloadLog}">Download Log</button>
      </div>


    `;
  }

  @query('#enable-button') enableButton!: HTMLInputElement;
  @query('#model') model!: HTMLSelectElement;
  @query('#enable-all-captions') enableAllCaptions!: HTMLInputElement;
  @query('#enable-emoji') enableEmoji!: HTMLInputElement;
  @query('#enable-personal') enablePersonal!: HTMLInputElement;
  @query('#proactiveness') proactiveness!: HTMLSelectElement;
  @query('#range-visual-size') visualSize!: HTMLInputElement;
  @query('#range-num-visuals') numVisuals!: HTMLInputElement;
  @query('#range-num-emojis') numEmojis!: HTMLInputElement;
  @query('#range-num-words') numWords!: HTMLInputElement;
  @query('#range-last-n-sentences') lastNSentences!: HTMLInputElement;
  @query('#enable-logging') enableLogging!: HTMLInputElement;

  @property({attribute: false})
  interactiveImageOptions?: InteractiveImageOptions;

  updateSettings() {
    this.interactiveImageOptions = {
      ...this.interactiveImageOptions,
      enableButton: this.enableButton.checked,
      model: this.model.value,
      enableAllCaptions: this.enableAllCaptions.checked,
      enableEmoji: this.enableEmoji.checked,
      enablePersonal: this.enablePersonal.checked,
      proactiveness: this.proactiveness.value,
      visualSize: parseFloat(this.visualSize.value),
      numVisuals: parseInt(this.numVisuals.value),
      numEmojis: parseInt(this.numEmojis.value),
      numWords: parseInt(this.numWords.value),
      lastNSentences: parseInt(this.lastNSentences.value),
      enableLogging: this.enableLogging.checked,
    } console.log(this.interactiveImageOptions);
    chrome.storage.local.set(
        {interactiveImageOptions: this.interactiveImageOptions});
  }

  // download log file from chrome storage
  downloadLog() {
    chrome.storage.local.get('interactiveImageLogging', (result) => {
      let data = result.interactiveImageLogging;
      // console.log("DEBUG: data", data);
      if (data) {
        let dataJson = JSON.stringify(data);
        // console.log("DEBUG: dataJson", dataJson);
        let blob = new Blob([dataJson], {type: 'text/json'});
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = 'visual_captions_logs' + Date.now() + '.json';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });

    chrome.storage.local.get('interactiveImageOptions', (result) => {
      let data = result.interactiveImageOptions;
      // console.log("DEBUG: data", data);
      if (data) {
        let dataJson = JSON.stringify(data);
        // console.log("DEBUG: dataJson", dataJson);
        let blob = new Blob([dataJson], {type: 'text/json'});
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = 'visual_captions_options' + Date.now() + '.json';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }


  connectedCallback() {
    super.connectedCallback();
    chrome.storage.local.get(
        {interactiveImageOptions: DEFAULT_INTERACTIVEIMAGE_OPTIONS},
        (response) => {
          this.interactiveImageOptions = response.interactiveImageOptions;
          chrome.storage.local.set(
              {interactiveImageOptions: this.interactiveImageOptions});
        });
  }
}
