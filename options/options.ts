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

import {SCENE_NAMES} from '../scenes/scene_names';

import {APP_SETTINGS} from './app-settings';
import {BASE_CSS} from './common-css';
import {MESSAGE_TYPES} from './message-types';

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
    const port = chrome.runtime.connect({name: 'options'});
    const rtcConnection = new RTCPeerConnection();
    // Assigning separately so closurized event below don't question whether
    // values exist.
    this.port = port;
    this.rtcConnection = rtcConnection;

    // Send ICE candidate info to another RTCPeerConnection.
    rtcConnection.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        port.postMessage(
            {type: MESSAGE_TYPES.rtcIce, candidate: event.candidate});
      }
    });

    rtcConnection.addEventListener('track', (event) => {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(event.track);
      this.video.srcObject = mediaStream;
      this.video.muted = true;
    });

    port.onMessage.addListener(async (msg) => {
      switch (msg.type) {
        case MESSAGE_TYPES.rtcOffer:
          await rtcConnection.setRemoteDescription(msg.description);
          const answer = await rtcConnection.createAnswer();
          await rtcConnection.setLocalDescription(answer);
          port.postMessage(
              {type: MESSAGE_TYPES.rtcAnswer, description: answer});
          break;
        case MESSAGE_TYPES.rtcIce:
          await rtcConnection.addIceCandidate(msg.candidate);
          break;
        default:
          console.warn(`Unsupported message type: ${msg.type}.`);
      }
    });

    port.postMessage({type: MESSAGE_TYPES.getStream});
  }
}
