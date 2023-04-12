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
import {MESSAGE_TYPES} from '../options/message-types';
import {EntityLocator} from '../scenes/Sound/entity_locator';

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

  // if (selfCaptions) {
  //   entityLocator.processText(selfCaptions).then(() => {
  //     console.log('We processed the entity, yay');
  //     console.log(entityLocator.entity, entityLocator.entityImgUrl,
  //     entityLocator.entityImg);
  //   });
  // }

  window.postMessage(
      {
        type: MESSAGE_TYPES.setCaptions,
        captionsEnabled: Boolean(gMeetCaptionsView),
        captions,
        selfCaptions,
        allCaptions,
        outgoing: true,
      },
      '*');

  setTimeout(fetchGoogleMeetCaptions, APP_SETTINGS.fetchMeetCaptionFPSInMs);
}

function makeStreamFromTrack(track: MediaStreamTrack) {
  const stream = new MediaStream();
  stream.addTrack(track);
  return stream;
}

async function getVirtualMediaStream(constraints: MediaTrackConstraints|
                                     boolean) {
  if (virtualTrack) return makeStreamFromTrack(virtualTrack);

  virtualTrack = await new Promise<MediaStreamTrack>(resolve => {
    // Facebook Messenger requests camera twice. We need a way to distinguish
    // messages between these requests. Signature will help us with that.
    const signature = Math.trunc(performance.now());

    const rtcConnection = new RTCPeerConnection();

    // Saving listener as a variable because we want to remove it once
    // the connection is established.
    const windowMessageListener = async (event: any) => {
      const message = event.data;
      if (!message.incoming || message.signature !== signature) return;

      switch (message.type) {
        case MESSAGE_TYPES.rtcOffer:
          await rtcConnection.setRemoteDescription(message.description);
          const answer = await rtcConnection.createAnswer();
          await rtcConnection.setLocalDescription(answer);
          window.postMessage(
              {
                type: MESSAGE_TYPES.rtcAnswer,
                description: new RTCSessionDescription(answer).toJSON(),
                outgoing: true,
                signature
              },
              '*');
          break;
        case MESSAGE_TYPES.rtcIce:
          await rtcConnection.addIceCandidate(message.candidate);
          break;
        default:
          console.warn(`Unsupported message type: ${message.type}.`);
      }
    };

    window.addEventListener('message', windowMessageListener);

    // We resolve promise with MediaStreamTrack on this event.
    rtcConnection.addEventListener('track', (event) => {
      const track = event.track;
      // TODO(vkyryliuk): implement proper applyConstraints and clone patches.
      // Right now it makes the camera not crash, however the client can't
      // change resolution on an active track / clone track and then close it
      // without closing the original.
      track.applyConstraints = async () => {};
      track.clone = () => track;
      track.stop = () => {
        MediaStreamTrack.prototype.stop.call(track);
        virtualTrack = null;
        rtcConnection.close();
        window.postMessage(
            {
              type: MESSAGE_TYPES.closeStream,
              outgoing: true,
              signature,
            },
            '*');
      };

      window.removeEventListener('message', windowMessageListener);
      resolve(track);
    });

    // ICE candidate should be sent to another peer.
    rtcConnection.addEventListener('icecandidate', (event) => {
      if (!event.candidate) return;
      window.postMessage(
          {
            type: MESSAGE_TYPES.rtcIce,
            candidate: event.candidate.toJSON(),
            outgoing: true,
            signature
          },
          '*');
    });

    // Once all listeners are set, requests the stream.
    window.postMessage(
        {type: MESSAGE_TYPES.getStream, constraints, outgoing: true, signature},
        '*');
  });

  return makeStreamFromTrack(virtualTrack);
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

/**
 * Restores navigator.mediaDevices to its original state.
 * Commented out to keep lint happy until I can think of a good use case for it.
 */
// function restoreNativeAPI() {
//   delete navigator.mediaDevices.getUserMedia;
//   delete navigator.mediaDevices.enumerateDevices;
//   navigator.mediaDevices.dispatchEvent(new CustomEvent('devicechange'));
// }

patchNativeAPI();
fetchGoogleMeetCaptions();
