// In sidepanel.ts
import { SCENE_NAMES } from './scenes/scene_names';

// Initialize UI elements
document.addEventListener('DOMContentLoaded', () => {
  // Get references to UI elements
  const sceneSelector = document.getElementById('scene-selector') as HTMLSelectElement;
  
  // Populate scene selector
  Object.values(SCENE_NAMES).forEach(sceneName => {
    const option = document.createElement('option');
    option.value = sceneName.toString();
    option.textContent = sceneName.toString();
    sceneSelector.appendChild(option);
  });
  // Add event listeners
  sceneSelector.addEventListener('change', () => {
    chrome.runtime.sendMessage({
      type: 'SIDE_PANEL_TO_CONTENT',
      command: 'SET_SCENE',
      data: { scene: sceneSelector.value }
    });
  });
  
  // Request initial state
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs[0]?.id) return;
    
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'GET_STATE'
    });
  });
});

// Listen for updates from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'CONTENT_TO_SIDE_PANEL') {
    updateUI(message.state);
  }
});

function updateUI(state: any) {
  // Update UI based on current state
  const sceneSelector = document.getElementById('scene-selector') as HTMLSelectElement;
  sceneSelector.value = state.currentScene;
}