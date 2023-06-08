# VC1.5K Dataset

## Overview

We collected a total of 1922 sentences (transcribed speech) from 42
YouTube videos (1201 sentences) and the DailyDialog dataset (721 sentences).
Videos were selected from various topics ranging from tour guide, lectures to
documentaries etc. Please refer to our paper for data collectio protocol.

## Content

* text: The current sentence in the conversation.
* type: The type of the conversation.
* topic: The topic of the conversation.
* context: A brief description of the conversational context.
* prev: The previous two sentences of the current sentence.
* ind: Index
* visual_mturk1: The visual content submitted by MTurk worker #1
* visual_mturk1_source: The visual source submitted by MTurk worker #1
* visual_mturk1_type: The visual type submitted by MTurk worker #1
* visual_mturk2: The visual content submitted by MTurk worker #2
* visual_mturk2_source: The visual source submitted by MTurk worker #2
* visual_mturk2_type: The visual type submitted by MTurk worker #2
* visual_mturk3: The visual content submitted by MTurk worker #3
* visual_mturk3_source: The visual source submitted by MTurk worker #3
* visual_mturk3_type: The visual type submitted by MTurk worker #3
* visual_mturk4: The visual content submitted by MTurk worker #4
* visual_mturk4_source: The visual source submitted by MTurk worker #4
* visual_mturk4_type: The visual type submitted by MTurk worker #4
* top_visual: A list of the all the visuals mentioned by crowdworkers combined and counted, decreasing order.

## Reference

Please cite ARChat as follows if you find it useful in your projects:

```bibtex
@inproceedings{Liu2023Visual,
  title = {{Visual Captions: Augmenting Verbal Communication With On-the-fly Visuals}},
  author = {Liu, Xingyu and Kirilyuk, Vladimir and Yuan, Xiuxiu and Chi, Peggy and Chen, Xiang and Olwal, Alex and Du, Ruofei},
  booktitle = {Proceedings of the 2023 CHI Conference on Human Factors in Computing Systems},
  year = {2023},
  publisher = {ACM},
  series = {CHI},
  doi = {10.1145/3544548.3581566},
}
```
