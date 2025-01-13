/**
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
import { getGeminiRawResult, getBingSearchThumbnail } from '../models/modelClient';
import { Options } from '../options/options';
import { Renderer } from '../background/renderer';

declare global {
  interface Window {
    renderer: Renderer;
  }
}

(async () => {
  console.log('VC - check start interactive_image.js');

  // One in a while this part will break and you will have to update it.
  const gMeetControllerName = 'D1tHje';

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

  const options = new Options();

  // Data logging
  class Logging {
    logging: LogEntry[] = [];

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
    }
  }

  const logging = new Logging();

  // //////////////////////////////////////////////////////////////////////////////
  // // Visual retrieval
  // //////////////////////////////////////////////////////////////////////////////
  // async function getBingSearchThumbnail(searchTerm: string) {
  //   const query = encodeURI(searchTerm);
  //   const url = `https://api.bing.microsoft.com/v7.0/images/search?q=${
  //       query}&mkt=en-us&safeSearch=moderate&count=1&offset=0`;
  //   const response = await fetch(url, {
  //                      headers: {'Ocp-Apim-Subscription-Key': bingApiKey},
  //                      method: 'GET',
  //                    }).catch(e => {console.log(e)});
  //   if (!response) return '';
  //   const result = await response.json();
  //   console.log('VC bin search result -', result);
  //   // if not defined
  //   if (result.value == undefined) {
  //     return '';
  //   }
  //   if (searchTerm.toLowerCase().includes('emoji')) {
  //     return result.value.map((val: {thumbnailUrl: string}) => val.thumbnailUrl)
  //                .shift() +
  //         options.bingEmojiRatio + '&c=7';
  //   }
  //   return result.value.map((val: {thumbnailUrl: string}) => val.thumbnailUrl)
  //              .shift() +
  //       options.bingImageRatio + '&c=7';
  // }

  //////////////////////////////////////////////////////////////////////////////
  // Process text: input text, return a list of entity objects
  //////////////////////////////////////////////////////////////////////////////
  async function processText(text: string): Promise<Entity[]> {
    console.log('VC - processText', text);
    
    if (!text.trim()) {
      console.warn('Empty text provided to processText');
      return [];
    }
  
    try {
      // let prompt_prefix = '';
      // let prompt_suffix = ' ->';
      // let result = await getGpt3RawResult(text, prompt_prefix, prompt_suffix);
      const result = await getGeminiRawResult(text);
      console.log('VC llm result -', result);
  
      if (!result) {
        console.warn('No result from Gemini');
        return [];
      }

      const entities: Entity[] = [];
      const names = result.split(';');
  
      await Promise.all(names.map(async (item) => {
        const [name, source] = parseNameAndSource(item);
        if (!name) return;
        console.log('VC current name, source pair: ', name, source);
  
        const imgUrl = await getBingSearchThumbnail(name, options);
        console.log('VC img url -', imgUrl);
        if (imgUrl) {
          await addEntity(name, source, imgUrl, entities);
        }
      }));
  
      console.log('VC: current entities -', entities);
      return entities;
    } catch (error) {
      console.error('Error in processText:', error);
      return [];
    }
  }
  
  function parseNameAndSource(item: string): [string | null, string | null] {
    const lowercaseItem = item.toLowerCase();
    if (!lowercaseItem.includes('from')) {
      return [null, null];
    }
  
    let [name, source] = item.split('from').map(s => s.trim());
  
    if (!name.includes('emoji') && !name.includes('map')) {
      const ofIndex = name.indexOf('of');
      if (ofIndex !== -1) {
        name = name.substring(ofIndex + 2).trim();
      }
    }
  
    return [name, source];
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
        if (entities.length >= 10) {
          // Remove the first item
          entities.shift();
        }
        entities.push({img, imgUrl, name, source});
        resolve();
      };
      img.src = imgUrl;
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
      // get width according to height
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
            sendImagesToBackground();
          } else {
            this.index = Math.max(0, this.index - 1);
            const height = options.visualHeight;  // %
            this.top -= (height + 4 * options.visualTopInterval);
            this.imageContainer.style.top = `${this.top}%`;
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
          console.log('Posting message');
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
          window.renderer.setImage(
            0,
            0,
            0,
            0,
            null,
            '',
          );
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

    window.renderer.setImage(
      x,
      y,
      width,
      height,
      imageWidget.entity.img.src,
      imageWidget.entity.name,
    );
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
    let video;
    if (videos.length === 1) {
      video = videos[0];
    } else {
      video = Array.from(videos).find((video) => getName(video).includes('You'));
    }
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
    options.update();
    if (!options.enabled) {
      console.log('VC - Disabled');
      return scheduleNextFetch();
    }
  
    console.log('VC - fetchGoogleMeetCaptions');
  
    const captions = fetchCaptionsFromDOM();
    if (!captions) return scheduleNextFetch();
  
    const chosenCaptions = options.enableAllCaptions ? captions.allCaptions : captions.selfCaptions;
    if (!chosenCaptions) return scheduleNextFetch();
  
    await processAndGenerateVisuals(chosenCaptions);
  
    return scheduleNextFetch();
  }
  
  function fetchCaptionsFromDOM() {
    const gMeetCaptionsView = document.querySelector(`div[jscontroller="${gMeetControllerName}"]`);
    if (!gMeetCaptionsView) return null;
  
    let selfCaptions = '';
    let allCaptions = '';
  
    const divs = document.querySelectorAll('div[class="TBMuR bj4p3b"]');
    for (const div of divs) {
      const name = div.querySelector('div[class="zs7s8d jxFHg"]').textContent;
      const sentence = Array.from(div.querySelectorAll('span'))
        .map(span => span.textContent.trim())
        .join(' ');
  
      if (name === 'You' || name === 'Your Presentation') {
        selfCaptions += sentence;
      }
      allCaptions += sentence;
    }
  
    return { selfCaptions, allCaptions };
  }
  
  async function processAndGenerateVisuals(captions: string) {
    const text = extractTextForProcessing(captions);
    if (text === lastText) {
      console.log('VC - same text will not generate new content: ', text);
      return;
    }
  
    lastText = text;
    const entityList = await processText(text);
    
    for (const entity of entityList) {
      if (entityAlreadyDisplayed(entity, getAllImageWidgets())) continue;
  
      logVisualCreation(entity, text);
      await createAndDisplayWidget(entity);
    }
  }

  function getAllImageWidgets() {
    return [
      ...candidateImageWidgets,
      ...spotlightImageWidgets,
      ...candidateEmojiWidgets
    ];
  }

  function logVisualCreation(entity: Entity, speech: string): void {
    logging.log('visual created', {
      visual: entity.name,
      source: entity.source,
      imgUrl: entity.imgUrl,
      speech: speech,
    });
  }
  
  function extractTextForProcessing(captions: string): string {
    const sentences = captions.match(/[^.?!]+[.!?]+[\])'"`'"]*|.+/g) || [];
    const lastSentence = sentences[sentences.length - 1] || '';
    const prevSentences = sentences.slice(-options.lastNSentences, -1).join(' ');
  
    if (lastSentence.endsWith('.') || lastSentence.endsWith('?') || lastSentence.endsWith('!')) {
      return `${prevSentences} ${lastSentence}`.trim();
    } else if (lastSentence.split(' ').length > options.numWords) {
      return `${prevSentences} ${lastSentence}`.trim();
    } else if (sentences.length > 1) {
      return prevSentences.trim();
    }
    return '';
  }
  
  async function createAndDisplayWidget(entity: Entity) {
    console.log('VC - generating new content from entity', entity);
    const isEmoji = entity.source.toLowerCase().includes('emoji');
    const isPersonal = entity.source.toLowerCase().includes('personal');
  
    if (isEmoji && !options.enableEmoji) {
      console.log('VC - Emoji disabled');
      return;
    }
  
    if (isPersonal && !options.enablePersonal) {
      console.log('VC - Personal disabled');
      return;
    }
  
    const widgetList = isEmoji ? candidateEmojiWidgets : candidateImageWidgets;
    const maxWidgets = isEmoji ? options.numEmojis : options.numVisuals;
  
    if (widgetList.length >= maxWidgets) {
      widgetList[0].resetUI();
      widgetList.shift();
    }
  
    const widget = createWidget(entity, isEmoji);
    widgetList.push(widget);
    await widget.createHtmlElement();
  }
  
  function scheduleNextFetch(): NodeJS.Timeout {
    return setTimeout(fetchGoogleMeetCaptions, options.updateInterval);
  }
  
  // Main execution
  if (options.proactiveness === 'OnTap') {
    document.body.onkeyup = handleSpacebarPress;
  }
  
  function handleSpacebarPress(e: KeyboardEvent) {
    if (e.key === ' ' || e.code === 'Space' || e.keyCode === 32) {
      console.log('VC - space pressed, OnTap');
      options.onTapQuerying = true;
      setTimeout(() => {
        options.onTapQuerying = false;
      }, 3000);
    }
  }

  function toggleEffect(enable: boolean) {
    if (enable) {
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
  }

  window.addEventListener('message', (event) => {
    const message = event.data;

  if (message.type !== 'CURRENT_SCENE') return;
    toggleEffect(message.scene === 'Interactive Images (beta)');
  });

  toggleEffect(true);

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
    const res: string[] = [];
    const words = str.split(' ')
    for (let i = 0; i < words.length; i++) {
      const word_clean = words[i].split('.').join('');
      if (!stopwords.includes(word_clean)) {
        res.push(word_clean);
      }
    }
    return (res.join(' '));
  }

  function removeVisualTypes(str: string) {
    const res = [];
    const words = str.split(' ');
    for (let i = 0; i < words.length; i++) {
      const word_clean = words[i].split('.').join('');
      if (!visualTypes.includes(word_clean)) {
        res.push(word_clean);
      }
    }
    return (res.join(' '));
  }
})();
