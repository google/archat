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
import {postprocessing} from '../utils/nlp_utils';

import {config, SAMPLE_RATE} from './sound_config';
import {SoundObject} from './sound_object';
import {SpeechRecognition} from './speech_recognition';

export class SoundEngine {
  mic = 0;
  index = 0;
  buffer = new Array();
  length: number;
  heightAmplitude = 100;   // area for amplitude plot
  heightRecognition = 50;  // are for recognition results
  recognition = new SpeechRecognition();
  isSpeech = false;
  isFinal = false;
  isSummarized = false;
  isSummarizing = false;
  finalText = '';
  summaryText = '';
  speechStartIndex = -1;
  speechEndIndex = -1;
  amplitudeMin = 255;
  frequencyMin = 0;
  frequencyMax = SAMPLE_RATE / 2;
  fftSmoothing = 0.5;
  lastReceivedTime = Date.now();
  lastSummarizedTime = 0;
  lastSummarizedText = '';
  lastSummarizedPosition = 0;
  summaryMaxWords = 100000;
  debugInfo = '';
  printed = false;
  useMelScale = true;
  resultCallback: any;
  minSummaryLength: number;
  LAMDA_PRESET_PROMPTS: string[];
  lamdaPrompt: string;
  loudness = 20;

  constructor() {
    this.mic = 0;
    this.index = 0;
    this.buffer = new Array();
    this.length = 128;            // Length of buffer.
    this.heightAmplitude = 100;   // area for amplitude plot
    this.heightRecognition = 50;  // are for recognition results
    this.recognition = new SpeechRecognition();
    this.isSpeech = false;
    this.isFinal = false;
    this.isSummarized = false;
    this.isSummarizing = false;
    this.finalText = '';
    this.summaryText = '';
    this.lastSummarizedText = '';
    this.lastSummarizedPosition = 0;
    this.speechStartIndex = -1;
    this.speechEndIndex = -1;
    this.amplitudeMin = 255;
    this.frequencyMin = 0;
    this.frequencyMax = SAMPLE_RATE / 2;
    this.fftSmoothing = 0.5;
    this.lastReceivedTime = Date.now();
    this.lastSummarizedTime = 0;
    this.summaryMaxWords = 100000;
    this.debugInfo = '';
    this.printed = false;
    this.useMelScale = true;
    this.minSummaryLength = 15;
    this.loudness = 0;

    var object = this;

    this.recognition.startCallback = function(e: any) {
      object.onSpeechRecognitionStart(e);
    };
    this.recognition.endCallback = function() {
      object.onSpeechRecognitionEnd();
    };
    this.recognition.speechStartCallback = function(e: any) {
      object.onSpeechRecognitionSpeechStart(e);
    };
    this.recognition.speechEndCallback = function() {
      object.onSpeechRecognitionSpeechEnd();
    };
    this.recognition.resultCallback = function(
        text: string, confidence: number, isFinal: boolean, timeStamp: number,
        json: any) {
      object.onSpeechRecognitionResults(
          text, confidence, isFinal, timeStamp, json);
    };

    for (let i = 0; i < this.length; ++i) {
      this.buffer.push(new SoundObject());
    }
  }

  setLanguageModel(modelName: string) {}

  add(value: number) {
    this.buffer[this.index] = value;
    this.index = (this.index + 1) % this.length;
  }

  start() {
    this.recognition.start();
  }

  setSourceLanguage(language: string) {
    this.recognition.setSourceLanguage(language);
  }

  stop() {
    console.log('Stopping recognition in SoundEngine');
    this.recognition.stop();
  }

  setFftSmoothing(smoothing: number) {
    if (this.fftSmoothing != smoothing) {
      this.fftSmoothing = smoothing;
      // this.fft.smooth(this.fftSmoothing);
    }
  }

  isOutDated() {
    const OUTDATE_TIME_MILLISECONDS = 7400;
    return Date.now() - this.lastReceivedTime > OUTDATE_TIME_MILLISECONDS;
  }

  isPauseLongEnoughForSummary(pauseTime: number) {
    return Date.now() - this.lastReceivedTime > pauseTime;
  }

  onSpeechRecognitionStart(e: any) {
    this.isSpeech = false;
  }
  onSpeechRecognitionEnd() {
    this.isSpeech = false;
  }

  onSpeechRecognitionSpeechStart(e: any) {
    this.isSpeech = false;  // we don't know yet
    this.speechStartIndex = this.index;
  }

  onSpeechRecognitionSpeechEnd() {
    this.isSpeech = false;  // we don't know yet
    this.speechEndIndex = this.index;
  }

  onSpeechRecognitionResults(
      text: string, confidence: number, isFinal: boolean, timeStamp: number,
      json: any) {
    if (!this.isSpeech)  // first result, need to catch up to the previous
      // events when we weren't sure if this was speech
      for (let i = this.speechStartIndex; i != this.index % this.length;
           i = (i + 1) % this.length)
        this.buffer[i].speech = true;

    this.buffer[this.speechStartIndex].text = text;
    this.buffer[this.speechStartIndex].confidence = confidence;

    this.isSpeech = true;

    this.isFinal = isFinal;
    this.loudness = isFinal ?
        config.minLoudness :
        config.minLoudness + Math.floor(Math.random() * config.rangeLoudness);
    // this.finalText = text;
    this.finalText = postprocessing(text, this.isFinal);
    this.lastReceivedTime = Date.now();

    if (this.resultCallback != undefined) {
      this.resultCallback(text, confidence, isFinal, timeStamp, json);
    }
  }

  update() {
    // return;
    // if we received a sound, which started "speech", but no results have been
    // detected (this.isSpeech) for 1s
    if (this.recognition.speechStarted &&
        ((performance.now() - this.recognition.speechStartedTime) > 1000) &&
        !this.isSpeech) {
      this.recognition.restart();
    }

    // Clears last value in the rolling buffer.
    let lastValue = (this.index + 1 + this.buffer.length) % this.buffer.length;
    this.buffer[lastValue].clear();
  }

  get(index: number) {
    return this.buffer[index];
  }

  getMelHz(frequency: number) {
    return 1127 * Math.log(1 + frequency / 700);
  }
}
