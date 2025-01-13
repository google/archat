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
import {APP_SETTINGS} from '../options/app-settings';
import {EntityLocator} from '../scenes/Sound/entity_locator';
import {SCENE_NAMES} from '../scenes/scene_names';

import {PassthroughScene} from '../scenes/PassThrough/PassThrough';
import {InteractiveImageScene} from '../scenes/Sound/InteractiveImage';
import {SummarizationScene} from '../scenes/Sound/Transcription';

import {Renderer} from '../background/renderer';

declare global {
  interface Window {
    selectedCameraId: string|string[]|null|undefined;
  }
}

/**
 * Emulates a virtual webcam.
 **/
function getDeviceId(videoConstraints: MediaTrackConstraints|boolean) {
  if (typeof videoConstraints === 'boolean') return null;

  if (!videoConstraints.deviceId) return null;

  if (typeof videoConstraints.deviceId === 'string') {
    return videoConstraints.deviceId;
  }

  if (videoConstraints.deviceId instanceof Array) {
    return videoConstraints.deviceId[0];
  }

  return videoConstraints.deviceId.exact ?? null;
}

// Actives Virtual media track.
let virtualTrack: MediaStreamTrack|null = null;

const entityLocator = new EntityLocator();
const renderer = new Renderer();
(window as any).renderer = renderer;

renderer.setScene(SCENE_NAMES.InteractiveImage);

window.addEventListener('message', (event) => {
  const message = event.data;
  if (!message.incoming) return;
  if (message.type === 'SETTINGS') {
    console.log('Received settings', message.settings);
    applySettings(message.settings);
  }
});

window.postMessage(
    {
      type: 'GET_SETTINGS',
      outgoing: true,
    },
    '*');

function applySettings(response: any) {
  renderer.setScene(response.scene);
  renderer.switchCamera(response.deviceId);

  // #NewScene: Add new options here when adding a new scene.
  if (Renderer.availableScenes.has(SCENE_NAMES.PassThrough)) {
    (Renderer.availableScenes.get(SCENE_NAMES.PassThrough) as PassthroughScene)
        .setZoom(response.passthroughZoom);
  }

  if (Renderer.availableScenes.has(SCENE_NAMES.Sound)) {
    (Renderer.availableScenes.get(SCENE_NAMES.Sound) as SummarizationScene)
        .setOptions(response.soundOptions);
  }

  if (Renderer.availableScenes.has(SCENE_NAMES.InteractiveImage)) {
    (Renderer.availableScenes.get(SCENE_NAMES.InteractiveImage) as
    InteractiveImageScene)
        .setOptions(response.interactiveImageOptions);
  }
}

/**
 * Fetches Google Meet captions if available.
 */
function fetchGoogleMeetCaptions() {
  let captions = '';
  let selfCaptions = '';
  let allCaptions = '';

  const gMeetCaptionsView =
      document.querySelector('div[jscontroller="D1tHje"]');

  if (gMeetCaptionsView) {
    const divs = document.querySelectorAll('div[class="TBMuR bj4p3b"]');
    for (const div of divs) {
      let name = div.querySelector('div[class="zs7s8d jxFHg"]')!.textContent;
      let wordSpans = Array.from(div.querySelectorAll('span'));
      captions += name + ': ';
      const sentence = wordSpans.map(span => span.textContent.trim()).join(' ');
      if (name === 'You' || name.indexOf('Presentation') !== -1) {
        if (selfCaptions.length > 0) {
          selfCaptions += ' ';
        }
        selfCaptions += sentence;
      }
      captions += sentence + '\n';
      allCaptions += sentence;
    }
  }

  renderer.setCaptions(
    Boolean(gMeetCaptionsView),
    captions,
    selfCaptions,
    allCaptions,
  );

  setTimeout(fetchGoogleMeetCaptions, APP_SETTINGS.fetchMeetCaptionFPSInMs);
}

function makeStreamFromTrack(track: MediaStreamTrack) {
  const stream = new MediaStream();
  stream.addTrack(track);
  return stream;
}

async function getVirtualMediaStream(constraints: MediaTrackConstraints|
                                     boolean) {
  return renderer.getStream();
}

/**
 * Injects Virtual Camera into navigator.mediaDevices API.
 */
function patchNativeAPI() {
  // Patches getUserMedia()
  navigator.mediaDevices.getUserMedia = async function(constraints) {
    if (!constraints) return null;
    const videoDeviceId =
        constraints.video ? getDeviceId(constraints.video) : null;
    window.selectedCameraId = videoDeviceId;

    if (videoDeviceId !== 'virtual') {
      restoreVideoMirrorMode();
      console.log('Current this', this);
      return MediaDevices.prototype.getUserMedia.call(this, constraints);
    } else {
      removeVideoMirrorMode();
      const stream = await getVirtualMediaStream(constraints.video!);
      if (constraints.audio) {
        const audioConstrains = {audio: constraints.audio, video: false};
        const audioStream = await MediaDevices.prototype.getUserMedia.call(
            this, audioConstrains);
        for (const track of audioStream.getAudioTracks()) {
          stream.addTrack(track);
        }
      }
      return stream;
    }
  };

  // Patches enumerateDevices.
  navigator.mediaDevices.enumerateDevices = async function() {
    const devices = await MediaDevices.prototype.enumerateDevices.call(this);

    const virtualCamera = {
      deviceId: APP_SETTINGS.virtualCameraDeviceId,
      groupID: APP_SETTINGS.virtualCameraGroupId,
      kind: 'videoinput',
      label: APP_SETTINGS.virtualCameraLabel,
    };

    return [...devices, virtualCamera];
  };

  // Notify that new camera was added. Needed for Google Meet.
  navigator.mediaDevices.dispatchEvent(new CustomEvent('devicechange'));
}

const ARCHAT_STYLES_ID = 'archat-styles';

function removeVideoMirrorMode() {
  if (document.getElementById(ARCHAT_STYLES_ID)) return;
  const styles = `
    video {
      transform: unset !important;
    }
  `;
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  styleSheet.setAttribute('id', ARCHAT_STYLES_ID);
  document.head.appendChild(styleSheet);
}

function restoreVideoMirrorMode() {
  const styleSheet = document.getElementById(ARCHAT_STYLES_ID);
  if (styleSheet) {
    styleSheet.parentNode!.removeChild(styleSheet);
  }
}

patchNativeAPI();
fetchGoogleMeetCaptions();
