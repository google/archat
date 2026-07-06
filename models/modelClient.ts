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
  if (!text || text.trim().length === 0) {
    console.log('VC - Empty text provided to getGeminiRawResult');
    return undefined;
  }
  
  try {
    return await callGemini(text);
  } catch (error) {
    console.error('VC - Error in getGeminiRawResult:', error);
    return undefined;
  }
}

async function callGemini(text: string): Promise<string> {
  try {
    // Improved prompt with clearer instructions and better examples
    const prompt = `Analyze the following speech text and identify concrete nouns or phrases that would make good visuals in a video call.
    
    For each identified noun/phrase, provide a suggested image search query.
    Format your response as a semicolon-separated list of "noun/phrase from suggested search query".

    Rules:
    1. Focus on SPECIFIC, tangible items that would enhance a video call with relevant visuals
    2. Prioritize proper nouns, locations, objects, and well-defined concepts mentioned in the speech
    3. Avoid abstract concepts or vague terms that wouldn't make clear images
    4. Include "emoji" in search query if the concept would work well as an emoji
    5. For maps or locations, include "map" in the search query
    6. Limit to 2-3 most relevant visual items from the text
    7. IMPORTANT: Respond ONLY with the semicolon-separated list, no explanations or additional text

    Examples:

    Input: "I visited Golden Gate Bridge yesterday and saw a beautiful sunset."
    Output: Golden Gate Bridge from Golden Gate Bridge San Francisco;sunset from beautiful sunset over ocean

    Input: "I'm feeling happy today because I got a new puppy!"
    Output: happy face from happy face emoji;puppy from cute puppy

    Input: "Let me show you how to get to the restaurant. It's on Main Street near the library."
    Output: directions from map of Main Street;restaurant from restaurant exterior

    Now, analyze this speech text:`;

    // Call Gemini model with the improved prompt
    const result = await geminiModel.generateContent(prompt + text);
    const response = result.response.candidates[0];
  
    console.log('VC - Gemini raw response:', response);
    
    // Validate response format and clean it if needed
    return extractSuggestionsFromResponse(response.content.parts[0].text.trim());
  } catch (error) {
    console.error('VC - Error calling Gemini:', error);
    // Return a fallback empty result instead of throwing
    return '';
  }
}

function extractSuggestionsFromResponse(response: string): string {
  try {
    let jsonData: any;
    
    try {
      jsonData = JSON.parse(response);
    } catch (e) {
      const jsonMatch = response.match(/\{.*("suggested_search_queries"|"visuals").*\}/s);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    }
    
    // Handle Format 1: {"suggested_search_queries": ["noun from query", "noun from query"]}
    if (jsonData.suggested_search_queries && Array.isArray(jsonData.suggested_search_queries)) {
      return jsonData.suggested_search_queries.join(';');
    }
    
    // Handle Format 2: {"visuals": [{"noun": "X", "search_query": "Y"}, ...]}
    if (jsonData.visuals && Array.isArray(jsonData.visuals) && 
        jsonData.visuals[0] && typeof jsonData.visuals[0] === 'object') {
      return jsonData.visuals.map((item: any) => 
        `${item.noun} from ${item.search_query}`
      ).join(';');
    }
    
    // Handle Format 3: {"visuals": ["noun from query", "noun from query"]}
    if (jsonData.visuals && Array.isArray(jsonData.visuals) && 
        typeof jsonData.visuals[0] === 'string') {
      return jsonData.visuals.join(';');
    }
    
    // Last resort: check for any field that contains an array of strings with "from" in them
    for (const key in jsonData) {
      if (Array.isArray(jsonData[key])) {
        if (typeof jsonData[key][0] === 'string' && jsonData[key][0].includes(' from ')) {
          return jsonData[key].join(';');
        } else if (typeof jsonData[key][0] === 'object') {
          // Try to extract noun/search_query pairs from any object array
          try {
            const items = jsonData[key].map((item: any) => {
              const noun = item.noun || item.name || item.item || item.visual || '';
              const query = item.search_query || item.query || item.search || '';
              if (noun && query) {
                return `${noun} from ${query}`;
              }
              return null;
            }).filter(Boolean);
            
            if (items.length > 0) {
              return items.join(';');
            }
          } catch (e) {
            console.warn('VC - Failed to extract from object array:', e);
          }
        }
      }
    }
    
    console.warn('VC - Could not find suggestions in response:', response);
    return '';
  } catch (error) {
    console.error('VC - Error parsing Gemini response:', error);
    
    // Last resort: try to extract anything that looks like "X from Y" using regex
    const fromMatches = response.match(/[^;]+? from [^;]+/g);
    if (fromMatches && fromMatches.length > 0) {
      return fromMatches.join(';');
    }
    
    return '';
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