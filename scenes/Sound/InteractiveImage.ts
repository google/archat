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
 * Visual Captions for GVC
 **/

// TODO: allow to draw multiple images on the other user's screen
import {Scene} from '../scene';
import {SCENE_NAMES} from '../scene_names';

import {InteractiveImageOptions} from './InteractiveImage_options';

const RANGE = 5;

export class InteractiveImageScene extends Scene {
  name = SCENE_NAMES.InteractiveImage;
  interactiveImageOptions: InteractiveImageOptions;


  init() {
    // Loads any deps.
    this.readyState = true;
  }

  stop() {
    if (this.readyState) {
      this.readyState = false;
    }
  }

  setOptions(newOptions: InteractiveImageOptions) {
    console.log('interactive image setoptions');
    if (!newOptions) return;

    this.interactiveImageOptions = newOptions;
  }

  render(
      canvasCamImg: HTMLCanvasElement, mlPredictions: any,
      effectOutputCanvas: HTMLCanvasElement) {
    const ctx = effectOutputCanvas.getContext('2d')!;

    const SOUND_FONT = `40px Roboto`;
    ctx.fillStyle = 'White';
    ctx.strokeStyle = 'White';
    ctx.font = SOUND_FONT;
    ctx.lineWidth = 3;

    ctx.clearRect(0, 0, effectOutputCanvas.width, effectOutputCanvas.height);
    ctx.drawImage(canvasCamImg, 0, 0);

    function roundedImage(
        x: number, y: number, width: number, height: number, radius: number) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(
          x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    if (this.image) {
      ctx.save();
      roundedImage(
          this.imageX * width, this.imageY * height, this.imageWidth * width,
          this.imageHeight * height, 10);
      ctx.clip();
      ctx.drawImage(
          this.image, this.imageX * width, this.imageY * height,
          this.imageWidth * width, this.imageHeight * height);
      ctx.restore();
    }
  }

  imageX = 0;
  imageY = 0;
  imageWidth = 0;
  imageHeight = 0;
  imageUrl?: string;
  imageName?: string;
  image?: HTMLImageElement;

  async setImage(
      x: number, y: number, width: number, height: number, url: string,
      name: string) {
    // Load image if needed.
    if (url !== this.imageUrl) {
      this.imageUrl = url;
      this.image = undefined;
      if (url) {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
          console.log('image loaded');
          this.image = image;
        };
        image.src = url;
      }
    }
    this.imageX = x;
    this.imageY = y;
    this.imageWidth = width;
    this.imageHeight = height;
    this.imageName = name;
  }
}
