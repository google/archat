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
 chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SIDE_PANEL_TO_CONTENT') {
    // Forward to active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs[0]?.id) return;
      
      chrome.tabs.sendMessage(tabs[0].id, {
        incoming: true,
        type: 'SIDE_PANEL_COMMAND',
        command: message.command,
        data: message.data
      });
    });
  } else if (message.type === 'UPDATE_SIDE_PANEL') {
    // Make sure we have a valid tab ID from the sender
    if (!sender.tab?.id) return;
    
    // Get side panel options for the specific tab
    chrome.sidePanel.getOptions({tabId: sender.tab.id}).then(options => {
      if (options.enabled) {
        chrome.runtime.sendMessage({
          type: 'CONTENT_TO_SIDE_PANEL',
          state: message.state
        });
      }
    }).catch(error => {
      console.error('Error getting side panel options:', error);
    });
  }
});

// Setup side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
