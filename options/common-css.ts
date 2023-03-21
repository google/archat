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
import {css} from 'lit';

export const COMMON_CSS = css`
:host {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border-radius: 20px;
  background-color: white;
  width: 444px;
  padding-top: 24px;
  padding-bottom: 24px;
  margin-left: 24px;
}

.row {
  display: flex;
  flex-direction: row;
}

.title {
  font-size: 22px;
}

.divider {
  width: 100%;
  border-bottom: 1px solid #EBEBEB;
}

.m40 {
  margin-left: 40px;
  margin-right: 60px;
}

.m24 {
  margin-left: 24px;
  margin-right: 60px;
}

.m60 {
  margin-left: 60px;
  margin-right: 60px;
}

.mb12 {
  margin-bottom: 12px;
}

select {
  border: none;
  color: #5F6368;
}

.left-right {
  display: flex;
  justify-content: space-between;
}

.left-right > select {
  text-align: end;
  padding-right: 8px;
}

#source-language, #target-language {
  width: 160px;
}

.left-right #source-language {
  margin-left: -4px;
  text-align: start;
}

.mask {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: white;
}

.range-input {
  margin: 0;
}
`;


export const BASE_CSS = css`
:host {
  display: inline-block;
  font-size: 14px;
}

video {
  transform: rotateY(180deg);
  width: 100%;
  margin-bottom: 10px;
}

select {
  margin-bottom: 8px;
  width: 100%;
}

.row {
  display: flex;
  align-items: center;
  padding: 16px;
}

.preview {
  width: 720px;
}
`;
