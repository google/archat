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
 * Basic video pass-through scene for AR Chat.
 **/
import {Scene} from '../scene';
import {SCENE_NAMES} from '../scene_names';

export class PassthroughScene extends Scene {
  name = SCENE_NAMES.PassThrough;

  zoom = 1;

  init() {
    this.readyState = true;
    console.log(SCENE_NAMES.PassThrough + ' scene is loaded.');
  }

  render(
      canvasCamImg: HTMLCanvasElement, mlPredictions: unknown,
      effectOutputCanvas: HTMLCanvasElement) {
    this.passThrough(canvasCamImg, effectOutputCanvas);
  }

  passThrough(inputImage: HTMLCanvasElement, outputCanvas: HTMLCanvasElement) {
    const outputCtx = outputCanvas.getContext('2d');
    outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

    const ratio = Math.sqrt(1 / this.zoom);
    const croppedWidth = outputCanvas.width * ratio;
    const croppedHeight = outputCanvas.height * ratio;
    const left = (outputCanvas.width - croppedWidth) / 2;
    const top = (outputCanvas.height - croppedHeight) / 2;

    outputCtx.drawImage(
        inputImage, left, top, croppedWidth, croppedHeight, 0, 0,
        outputCanvas.width, outputCanvas.height);
  }

  setZoom(zoom: number) {
    this.zoom = zoom;
  }
}
