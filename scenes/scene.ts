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
export type Canvas = OffscreenCanvas|HTMLCanvasElement|HTMLVideoElement;

export type Context2D =
    OffscreenCanvasRenderingContext2D|CanvasRenderingContext2D;

export class Scene {
  readyState = false;

  name?: string;

  gCaptionsEnabled: boolean;
  gCaptions: string = '';
  gAllCaptions: string = '';
  gSelfCaptions: string = '';

  // For debuugging only.
  gCaptionsCounter: number = 0;

  // modelDependencies: string[] = [];

  init() {}

  stop() {}

  render(
      inputCanvas: Canvas, predictions: any, outputCanvas: Canvas) {}

  // getModelDependencies() {
  //   return this.modelDependencies;
  // }

  getName() {
    return this.name;
  }

  // This is only used in the Sound scene, for rapid prototyping, put here.
  // TODO: Rewrite this as SpeechDown.
  setCaptions(
      enabled: boolean, captions: string, selfCaptions: string,
      allCaptions: string) {
    this.gCaptionsEnabled = enabled;
    this.gCaptions = captions;
    this.gSelfCaptions = selfCaptions;
    this.gAllCaptions = allCaptions;
    ++this.gCaptionsCounter;
  }

  getReadyState() {
    return this.readyState;
  }
}
