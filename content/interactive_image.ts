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
import {bingApiKey, gpt3ApiKey} from '../api_keys';

(async () => {
  console.log('VC - check start interactive_image.js');

  // One in a while this part will break and you will have to update it.
  const gMeetControllerName = 'D1tHje';

  // finetuned models
  const MODELS = {
    davinci: 'davinci:ft-personal-2022-08-10-08-50-23',
    curie: 'curie:ft-personal-2022-08-10-09-30-02',
    ada: 'ada:ft-personal-2022-08-10-16-42-21',
  };

  interface LogEntry {
    type: string;
    message: Record<string, string>;
    timestamp: string;
  }


  let candidateImageWidgets: EntityImageWidget[] = [];
  let candidateEmojiWidgets: EntityImageWidget[] = [];
  let spotlightImageWidgets: EntityImageWidget[] = [];
  let lastText = '';

  const stopwords = [
    'i',          'me',        'my',      'myself', 'we',         'our',
    'ours',       'ourselves', 'you',     'your',   'yours',      'yourself',
    'yourselves', 'he',        'him',     'his',    'himself',    'she',
    'her',        'hers',      'herself', 'it',     'its',        'itself',
    'they',       'them',      'their',   'theirs', 'themselves', 'what',
    'which',      'who',       'whom',    'this',   'that',       'these',
    'those',      'am',        'is',      'are',    'was',        'were',
    'be',         'been',      'being',   'have',   'has',        'had',
    'having',     'do',        'does',    'did',    'doing',      'a',
    'an',         'the',       'and',     'but',    'if',         'or',
    'because',    'as',        'until',   'while',  'of',         'at',
    'by',         'for',       'with',    'about',  'against',    'between',
    'into',       'through',   'during',  'before', 'after',      'above',
    'below',      'to',        'from',    'up',     'down',       'in',
    'out',        'on',        'off',     'over',   'under',      'again',
    'further',    'then',      'once',    'here',   'there',      'when',
    'where',      'why',       'how',     'all',    'any',        'both',
    'each',       'few',       'more',    'most',   'other',      'some',
    'such',       'no',        'nor',     'not',    'only',       'own',
    'same',       'so',        'than',    'too',    'very',       's',
    't',          'can',       'will',    'just',   'don',        'should',
    'now',        'well'
  ];
  const visualTypes = [
    'picture',    'pic',          'photo',
    'image',      '3d',           'model',
    'symbol',     'emoji',        'clip art',
    'drawing',    'gif',          'animat',
    'video',      'effect',       'none',
    'poster',     'scene',        'visual representation',
    'screenshot', 'illustration', 'note',
    'painting',   'list',         'cover',
    'selfie',     'sticker',      'map'
  ];

  ///////////////////////////////////////////////////////////////////////////////
  // OPTIONS
  ///////////////////////////////////////////////////////////////////////////////

  // options class
  class Options {
    enabled = false;
    proactiveness: string;
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
      chrome.storage.local.get(['interactiveImageOptions'], (response) => {
        let interactiveImageOptions = response.interactiveImageOptions;
        this.enabled = interactiveImageOptions.enableButton;
        this.proactiveness = interactiveImageOptions.proactiveness;
        this.enableAllCaptions = interactiveImageOptions.enableAllCaptions;
        this.enableEmoji = interactiveImageOptions.enableEmoji;
        this.enablePersonal = interactiveImageOptions.enablePersonal;
        this.model = interactiveImageOptions.model;
        this.visualSize = interactiveImageOptions.visualSize;
        this.visualWidth = 12 * this.visualSize;
        this.visualHeight = 8 * this.visualSize;
        this.emojiWidth = 3 * this.visualSize;
        this.numVisuals = interactiveImageOptions.numVisuals;
        this.lastNSentences = interactiveImageOptions.lastNSentences;
        this.numEmojis = interactiveImageOptions.numEmojis;
        this.numWords = interactiveImageOptions.numWords;
        this.enableLogging = interactiveImageOptions.enableLogging;
        // console.log("DEBUG - options", this);
      });
    }
  }

  const options = new Options();


  // Data logging
  class Logging {
    logging: LogEntry[] = [];

    // type, message, timestamp
    // visual suggested, {visual, source, imgUrl}, timestamp
    // visual selected
    // visual removed

    // log data
    log(type: string, message: Record<string, string>) {
      if (options.enableLogging) return;
      const timestamp = new Date().toISOString();
      const logEntry = {
        type,
        message,
        timestamp,
      };
      console.log('Logging', logEntry);
      this.logging.push(logEntry);
      chrome.storage.local.set({interactiveImageLogging: this.logging});
    }
  }

  const logging = new Logging();

  ///////////////////////////////////////////////////////////////////////////////
  // LANGUAGE MODELS
  ///////////////////////////////////////////////////////////////////////////////

  // GPT-3
  async function getGpt3RawResult(
      text: string, prompt_prefix: string, prompt_suffix: string) {
    if (text.length == 0) {
      return
    }
    const prompt = prompt_prefix + text + prompt_suffix
    const messages = await callGPT3(prompt);
    let result = messages.choices[0].text;
    return result;
  }

  async function callGPT3(prompt: string) {
    const modelType = options.model;

    const data = {
      'prompt': prompt,
      'max_tokens': 64,
      'temperature': 0.0,
      'frequency_penalty': 0.5,
      'stop': ['\n'],
      'model': MODELS[modelType]
    }

    const response = await fetch(
        // "https://api.openai.com/v1/engines/" + model_davinci +
        // "/completions",
        'https://api.openai.com/v1/completions', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + gpt3ApiKey
          },
          method: 'POST',
          body: JSON.stringify(data),
        });
    const result = await response.json();
    return result;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Visual retrieval
  //////////////////////////////////////////////////////////////////////////////
  async function getBingSearchThumbnail(searchTerm: string) {
    const query = encodeURI(searchTerm);
    const url = `https://api.bing.microsoft.com/v7.0/images/search?q=${
        query}&mkt=en-us&safeSearch=moderate&count=1&offset=0`;
    const response = await fetch(url, {
                       headers: {'Ocp-Apim-Subscription-Key': bingApiKey},
                       method: 'GET',
                     }).catch(e => {console.log(e)});
    if (!response) return '';
    const result = await response.json();
    // if not defined
    if (result.value == undefined) {
      return '';
    }
    if (searchTerm.toLowerCase().includes('emoji')) {
      return result.value.map((val: {thumbnailUrl: string}) => val.thumbnailUrl)
                 .shift() +
          options.bingEmojiRatio + '&c=7';
    }
    return result.value.map((val: {thumbnailUrl: string}) => val.thumbnailUrl)
               .shift() +
        options.bingImageRatio + '&c=7';
  }


  //////////////////////////////////////////////////////////////////////////////
  // Process text: input text, return a list of entity objects
  //////////////////////////////////////////////////////////////////////////////
  async function processText(text: string) {
    const entities: Entity[] = [];
    console.log('VC - processText', text);
    // call llm
    // let prompt_prefix = PROMT;
    // let prompt_suffix = "\nVisuals:";
    // call gpt3 finetuned
    let prompt_prefix = '';
    let prompt_suffix = ' ->';
    // result = await getLamdaRawResult(text, prompt_prefix, prompt_suffix);
    let result = await getGpt3RawResult(text, prompt_prefix, prompt_suffix);
    // result = callLamdaFromBg(text, prompt_prefix, prompt_suffix);

    if (result == undefined) {
      return [];
    }
    // clean
    result = result.trim();
    result = result.split('\n')[0];

    if (result.length == 0 || result.toLowerCase().includes('none') ||
        result.toLowerCase().includes('>')) {
      return [];
    }
    console.log('VC llm result -', result);

    // query multiple images
    let names = result.split(';');
    for (let i = 0; i < names.length; i++) {
      // split by "from"
      if (!names[i].toLowerCase().includes('from')) {
        continue;
      }
      let name = names[i].split('from')[0].trim();
      let source = names[i].split('from')[1].trim();
      // TEMP if name include "emoji"
      if (!name.includes('emoji') && !name.includes('map')) {
        // get the index of the first "of"
        let index = name.indexOf('of');
        // get the remaining
        name = name.substring(index + 2);
      }
      const imgUrl = await getBingSearchThumbnail(name);
      if (imgUrl.length == 0) {
        continue;
      }
      await addEntity(name, source, imgUrl, entities);
    }
    console.log('VC entities -', entities);
    return entities;
  }


  //////////////////////////////////////////////////////////////////////////////
  // Entity Object
  //////////////////////////////////////////////////////////////////////////////
  interface Entity {
    name: string;
    source: string;
    img: HTMLImageElement;
    imgUrl: string;
  }

  async function addEntity(
      name: string, source: string, imgUrl: string, entities: Entity[]) {
    return new Promise<void>(resolve => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        console.log('VC - image loaded');
        // add to list
        entities.push({img, imgUrl, name, source});
        resolve();
      } img.src = imgUrl;
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  // Image Widget Object
  //////////////////////////////////////////////////////////////////////////////
  const ROOT_CLASS = 'archat-image-widget';
  class EntityImageWidget {
    imageContainer: HTMLElement;
    accepted = false;

    left: number;
    top: number;
    width: number;
    height: number;

    constructor(
        public container: HTMLElement, public entity: Entity,
        private index: number, private isEmoji: boolean) {
      // // Right and Top values in percents to support scaling.
      // this.height = VISUAL_HEIGHT;
      // // get width according to height
      if (this.isEmoji) {
        this.width = options.emojiWidth;
        this.left = options.emojiLeft +
            this.index * (options.emojiLeftInterval + options.emojiWidth);
        this.height = options.emojiHeight;
        this.top = options.emojiTop;
      } else {
        this.width = options.visualWidth;    // %
        this.left = options.visualLeft;      // %
        this.height = options.visualHeight;  // %
        this.top = options.visualTopInterval +
            this.index * (4 * options.visualTopInterval + this.height);  // %
        // this.top = options.visualTopInterval; // %
      }

      this.injectMaterialIconsFont();
      this.injectStyles();
    }

    injectMaterialIconsFont() {
      const FONT_ID = 'material-icons-font';
      if (document.getElementById(FONT_ID)) return;
      const font = document.createElement('link');
      font.setAttribute('id', FONT_ID);
      font.setAttribute(
          'href', 'https://fonts.googleapis.com/icon?family=Material+Icons');
      font.setAttribute('rel', 'stylesheet');
      document.body.appendChild(font);
    }

    injectStyles() {
      const STYLES_ID = 'archat-image-widget';
      if (document.getElementById(STYLES_ID)) return;
      const stylesheet = document.createElement('style');
      stylesheet.setAttribute('id', STYLES_ID);
      stylesheet.textContent = `
        .${ROOT_CLASS} {
          position: absolute;
          line-height: 0;
          cursor: pointer;
          z-index: 10000;
        }

        .${ROOT_CLASS} .resizable {
          resize: horizontal;
          overflow: hidden;
          max-height: 100%;
          min-width: 10%;
          max-width: 30%;
        }

        .${ROOT_CLASS} > .image-wrapper {
          width: 100%;
          position: relative;
        }

        .${ROOT_CLASS} > .image-wrapper > img {
          width: 100%;
          pointer-events: none;
          border-radius: 5px;
          box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
          opacity: 0.5;
        }

        .${ROOT_CLASS} .close-icon {
          position: absolute;
          top: 2%;
          right: 2%;
          display: none !important;
          color: white;
          cursor: pointer;
        }

        .${ROOT_CLASS}:hover .close-icon {
          display: inline-block !important;
        }

        .${ROOT_CLASS}:hover .close-icon:hover {
          font-size: 28px;
          top: 1.5%;
          right: 1.5%;
        }

        .${ROOT_CLASS} .material-icons {
          font-family: 'Material Icons';

          font-weight: normal;
          font-style: normal;
          font-size: 24px;  /* Preferred icon size */
          display: inline-block;
          line-height: 1;
          text-transform: none;
          letter-spacing: normal;
          word-wrap: normal;
          white-space: nowrap;
          direction: ltr;

          /* Support for all WebKit browsers. */
          -webkit-font-smoothing: antialiased;
          /* Support for Safari and Chrome. */
          text-rendering: optimizeLegibility;
        }
        .${ROOT_CLASS} .source {
          color: white;
          position: absolute;
          top: 0px;
          left: 0px;
          font-size: 18px;
          line-height: 1;
          background-color: rgba(0, 0, 0, 0.4);
          padding: 5px;
        }

        .${ROOT_CLASS} .title {
          color: white;
          position: absolute;
          bottom: 0px;
          left: 0px;
          font-size: 18px;
          line-height: 1;
          background-color: rgba(0, 0, 0, 0.4);
          padding: 5px;
        }
      `;


      document.body.appendChild(stylesheet);
    }

    enableMoving() {
      // console.log("DEBUG - enableMoving");
      if (!this.imageContainer) {
        // console.log("DEBUG - enableMoving - no imageContainer");
        return;
      }
      let isMoving = false;
      this.imageContainer.addEventListener('mousedown', () => {
        // console.log("DEBUG - enableMoving - mousedown");
        isMoving = true;
        this.imageContainer.style.boxShadow = '0px 0px 20px green';
      });
      this.imageContainer.addEventListener('mouseup', () => {
        if (!isMoving) return;
        this.imageContainer.style.boxShadow = 'unset';
        // this.sendImageToBackground();
        sendImagesToBackground();
        isMoving = false;
      });
      this.imageContainer.addEventListener('mouseleave', () => {
        if (!isMoving) return;
        this.imageContainer.style.boxShadow = 'unset';
        // this.sendImageToBackground();
        sendImagesToBackground();
        isMoving = false;
      });
      this.imageContainer.addEventListener('mousemove', (event) => {
        if (!isMoving) return;
        const dx = event.movementX / this.container.clientWidth * 100;
        const dy = event.movementY / this.container.clientHeight * 100;

        this.left += dx;
        this.top += dy;

        const width =
            this.imageContainer.clientWidth / this.container.clientWidth * 100;
        const height = this.imageContainer.clientHeight /
            this.container.clientHeight * 100;

        this.left = Math.max(0, Math.min(this.left, 100 - width));
        this.top = Math.max(0, Math.min(this.top, 100 - height));

        this.imageContainer.style.left = `${this.left}%`;
        this.imageContainer.style.top = `${this.top}%`;
      });
    }

    enableResizing() {
      // console.log("DEBUG - enableResizing");
      if (!this.imageContainer) return;
      this.imageContainer.classList.add('resizable');

      new ResizeObserver(() => {
        this.width =
            this.imageContainer.clientWidth / this.container.clientWidth * 100;
        // this.sendImageToBackground();
        sendImagesToBackground();
      }).observe(this.imageContainer);
    }

    createBasicLayout() {
      if (this.imageContainer) return;
    }

    moveUp =
        () => {
          if (this.accepted) return;

          if (this.isEmoji) {
            this.index = Math.max(0, this.index - 1);
            const width = options.emojiWidth;
            this.left -= (width + options.emojiLeftInterval);
            this.imageContainer.style.left = `${this.left}%`;
            // this.sendImageToBackground();
            sendImagesToBackground();
          } else {
            this.index = Math.max(0, this.index - 1);
            const height = options.visualHeight;  // %
            this.top -= (height + 4 * options.visualTopInterval);
            this.imageContainer.style.top = `${this.top}%`;
            // this.sendImageToBackground();
            sendImagesToBackground();
          }
        }

    // move all other images after this one up
    moveUpOthers =
        () => {
          if (this.accepted) return;
          if (this.isEmoji) {
            for (let i = this.index + 1; i < candidateEmojiWidgets.length;
                 i++) {
              candidateEmojiWidgets[i].moveUp();
            }
          } else {
            for (let i = this.index + 1; i < candidateImageWidgets.length;
                 i++) {
              candidateImageWidgets[i].moveUp();
            }
          }
        }

    moveToSpotlight =
        () => {
          if (this.accepted) {
            return;
          }

          // TEMP: clear all other images
          for (let i = 0; i < spotlightImageWidgets.length; i++) {
            spotlightImageWidgets[i].resetUI();
          }

          // add to spotlightImageWidgets
          spotlightImageWidgets.push(this);
          // remove from candidateImageWidgets or candidateEmojiWidgets
          if (this.isEmoji) {
            this.addCloseIcon();
            candidateEmojiWidgets.splice(this.index, 1);
          } else {
            candidateImageWidgets.splice(this.index, 1);
          }
          this.index = spotlightImageWidgets.length - 1;
          this.width = this.isEmoji ? options.spotlightEmojiWidth :
                                      options.spotlightImageWidth;
          this.left = options.spotlightLeft;
          this.top = options.spotlightTop;
          this.imageContainer.style.width = `${this.width}%`;
          this.imageContainer.style.left = `${this.left}%`;
          this.imageContainer.style.top = `${this.top}%`;

          sendImagesToBackground();
        }


    resetUI =
        () => {
          // log data
          logging.log('visual removed', {
            visual: this.entity.name,
            source: this.entity.source,
            imgUrl: this.entity.imgUrl,
            speech: lastText,
          });
          // remove this from either candidateImageWidgets or
          // spotlightImageWidgets or candidateEmojiWidgets
          if (this.accepted) {
            for (let i = this.index + 1; i < spotlightImageWidgets.length;
                 i++) {
              spotlightImageWidgets[i].index =
                  Math.max(0, spotlightImageWidgets[i].index - 1);
            }
            spotlightImageWidgets.splice(this.index, 1);
          } else {
            if (this.isEmoji) {
              this.moveUpOthers();
              candidateEmojiWidgets.splice(this.index, 1);
            } else {
              this.moveUpOthers();
              candidateImageWidgets.splice(this.index, 1);
            }
          }

          this.imageContainer?.remove();
          this.imageContainer = undefined;
          this.entity = undefined;
          window.postMessage(
              {
                type: 'SET_IMAGE',
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                url: null,
                outgoing: true,
              },
              '*');
        }

    blockEvent =
        (event: Event) => {
          event.preventDefault();
          event.stopPropagation();
        }

    addCloseIcon() {
      const closeIcon = document.createElement('span');
      closeIcon.classList.add('material-icons');
      closeIcon.classList.add('close-icon');
      closeIcon.textContent = 'close';
      closeIcon.addEventListener('mousedown', this.blockEvent);
      closeIcon.addEventListener('click', this.resetUI);
      this.imageContainer.appendChild(closeIcon);
    }

    async createHtmlElement() {
      console.log('VC - Create suggestion');

      this.imageContainer = document.createElement('div');
      this.imageContainer.classList.add(ROOT_CLASS);
      this.imageContainer.style.transition = 'all 0.5s ease-in-out ';
      if (options.proactiveness === 'Automatic') {
        this.imageContainer.style.transition = 'all 0.0s ease-in-out ';
      }
      this.imageContainer.style.width = `${this.width}%`;
      this.imageContainer.style.left = `${this.left}%`;
      this.imageContainer.style.top = `${this.top}%`;

      const imageWrapper = document.createElement('div');
      imageWrapper.classList.add('image-wrapper');
      imageWrapper.appendChild(this.entity.img);


      const sourceSpan = document.createElement('span');
      sourceSpan.classList.add('source');
      const sourceName = this.entity.source;

      if (sourceName.toLowerCase() == 'online search') {
        sourceSpan.textContent = 'Search';
      } else if (sourceName.toLowerCase() == 'personal album') {
        sourceSpan.textContent = 'Personal';
      } else if (sourceName.toLowerCase() == 'emoji search') {
        sourceSpan.textContent = 'Emoji';
      }
      imageWrapper.appendChild(sourceSpan);

      const titleSpan = document.createElement('span');
      titleSpan.classList.add('title');
      // remove the text before "of"
      const titleName = this.entity.name
      titleSpan.textContent = titleName;
      imageWrapper.appendChild(titleSpan);


      // click to show
      imageWrapper.addEventListener('mousedown', this.blockEvent);

      function showImage() {
        // console.log("DEBUG - click on image!!!");
        if (!this.accepted) {
          // console.log("DEBUG - click to show", this);
          // remove event listener
          let imageWrapper =
              this.imageContainer.querySelector('.image-wrapper');
          // console.log("DEBUG - click to show - imageWrapper", imageWrapper);
          imageWrapper.removeEventListener('mousedown', this.blockEvent);
          imageWrapper.removeEventListener('click', showImage);
          this.moveUpOthers();
          this.moveToSpotlight();
          this.enableMoving();
          this.enableResizing();
          this.accepted = true;

          // log data
          logging.log('visual selected', {
            visual: this.entity.name,
            source: this.entity.source,
            imgUrl: this.entity.imgUrl,
            speech: lastText,
          });

          // wait for 0.1s
          setTimeout(() => {
            this.imageContainer.style.transition = 'all 0.0s ease-in-out';
            sendImagesToBackground();
          }, 100);
        }
      }

      imageWrapper.addEventListener('click', showImage.bind(this));
      this.imageContainer.appendChild(imageWrapper);

      if (this.isEmoji) {
        sourceSpan.style.display = 'none';
        titleSpan.style.display = 'none';
        // hover to only change opacity
        this.imageContainer.addEventListener('mouseover', () => {
          this.imageContainer.querySelector('img').style.opacity = '1';
        });
        this.imageContainer.addEventListener('mouseout', () => {
          this.imageContainer.querySelector('img').style.opacity = '0.5';
        });
      }

      else {
        this.addCloseIcon();
        // hover to show title div
        this.imageContainer.addEventListener('mouseover', () => {
          // sourceSpan.style.display = 'block';
          // titleSpan.style.display = 'block';
          this.imageContainer.querySelector('img').style.opacity = '1';
        });
        this.imageContainer.addEventListener('mouseout', () => {
          // sourceSpan.style.display = 'none';
          // titleSpan.style.display = 'none';
          this.imageContainer.querySelector('img').style.opacity = '0.5';
        });
      }

      this.container.appendChild(this.imageContainer);
      sendImagesToBackground();

      // directly show image if proactiveness level is set to automatic
      if (options.proactiveness === 'Automatic') {
        showImage.call(this);
      }
    }
  }

  function sendImagesToBackground() {
    if (spotlightImageWidgets.length === 0) {
      return;
    }
    const imageWidget = spotlightImageWidgets[spotlightImageWidgets.length - 1];

    if (!imageWidget.accepted) return;
    let parentWidth = imageWidget.container.clientWidth;
    let parentHeight = imageWidget.container.clientHeight;
    let x = imageWidget.imageContainer.offsetLeft / parentWidth;
    let y = imageWidget.imageContainer.offsetTop / parentHeight;
    let width = imageWidget.imageContainer.clientWidth / parentWidth;
    let height = imageWidget.imageContainer.clientHeight / parentHeight;

    window.postMessage(
        {
          type: 'SET_IMAGE',
          x,
          y,
          width,
          height,
          url: imageWidget.entity.img.src,
          name: imageWidget.entity.name,
          outgoing: true,
        },
        '*');
  }

  function getName(video: HTMLVideoElement) {
    const parent =
        video.parentElement.parentElement.parentElement.parentElement;
    const nameDiv = parent.querySelector('[data-self-name]');
    if (nameDiv) {
      return nameDiv.textContent;
    }
    return '';
  }

  function createWidget(entity: Entity, isEmoji: boolean) {
    const videos = document.querySelectorAll('video');
    const video =
        Array.from(videos).find((video) => getName(video).includes('You'));
    const container = video.parentElement;

    if (isEmoji) {
      console.log('VC - Create emoji widget');
      const index = candidateEmojiWidgets.length;
      return new EntityImageWidget(container, entity, index, isEmoji);
    } else {
      console.log('VC - Create image widget');
      const index = candidateImageWidgets.length;
      return new EntityImageWidget(container, entity, index, isEmoji);
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // MAIN
  //////////////////////////////////////////////////////////////////////////////
  let fetchCaptionsHandle: number|NodeJS.Timeout;
  async function fetchGoogleMeetCaptions() {
    // REPEAT
    options.update();
    if (!options.enabled) {
      console.log('VC - Disabled');
      fetchCaptionsHandle =
          setTimeout(fetchGoogleMeetCaptions, options.updateInterval);
      return;
    }


    console.log('VC - fetchGoogleMeetCaptions');
    let captions = '';
    let selfCaptions = '';
    let allCaptions = '';

    const gMeetCaptionsView =
        document.querySelector(`div[jscontroller="${gMeetControllerName}"]`);

    if (gMeetCaptionsView) {
      const divs = document.querySelectorAll('div[class="TBMuR bj4p3b"]');
      for (const div of divs) {
        let name = div.querySelector('div[class="Mz6pEf wY1pdd"]').textContent;
        let wordSpans = Array.from(div.querySelectorAll('span'));
        captions += name + ': ';
        const sentence =
            wordSpans.map(span => span.textContent.trim()).join(' ');
        if (name === 'You' || name === 'Your Presentation') {
          selfCaptions += sentence;
          // console.log("DEBUG - selfCaptions", selfCaptions);
        }
        captions += sentence + '\n';
        allCaptions += sentence;
      }
    }


    let chosenCaptions = selfCaptions;
    if (options.enableAllCaptions) {
      chosenCaptions = allCaptions;
    }

    // GENERATE VISUALS FROM CAPTIONS
    if (chosenCaptions) {
      async function generateVisuals(chosenCaptions: string) {
        // get the last sentence
        let sentences =
            chosenCaptions.match(/[^.?!]+[.!?]+[\])'"`’”]*|.+/g);
        let text = '';
        let lastSentence = sentences[sentences.length - 1];
        let prevSentences = (sentences.slice(
                                 sentences.length - options.lastNSentences,
                                 sentences.length - 1))
                                .join(' ');
        // if current text ends with punctuation
        // ?
        if (lastSentence.endsWith('.') || lastSentence.endsWith('?') ||
            lastSentence.endsWith('!')) {
          text = prevSentences + ' ' + lastSentence;
          text = text.trim();
        } else {
          if (lastSentence.split(' ').length > options.numWords) {
            text = prevSentences + ' ' + lastSentence;
            text = text.trim();
          } else if (sentences.length > 1) {
            text = prevSentences;
            text = text.trim();
          }
        }
        console.log('VC - text', text);

        // don't send text - same as last text
        if (text == lastText) {
          console.log('VC - same text, don\'t send');
        }

        else {
          lastText = text;
          let entityList = await processText(text);
          for (let i = 0; i < entityList.length; i++) {
            const entity = entityList[i];
            // if already displayed, in the queue
            let allImageWidgets =
                candidateImageWidgets.concat(spotlightImageWidgets);
            allImageWidgets = allImageWidgets.concat(candidateEmojiWidgets);
            if (entityAlreadyDisplayed(entity, allImageWidgets)) {
              continue;
            }

            // log data
            logging.log('visual created', {
              visual: entity.name,
              source: entity.source,
              imgUrl: entity.imgUrl,
              speech: lastText,
            });

            // if EMOJI
            if (entity.source.toLowerCase().includes('emoji')) {
              if (options.enableEmoji) {
                if (candidateEmojiWidgets.length + 1 > options.numEmojis) {
                  // remove the oldest image widget
                  candidateEmojiWidgets[0].resetUI();
                }

                const isEmoji = true;
                const widget = createWidget(entity, isEmoji);
                candidateEmojiWidgets.push(widget);
                widget.createHtmlElement().catch(console.error);
              } else {
                console.log('VC - Emoji disabled');
              }
            }

            // if PERSONAL
            else if (entity.source.toLowerCase().includes('personal')) {
              if (options.enablePersonal) {
                if (candidateImageWidgets.length + 1 > options.numVisuals) {
                  // remove the oldest image widget
                  candidateImageWidgets[0].resetUI();
                }

                const isEmoji = false;
                const widget = createWidget(entity, isEmoji);
                candidateImageWidgets.push(widget);
                widget.createHtmlElement().catch(console.error);
              } else {
                console.log('VC - Personal disabled');
              }
            }

            // if not emoji or personal
            else {
              if (candidateImageWidgets.length + 1 > options.numVisuals) {
                // remove the oldest image widget
                candidateImageWidgets[0].resetUI();
              }

              const isEmoji = false;
              const widget = createWidget(entity, isEmoji);
              candidateImageWidgets.push(widget);
              widget.createHtmlElement().catch(console.error);
            }
          }
        }
      }

      // check AI proactiveness
      if (options.proactiveness === 'Suggestion' || options.onTapQuerying) {
        generateVisuals(chosenCaptions);
      }

      else if (options.proactiveness === 'Automatic') {
        console.log('VC - Automatic');
        generateVisuals(chosenCaptions);
      }

      else if (options.proactiveness === 'OnTap') {
        // tap spacebar to generate visuals
        document.body.onkeyup = function(e) {
          if (e.key == ' ' || e.code == 'Space' || e.keyCode == 32) {
            console.log('VC - space pressed, OnTap');
            options.onTapQuerying = true;
            setTimeout(() => {
              options.onTapQuerying = false;
            }, 3000);
          }
        }
      }
    }
    fetchCaptionsHandle =
        setTimeout(fetchGoogleMeetCaptions, options.updateInterval);
  }

  window.addEventListener('message', (event) => {
    const message = event.data;

    if (message.type !== 'CURRENT_SCENE') return;
    if (message.scene === 'Interactive Images (beta)') {
      // addBootstrap();
      // addOptions();

      // LOAD OPTIONS
      options.update();

      if (!fetchCaptionsHandle) {
        fetchCaptionsHandle = setTimeout(fetchGoogleMeetCaptions, 0);
      }
    } else {
      clearTimeout(fetchCaptionsHandle);
      fetchCaptionsHandle = undefined;
      candidateImageWidgets.forEach(widget => widget.resetUI());
      candidateImageWidgets = [];
      candidateEmojiWidgets.forEach(widget => widget.resetUI());
      candidateEmojiWidgets = [];
      spotlightImageWidgets.forEach(widget => widget.resetUI());
      spotlightImageWidgets = [];
    }
  });

  window.postMessage(
      {
        type: 'GET_CURRENT_SCENE',
        outgoing: true,
      },
      '*');



  //////////////////////////////////////////////////////////////////////////////
  // HELPERS
  //////////////////////////////////////////////////////////////////////////////

  function entityAlreadyDisplayed(
      entity: Entity, all_image_widgets: EntityImageWidget[]) {
    // none case
    // console.log("DEBUG all widgets", all_image_widgets);
    for (const widget of all_image_widgets) {
      // console.log("DEBUG widget", widget);
      if (isSimilar(widget.entity.name, entity.name)) {
        return true;
      }
    }
    return false;
  }

  // Helper function to check similarity
  function isSimilar(sent1: string, sent2: string, threshold = 0.7) {
    // convert to lower case
    sent1 = sent1.toLowerCase();
    sent2 = sent2.toLowerCase();
    // remove punctuation
    sent1 = sent1.replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    sent2 = sent2.replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    // remove extra spaces
    sent1 = sent1.replace(/\s+/g, ' ');
    sent2 = sent2.replace(/\s+/g, ' ');
    // remove stopwords
    sent1 = removeStopwords(sent1);
    sent2 = removeStopwords(sent2);
    // remove visual types
    // sent1 = removeVisualTypes(sent1);
    // sent2 = removeVisualTypes(sent2);

    // console.log("Check similarity", sent1, sent2)
    // split into words
    let a_words = sent1.split(' ');
    let b_words = sent2.split(' ');
    let a_set = new Set(a_words);
    let b_set = new Set(b_words);
    let a_size = a_set.size;
    let b_size = b_set.size;
    let intersection = new Set([...a_set].filter(x => b_set.has(x)));
    let intersection_size = intersection.size;
    let union_size = a_size + b_size - intersection_size;
    let similarity = intersection_size / union_size;

    return similarity > threshold;
  }

  function removeStopwords(str: string) {
    const res: string[] = [] const words = str.split(' ')
    for (let i = 0; i < words.length; i++) {
      const word_clean = words[i].split('.').join('')
      if (!stopwords.includes(word_clean)) {
        res.push(word_clean)
      }
    }
    return (res.join(' '));
  }

  function removeVisualTypes(str: string) {
    const res = [] const words = str.split(' ')
    for (let i = 0; i < words.length; i++) {
      const word_clean = words[i].split('.').join('')
      if (!visualTypes.includes(word_clean)) {
        res.push(word_clean)
      }
    }
    return (res.join(' '));
  }
})();
