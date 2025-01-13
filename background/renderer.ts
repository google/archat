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
import {PassthroughScene} from '../scenes/PassThrough/PassThrough';
import {Scene} from '../scenes/scene';
import {InteractiveImageScene} from '../scenes/Sound/InteractiveImage';
import {SummarizationScene} from '../scenes/Sound/Transcription';

export class Renderer {
  static availableScenes = new Map<string, Scene>();

  private video = document.createElement('video');
  private canvas = document.createElement('canvas');
  private currentScene: Scene|undefined = undefined;
  private loopHandle: number|undefined = undefined;
  private lastVideoTime = 0;
  private deviceId: string|null = null;

  setDeviceId(deviceId: string) {
    this.deviceId = deviceId;
  }

  async openCamera() {
    if ((this.video.srcObject as MediaStream|undefined)?.active) return;
    const cameraStream = await MediaDevices.prototype.getUserMedia.call(navigator.mediaDevices, {
      // audio: true,
      video: {
        deviceId: this.deviceId,
        width: 1280,
        height: 720,
      }
    });
    this.video.srcObject = cameraStream;
    await this.video.play();

    const width = this.video.videoWidth;
    const height = this.video.videoHeight;

    this.canvas.width = width;
    this.canvas.height = height;
  }

  async switchCamera(newDeviceId: string) {
    console.log(`Switching camera to ${newDeviceId}.`);
    const currentStream = this.video.srcObject as MediaStream|undefined;
    const track = currentStream?.getVideoTracks()[0];
    if (track?.getSettings().deviceId === newDeviceId) return;

    if (track) {
      track.stop();
      const stream = await MediaDevices.prototype.getUserMedia.call(navigator.mediaDevices, {
        video: {
          deviceId: newDeviceId,
          width: 1280,
          height: 720,
        }
      });
      this.video.srcObject = stream;
      await this.video.play();
    }

    this.deviceId = newDeviceId;
  }

  async startEngine() {
    this.loopHandle = requestAnimationFrame(this.render);
  }

  render = () => {
    if (this.lastVideoTime !== this.video.currentTime) {
      if (this.currentScene) {
        this.currentScene.render(this.video, {}, this.canvas);
      } else {
        const ctx = this.canvas.getContext('2d');
        ctx?.drawImage(this.video, 0, 0);
      }
      this.lastVideoTime = this.video.currentTime;
    }
    this.loopHandle = requestAnimationFrame(this.render);
  };

  async getStream() {
    await this.openCamera();
    await this.startEngine();
    return this.canvas.captureStream(30);
  }

  stopStream() {
    cancelAnimationFrame(this.loopHandle!);
    // maybeStopEngine();
  }

  setScene(name: string) {
    if (this.currentScene?.getName() !== name) {
      // Unloads current scene if something is happening there.
      this.currentScene?.stop?.();
    }

    // requiredModels = [];

    this.currentScene = Renderer.availableScenes.get(name);
    if (this.currentScene) {
      // requiredModels = currentScene.getModelDependencies();
      console.log('Switched scene to: ' + this.currentScene.getName());
      console.log('Loading scene ML dependencies...');
      this.currentScene.init();
    }
  }

  setCaptions(
      enabled: boolean, captions: string, selfCaptions: string,
      allCaptions: string) {
    this.currentScene?.setCaptions(enabled, captions, selfCaptions, allCaptions);
  }

  setImage(
      x: number, y: number, width: number, height: number, url: string,
      name: string) {
    if (this.currentScene instanceof InteractiveImageScene) {
      this.currentScene.setImage(x, y, width, height, url, name);
    }
  }

  getCurrentScene() {
    return this.currentScene?.getName();
  }
}

/**
 * Registers a scene for usage.
 * @param {object} scene a scene from the scenes folder.
 */
function registerScene(scene: Scene) {
  Renderer.availableScenes.set(scene.getName(), scene);
  console.log('Registered Effect: ' + scene.getName());
}

// #NewScene: Registers your scene here.
registerScene(new PassthroughScene());
registerScene(new SummarizationScene());
registerScene(new InteractiveImageScene());
