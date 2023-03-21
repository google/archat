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
 * Renders a circle to a canvas's context.
 * @param ctx
 * @param x
 * @param y
 * @param radius
 * @param fill
 * @param stroke
 * @param strokeWidth
 */
export function drawCircle(
    ctx: CanvasRenderingContext2D, x: number, y: number, radius: number,
    fill: string, stroke: string, strokeWidth = 0) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}


/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
export function roundRect(
    ctx: CanvasRenderingContext2D, x: number, y: number, width: number,
    height: number, radius: number, fill: Boolean, stroke: Boolean) {
  const r = {tl: radius, tr: radius, br: radius, bl: radius};

  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + width - r.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
  ctx.lineTo(x + width, y + height - r.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
  ctx.lineTo(x + r.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
}


/**
 * Renders a Sine curve.
 * @param ctx context2D
 * @param ox origin's x
 * @param oy origin's y
 * @param ow origin's w
 * @param oh origin's h
 */
export function drawSine(
    ctx: CanvasRenderingContext2D, ox: number, oy: number, ow: number,
    oh: number) {
  let counter = 0, x = ox, y = oy;

  let increase = 10 / 180 * Math.PI;
  for (let i = 0; i <= ow; i += ow / 72) {
    ctx.moveTo(x, y);
    x = ox + i;
    y = oy - Math.sin(counter) * oh;
    counter += increase;

    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

/**
 * Sets the DPI of a canvas.
 * @param canvas
 * @param dpi pixel per inch, 96 by default.
 */
export function setDPI(canvas: HTMLCanvasElement, dpi = 96) {
  // Sets up CSS size.
  canvas.style.width = canvas.style.width || canvas.width + 'px';
  canvas.style.height = canvas.style.height || canvas.height + 'px';

  // Resizes canvas and scale future draws.
  const scaleFactor = dpi / 96;
  canvas.width = Math.ceil(canvas.width * scaleFactor);
  canvas.height = Math.ceil(canvas.height * scaleFactor);

  canvas.getContext('2d').scale(scaleFactor, scaleFactor);
}

/**
 * Tests if a line exceeds the capacity of the canvas.
 * @param ctx context2D
 * @param line a string of the input text
 * @param maxWidth preferred maximum width in pixels.
 * @returns
 */
export function isLineExceed(
    ctx: CanvasRenderingContext2D, line: string, maxWidth: number) {
  // Try rendering and measuring width;
  return ctx.measureText(line).width > maxWidth;
}

const EASTERN_CHARACTER = /[\u3400-\u9FBF]/;

/**
 * Turn a string into a list of string.
 * @param ctx the canvas context for measuring the text width
 * @param text the canvas context for measuring the text width
 * @param maxWidth the maxWidth of the canvas for hard thresholding
 * @param useHyphen whether or not to use dash "-" in the text
 * @returns a string with line breaks
 */
export function breakLines(
    ctx: CanvasRenderingContext2D, text: string, maxWidth: number,
    useHyphen = false) {
  const MAX_CHARS_PER_WORD = 20;
  let breakLineByCharacter = EASTERN_CHARACTER.test(text);
  let i = 0, last_i = 0, start_i = 0;
  let current_line = '';

  while (i + 1 < text.length) {
    ++i;
    breakLineByCharacter = EASTERN_CHARACTER.test(current_line);

    if (text[i] == ' ') {
      current_line += text[i];
      last_i = i;
      continue;
    } else if (text[i] == '\n') {
      start_i = i;
      last_i = i;
      current_line = '';
      continue;
    }

    current_line += text[i];

    let line_break_symbol = '\n';

    if (isLineExceed(ctx, current_line, maxWidth)) {
      if (breakLineByCharacter) {
        i = i - 1;
      } else {
        if (last_i != start_i) {
          i = last_i;
        } else {
          i = start_i + MAX_CHARS_PER_WORD - 1;
          if (useHyphen) {
            line_break_symbol += '-';
          }
        }
      }

      start_i = i + 1;
      last_i = start_i;

      if (text[i] == ' ') {
        text = text.substring(0, i) + line_break_symbol + text.substring(i + 1);
      } else {
        text = text.substring(0, i) + line_break_symbol + text.substring(i);
      }
      current_line = '';
      continue;
    }
  }
  return text;
}

/**
 * Render lines of text on canvas.
 * @param ctx
 * @param lines
 * @param startIndex
 * @param textX
 * @param textY
 * @param textColor
 * @param textFont
 * @param isFinal
 * @returns
 */
export function drawLines(
    ctx: CanvasRenderingContext2D, lines: string[], startIndex: number,
    textX: number, textY: number, textColor: string, textFont: string,
    isFinal = true) {
  // const SOUND_FONT =
  //     `${this.soundOptions.fontSize}px ${this.soundOptions.fontFamily}`;
  const FINAL_TEXT_COLOR = 'ff';
  const INTERMEDIATE_TEXT_COLOR = 'dd';

  if (startIndex >= lines.length) {
    console.warn('The specified starting index is out of bounds of the lines.');
    return;
  }

  // Draws the text.
  ctx.font = textFont;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Slightly darkens the text if it is not final.
  const ALPHA_VALUE = isFinal ? FINAL_TEXT_COLOR : INTERMEDIATE_TEXT_COLOR;
  ctx.strokeStyle = textColor + ALPHA_VALUE;
  ctx.fillStyle = textColor + ALPHA_VALUE;

  for (let i = startIndex; i < lines.length; i++) {
    ctx.fillText(
        /*text=*/ lines[i],
        /*x=*/ textX,
        /*y=*/ textY +
            (i - startIndex) *
                (this.soundOptions.fontSize + this.soundOptions.lineSpacing));
  }
}
