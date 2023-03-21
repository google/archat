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
 * Constant message types in communication.
 */
export const MESSAGE_TYPES = {
  getStream: 'GET_STREAM',
  closeStream: 'CLOSE_STREAM',
  rtcAnswer: 'RTC_ANSWER',
  rtcIce: 'RTC_ICE',
  rtcOffer: 'RTC_OFFER',
  setScene: 'SET_SCENE',
  setCaptions: 'SET_CAPTIONS',
  setImage: 'SET_IMAGE',
  // callLaMDA: 'CALL_LAMDA',
  getCurrentScene: 'GET_CURRENT_SCENE',
  currentScene: 'CURRENT_SCENE',
}
