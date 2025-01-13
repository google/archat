import { gpt3ApiKey, googleApiKey, bingApiKey } from '../api_keys';
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { Options } from '../options/options';

// Type definitions
type ModelType = 'davinci' | 'curie' | 'ada';

interface GPT3Config {
  max_tokens: number;
  temperature: number;
  frequency_penalty: number;
  stop: string[];
}

// Constants
const MODELS: Record<ModelType, string> = {
  davinci: 'davinci:ft-personal-2022-08-10-08-50-23',
  curie: 'curie:ft-personal-2022-08-10-09-30-02',
  ada: 'ada:ft-personal-2022-08-10-16-42-21',
};

const DEFAULT_GPT3_CONFIG: GPT3Config = {
  max_tokens: 64,
  temperature: 0.0,
  frequency_penalty: 0.5,
  stop: ['\n'],
};

// Gemini initialization
const createGemini = (apiKey: string): GoogleGenerativeAI => {
  return new GoogleGenerativeAI(apiKey);
};

const geminiModel: GenerativeModel = createGemini(googleApiKey).getGenerativeModel({
  model: "gemini-1.5-pro-latest",
  generationConfig: {
    temperature: 0.8,
    responseMimeType: "application/json"
  },
});

// GPT-3 functions
export async function getGpt3RawResult(
  text: string, 
  prompt_prefix: string, 
  prompt_suffix: string, 
  modelType: ModelType
): Promise<string | undefined> {
  if (text.length === 0) {
    return undefined;
  }
  const prompt = `${prompt_prefix}${text}${prompt_suffix}`;
  const messages = await callGPT3(prompt, modelType);
  return messages.choices[0]?.text;
}

async function callGPT3(prompt: string, modelType: ModelType): Promise<any> {
  const data = {
    prompt,
    model: MODELS[modelType],
    ...DEFAULT_GPT3_CONFIG
  };

  const response = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gpt3ApiKey}`
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Gemini functions
export async function getGeminiRawResult(text: string): Promise<string | undefined> {
  if (text.length === 0) {
    return undefined;
  }
  return callGemini(text);
}

async function callGemini(text: string): Promise<string> {
  try {
    const prompt = `Analyze the following text and identify concrete nouns or noun phrases that could be visualized with an image. For each identified noun or phrase, provide a suggested image search query. Format your response as a semicolon-separated list of "noun/phrase from suggested search query".

    Rules:
    1. Focus on specific, tangible nouns or noun phrases that would make good image subjects.
    2. Prioritize proper nouns, locations, objects, and well-defined concepts.
    3. Avoid abstract concepts, general categories, or vague terms.
    4. For compound nouns or phrases, use the full phrase as both the noun and the search query.
    5. If a noun is part of a larger context, include relevant context in the search query.
    6. Limit your response to the most relevant and important nouns/phrases (max 5).
    7. Do not include any explanations or additional text in your response.
    
    Example input: "I visited Palo Alto Central Park yesterday and saw a red-tailed hawk perched on an old oak tree."
    
    Example output:
    Palo Alto Central Park from Palo Alto Central Park;red-tailed hawk from red-tailed hawk perched on tree;oak tree from old oak tree in park

    Example input: "Did you want to go to san francisco zoo today?"
    
    Example output:
    San Francisco Zoo from San Francisco
    
    Now, analyze the following text:`
    const result = await geminiModel.generateContent(prompt + text);
    return result.response.text();
  } catch (error) {
    console.error('Error calling Gemini:', error);
    throw error;
  }
}

interface BingImageSearchResult {
  value: Array<{
    thumbnailUrl: string;
  }>;
}

export async function getBingSearchThumbnail(
  searchTerm: string, 
  options: Options
): Promise<string> {
  const query = encodeURIComponent(searchTerm);
  const url = new URL('https://api.bing.microsoft.com/v7.0/images/search');
  
  url.search = new URLSearchParams({
    q: query,
    mkt: 'en-us',
    safeSearch: 'moderate',
    count: "1",
    offset: "0"
  }).toString();

  try {
    const response = await fetch(url.toString(), {
      headers: { 'Ocp-Apim-Subscription-Key': bingApiKey },
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BingImageSearchResult = await response.json();

    if (!result.value || result.value.length === 0) {
      console.warn(`No results found for search term: ${searchTerm}`);
      return '';
    }

    const thumbnailUrl = result.value[0].thumbnailUrl;
    const ratioParam = searchTerm.toLowerCase().includes('emoji') 
      ? options.bingEmojiRatio 
      : options.bingImageRatio;

    return `${thumbnailUrl}${ratioParam}&c=7`;
  } catch (error) {
    console.error('Error in getBingSearchThumbnail:', error);
    return '';
  }
}