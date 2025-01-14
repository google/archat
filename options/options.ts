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
import './interactiveImage-options';
import './sound-options';

import {html, LitElement} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import { SCENE_NAMES } from '../scenes/scene_names';
import { APP_SETTINGS } from './app-settings';
import { BASE_CSS } from './common-css';
import { DEFAULT_INTERACTIVEIMAGE_OPTIONS } from '../scenes/Sound/InteractiveImage_options';
import {Renderer} from '../background/renderer';

/**
 * Checks if we have access to the camera and microphone.
 * @returns list of devices that we have access to
 */
async function checkDeviceAccess() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
      .filter(
          device =>
              device.kind === 'videoinput' || device.kind === 'audioinput')
      .every(device => Boolean(device.label));
}

// Deprecated:  SCENE_NAMES.BodyPixFX,
const SCENES = [
  SCENE_NAMES.PassThrough,
  SCENE_NAMES.Sound,
  SCENE_NAMES.InteractiveImage,
];

// Type definitions
type ModelType = 'davinci' | 'curie' | 'ada';

// Constants
const MODELS: Record<ModelType, string> = {
  davinci: 'davinci:ft-personal-2022-08-10-08-50-23',
  curie: 'curie:ft-personal-2022-08-10-09-30-02',
  ada: 'ada:ft-personal-2022-08-10-16-42-21',
};

// options class
export class Options {
  enabled = false;
  proactiveness = 'automatic';
  enableAllCaptions = false;
  enableEmoji = false;
  enablePersonal = false;
  model: keyof typeof MODELS;
  visualSize = 1;
  numVisuals: number;
  numEmojis: number;
  numWords: number;
  lastNSentences: number;
  updateInterval = 500;
  visualWidth: number;
  visualHeight: number;
  visualLeft = 85;
  visualTopInterval = 2;
  bingImageRatio: String;
  emojiWidth: number;
  emojiHeight: number;
  emojiTop = 90;
  emojiLeft = 80;
  emojiLeftInterval = 1;
  bingEmojiRatio: String;
  spotlightLeft = 7;
  spotlightTop = 7;
  spotlightImageWidth = 24;
  spotlightEmojiWidth = 10;
  enableLogging: boolean;
  onTapQuerying = false;

  constructor() {
    this.visualWidth = 12 * this.visualSize;
    this.visualHeight = 8 * this.visualSize;
    this.bingImageRatio =
        `&w=${40 * this.visualWidth}&h=${40 * this.visualHeight}`;
    this.emojiWidth = 3 * this.visualSize;
    this.emojiHeight = 3 * this.visualSize;
    this.bingEmojiRatio =
        `&w=${40 * this.emojiWidth}&h=${40 * this.emojiHeight}`;
  }

  // update options
  update() {
    let interactiveImageOptions = DEFAULT_INTERACTIVEIMAGE_OPTIONS;
    this.enabled = interactiveImageOptions.enableButton;
    this.proactiveness = interactiveImageOptions.proactiveness;
    this.enableAllCaptions = interactiveImageOptions.enableAllCaptions;
    this.enableEmoji = interactiveImageOptions.enableEmoji;
    this.enablePersonal = interactiveImageOptions.enablePersonal;
    this.model = interactiveImageOptions.model as keyof typeof MODELS;
    this.visualSize = interactiveImageOptions.visualSize;
    this.visualWidth = 12 * this.visualSize;
    this.visualHeight = 8 * this.visualSize;
    this.emojiWidth = 3 * this.visualSize;
    this.numVisuals = interactiveImageOptions.numVisuals;
    this.lastNSentences = interactiveImageOptions.lastNSentences;
    this.numEmojis = interactiveImageOptions.numEmojis;
    this.numWords = interactiveImageOptions.numWords;
    this.enableLogging = interactiveImageOptions.enableLogging;
  }
}

/**
 * Option page for rendering sliders and communicate with background thread.
 */
@customElement('options-page')
class OptionsPage extends LitElement {
  static get styles() {
    return BASE_CSS;
  }

  @state() scene?: string;
  @state() nativeCameraId?: string;
  @state() cameras: MediaDeviceInfo[] = [];

  @state() passthroughZoom = 1;
  @state() isRecording = 0;
  @state() stream: any = null;

  /**
   * Returns scene-dependent option pages.
   * @param scene name of the scene
   * @returns
   */
  renderSceneSpecificUI(scene: String) {
    switch (scene) {
      case SCENE_NAMES.PassThrough:
        return html`<span style="color:white">Zoom-in level:</span>
          <input type="range"
              min="1"
              max="10"
              step="0.1"
              value="${this.passthroughZoom}"
              @input="${this.onCropSliderInput}"
              @change="${this.onCropSliderChange}">
        `;
      case SCENE_NAMES.Sound:
        return html`<sound-options></sound-options>`;
      case SCENE_NAMES.InteractiveImage:
        return html`<interactive-image-options></interactive-image-options>`;
    }
  }

  onCropSliderInput(e: {target: HTMLInputElement}) {
    chrome.storage.local.set({passthroughZoom: Number(e.target.value)});
  }

  // So we don't call render on every change.
  onCropSliderChange(e: {target: HTMLInputElement}) {
    this.passthroughZoom = Number(e.target.value);
  }

  render() {
    console.log('Calling render');
    const cameraOptions = this.cameras.map(
        camera =>
            html`<option value="${camera.deviceId}">${camera.label}</option>`);
    const sceneOptions = SCENES.map(scene => html`<option>${scene}</option>`);

    return html`
      <div class="row">
        <div class="preview">
          <video @dblclick="${this.enterFullScreenMode}"
            id="video-cam" autoplay></video>

          <select .value="${this.nativeCameraId}"
            @change="${this.cameraSelectChanged}">
              ${cameraOptions}
          </select>
          <select .value="${this.scene}" @change="${this.sceneSelectChanged}">
             ${sceneOptions}
          </select>
        </div>
        ${this.renderSceneSpecificUI(this.scene)}
      </div>
    `;
  }

  // Enters the full screen mode
  enterFullScreenMode() {
    this.video.requestFullscreen();
  }

  sceneSelectChanged(event: {target: HTMLSelectElement}) {
    this.scene = event.target.value;
    chrome.storage.local.set({scene: this.scene});
    this.setVideoMirroring(this.scene);
  }

  /**
   * Mirrors the video locally for scenes that may contain text.
   * #NewScene: if your scene requires text rendering, reverts mirroring here.
   * @param scene name of the scene
   */
  setVideoMirroring(scene: String) {
    if (scene === SCENE_NAMES.Sound || scene === SCENE_NAMES.InteractiveImage) {
      this.video.style.transform = 'initial';
    } else {
      this.video.style.transform = null;
    }

    this.video.muted = true;
  }

  cameraSelectChanged(event: {target: HTMLSelectElement}) {
    this.nativeCameraId = event.target.value;
    chrome.storage.local.set({deviceId: this.nativeCameraId});
  }

  /**
   * Video player for previewing web camera.
   */
  @query('video') video!: HTMLVideoElement;

  /**
   * Active RTC Peer connection to background page.
   */
  rtcConnection: RTCPeerConnection|null = null;

  /**
   * Active connection to the background page.
   */
  port: chrome.runtime.Port|null = null;

  connectedCallback() {
    super.connectedCallback();
    this.initUI();
  }

  disconnectedCallback() {
    this.port?.disconnect();
    this.port = undefined;
    this.rtcConnection?.close();
    this.rtcConnection = undefined;
    super.disconnectedCallback();
  }

  async obtainMediaAccess() {
    const haveAccess = await checkDeviceAccess();
    if (!haveAccess) {
      // Get access to video camera. Access is granted per origin, so successful
      // call here enables camera API for the background page too.
      // TODO(vkyryliuk): test how it works on Windows.
      // Specifically, what happens when user set a non-default native camera
      // and then revoked video access. Would it break since extension will try
      // to control two different cameras at once? (default here and non-default
      // in background). track.stop() has a delay before camera is turned off.
      const stream =
          await navigator.mediaDevices.getUserMedia({video: true, audio: true});
      for (const track of stream.getTracks()) track.stop();
    }
  }

  async initUI() {
    await this.obtainMediaAccess();
    await this.preview();

    const allDevices = await navigator.mediaDevices.enumerateDevices();
    this.cameras = allDevices.filter(device => device.kind === 'videoinput');

    chrome.storage.local.get(
        {
          scene: APP_SETTINGS.initialScene,
          deviceId: null,
          passthroughZoom: 1,
          isRecording: 0,
        },
        (response) => {
          console.log('got response', response);
          this.scene = response.scene;
          this.nativeCameraId = response.deviceId ?? this.cameras[0]?.deviceId;
          this.passthroughZoom = response.passthroughZoom;
          this.isRecording = 0;
          this.setVideoMirroring(this.scene);
        });
  }

  async preview() {
    console.log('Connecting...');
    const renderer = new Renderer();

    const mediaStream = await renderer.getStream();
    this.video.srcObject = mediaStream;
    this.video.muted = true;
  }
}
