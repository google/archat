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
 * Converts a number from 0 to 1 into a HEX string 00 to FF
 * @param percentage a number from 0.0 to 1.0
 * @returns a HEX string 00 to FF, alpha value.
 */
export function percentageToHex(percentage: number) {
  const alpha = Math.floor(percentage * 255);
  let alphaString = alpha.toString(16);
  if (alphaString.length < 2) {
    alphaString = '0' + alphaString;
  }
  return alphaString;
};

export function hexToRgb(hex: string): number[] {
  const aRgbHex = hex.match(/.{1,2}/g);
  let res: number[] = new Array();

  for (let i = 0; i < aRgbHex.length; ++i) {
    res.push(parseInt(aRgbHex[i], 16));
  }
  return res;
}

export function rgbToHex(rgba: number[]): string {
  let res = '';
  for (let i = 0; i < rgba.length; ++i) {
    res += rgba[0].toString(16);
  }
  return res;
}

/**
 * Returns mix of two colors.
 * @param color1
 * @param color2
 * @param percentage
 */
export function mixColors(
    color1: string, color2: string, percentage: number): string {
  const rgba1 = hexToRgb(color1);
  const rgba2 = hexToRgb(color2);
  let res: number[] = new Array();

  for (let i = 0; i < rgba1.length; ++i) {
    res.push(rgba1[i] * percentage + rgba2[i] * (1 - percentage));
  }

  return rgbToHex(res);
}

export enum Colors {
  WHITE = '#ffffff',
  ORANGE = '#fbdd3a',
  PINK = '#fcc5c0',
  FUCHSIA = '#FF00FF',
  PURPLE = '#df73ff',
  YELLOW = '#ffff00',
  TAN = '#d2b48c',
  BEIGE = '#f5f5dc',
  LIGHT_YELLOW = '#ffffe0',
  CYAN = '#00ffff',
  ALICE = '#F0F8FF',
  MINT = '#Aaf0d1',
  RED = '#ff0000',
  GREEN = '#00ff00',
  BLUE = '#0000ff',
}
