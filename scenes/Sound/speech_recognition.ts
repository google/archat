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
import {DEFAULT_INPUT_LANGUAGE} from './sound_options';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export class SpeechRecognition {
  recognition: any;
  text = '...';
  log = '';

  confidence = 0;
  isFinal = false;
  timeStamp = 0;
  isRunning = false;
  speechStarted = false;
  soundStarted = false;
  shouldRestart = true;

  startCallback: any;
  endCallback: any;
  resultCallback: any;
  speechStartCallback: any;
  speechEndCallback: any;

  json: any;
  result: any;

  speechStartedTime: number;

  constructor() {
    this.recognition = new window.webkitSpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = DEFAULT_INPUT_LANGUAGE;

    this.recognition.addEventListener('start', this.onStart);
    this.recognition.addEventListener('end', this.onEnd);
    this.recognition.addEventListener('error', this.onError);

    this.recognition.addEventListener('soundstart', this.onSoundStart);
    this.recognition.addEventListener('soundend', this.onSoundEnd);

    this.recognition.addEventListener('speechstart', this.onSpeechStart);
    this.recognition.addEventListener('speechend', this.onSpeechEnd);

    this.recognition.addEventListener('result', this.onResult);
  }

  setSourceLanguage(language: string) {
    if (language !== this.recognition.lang) {
      this.recognition.lang = language;
      this.restart();
    }
  }

  init() {
    this.confidence = 0;
    this.isFinal = false;
    this.timeStamp = 0;
    this.isRunning = false;
    this.speechStarted = false;
    this.soundStarted = false;
    this.shouldRestart = true;
    this.text = '...';
    this.log = '';
  }

  start() {
    this.init();
    this.recognition.start();

    // console.log('Started recognition');
  }

  stop() {
    // console.log('Stopping recognition in SpeechRecognition');
    this.shouldRestart = false;
    this.recognition.stop();
  }

  onStart =
      (e: any) => {
        this.p('onStart ');
        this.isRunning = true;

        if (this.startCallback != undefined) this.startCallback();
      }

  onEnd =
      () => {
        this.p('onEnd ');
        this.isRunning = false;

        if (this.endCallback != undefined) this.endCallback();

        if (this.shouldRestart) {
          // console.log('Ended recognition');
          this.start();
        }
      }

  onError =
      (e: any) => {
        this.p('onError ' + e.error);
        this.p('onerror ' + e.message);
      }

  onSoundStart =
      (e: any) => {
        this.p('onSoundStart ');
        this.soundStarted = true;
      }

  onSoundEnd =
      () => {
        this.p('onSoundEnd ');
        this.soundStarted = false;
      }

  onSpeechStart =
      (e: any) => {
        this.p('onSpeechStart ');
        this.speechStarted = true;
        this.speechStartedTime = performance.now();

        if (this.speechStartCallback != undefined) this.speechStartCallback(e);
      }

  onSpeechEnd =
      () => {
        this.p('onSpeechEnd ');
        this.speechStarted = false;

        if (this.speechEndCallback != undefined) this.speechEndCallback();
      }

  p(t: string) {
    // console.log(t);
    // this.log += t + ' ';
  }

  onResult = (e: any) => {
    if (!e) return;
    this.p('onResult ' + this.text);

    this.json = e;
    this.result = e.results[e.results.length - 1];
    this.isFinal = this.result.isFinal;

    if (this.isFinal) {
      this.text = this.result[0].transcript.trim();
      this.confidence = this.result[0].confidence;
    } else {
      this.text = '';
      this.confidence = 0;
      // Joins transcript.
      for (let r of e.results) {
        this.text += r[0].transcript;
        this.confidence += r[0].confidence;
      }
    }
    this.timeStamp = e.timeStamp;

    // Kills unresponsive transcription thread.
    if (this.isFinal && this.isRunning) {
      this.restart();
    }

    if (this.resultCallback != undefined)
      this.resultCallback(
          this.text, this.confidence, this.isFinal, this.timeStamp, this.json);
  };

  restart() {
    this.speechStarted = false;
    this.recognition.abort();
    this.recognition.stop();
    // this.start();
  }
}
