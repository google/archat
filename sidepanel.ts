// In sidepanel.ts
import { SCENE_NAMES } from './scenes/scene_names';
import { 
  DEFAULT_SOUND_OPTIONS, 
  SoundOptions, 
  LANGUAGES, 
  TranscriptionLayout,
  LambdaLayout,
  SummaryMode,
  CaptionMode,
  BackgroundImage,
  EmphasizingMode,
  AutoCapitalization,
  Colors
} from './scenes/Sound/sound_options';

import {
  DEFAULT_INTERACTIVEIMAGE_OPTIONS,
  InteractiveImageOptions
} from './scenes/Sound/InteractiveImage_options';

// Define the state interface
interface ARChatState {
  currentScene: string;
  captionsEnabled: boolean;
  aiProactiveness: string;
  allParticipants: boolean;
  suggestEmojis: boolean;
  suggestPersonal: boolean;
  modelCapability: string;
  minWords: number;
  lastNSentences: number;
  maxVisuals: number;
  maxEmojis: number;
  visualSize: number;
  loggingEnabled: boolean;
  interactiveImage?: {
    url: string;
    name: string;
  };
}

// Initial state
let currentState: ARChatState = {
  currentScene: '',
  captionsEnabled: true,
  aiProactiveness: 'suggestion',
  allParticipants: false,
  suggestEmojis: true,
  suggestPersonal: true,
  modelCapability: 'most-capable',
  minWords: 4,
  lastNSentences: 1,
  maxVisuals: 5,
  maxEmojis: 4,
  visualSize: 1,
  loggingEnabled: false
};

document.addEventListener('DOMContentLoaded', () => {
  // Get references to tab elements
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // Tab switching logic
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));
      
      button.classList.add('active');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Scene selector setup
  const sceneSelector = document.getElementById('scene-selector') as HTMLSelectElement;
  const blankPage = document.getElementById('blank-page');
  const soundSettings = document.getElementById('sound-settings');
  const visualCaptions = document.getElementById('visual-captions');
  const toggleAdvanced = document.getElementById('toggle-advanced');
  const advancedContent = document.getElementById('advanced-content');
  
  // Clear any existing options
  while (sceneSelector.firstChild) {
    sceneSelector.removeChild(sceneSelector.firstChild);
  }
  
  // Add blank option first
  const blankOption = document.createElement('option');
  blankOption.value = '';
  blankOption.textContent = 'Select a scene';
  sceneSelector.appendChild(blankOption);

  console.log("SCENE_NAMES:", SCENE_NAMES); // Debug what's being imported

  Object.entries(SCENE_NAMES).forEach(([key, sceneName]) => {
    console.log(`Adding option: key=${key}, value=${sceneName}`); // Debug each iteration
    const option = document.createElement('option');
    option.value = key; // Use the key as the value
    option.textContent = sceneName; // Use the name as display text
    sceneSelector.appendChild(option);
  });

  // Setup different panels
  setupInteractiveImageOptions();
  setupSoundOptions();
  setupCaptionSettings();
  setupAdvancedSettings();
  setupLoggingSettings();
  setupInteractiveImageSettings();

  const sliders = document.querySelectorAll('input[type="range"]');
  sliders.forEach(function(slider) {
    const valueDisplay = document.getElementById(`${slider.id}-value`);
    if (valueDisplay) {
      valueDisplay.textContent = (slider as HTMLInputElement).value;
      slider.addEventListener('input', function(this: HTMLInputElement) {
        valueDisplay.textContent = this.value;
      });
    }
  });

  sceneSelector.addEventListener('change', () => {
    const selectedScene = sceneSelector.value;
    currentState.currentScene = selectedScene;
    
    chrome.runtime.sendMessage({
      type: 'SIDE_PANEL_TO_CONTENT',
      command: 'SET_SCENE',
      data: { scene: selectedScene }
    });
  
    // Hide all pages
    blankPage.style.display = 'none';
    soundSettings.style.display = 'none';
    visualCaptions.style.display = 'none';
    
    // Show the selected page
    if (selectedScene === 'Sound') {
      soundSettings.style.display = 'block';
    } else if (selectedScene === 'InteractiveImage') {
      visualCaptions.style.display = 'block';
      toggleInteractiveImageSection(true);
    } else if (selectedScene === 'PassThrough') {
      blankPage.style.display = 'block';
    } else {
      blankPage.style.display = 'block';
    }
    
    updateStatusDisplay();
  });

  // Toggle advanced settings
  if (toggleAdvanced && advancedContent) {
    toggleAdvanced.addEventListener('click', function() {
      const isHidden = advancedContent.style.display === 'none' || !advancedContent.style.display;
      
      if (isHidden) {
        advancedContent.style.display = 'block';
        toggleAdvanced.textContent = 'Hide';
      } else {
        advancedContent.style.display = 'none';
        toggleAdvanced.textContent = 'Show';
      }
    });
  }
});

function setupInteractiveImageOptions() {
  // Get references to UI elements
  const enableButton = document.getElementById('enable-button') as HTMLInputElement;
  const proactivenessSelect = document.getElementById('proactiveness') as HTMLSelectElement;
  const enableAllCaptions = document.getElementById('enable-all-captions') as HTMLInputElement;
  const enableEmoji = document.getElementById('enable-emoji') as HTMLInputElement;
  const enablePersonal = document.getElementById('enable-personal') as HTMLInputElement;
  const visualSize = document.getElementById('visual-size') as HTMLInputElement;
  const numVisuals = document.getElementById('num-visuals') as HTMLInputElement;
  const numEmojis = document.getElementById('num-emojis') as HTMLInputElement;
  const numWords = document.getElementById('num-words') as HTMLInputElement;
  const lastNSentences = document.getElementById('last-n-sentences') as HTMLInputElement;
  
  // Update UI value displays
  const visualSizeValue = document.getElementById('visual-size-value') as HTMLSpanElement;
  const numVisualsValue = document.getElementById('num-visuals-value') as HTMLSpanElement;
  const numEmojisValue = document.getElementById('num-emojis-value') as HTMLSpanElement;
  const numWordsValue = document.getElementById('num-words-value') as HTMLSpanElement;
  const lastNSentencesValue = document.getElementById('last-n-sentences-value') as HTMLSpanElement;
  
  function updateSettings() {
    const options: InteractiveImageOptions = {
      enableButton: enableButton?.checked || false,
      proactiveness: proactivenessSelect?.value || 'suggestion',
      enableAllCaptions: enableAllCaptions?.checked || false,
      enableEmoji: enableEmoji?.checked || true,
      enablePersonal: enablePersonal?.checked || true,
      model: 'davinci', // Fixed for now
      visualSize: Number(visualSize?.value || 1),
      numVisuals: Number(numVisuals?.value || 5),
      numEmojis: Number(numEmojis?.value || 4),
      numWords: Number(numWords?.value || 4),
      lastNSentences: Number(lastNSentences?.value || 1),
      enableLogging: false // Fixed for now
    };

    // Update slider value displays
    if (visualSizeValue) visualSizeValue.textContent = visualSize?.value || '1';
    if (numVisualsValue) numVisualsValue.textContent = numVisuals?.value || '5';
    if (numEmojisValue) numEmojisValue.textContent = numEmojis?.value || '4';
    if (numWordsValue) numWordsValue.textContent = numWords?.value || '4';
    if (lastNSentencesValue) lastNSentencesValue.textContent = lastNSentences?.value || '1';

    chrome.storage.local.set({ interactiveImageOptions: options });
    
    // Update current state with relevant values
    currentState.suggestEmojis = options.enableEmoji;
    currentState.suggestPersonal = options.enablePersonal;
    currentState.visualSize = options.visualSize;
    currentState.maxVisuals = options.numVisuals;
    currentState.maxEmojis = options.numEmojis;
    currentState.minWords = options.numWords;
    currentState.lastNSentences = options.lastNSentences;
    
    sendStateUpdate();
  }

  // Add event listeners
  [enableButton, enableAllCaptions, enableEmoji, enablePersonal].forEach(checkbox => {
    if (checkbox) checkbox.addEventListener('change', updateSettings);
  });

  if (proactivenessSelect) proactivenessSelect.addEventListener('change', updateSettings);
  
  [visualSize, numVisuals, numEmojis, numWords, lastNSentences].forEach(input => {
    if (input) input.addEventListener('input', updateSettings);
  });

  // Load initial settings
  chrome.storage.local.get({ interactiveImageOptions: DEFAULT_INTERACTIVEIMAGE_OPTIONS }, (response) => {
    const options = response.interactiveImageOptions;
    if (enableButton) enableButton.checked = options.enableButton;
    if (proactivenessSelect) proactivenessSelect.value = options.proactiveness;
    if (enableAllCaptions) enableAllCaptions.checked = options.enableAllCaptions;
    if (enableEmoji) enableEmoji.checked = options.enableEmoji;
    if (enablePersonal) enablePersonal.checked = options.enablePersonal;
    if (visualSize) visualSize.value = String(options.visualSize);
    if (numVisuals) numVisuals.value = String(options.numVisuals);
    if (numEmojis) numEmojis.value = String(options.numEmojis);
    if (numWords) numWords.value = String(options.numWords);
    if (lastNSentences) lastNSentences.value = String(options.lastNSentences);
    
    // Update value displays
    if (visualSizeValue) visualSizeValue.textContent = String(options.visualSize);
    if (numVisualsValue) numVisualsValue.textContent = String(options.numVisuals);
    if (numEmojisValue) numEmojisValue.textContent = String(options.numEmojis);
    if (numWordsValue) numWordsValue.textContent = String(options.numWords);
    if (lastNSentencesValue) lastNSentencesValue.textContent = String(options.lastNSentences);
  });
}

function setupSoundOptions() {
  // Get references to all sound option elements
  const sourceLanguage = document.getElementById('source-language') as HTMLSelectElement;
  const summarizationMode = document.getElementById('summarization-mode') as HTMLSelectElement;
  const fontFamily = document.getElementById('font-family') as HTMLSelectElement;
  const fontSize = document.getElementById('font-size') as HTMLSelectElement;
  const backgroundColor = document.getElementById('background-color') as HTMLSelectElement;
  const summaryDelay = document.getElementById('summary-delay') as HTMLSelectElement;
  const summaryShowTime = document.getElementById('summary-show-time') as HTMLSelectElement;
  const summaryMaxWords = document.getElementById('summary-max-words') as HTMLSelectElement;
  const summaryMinWords = document.getElementById('summary-min-words') as HTMLSelectElement;
  const summaryColor = document.getElementById('summary-color') as HTMLSelectElement;
  const captionColor = document.getElementById('caption-color') as HTMLSelectElement;
  const rangeScreenX = document.getElementById('range-screenX') as HTMLInputElement;
  const rangeScreenY = document.getElementById('range-screenY') as HTMLInputElement;
  const rangeScreenSize = document.getElementById('range-screenSize') as HTMLInputElement;
  const useMeetCaptions = document.getElementById('use-meet-captions') as HTMLSelectElement;
  const autoCapitalization = document.getElementById('auto-capitalization') as HTMLSelectElement;
  const emphasizingMode = document.getElementById('emphasizing-mode') as HTMLSelectElement;
  const backgroundImage = document.getElementById('background-image') as HTMLSelectElement;
  const textLogMeet = document.getElementById('text-log-meet') as HTMLTextAreaElement;
  const textLayout = document.getElementById('text-layout') as HTMLSelectElement;
  const summaryLayout = document.getElementById('summary-layout') as HTMLSelectElement;
  
  // Populate language dropdown if it exists
  if (sourceLanguage) {
    // Use the LANGUAGES object from the imported sound options
    const option = document.createElement('option');
    option.value = LANGUAGES.EN_US;
    option.textContent = 'English (United States)';
    sourceLanguage.appendChild(option);
  }
  
  // Populate other dropdowns with enum values
  if (summarizationMode) {
    Object.values(SummaryMode).forEach(mode => {
      const option = document.createElement('option');
      option.value = mode;
      option.textContent = mode;
      summarizationMode.appendChild(option);
    });
  }
  
  if (useMeetCaptions) {
    Object.values(CaptionMode).forEach(mode => {
      const option = document.createElement('option');
      option.value = mode;
      option.textContent = mode;
      useMeetCaptions.appendChild(option);
    });
  }
  
  if (autoCapitalization) {
    Object.values(AutoCapitalization).forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      autoCapitalization.appendChild(option);
    });
  }
  
  if (emphasizingMode) {
    Object.values(EmphasizingMode).forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      emphasizingMode.appendChild(option);
    });
  }
  
  if (backgroundImage) {
    Object.values(BackgroundImage).forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      backgroundImage.appendChild(option);
    });
  }

  function updateSoundSettings() {
    // Create a partial options object with only the elements that exist
    const options: Partial<SoundOptions> = { ...DEFAULT_SOUND_OPTIONS };
    
    if (sourceLanguage) options.sourceLanguage = sourceLanguage.value;
    if (summarizationMode) options.summarizationMode = summarizationMode.value;
    if (fontFamily) options.fontFamily = fontFamily.value;
    if (fontSize) options.fontSize = Number(fontSize.value);
    if (backgroundColor) options.backgroundColor = backgroundColor.value;
    if (summaryDelay) options.summaryDelay = Number(summaryDelay.value);
    if (summaryShowTime) options.lamdaShowTimeMs = Number(summaryShowTime.value);
    if (summaryMaxWords) options.summaryMaxWords = Number(summaryMaxWords.value);
    if (summaryMinWords) options.summaryMinWords = Number(summaryMinWords.value);
    if (summaryColor) options.summaryColor = summaryColor.value;
    if (captionColor) options.captionColor = captionColor.value;
    if (rangeScreenX) options.screenX = Number(rangeScreenX.value);
    if (rangeScreenY) options.screenY = Number(rangeScreenY.value);
    if (rangeScreenSize) options.zoomRatio = Number(rangeScreenSize.value);
    if (useMeetCaptions) options.useMeetCaptions = useMeetCaptions.value;
    if (autoCapitalization) options.autoCapitalization = autoCapitalization.value;
    if (emphasizingMode) options.emphasizingMode = emphasizingMode.value;
    if (backgroundImage) options.backgroundImage = backgroundImage.value;
    if (textLayout) options.textLayout = textLayout.value;
    if (summaryLayout) options.summaryLayout = summaryLayout.value;

    chrome.storage.local.set({ soundOptions: options as SoundOptions });
  }

  // Add event listeners to elements that exist
  [sourceLanguage, summarizationMode, fontFamily, fontSize, backgroundColor, 
   summaryDelay, summaryShowTime, summaryMaxWords, summaryMinWords, 
   summaryColor, captionColor, useMeetCaptions, autoCapitalization, 
   emphasizingMode, backgroundImage, textLayout, summaryLayout].forEach(element => {
    if (element) {
      element.addEventListener('change', updateSoundSettings);
    }
  });

  [rangeScreenX, rangeScreenY, rangeScreenSize].forEach(element => {
    if (element) {
      element.addEventListener('input', updateSoundSettings);
    }
  });

  if (textLogMeet) {
    textLogMeet.addEventListener('input', updateSoundSettings);
  }

  // Load initial settings
  chrome.storage.local.get({ soundOptions: DEFAULT_SOUND_OPTIONS }, (response) => {
    const options = response.soundOptions;
    if (sourceLanguage) sourceLanguage.value = options.sourceLanguage;
    if (summarizationMode && options.summarizationMode) summarizationMode.value = options.summarizationMode;
    if (fontFamily) fontFamily.value = options.fontFamily;
    if (fontSize) fontSize.value = String(options.fontSize);
    if (backgroundColor) backgroundColor.value = options.backgroundColor;
    if (summaryDelay) summaryDelay.value = String(options.summaryDelay / 1000); // Convert to seconds for display
    if (summaryShowTime) summaryShowTime.value = String(options.lamdaShowTimeMs / 1000); // Convert to seconds for display
    if (summaryMaxWords) summaryMaxWords.value = String(options.summaryMaxWords);
    if (summaryMinWords) summaryMinWords.value = String(options.summaryMinWords);
    if (summaryColor) summaryColor.value = options.summaryColor;
    if (captionColor) captionColor.value = options.captionColor;
    if (rangeScreenX) rangeScreenX.value = String(options.screenX);
    if (rangeScreenY) rangeScreenY.value = String(options.screenY);
    if (rangeScreenSize) rangeScreenSize.value = String(options.zoomRatio * 100); // Convert to percentage for display
    if (useMeetCaptions && options.useMeetCaptions) useMeetCaptions.value = options.useMeetCaptions;
    if (autoCapitalization && options.autoCapitalization) autoCapitalization.value = options.autoCapitalization;
    if (emphasizingMode && options.emphasizingMode) emphasizingMode.value = options.emphasizingMode;
    if (backgroundImage && options.backgroundImage) backgroundImage.value = options.backgroundImage;
    if (textLogMeet) textLogMeet.value = options.textLogMeet || '';
    if (textLayout && options.textLayout) textLayout.value = options.textLayout;
    if (summaryLayout && options.summaryLayout) summaryLayout.value = options.summaryLayout;
  });
}

// Setup caption settings event listeners
function setupCaptionSettings() {
  const enableCaptions = document.getElementById('enable-captions') as HTMLInputElement;
  const aiProactiveness = document.getElementById('ai-proactiveness') as HTMLSelectElement;
  
  if (enableCaptions) {
    enableCaptions.addEventListener('change', () => {
      currentState.captionsEnabled = enableCaptions.checked;
      sendStateUpdate();
    });
  }
  
  if (aiProactiveness) {
    aiProactiveness.addEventListener('change', () => {
      currentState.aiProactiveness = aiProactiveness.value;
      sendStateUpdate();
    });
  }
}

// Setup advanced settings event listeners
function setupAdvancedSettings() {
  const allParticipants = document.getElementById('all-participants') as HTMLInputElement;
  const suggestEmojis = document.getElementById('suggest-emojis') as HTMLInputElement;
  const suggestPersonal = document.getElementById('suggest-personal') as HTMLInputElement;
  const modelCapability = document.getElementById('model-capability') as HTMLSelectElement;
  
  const minWords = document.getElementById('min-words') as HTMLInputElement;
  const minWordsValue = document.getElementById('min-words-value') as HTMLSpanElement;
  
  const lastNSentences = document.getElementById('last-n-sentences') as HTMLInputElement;
  const lastNSentencesValue = document.getElementById('last-n-sentences-value') as HTMLSpanElement;
  
  const maxVisuals = document.getElementById('max-visuals') as HTMLInputElement;
  const maxVisualsValue = document.getElementById('max-visuals-value') as HTMLSpanElement;
  
  const maxEmojis = document.getElementById('max-emojis') as HTMLInputElement;
  const maxEmojisValue = document.getElementById('max-emojis-value') as HTMLSpanElement;
  
  const visualSize = document.getElementById('visual-size') as HTMLInputElement;
  const visualSizeValue = document.getElementById('visual-size-value') as HTMLSpanElement;
  
  // Checkbox event listeners
  if (allParticipants) {
    allParticipants.addEventListener('change', () => {
      currentState.allParticipants = allParticipants.checked;
      sendStateUpdate();
    });
  }
  
  if (suggestEmojis) {
    suggestEmojis.addEventListener('change', () => {
      currentState.suggestEmojis = suggestEmojis.checked;
      sendStateUpdate();
    });
  }
  
  if (suggestPersonal) {
    suggestPersonal.addEventListener('change', () => {
      currentState.suggestPersonal = suggestPersonal.checked;
      sendStateUpdate();
    });
  }
  
  // Dropdown event listeners
  if (modelCapability) {
    modelCapability.addEventListener('change', () => {
      currentState.modelCapability = modelCapability.value;
      sendStateUpdate();
    });
  }
  
  // Slider event listeners
  if (minWords && minWordsValue) {
    minWords.addEventListener('input', () => {
      currentState.minWords = parseInt(minWords.value);
      minWordsValue.textContent = minWords.value;
      sendStateUpdate();
    });
  }
  
  if (lastNSentences && lastNSentencesValue) {
    lastNSentences.addEventListener('input', () => {
      currentState.lastNSentences = parseInt(lastNSentences.value);
      lastNSentencesValue.textContent = lastNSentences.value;
      sendStateUpdate();
    });
  }
  
  if (maxVisuals && maxVisualsValue) {
    maxVisuals.addEventListener('input', () => {
      currentState.maxVisuals = parseInt(maxVisuals.value);
      maxVisualsValue.textContent = maxVisuals.value;
      sendStateUpdate();
    });
  }
  
  if (maxEmojis && maxEmojisValue) {
    maxEmojis.addEventListener('input', () => {
      currentState.maxEmojis = parseInt(maxEmojis.value);
      maxEmojisValue.textContent = maxEmojis.value;
      sendStateUpdate();
    });
  }
  
  if (visualSize && visualSizeValue) {
    visualSize.addEventListener('input', () => {
      currentState.visualSize = parseFloat(visualSize.value);
      visualSizeValue.textContent = visualSize.value;
      sendStateUpdate();
    });
  }
}

// Setup logging settings event listeners
function setupLoggingSettings() {
  const enableLogging = document.getElementById('enable-logging') as HTMLInputElement;
  const downloadLog = document.getElementById('download-log') as HTMLButtonElement;
  
  if (enableLogging) {
    enableLogging.addEventListener('change', () => {
      currentState.loggingEnabled = enableLogging.checked;
      sendStateUpdate();
    });
  }
  
  if (downloadLog) {
    downloadLog.addEventListener('click', () => {
      sendCommand('DOWNLOAD_LOG', {});
    });
  }
}

// Setup interactive image settings
function setupInteractiveImageSettings() {
  const imageUrl = document.getElementById('image-url') as HTMLInputElement;
  const imageName = document.getElementById('image-name') as HTMLInputElement;
  const applyImage = document.getElementById('apply-image') as HTMLButtonElement;
  
  // Add position and size controls
  const imageX = document.getElementById('image-x') as HTMLInputElement;
  const imageY = document.getElementById('image-y') as HTMLInputElement;
  const imageWidth = document.getElementById('image-width') as HTMLInputElement;
  const imageHeight = document.getElementById('image-height') as HTMLInputElement;
  
  // Value displays
  const imageXValue = document.getElementById('image-x-value') as HTMLSpanElement;
  const imageYValue = document.getElementById('image-y-value') as HTMLSpanElement;
  const imageWidthValue = document.getElementById('image-width-value') as HTMLSpanElement;
  const imageHeightValue = document.getElementById('image-height-value') as HTMLSpanElement;
  
  // Update value displays when sliders change
  if (imageX && imageXValue) {
    imageX.addEventListener('input', () => {
      imageXValue.textContent = imageX.value;
    });
  }
  
  if (imageY && imageYValue) {
    imageY.addEventListener('input', () => {
      imageYValue.textContent = imageY.value;
    });
  }
  
  if (imageWidth && imageWidthValue) {
    imageWidth.addEventListener('input', () => {
      imageWidthValue.textContent = imageWidth.value;
    });
  }
  
  if (imageHeight && imageHeightValue) {
    imageHeight.addEventListener('input', () => {
      imageHeightValue.textContent = imageHeight.value;
    });
  }
  
  if (applyImage && imageUrl) {
    applyImage.addEventListener('click', () => {
      if (imageUrl.value) {
        // Default values if sliders don't exist
        const x = imageX ? parseFloat(imageX.value) : 0.1;
        const y = imageY ? parseFloat(imageY.value) : 0.1;
        const width = imageWidth ? parseFloat(imageWidth.value) : 0.3;
        const height = imageHeight ? parseFloat(imageHeight.value) : 0.3;
        
        currentState.interactiveImage = {
          url: imageUrl.value,
          name: imageName ? imageName.value || 'Image' : 'Image'
        };
        
        sendCommand('SET_IMAGE', {
          url: imageUrl.value,
          name: imageName ? imageName.value || 'Image' : 'Image',
          x: x,
          y: y,
          width: width,
          height: height
        });
      }
    });
  }
}

function toggleInteractiveImageSection(show: boolean) {
  const section = document.getElementById('interactive-image-section');
  if (section) {
    section.style.display = show ? 'block' : 'none';
  }
}

// Send state update to content script
function sendStateUpdate() {
  chrome.runtime.sendMessage({
    type: 'SIDE_PANEL_TO_CONTENT',
    command: 'UPDATE_STATE',
    data: currentState
  });
  
  updateStatusDisplay();
}

// Send specific command to content script
function sendCommand(command: string, data: any) {
  chrome.runtime.sendMessage({
    type: 'SIDE_PANEL_TO_CONTENT',
    command: command,
    data: data
  });
}

// Update status display
function updateStatusDisplay() {
  const statusDisplay = document.getElementById('status-display');
  if (statusDisplay) {
    statusDisplay.textContent = `Scene: ${currentState.currentScene || 'None'} | Captions: ${currentState.captionsEnabled ? 'On' : 'Off'}`;
  }
}

// Update UI based on current state
function updateUI(state: ARChatState) {
  // Update the state object
  currentState = {...currentState, ...state};
  
  // Update scene selector
  const sceneSelector = document.getElementById('scene-selector') as HTMLSelectElement;
  if (sceneSelector && state.currentScene) {
    sceneSelector.value = state.currentScene;
    
    // Show/hide Interactive Image settings if appropriate
    toggleInteractiveImageSection(state.currentScene === 'InteractiveImage');
  }
  
  // Update caption settings
  const enableCaptions = document.getElementById('enable-captions') as HTMLInputElement;
  const aiProactiveness = document.getElementById('ai-proactiveness') as HTMLSelectElement;
  
  if (enableCaptions && state.captionsEnabled !== undefined) {
    enableCaptions.checked = state.captionsEnabled;
  }
  
  if (aiProactiveness && state.aiProactiveness) {
    aiProactiveness.value = state.aiProactiveness;
  }
  
  
  // Update advanced settings
  const allParticipants = document.getElementById('all-participants') as HTMLInputElement;
  const suggestEmojis = document.getElementById('suggest-emojis') as HTMLInputElement;
  const suggestPersonal = document.getElementById('suggest-personal') as HTMLInputElement;
  const modelCapability = document.getElementById('model-capability') as HTMLSelectElement;
  
  if (allParticipants && state.allParticipants !== undefined) {
    allParticipants.checked = state.allParticipants;
  }
  
  if (suggestEmojis && state.suggestEmojis !== undefined) {
    suggestEmojis.checked = state.suggestEmojis;
  }
  
  if (suggestPersonal && state.suggestPersonal !== undefined) {
    suggestPersonal.checked = state.suggestPersonal;
  }
  
  if (modelCapability && state.modelCapability) {
    modelCapability.value = state.modelCapability;
  }
  
  // Update slider values
  updateSlider('min-words', 'min-words-value', state.minWords);
  updateSlider('last-n-sentences', 'last-n-sentences-value', state.lastNSentences);
  updateSlider('max-visuals', 'max-visuals-value', state.maxVisuals);
  updateSlider('max-emojis', 'max-emojis-value', state.maxEmojis);
  updateSlider('visual-size', 'visual-size-value', state.visualSize);
  
  // Update logging settings
  const enableLogging = document.getElementById('enable-logging') as HTMLInputElement;
  if (enableLogging && state.loggingEnabled !== undefined) {
    enableLogging.checked = state.loggingEnabled;
  }
  
  // Update status display
  updateStatusDisplay();
}

// Helper to update slider and its value display
function updateSlider(sliderId: string, valueId: string, value: number | undefined) {
  if (value !== undefined) {
    const slider = document.getElementById(sliderId) as HTMLInputElement;
    const valueDisplay = document.getElementById(valueId) as HTMLSpanElement;
    
    if (slider && valueDisplay) {
      slider.value = value.toString();
      valueDisplay.textContent = value.toString();
    }
  }
}

// Listen for updates from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'CONTENT_TO_SIDE_PANEL') {
    updateUI(message.state);
  }
});