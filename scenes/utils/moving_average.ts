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
 * A basic moving avereage class. Alternative: one-euro filter.
 */
export class MovingAverage {
  maxSize: number;
  size = 0;
  sum = 0;
  pointer = 0;
  queue: Array<number>;


  constructor(size = 10) {
    // Corner cases.
    if (size <= 0) {
      size = 1;
    }

    this.maxSize = size;
    this.size = 0;
    this.sum = 0;
    this.pointer = 0;
    this.queue = Array(size).fill(0);
  }

  add(value: number) {
    // Adds the value to the queue and the sum.
    this.sum += value;
    this.pointer = (this.pointer + 1) % this.maxSize;
    this.sum -= this.queue[this.pointer];
    this.queue[this.pointer] = value;

    // Increases the capacity if needs.
    if (this.size < this.maxSize) {
      ++this.size;
    }
  }

  get() {
    if (this.size > 0) {
      return this.sum / this.size;
    } else {
      return 0;
    }
  }

  getInt() {
    return Math.round(this.get());
  }

  debug() {
    return this.sum / this.size;
  }
}
