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
 * Constant settings of the app.
 * If changes, then change `js/emulator.js`
 */
import {SCENE_NAMES} from '../scenes/scene_names';

export const APP_SETTINGS = {
  // targetFPS: 30,
  targetFPSInMs: 1000 / 30,

  // fetchMeetCaptionFPS: 5,
  fetchMeetCaptionFPSInMs: 1000 / 5,

  initialScene: SCENE_NAMES.Sound,
  delayToRunFirstSceneMs: 1000,

  // Camera resolution & initial dimension of input image of the ML model.
  cameraWidth: 1280,
  cameraHeight: 720,

  // Change it to something else to enable downsampling. Right now only
  // HandGestures are rendered correctly (predictions are in absolute units
  // and have to be corrected back).
  downSamplingRatio: 0.67,

  virtualCameraDeviceId: 'virtual',
  virtualCameraGroupId: 'ARChat',
  virtualCameraLabel: 'ARChat Virtual Camera',
};
