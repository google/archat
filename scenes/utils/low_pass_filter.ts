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
export class LowPassFilter {
  y: number|null;

  s: number|null;

  alpha = 0;

  constructor(alpha: number) {
    this.setAlpha(alpha);
    this.y = null;
    this.s = null;
  }

  setAlpha(alpha: number) {
    if (alpha <= 0 || alpha > 1.0) {
      throw new Error();
    }
    this.alpha = alpha;
  }

  filter(value: number, timestamp: number, alpha: number) {
    if (alpha) {
      this.setAlpha(alpha);
    }
    let s;
    if (!this.y) {
      s = value;
    } else {
      s = this.alpha * value + (1.0 - this.alpha) * this.s;
    }
    this.y = value;
    this.s = s;
    return s;
  }

  lastValue() {
    return this.y;
  }
};
