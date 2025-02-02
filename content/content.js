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
 * Content Script for TFJS Cam Effects Chrome Extension.
 *
 * It does only two things:
 * - injects the emulator script into the main page context so we can override
 * native API.
 * - becomes a proxy between background and emulator script.
 **/
(function () {
  // Forces webcam emulation.
  const SCRIPT = document.createElement('script');
  SCRIPT.setAttribute('src', chrome.runtime.getURL('client.js'));
  const root = document.documentElement;
  root.insertBefore(SCRIPT, root.lastChild);

  const IMAGE_SCRIPT = document.createElement('script');
  IMAGE_SCRIPT.setAttribute('src', chrome.runtime.getURL('interactive_image.js'));
  root.insertBefore(IMAGE_SCRIPT, root.lastChild);

  // const port = chrome.runtime.connect({ name: 'client' });
  window.addEventListener('message', (message) => {
    if (message.data.outgoing) {
      if (message.data.type === 'GET_SETTINGS') {
        sendSettings();
      }
    }
  });

  function sendSettings() {
    chrome.storage.local.get(
      {
        scene: 'Interactive Images (beta)',
        deviceId: null,
        passthroughZoom: 1,
        soundOptions: null,
        interactiveImageOptions: null,
      },
      (response) => {
        window.postMessage({incoming: true, type: 'SETTINGS', settings: response}, '*');
      });
  }

  // Listens for changes from options page; if so, sets new options for scene.
  chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace !== 'local') return;
    sendSettings();
  });
})();
