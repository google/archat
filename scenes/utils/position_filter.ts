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
import {LowPassFilter} from './low_pass_filter';

const DIM = 3;

export class PositionFilter {
  freq: number;

  minCutOff: number;

  beta: number;

  dCutOff: number;

  v: LowPassFilter[];

  dv: LowPassFilter[];

  lasttime: number|null;

  constructor(freq: number, minCutOff = 0.2, beta = 0.0, dCutOff = 1.0) {
    if (freq <= 0 || minCutOff <= 0 || dCutOff <= 0) {
      throw new Error();
    }
    this.freq = freq;
    this.minCutOff = minCutOff;
    this.beta = beta;
    this.dCutOff = dCutOff;

    this.v = new Array(DIM);
    this.dv = new Array(DIM);
    for (let i = 0; i < DIM; ++i) {
      this.v[i] = new LowPassFilter(this.alpha(this.minCutOff));
      this.dv[i] = new LowPassFilter(this.alpha(this.dCutOff));
    }

    this.lasttime = 0;
  }

  alpha(cutOff: number): number {
    const te = 1.0 / this.freq;
    const tau = 1.0 / (2 * Math.PI * cutOff);
    return 1.0 / (1.0 + tau / te);
  }

  filter(data: number[], timestamp: number = 0): number[] {
    if (this.lasttime && timestamp) {
      this.freq = 1.0 / (timestamp - this.lasttime);
    }
    this.lasttime = timestamp;

    let res = new Array(DIM);
    for (let i = 0; i < DIM; ++i) {
      const prev = this.v[i].lastValue();
      const dx = (!prev) ? 0.0 : (data[i] - prev) * this.freq;
      const edx = this.dv[i].filter(dx, timestamp, this.alpha(this.dCutOff));
      const cutOff = this.minCutOff + this.beta * Math.abs(edx);
      res[i] = this.v[i].filter(data[i], timestamp, this.alpha(cutOff))
    }

    return res;
  }
};
