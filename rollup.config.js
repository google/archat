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
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

export default [
  {
    input: 'options/options.ts',
    output: {
      dir: 'output',
      format: 'es',
      generatedCode: 'es2015',
    },
    plugins: [typescript(), nodeResolve()]
  },
  {
    input: 'content/client.ts',
    output: {
      dir: 'output',
      format: 'es',
      generatedCode: 'es2015',
    },
    plugins: [typescript(), nodeResolve()]
  },
  {
    input: 'content/interactive_image.ts',
    output: {
      dir: 'output',
      format: 'es',
      generatedCode: 'es2015',
    },
    plugins: [typescript(), nodeResolve()]
  },
  {
    input: 'background/background.ts',
    output: {
      dir: 'output',
      name: 'background',
      format: 'iife',
      generatedCode: 'es2015',
    },
    plugins: [
      typescript(), nodeResolve(), copy({
        targets: [
          {
            src: [
              'background/background.html', 'options/options.html',
              'manifest.json', 'content/content.js'
            ],
            dest: 'output'
          },
          {src: 'images/*', dest: 'output/images'},
          {src: 'models/nlp/*', dest: 'output/nlp'}
        ]
      })
    ]
  }
];
