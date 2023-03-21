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
import {isLineExceed} from './canvas_utils';

export const APOSTROPHES_MAPPING = [
  'is not',   'has not',    'had not',   'have not', 'did not',   'would not',
  'can not',  'she is',     'there is',  'he is',    'it is',     'Mary is',
  'Jim is',   'Germany is', 'who is',    'I am',     'I will',    'you will',
  'she will', 'we will',    'they will', 'I would',  'you would', 'he would',
  'we would', 'they would', 'I have',    'you have', 'we have',   'they have',
  'you are',  'they are',   'we are'
];

export const APOSTROPHES = [
  'isn\'t',  'hasn\'t',    'hadn\'t',  'haven\'t', 'didn\'t', 'wouldn\'t',
  'can\'t',  'she\'s',     'there\'s', 'he\'s',    'it\'s',   'Mary\'s',
  'Jim\'s',  'Germany\'s', 'who\'s',   'I\'m',     'I\'ll',   'you\'ll',
  'she\'ll', 'we\'ll',     'they\'ll', 'I\'d',     'you\'d',  'he\'d',
  'we\'d',   'they\'d',    'I\'ve',    'you\'ve',  'we\'ve',  'they\'ve',
  'you\'re', 'they\'re',   'we\'re'
];

export const ENDING_PUNCTUATION_SET = new Set(['.', '?', '!']);

export const PAUSE_PUNCTUATION_SET =
    new Set([',', ':', '"', '\'', '(', ')', ';']);

export const PUNCTUATION_SET =
    new Set([',', ':', '"', '\'', '(', ')', '.', '?', '!', ';']);

const FIRST_CHAR_REGEX = /\S/;
export const BULLET = '•';

/**
 * Filters non-standard apostrophes in translation mode.
 * @param s input string
 * @returns
 */
export function unifyApostrophes(s: string): string {
  for (let a_id in APOSTROPHES) {
    s = s.replace(APOSTROPHES[a_id], APOSTROPHES_MAPPING[a_id]);
  }
  return s;
};

/**
 * Returns number of effective chars in the string.
 * @param s input string
 * @returns
 */
export function countEffectiveChars(s: string): number {
  return s.replace(/[.,\/#!$%\^&\*;:{}=\`~()\\\sâ€“·]/gi, '').length;
};

export function capitalizeFirstChar(s: string): string {
  return s.replace(FIRST_CHAR_REGEX, function(m) {
    return m.toUpperCase();
  });
};

/**
 * Processes the intermedia text buffer.
 * @param s input text.
 * @param isFinal Whether or not the text is finalized.
 */
export function replaceSpecialPhrases(s: string, isFinal = false) {
  // Converts go links.
  s = s.replace(/go\s+[fs][lm]ash\s+/gmi, 'go/');
  if (s.indexOf('go/') >= 0) {
    s = s.replace(/ dash /gmi, '-');
    s = s.replace(/ underscore /gm, '_');
  }

  // Special names:
  s = s.replace(/a r /gmi, 'AR ');
  s = s.replace(/a our /gmi, 'AR ');
  s = s.replace(/vrchat/gmi, 'ARChat');
  s = s.replace(/they are cat/gmi, 'ARChat');
  s = s.replace(/a r cat/gmi, 'ARChat');
  s = s.replace(/a Arc at/gmi, 'ARChat');
  s = s.replace(/a art at/gmi, 'ARChat');
  s = s.replace(/a arch at/gmi, 'ARChat');
  s = s.replace(/ar tat/gmi, 'ARChat');
  s = s.replace(/arcat/gmi, 'ARChat');
  s = s.replace(/AR test/gm, 'ARChat');
  s = s.replace(/AR cat/gm, 'ARChat');
  s = s.replace(/VR\s?Chat/gmi, 'ARChat');
  s = s.replace(/our cat/gm, 'ARChat');
  s = s.replace(/AI chat/gm, 'ARChat');

  return s;
};

// Maximum length of characters that may change in the transcription or
// translation text.
const MAX_PENDING_CHARACTERS = 25;
// Minimum number of characters that shares a common substring with the previous
// one.
const MIN_COMMON_PREFIX_LENGTH = 5;

let longestCommonPrefix = new Array(MAX_PENDING_CHARACTERS + 1);

for (let i = 0; i < longestCommonPrefix.length; ++i) {
  longestCommonPrefix[i] = new Array(MAX_PENDING_CHARACTERS + 1);
}

const PUNCTUATIONS = /[\!|\?|\.,:]/mg;

/**
 * Merges two strings.
 * @param src the source string
 * @param dst the new string coming into Transcription
 * @returns
 */
export function mergeText(src: string, dst: string): string {
  if (src == null || src == undefined) {
    return '';
  }
  if (dst == null || dst == undefined) {
    return src;
  }

  let srcLength = src.length;
  let dstLength = dst.length;
  let srcStart = 0;
  let dstStart = 0;

  if (src.length === 0) {
    return dst;
  }

  if (srcLength > MAX_PENDING_CHARACTERS) {
    srcStart = srcLength - MAX_PENDING_CHARACTERS;
  }

  if (dstLength > MAX_PENDING_CHARACTERS) {
    dstStart = dstLength - MAX_PENDING_CHARACTERS;
  }

  let maxCommonPrefix = 0;
  let srcMaxMatchStartingIndex = 0;
  let dstMaxMatchStartingIndex = 0;

  // Builds the longestCommonPrefix array from left to right.
  for (let srcPointer = srcStart; srcPointer <= srcLength; ++srcPointer) {
    for (let dstPointer = dstStart; dstPointer <= dstLength; ++dstPointer) {
      const srcIndex = srcPointer - srcStart;
      const dstIndex = dstPointer - dstStart;

      if (srcIndex == 0 || dstIndex == 0) {
        longestCommonPrefix[srcIndex][dstIndex] = 0;
      } else if (src.charAt(srcPointer - 1) == dst.charAt(dstPointer - 1)) {
        longestCommonPrefix[srcIndex][dstIndex] =
            longestCommonPrefix[srcIndex - 1][dstIndex - 1] + 1;
        if (longestCommonPrefix[srcIndex][dstIndex] > maxCommonPrefix) {
          srcMaxMatchStartingIndex = srcPointer;
          dstMaxMatchStartingIndex = dstPointer;
          maxCommonPrefix = longestCommonPrefix[srcIndex][dstIndex];
        }
      } else if (src.charAt(srcPointer - 1) == '\n') {
        longestCommonPrefix[srcIndex][dstIndex] =
            longestCommonPrefix[srcIndex - 1][dstIndex] + 1;
        if (longestCommonPrefix[srcIndex][dstIndex] > maxCommonPrefix) {
          srcMaxMatchStartingIndex = srcPointer;
          dstMaxMatchStartingIndex = dstPointer;
          maxCommonPrefix = longestCommonPrefix[srcIndex][dstIndex];
        }
      } else {
        longestCommonPrefix[srcIndex][dstIndex] = 0;
      }
    }
  }

  // If common prefix is too small, there is no overlapping between src and dst,
  // return dst.
  if (maxCommonPrefix < MIN_COMMON_PREFIX_LENGTH) {
    return dst;
    // If src's substring is valid return the concatenated string.
  } else if (srcMaxMatchStartingIndex >= 0) {
    // Further computes the maximum common prefix and skips line breaks.
    let pointer = 0;
    let srcPointer = 0;
    while (dstMaxMatchStartingIndex + pointer < dst.length &&
           srcMaxMatchStartingIndex + pointer + srcPointer < src.length) {
      const dstPointer = dstMaxMatchStartingIndex + pointer;
      const dstChar = dst[dstPointer];
      if (dstChar == src[srcMaxMatchStartingIndex + pointer + srcPointer]) {
        ++pointer;
      } else if (src[srcMaxMatchStartingIndex + pointer + srcPointer] == '\n') {
        ++srcPointer;
      } else {
        break;
      }
    }
    dstMaxMatchStartingIndex += pointer;
    srcMaxMatchStartingIndex += pointer + srcPointer;

    return src.substring(0, srcMaxMatchStartingIndex) +
        dst.substring(dstMaxMatchStartingIndex);
  } else {
    return dst;
  }
}

/**
 * Finds the first punctuation before line breaks.
 * @param inputString
 * @param maxLines
 * @returns
 */
export function findTheFirstPunctuationBeforeLineBreak(
    inputString: string, maxLines: number) {
  let numBreaks = 0;
  let fromIndex = 0;
  let lastBreakIndex = 0;
  let breakIndex = inputString.indexOf('\n', fromIndex);
  let cutoffPosition = -1;

  while (breakIndex >= 0) {
    ++numBreaks;
    lastBreakIndex = fromIndex;
    fromIndex = breakIndex + 1;
    breakIndex = inputString.indexOf('\n', fromIndex);

    if (numBreaks < maxLines) {
      continue;
    } else {
      let query = inputString.substring(0, fromIndex - 1);
      let reversedQuery = query.split('').reverse().join('');
      let punct = reversedQuery.search(PUNCTUATIONS);
      cutoffPosition = punct;
      break;
    }
  }

  if (cutoffPosition === -1) {
    return inputString;
  }

  let cutoffLength = fromIndex - cutoffPosition - 1;
  // MSG += inputString[cutoffLength - 1] + '\n';
  if (PAUSE_PUNCTUATION_SET.has(inputString[cutoffLength - 1])) {
    return inputString.substring(0, cutoffLength - 1) + '...';
  } else {
    return inputString.substring(0, cutoffLength);
  }
}

const MAX_LOG_LENGTH = 3300000;
const MIN_LOG_LENGTH = 10;

/**
 * Append currentText to log or merge currentText to the log.
 * @param log Merges currentText to the log.
 * @param currentText
 * @returns new log in string
 */
export function mergeLog(log: string, currentText: string): string {
  if (log.length > MAX_LOG_LENGTH) {
    return log.substring(currentText.length) + currentText;
  }

  if (log.length < MIN_LOG_LENGTH) {
    return currentText;
  }

  if (currentText === null || currentText === undefined ||
      currentText.length === 0) {
    return log;
  }

  if (log.length === 0) {
    return currentText;
  }

  const newLog = mergeText(log.trim(), currentText.trim());
  return newLog;

  // if (newLog.length === currentText.length) {
  //   const minLength = Math.min(log.length, newLog.length);
  //   if (log.substring(log.length - newLog.length) == newLog) {
  //     return log;
  //   } else {
  //     return log + newLog;
  //   }
  // } else {
  //   return newLog;
  // }
}

export const EASTERN_CHARACTER = /[\u3400-\u9FBF]/;

/**
 * Returns a string with psedo punctuations.
 * With Web Audio API, the return string has no punctuations.
 * @param s the input string
 * @param isFinal whether the speech is finalized
 * @param isEnglish whether the speech is English
 * @param isChinese whether the speech is Chinese
 * @returns
 */
export function postprocessNoPunctuationString(
    s: string, isFinal = false, isEnglish = true, isChinese = false): string {
  if (s.length == 0) return s;

  const isEastern = EASTERN_CHARACTER.test(s);

  // TODO: Find some NLP.js libraries.
  if (!isEastern) {
    if (isFinal) {
      const QUESTIONS = [
        'who', 'what', 'when', 'where', 'why', 'how', 'which', 'won\'t',
        'can\'t', 'isn\'t', 'aren\'t', 'is', 'do', 'does', 'will', 'can',
        'shall', 'could', 'would'
      ];

      const EXCLAMATORIES = [
        'hi', 'hey', 'hello', 'wow', 'amazing', 'great', 'good', 'awesome',
        'beautiful', 'wonderful', 'perfect', 'splendid', 'OK', 'let\'s',
        'welcome', 'thank', 'cool', 'super'
      ];

      const SPECIAL_WORDS = ['i/o'];
      let isQuestion = false;
      for (let q of QUESTIONS) {
        // TODO: Replace it with order in tokens.
        if (s.indexOf(q) == 0) {
          isQuestion = true;
          break;
        }
      }

      let isExclamatory = false;
      for (let q of EXCLAMATORIES) {
        if (s.indexOf(q) >= 0) {
          isExclamatory = true;
          break;
        }
      }

      if (isQuestion) {
        s += '?';
      } else if (isExclamatory) {
        s += '!';
      } else {
        s += '.';
      }
    }
  } else {
    const QUESTIONS = ['吗', '什么', '难道', '是不是'];
    const EXCLAMATORIES = ['哇', '真', '啦', '恭喜', '谢'];
    let isQuestion = false;
    for (let q of QUESTIONS) {
      if (s.indexOf(q) >= 0) {
        isQuestion = true;
        break;
      }
    }

    let isExclamatory = false;
    for (let q of EXCLAMATORIES) {
      if (s.indexOf(q) >= 0) {
        isExclamatory = true;
        break;
      }
    }

    if (isQuestion) {
      s += '？';
    } else if (isExclamatory) {
      s += '！';
    } else {
      s += '。';
    }
  }

  // Capitalizes the incoming sentence.
  s = s.replace(FIRST_CHAR_REGEX, function(m) {
    return m.toUpperCase();
  });

  return s;
}

/**
 * Returns if two words are different
 * @param s
 * @param t
 * @returns
 */
export function testDifferentWords(s: string, t: string): boolean {
  return s.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') !=
      t.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
}

// Naive word counter.
export function countWord(s: string): number {
  const isEastern = EASTERN_CHARACTER.test(s);
  return isEastern ? s.length : s.split(' ').length;
}

/**
 * Returns new text to summarize.
 * @param transcript
 * @param lastTextToSummarizer
 * @returns
 */
export function findNewTextForSummarizer(
    transcript: string, lastTextToSummarizer: string) {
  const t = lastTextToSummarizer;
  const s = transcript;

  const p = s.indexOf(t);
  if (p >= 0) {
    return s.substring(p + t.length);
  } else {
    return s;
  }
}

/**
 * Converts the first letter of each sentence into upper case.
 * @param s
 * @returns the perfect sentence.
 */
export function capitalizeFirstWordInSentences(s: string) {
  return s.replace(/(^|[.?!] )(\w)/gm, s => s.toUpperCase());
}

// TODO: reformat.
export function editDistance(a: string, b: string): number {
  if (a.length == 0) return b.length;
  if (b.length == 0) return a.length;

  let matrix = [];

  // increment along the first column of each row
  let i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  let j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,  // substitution
            Math.min(
                matrix[i][j - 1] + 1,    // insertion
                matrix[i - 1][j] + 1));  // deletion
      }
    }
  }

  return matrix[b.length][a.length];
}

export function removeLastWord(s: string) {
  const isEastern = EASTERN_CHARACTER.test(s);
  if (isEastern) {
    return s.substring(s.length - 1);
  } else {
    const p = s.lastIndexOf(' ');
    return p > 0 ? s.substring(0, p) : s;
  }
}

export function cleanLamdaReply(reply: string): string {
  if (!reply) {
    return '';
  }

  if (reply.indexOf(BULLET) >= 0) {
    let strs = reply.split(BULLET);
    let popTimes = strs.length - 6;
    for (let i = 0; i < popTimes; ++i) {
      strs.pop();
    }

    // for str in strs: remove all characters after "speech:"
    for (let i = 0; i < strs.length; ++i) {
      let str = strs[i];
      let index = str.indexOf('speech:');
      if (index >= 0) {
        strs[i] = str.substring(0, index);
      }
    }

    let ans = strs.join(BULLET);
    const BULLET_SPACE_REGEX = / •/;
    ans = ans.replace(BULLET_SPACE_REGEX, '\n•');
    return ans;
  }

  const FIRST_CHAR_REGEX = /\S/;

  // Gets rid of the trailing double slash, if it exists.
  const split = reply.trim().split('\n');
  let ans = split[0];
  if (ans.length > 0 && PUNCTUATION_SET.has(ans[0])) {
    ans = ans.substring(1).trim();
  }

  // Locates the last sentence and truncates it.
  let last_id = ans.length - 1;
  for (let i = ans.length - 1; i >= 0; --i) {
    if (ans[i] == '.' || ans[i] == '?' || ans[i] == '!') {
      last_id = i;
      break;
    }
  }

  // Corrects the last punctuation to '.' if not.
  if (ans.length > 0) {
    ans = ans.substring(0, last_id + 1);
    if (PAUSE_PUNCTUATION_SET.has(ans[ans.length - 1])) {
      ans = ans.slice(0, -1) + '.';
    } else if (!PUNCTUATION_SET.has(ans[ans.length - 1])) {
      ans += '.';
    }
  }

  // Capitalizes the first word of the incoming sentence.
  ans = capitalizeFirstChar(ans);

  return ans.trim();
}


/**
 * Processes the intermedia text buffer.
 * @param s input text.
 * @param isFinal Whether or not the text is finalized.
 */
export function postprocessing(s: string, isFinal = false) {
  // Converts go links.
  s = s.replace(/go\s+[fs][lm]ash\s+/gmi, 'go/');
  if (s.indexOf('go/') >= 0) {
    s = s.replace(/ dash /gmi, '-');
    s = s.replace(/ underscore /gm, '_');
  }

  // Special names:
  s = s.replace(/a r /gmi, 'AR ');
  s = s.replace(/a our /gmi, 'AR ');
  s = s.replace(/vrchat/gmi, 'ARChat');
  s = s.replace(/they are cat/gmi, 'ARChat');
  s = s.replace(/a r cat/gmi, 'ARChat');
  s = s.replace(/a Arc at/gmi, 'ARChat');
  s = s.replace(/a art at/gmi, 'ARChat');
  s = s.replace(/a arch at/gmi, 'ARChat');
  s = s.replace(/AR test/gm, 'ARChat');
  s = s.replace(/AR cat/gm, 'ARChat');
  s = s.replace(/VR\s?Chat/gmi, 'ARChat');
  s = s.replace(/our cat/gm, 'ARChat');
  s = s.replace(/AI chat/gm, 'ARChat');

  return s;
}

// TODO: Find a comprehensive list of abbreviations.
const PROPER_NOUNS = new Set(['IMU', 'UX', 'UXR', 'SWE', 'RS', 'PM']);

function shouldCapitalize(str: string): boolean {
  return /[\d\-]/.test(str) && (!(/[\d\-]/.test(str)));
}

export function formatRawWord(rawWord: string, isEastern: boolean) {
  if (!isEastern) {
    const upper = rawWord.toUpperCase();
    // 'DF1', 'DF2', 'DF3', 'RB3'
    if (shouldCapitalize(rawWord)) {
      return upper;
    }
    // 'IMU'
    if (PROPER_NOUNS.has(upper)) {
      return upper;
    }
  }

  return rawWord;
}

export function endsWithAny(s: string, suffixes = ['.', '!', '?', ':']) {
  return suffixes.some(function(suffix) {
    return s.endsWith(suffix);
  });
}

export function getProcessedWordFromRaw(rawWord: string, isEastern: boolean) {
  if (isEastern) {
    return rawWord.replace(SPEECH_EASTER_PUNCTUANTION_REGEX, '').trim();
  } else {
    return rawWord.toLowerCase().replace(SPEECH_PUNCTUATIONS_REGEX, '').trim();
  }
}

export const MERGE_LAST_CHARACTER_SET =
    new Set([',', ':', '.', '?', '!', ';', 's']);
/**
 * Each token contains a western word or an estern character.
 */
export class Token {
  // Raw word when printing. E.g., Wife, these
  raw: string;
  // Filtered word for comparison. E.g., wife, these
  word: string;
  // Word pending for correction. Wi-Fi, those
  pending: string;
  // Whether word is rendered on canvas.
  isLaidOut: boolean;
  // Pending punctuation (.)
  // pendingPunctuation: string;
  // Last time when laid out in ms.
  lastLaidOutTime: number;
  // Width to occupy on canvas.
  width: number;
  // Padding reserved for potential correctoion.
  padding: number;
  // Whether raw is capitalized.
  isCapitalized: boolean;

  /**
   * Constructor of a new token.
   * @param rawWord the original input word
   * @param isEastern whether it is eastern or not
   */
  constructor(rawWord: string, isEastern = false) {
    this.raw = formatRawWord(rawWord, isEastern);
    console.log(rawWord, this.raw);
    this.word = getProcessedWordFromRaw(this.raw, isEastern);
    this.width = 0;
    this.padding = 0;
    this.lastLaidOutTime = -1;
    this.isLaidOut = false;
    // Returns whether the word is capitalized and ignore single-letter word
    // such as "I".
    this.isCapitalized = rawWord.length > 1 && (!!/[A-Z]/.exec(rawWord[0]));
    // this.pendingPunctuation = '';
  }

  /**
   * Wehther the token is similar to another token
   * @param b the token to compare with
   * @param exactMatch whether to apply an exact match (e.g., eastern token)
   * @returns
   */
  isSimilarTo(b: Token, exactMatch: boolean) {
    if (exactMatch) {
      return this.word == b.word;
    } else {
      const TOKEN_SIMILARITY = 2;
      return editDistance(this.word, b.word) < TOKEN_SIMILARITY;
    }
  }

  layout() {
    this.isLaidOut = true;
    this.lastLaidOutTime = performance.now();
  }

  merge(b: Token) {
    this.pending = b.raw;
    // if (!isLast || b.raw.length <= 1) return;
    // const lastB = b.raw[b.raw.length - 1];
    // if (MERGE_LAST_CHARACTER_SET.has(lastB) &&
    //     b.raw.substring(0, b.raw.length - 1) == this.raw) {
    //   this.raw = b.raw;
    // }
  }

  isEndOfSentence() {
    return endsWithAny(this.raw);
  }

  capitalizeRaw() {
    if (this.raw.length > 0) {
      this.raw = this.raw[0].toUpperCase() + this.raw.substring(1);
    }
  }

  isFinalized() {
    const FINALIZE_TIME_MS = 1000;
    return this.isLaidOut &&
        performance.now() - this.lastLaidOutTime > FINALIZE_TIME_MS;
  }

  print(isLast = false, isNextWordCapitalized = false, isEastern = false) {
    if (isLast) {
      if (this.isFinalized) {
        return this.raw;
      } else {
        // if (ENDING_PUNCTUATION_SET.has(this.raw[this.raw.length - 1])) {
        //   this.pendingPunctuation = this.raw[this.raw.length - 1];
        // }
        // Removes ending dot if not capitalized.
        return this.raw.replace(/[\.,!?]$/, '');
      }
    } else {
      if (this.raw.indexOf('\n') > 0) {
        return this.raw;
      } else if (this.isFinalized) {
        if (isNextWordCapitalized) {
          if (this.raw[this.raw.length - 1] == ',') {
            this.raw = this.raw.replace(/,$/, '.');
          }
          return this.raw + ' ';
        } else {
          if (ENDING_PUNCTUATION_SET.has(this.raw[this.raw.length - 1])) {
            this.raw = this.raw.replace(/[\.!?]$/, ',');
          }
          return this.raw + ' ';
        }
      } else {
        return this.raw + ' ';
      }
    }
  }
};

const SPEECH_PUNCTUATIONS_REGEX = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;
const SPEECH_EASTER_PUNCTUANTION_REGEX = /[.,，。]/g;

/**
 * Turns a string into an array of tokens.
 * @param s the incoming string
 * @param isEastern whether the string contains eastern word
 * @returns an array of tokens
 */
export function tokenize(s: string, isEastern = false): Token[] {
  if (s == null || s.trim().length == 0) {
    return [];
  }
  s = s.replace(/\n/gmi, '\n ').trim();
  let res: Token[] = null;

  // TODO: Western and esteran words coming together. Need to examine
  // character one by one.
  let tokens = isEastern ? s.split('') : s.split(' ');

  res = new Array(tokens.length);
  let ends = false;
  for (let i = 0; i < tokens.length; ++i) {
    res[i] = new Token(tokens[i], isEastern);
    if (i >= 1) {
      ends = res[i - 1].isEndOfSentence();
      if (ends) {
        res[i].capitalizeRaw();
      }
    } else {
      res[i].capitalizeRaw();
    }
  }
  return res;
};

// Maximum length of characters that may change in the transcription or
// translation text.
const MAX_PENDING_TOKENS = 10;
// Minimum number of characters that shares a common substring with the previous
// one.
const MIN_COMMON_TOKENS_LENGTH = 1;

let longestCommonSubtokens = new Array(MAX_PENDING_TOKENS + 1);

for (let i = 0; i < longestCommonSubtokens.length; ++i) {
  longestCommonSubtokens[i] = new Array(MAX_PENDING_TOKENS + 1);
}

const CORRECT_SRC = false;
/**
 * Merge existing tokens with incoming text.
 * Support merging \n in source
 * No spaces allowed after \n, or use .replace(/  +/g, ' '); to process spaces.
 * @param s
 * @param t
 */
export function tokenizedMerge(srcTokens: Token[], incomingText: string) {
  const isEastern = EASTERN_CHARACTER.test(incomingText);
  let dstTokens = tokenize(incomingText, isEastern);
  // Corner cases:
  if (srcTokens.length == 0) return dstTokens;

  // Finds the first token that two sentences share with each other.
  let indices = findFirstTokenIndexToMerge(srcTokens, dstTokens, isEastern);
  let srcStartIndex = indices[0], dstStartIndex = indices[1];

  // Gets stale results as stale.
  let res: Token[] = new Array(srcStartIndex);
  for (let i = 0; i < srcStartIndex; ++i) {
    res[i] = srcTokens[i];
  }

  // Merge common results as much as possible.
  let srcPointer = srcStartIndex, dstPointer = dstStartIndex;
  let srcToken = srcTokens[srcPointer];
  let dstToken = srcTokens[dstPointer];
  while (srcPointer < srcTokens.length && dstPointer < dstTokens.length) {
    srcToken = srcTokens[srcPointer];
    dstToken = dstTokens[dstPointer];

    if (srcToken.isSimilarTo(dstToken, isEastern)) {
      srcTokens[srcPointer].merge(dstToken);
      res.push(srcTokens[srcPointer]);
      ++srcPointer;
      ++dstPointer;
    } else if (
        dstPointer < dstTokens.length - 1 &&
        srcToken.isSimilarTo(dstTokens[dstPointer + 1], isEastern)) {
      // skip 1 words correction
      // no correction
      res.push(srcTokens[srcPointer]);
      ++dstPointer;
      ++srcPointer;
    } else if (
        dstPointer < dstTokens.length - 2 &&
        srcToken.isSimilarTo(dstTokens[dstPointer + 2], isEastern)) {
      // skip 2 words correction
      res.push(srcTokens[srcPointer]);
      dstPointer += 2;
      ++srcPointer;
    } else {
      break;
    }
  }
  // console.log(srcPointer, dstPointer, dstTokens);

  // Puts new results from dstToken.
  for (let i = dstPointer; i < dstTokens.length; ++i) {
    res.push(dstTokens[i]);
  }

  return res;
}

// Only for debugging use.
export function printTokens(tokens: Token[], isEastern = false) {
  let s = '';
  for (let i = 0; i < tokens.length; ++i) {
    if (tokens[i].raw.indexOf('\n') == tokens[i].raw.length - 1) {
      s += tokens[i].raw.trim() + '<br/>';
    } else {
      s += tokens[i].raw + ' ';
    }
  }
  return s.trim();
}

/**
 * Assumption: srcTokens are non-empty.
 * @param srcTokens
 * @param dstTokens
 * @returns
 */
export function findFirstTokenIndexToMerge(
    srcTokens: Token[], dstTokens: Token[], isEastern: boolean): number[] {
  let srcLength = srcTokens.length;
  let dstLength = dstTokens.length;
  let srcStart = 0;
  let dstStart = 0;

  if (srcLength > MAX_PENDING_TOKENS) {
    srcStart = srcLength - MAX_PENDING_TOKENS;
  }

  if (dstLength > MAX_PENDING_TOKENS) {
    dstStart = dstLength - MAX_PENDING_TOKENS;
  }

  let maxCommonPrefix = 0;
  let srcMaxMatchStartingIndex = 0;
  let dstMaxMatchStartingIndex = 0;

  // Builds the longestCommonSubtokens array from left to right.
  for (let srcPointer = srcStart; srcPointer <= srcLength; ++srcPointer) {
    for (let dstPointer = dstStart; dstPointer <= dstLength; ++dstPointer) {
      const srcIndex = srcPointer - srcStart;
      const dstIndex = dstPointer - dstStart;
      const srcTokenPrev = srcTokens[srcPointer - 1];
      const dstTokenPrev = dstTokens[dstPointer - 1];

      if (srcIndex == 0 || dstIndex == 0) {
        longestCommonSubtokens[srcIndex][dstIndex] = 0;
      } else if (srcTokenPrev.isSimilarTo(dstTokenPrev, isEastern)) {
        longestCommonSubtokens[srcIndex][dstIndex] =
            longestCommonSubtokens[srcIndex - 1][dstIndex - 1] + 1;
        if (longestCommonSubtokens[srcIndex][dstIndex] > maxCommonPrefix) {
          srcMaxMatchStartingIndex = srcPointer;
          dstMaxMatchStartingIndex = dstPointer;
          maxCommonPrefix = longestCommonSubtokens[srcIndex][dstIndex];
        }
      } else {
        longestCommonSubtokens[srcIndex][dstIndex] = 0;
      }
    }
  }

  return [
    srcMaxMatchStartingIndex - maxCommonPrefix,
    dstMaxMatchStartingIndex - maxCommonPrefix
  ];
};

export function getStringFromTokensToRender(
    ctx: CanvasRenderingContext2D, tokens: Token[], maxWidth: number,
    useHyphen = false): string {
  // let i = 0, last_i = 0, start_i = 0;
  let current_line = '';
  let text = '';

  for (let token_id = 0; token_id < tokens.length; ++token_id) {
    const token = tokens[token_id];
    if (token.isLaidOut) {
      current_line += token.raw;
      text += token.raw;
      if (token.raw.indexOf('\n') < 0) {
        current_line += ' ';
        text += ' ';
      } else {
        current_line = '';
      }
    } else {
      if (isLineExceed(ctx, current_line + token.raw, maxWidth)) {
        current_line = token.raw + ' ';
        text += '\n' + token.raw + ' ';
        if (token_id > 0) {
          const prevToken = tokens[token_id - 1];
          prevToken.raw += '\n';
        }
      } else {
        current_line += token.raw + ' ';
        text += token.raw + ' ';
      }
      token.isLaidOut = true;
    }
  }

  // console.log(text, tokens);
  return text.trim();
}

export function tokens2str(tokens: Token[], isEastern = false): string {
  let s = '';
  for (let i = 0; i < tokens.length; ++i) {
    const token = tokens[i];
    const isLast = i == tokens.length - 1;
    const isNextWordCapitalized = !isLast && tokens[i + 1].isCapitalized;
    s += token.print(isLast, isNextWordCapitalized);
  }

  return s.trim();
}

/**
 * Whether the new tokens are completely new sentences after a pause.
 * @param src
 * @param dst
 * @returns
 */
export function areTokensNew(src: Token[], dst: Token[]) {
  const MIN_NUM_TOKENS = 3;
  if (src.length > MIN_NUM_TOKENS && dst.length < MIN_NUM_TOKENS &&
      dst.length > 0) {
    return true;
  } else {
    return false;
  }
}
