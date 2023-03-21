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
export class SoundObject {
  level = 0;
  text = '';
  confidence = 0;
  speech = false;
  timeStamp = 0;
  annotation = '';
  pitch = 0;

  constructor() {
    this.clear();
  }

  clear() {
    this.level = 0;
    this.text = '';
    this.confidence = 0;
    this.speech = false;
    this.timeStamp = 0;
    this.annotation = '';
    this.pitch = 0;
  }
}
