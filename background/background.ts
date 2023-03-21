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
 * Background script which runs persistently.
 **/
import {APP_SETTINGS} from '../options/app-settings';
import {MESSAGE_TYPES} from '../options/message-types';
import {OPTION_NAMES} from '../options/option-names';
// #NewScene: Import your new scene here and search for #NewScene for the rest.
// E.g., also adds new scene to options.ts SCENES.
import {PassthroughScene} from '../scenes/PassThrough/PassThrough';
import {Scene} from '../scenes/scene';
import {SCENE_NAMES} from '../scenes/scene_names';
import {InteractiveImageScene} from '../scenes/Sound/InteractiveImage';
import {SummarizationScene} from '../scenes/Sound/Transcription';

interface JsonMessage {
  text: string;
}

// Xeno icon opens Options page. Requires "browser_action" section in manifest.
chrome.browserAction.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage();
});

async function checkDeviceAccess() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
      .filter(
          device =>
              device.kind === 'videoinput' || device.kind === 'audioinput')
      .every(device => Boolean(device.label));
}

chrome.runtime.onInstalled.addListener(() => {
  checkDeviceAccess().then(haveAccess => {
    if (!haveAccess) chrome.runtime.openOptionsPage();
  });
});

const VIDEO = document.createElement('video');

// Initial dimension of input image of the ML model.
const CAMERA_WIDTH = APP_SETTINGS.cameraWidth;
const CAMERA_HEIGHT = APP_SETTINGS.cameraHeight;

// Downsampling ratio for some ML models.
const DOWNSAMPLING_RATIO = APP_SETTINGS.downSamplingRatio;

// Input canvas.
const INPUT_CAMERA_CANVAS = new OffscreenCanvas(CAMERA_WIDTH, CAMERA_HEIGHT);
const INPUT_CAMERA_CTX = INPUT_CAMERA_CANVAS.getContext('2d');

// const DOWNSAMPLED_INPUT_CAMERA_CANVAS =
//     new OffscreenCanvas(CAMERA_WIDTH / DOWNSAMPLING_RATIO, CAMERA_HEIGHT /
//     DOWNSAMPLING_RATIO);
const DOWNSAMPLED_INPUT_CAMERA_CANVAS = document.createElement('canvas');
DOWNSAMPLED_INPUT_CAMERA_CANVAS.width = CAMERA_WIDTH / DOWNSAMPLING_RATIO;
DOWNSAMPLED_INPUT_CAMERA_CANVAS.height = CAMERA_HEIGHT / DOWNSAMPLING_RATIO;
const DOWNSAMPLED_INPUT_CAMERA_CTX =
    DOWNSAMPLED_INPUT_CAMERA_CANVAS.getContext('2d');

// Output canvas.
const OUTPUT_CANVAS = document.createElement('canvas');
OUTPUT_CANVAS.width = CAMERA_WIDTH;
OUTPUT_CANVAS.height = CAMERA_HEIGHT;

// TODO: Add a manager to manage all models, interfaces, and scenes.
let requiredModels: string[] = [];
let requiredModelsPredictions: {[key: string]: any} = {};

var currentScene: Scene|undefined = undefined;
var currentSceneReady = false;

// const modelInterfaces = new Map<string, Model>();
const availableScenes = new Map<string, Scene>();

/**
 * Registers a scene for usage.
 * @param {object} scene a scene from the scenes folder.
 */
function registerScene(scene: Scene) {
  availableScenes.set(scene.getName(), scene);
  console.log('Registered Effect: ' + scene.getName());
}

// #NewScene: Registers your scene here.
registerScene(new PassthroughScene());
registerScene(new SummarizationScene());
registerScene(new InteractiveImageScene());

/**
 * Switches to a new scene.
 * @param {string} name a name of the scene to switch.
 */
async function switchScene(name: string) {
  if (currentScene?.getName() !== name) {
    // Unloads current scene if something is happening there.
    currentScene?.stop?.();
  }

  currentSceneReady = false;
  requiredModels = [];

  currentScene = availableScenes.get(name);
  if (currentScene) {
    // requiredModels = currentScene.getModelDependencies();
    console.log('Switched scene to: ' + currentScene.getName());
    console.log('Loading scene ML dependencies...');

    // const promises =
    //   requiredModels.map(model => modelInterfaces.get(model).init());
    // await Promise.all(promises);

    if (isEngineRunning) {
      // Finally init the scene itself.
      await currentScene.init();
      currentSceneReady = true;
    }
  }
}

/**
 * Passes gMeet captions to individual scenes for rapid prototyping.
 * @param enabled whether to enable this feature
 * @param captions raw captions from gMeet
 * @param selfCaptions captions by speaker theirselves in gMeet
 * @param allCaptions captions by everyone in gMeet
 * @returns
 */
function setCaptions(
    enabled: boolean, captions: string, selfCaptions: string,
    allCaptions: string) {
  if (!currentScene || !currentSceneReady) return;
  if (isEngineRunning) {
    currentScene.setCaptions(enabled, captions, selfCaptions, allCaptions);
  }
}

function setImage(
    x: number, y: number, width: number, height: number, url: string,
    name: string) {
  if (!currentScene || !currentSceneReady) return;
  if (isEngineRunning && currentScene instanceof InteractiveImageScene) {
    currentScene.setImage(x, y, width, height, url, name);
  }
}

// Loads the default scene. Delay is needed to allow the models to register.
setTimeout(() => {
  chrome.storage.local.get(
      {
        scene: APP_SETTINGS.initialScene,
        deviceId: null,
        passthroughZoom: 1,
        soundOptions: null,
        interactiveImageOptions: null,
      },
      (response) => {
        switchScene(response.scene);
        switchCamera(response.deviceId);

        // #NewScene: Add new options here when adding a new scene.
        if (availableScenes.has(SCENE_NAMES.PassThrough)) {
          (availableScenes.get(SCENE_NAMES.PassThrough) as PassthroughScene)
              .setZoom(response.passthroughZoom);
        }

        if (availableScenes.has(SCENE_NAMES.Sound)) {
          (availableScenes.get(SCENE_NAMES.Sound) as SummarizationScene)
              .setOptions(response.soundOptions);
        }

        if (availableScenes.has(SCENE_NAMES.InteractiveImage)) {
          (availableScenes.get(SCENE_NAMES.InteractiveImage) as
           InteractiveImageScene)
              .setOptions(response.interactiveImageOptions);
        }
      });
}, APP_SETTINGS.delayToRunFirstSceneMs);

// Listens for changes from options page; if so, sets new options for scene.
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace !== 'local') return;
  for (const [key, storageChange] of Object.entries(changes)) {
    switch (key) {
      case OPTION_NAMES.Scene:
        switchScene(storageChange.newValue);
        break;
      case OPTION_NAMES.DeviceId:
        switchCamera(storageChange.newValue);
        break;
      // #NewScene: Add new setters here when adding a new option page.
      case OPTION_NAMES.PassthroughZoom:
        if (availableScenes.has(SCENE_NAMES.PassThrough)) {
          (availableScenes.get(SCENE_NAMES.PassThrough) as PassthroughScene)
              .setZoom(storageChange.newValue);
        }
        break;
      case OPTION_NAMES.SoundOptions:
        if (availableScenes.has(SCENE_NAMES.Sound)) {
          (availableScenes.get(SCENE_NAMES.Sound) as SummarizationScene)
              .setOptions(storageChange.newValue);
        }
        break;
      case OPTION_NAMES.InteractiveImageOptions:
        if (availableScenes.has(SCENE_NAMES.InteractiveImage)) {
          (availableScenes.get(SCENE_NAMES.InteractiveImage) as
           InteractiveImageScene)
              .setOptions(storageChange.newValue);
        }
      default:
        break;
    }
  }
});



/**
 * Copies incoming image from real camera to the input camera canvas.
 */
async function streamPredictLoop() {
  // const startTime = performance.now();
  await predict();
  // const endTime = performance.now();
  // console.log(`main predict took ${endTime - startTime} ms.`)
  loopTimeout =
      window.setTimeout(streamPredictLoop, APP_SETTINGS.targetFPSInMs);
}

/**
 * Enumerates through required models and run predictions.
 */
async function predict() {
  if (!currentScene || !currentSceneReady) return;

  INPUT_CAMERA_CTX.drawImage(VIDEO, 0, 0);

  if (currentScene.useDownsampledCanvas) {
    DOWNSAMPLED_INPUT_CAMERA_CTX.drawImage(
        VIDEO, 0, 0, DOWNSAMPLED_INPUT_CAMERA_CANVAS.width,
        DOWNSAMPLED_INPUT_CAMERA_CANVAS.height);
  }

  // for (const requiredModel of requiredModels) {
  //   const modelInterface = modelInterfaces.get(requiredModel);

  //   if (currentScene.useDownsampledCanvas) {
  //     requiredModelsPredictions[requiredModel] =
  //       await modelInterface.predict(DOWNSAMPLED_INPUT_CAMERA_CANVAS);
  //   } else {
  //     requiredModelsPredictions[requiredModel] =
  //       await modelInterface.predict(INPUT_CAMERA_CANVAS);
  //   }
  // }

  // Uncomment to remove lag. Or replace INPUT_CAMERA_CANVAS with VIDEO in the
  // function below. INPUT_CAMERA_CTX.drawImage(VIDEO, 0, 0);

  if (currentScene.useDownsampledCanvas) {
    await currentScene.render(
        DOWNSAMPLED_INPUT_CAMERA_CANVAS, requiredModelsPredictions,
        OUTPUT_CANVAS, DOWNSAMPLING_RATIO);
  } else {
    await currentScene.render(
        INPUT_CAMERA_CANVAS, requiredModelsPredictions, OUTPUT_CANVAS,
        DOWNSAMPLING_RATIO);
  }
}

let loopTimeout: number|null = null;

let deviceId: string|undefined = undefined;

let isEngineRunning = false;

async function maybeStartEngine() {
  if (isEngineRunning) return;
  // if (VIDEO.srcObject) {
  //   return;
  // }
  const cameraStream = await navigator.mediaDevices.getUserMedia({
    // audio: true,
    video: {
      deviceId,
      width: CAMERA_WIDTH,
      height: CAMERA_HEIGHT,
    }
  });
  // VIDEO.addEventListener('loadeddata', streamPredictLoop);
  VIDEO.srcObject = cameraStream;
  await VIDEO.play();

  await currentScene?.init?.();
  currentSceneReady = true;

  if (!loopTimeout) {
    loopTimeout = window.setTimeout(streamPredictLoop, 0);
  }

  isEngineRunning = true;
}

/**
 * Cleans up video streams when closing.
 */
async function maybeStopEngine() {
  if (globalClientCounter > 0) return;
  console.log('Maybe stopping');
  if (!isEngineRunning) return;
  if (VIDEO.srcObject) {
    for (const track of (VIDEO.srcObject as MediaStream).getTracks()) {
      track.stop();
    }
    VIDEO.srcObject = null;
  }

  currentSceneReady = false;
  await currentScene?.stop?.();

  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = null;
  }
  isEngineRunning = false;
}

/**
 * Changes the current camera with a device id.
 * @param newDeviceId the device id to set
 */
async function switchCamera(newDeviceId: string) {
  console.log(`Switching camera to ${newDeviceId}.`);

  if (deviceId === newDeviceId) return;
  // We have to stop the stream and create a new one.
  if (VIDEO.srcObject) {
    for (const track of (VIDEO.srcObject as MediaStream).getTracks()) {
      track.stop();
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: newDeviceId,
        width: CAMERA_WIDTH,
        height: CAMERA_HEIGHT,
      }
    });
    VIDEO.srcObject = stream;
    await VIDEO.play();
  }
  deviceId = newDeviceId;
}

let globalClientCounter = 0;

// Set up to exchange only video.
const offerOptions = {
  offerToReceiveVideo: true,
};

/**
 * Big and scary communication layer with clients.
 * Sets up WebRTC connections to them.
 */
chrome.runtime.onConnect.addListener((port) => {
  // All created RTCPeerConnections. Key is signature.
  // Every RTCConnection is streaming Xeno media stream, so the size of the
  // map is equal to number of active streams for this port connection.
  // We use this fact to update global client counter when tab is closed.
  const rtcConnections = new Map();

  port.onMessage.addListener(async (message) => {
    // Client can send an optional signature. This way we can distinguish
    // between different camera requests. If unset, it defaults to 0.
    const signature = message.signature ?? 0;

    switch (message.type) {
      case MESSAGE_TYPES.getStream:
        console.log('Starting the camera');
        await maybeStartEngine();

        const stream = OUTPUT_CANVAS.captureStream();

        const rtcConnection = new RTCPeerConnection();
        rtcConnections.set(signature, rtcConnection);
        globalClientCounter++;

        // Sends ICE candidate info to another peer when it becomes available.
        rtcConnection.addEventListener('icecandidate', (event) => {
          if (event.candidate) {
            port.postMessage({
              type: MESSAGE_TYPES.rtcIce,
              candidate: event.candidate,
              signature
            });
          }
        });

        // Adds all tracks from Xeno media stream. rtc.addStream is deprecated.
        for (const track of stream.getTracks()) {
          rtcConnection.addTrack(track);
        }

        // Creates offer and send it to another peer.
        const offer = await rtcConnection.createOffer(offerOptions);
        await rtcConnection.setLocalDescription(offer);
        port.postMessage(
            {type: MESSAGE_TYPES.rtcOffer, description: offer, signature});
        break;

      // Received an answer from another peer.
      case MESSAGE_TYPES.rtcAnswer:
        const answer = message.description;
        await rtcConnections.get(signature)?.setRemoteDescription(answer);
        break;

      // Received ICE candidate info from another peer.
      case MESSAGE_TYPES.rtcIce:
        await rtcConnections.get(signature)?.addIceCandidate(message.candidate);
        break;

      // Client decided to close the stream manually.
      case MESSAGE_TYPES.closeStream:
        const unusedRtcConnection = rtcConnections.get(signature);
        // Maybe we already deleted it elsewhere.
        if (unusedRtcConnection) {
          unusedRtcConnection.close();
          rtcConnections.delete(signature);
          globalClientCounter--;
          maybeStopEngine();
        }
        break;
      case MESSAGE_TYPES.setScene:
        const effect = message.effect;
        switchScene(effect);
        port.postMessage(
            {type: MESSAGE_TYPES.currentScene, scene: currentScene?.name});
        break;
      case MESSAGE_TYPES.setCaptions:
        const captions = message.captions;
        const selfCaptions = message.selfCaptions;
        const enabled = message.captionsEnabled;
        const allCaptions = message.allCaptions;
        setCaptions(enabled, captions, selfCaptions, allCaptions);
        break;
      case MESSAGE_TYPES.setImage:
        setImage(
            message.x, message.y, message.width, message.height, message.url,
            message.name);
        break;
      case MESSAGE_TYPES.getCurrentScene:
        port.postMessage(
            {type: MESSAGE_TYPES.currentScene, scene: currentScene?.name});
        break;
      default:
        console.warn(`Unsupported message type: ${message.type}.`);
    }
  });

  // Most likely client tab was closed.
  port.onDisconnect.addListener(() => {
    globalClientCounter -= rtcConnections.size;
    rtcConnections.clear();
    maybeStopEngine();
  });
});
