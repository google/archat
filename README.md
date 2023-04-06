# ARChat: A Rapid Prototyping Platform for Augmented Communication

Copyright 2023 Google LLC


[![ARChat Visual Captions](images/visual_captions_CHI2023.gif)](https://research.google/pubs/pub52074)


**ARChat** is a research project written in TypeScript and JavaScript and aims
to render live captions and relevant images directly onto the camera stream for
online video conferences. It is an example Chrome Plugin that helps developers
and researchers to prototype novel AR experiences with real-time and real-world
conversations. **ARChat** is firstly introduced in our ACM CHI 2023 paper,
entitled "Visual Captions: Augmenting Verbal Communication With On-the-fly
Visuals", and is also used in "Modeling and Improving Text Stability in Live
Captions" and "Rapsai: Accelerating Machine Learning Prototyping of Multimedia
Applications Through Visual Programming". Please cite ARChat as follows if you
find it useful in your projects:

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

## Chrome Plugin Key

Before running this plugin, you need to apply a Chrome plugin key by following
[this page](https://developer.chrome.com/docs/extensions/mv3/manifest/key).
Then replace line 5 in `manifest.json` with your own key.

## Getting Started

Install `node.js` if you haven't done so. Here is
[a tutorial](https://changelog.com/posts/install-node-js-with-homebrew-on-os-x)

For the first time, run

```sh
npm install
```

Next, run the following command to build the Chrome plugin:

```sh
npm run build
```

## API Keys

To run Visual Captions, you need to provide your own API keys in api_keys.ts
file for the extension to work properly. Without API keys, you can also
experience live captions in video confereing as instructed below:

### To install the plugin

1.  Open a Chrome browser and navigate to `chrome://extensions/`.
2.  Enable `Developer mode` on the top right corner of the Extensions page.
3.  Click `Load unpacked` and select the `output` folder of this file as a
    Chrome extension.
4.  Go to https://meet.google.com and start a new meeting. Follow
    go/archat-tutorial for the complete tutorial to get started.

### Directory Structure

Main directories:

*   `background` contains the script that runs persistently.
*   `content` contains the main front-end script.
*   `scenes` contains the major scenes (apps or effects) to apply onto GVC
    cameras.
*   `models` contains interfaces or wrappers of machine learning models.
*   `output` contains the compiled plugin, which is not included in the Git.
*   `options` contains the settings in the extension's option page.

An `output` folder will be generated after building the plugin.

### How to collaborate and add new scenes

First of all, you need to request to be added to go/archat-members. We welcome
contributors to add new scenes and take ownership of your AR experience:

1.  Copy `PassThrough` folder into a new folder of your use case and add logic
    there.
2.  Change the class name of your scene.
3.  (optional) Add new machine learning models into the `models` folder.
4.  Add your scene script to `background/background.ts` by searching the
    `#NewScene` hashtag:

## References

ARChat has been leveraged in the following research projects. Consider citing
our Visual Captions paper and related works when appropriate:

Xingyu "Bruce" Liu, Vladimir Kirilyuk, Xiuxiu Yuan, Peggy Chi, Xiang "Anthony"
Chen, Alex Olwal, and Ruofei Du. 2023. Visual Captions: Augmenting Verbal
Communication With On-the-fly Visuals. Proceedings of the 2023 CHI Conference on
Human Factors in Computing Systems, pp. 20. DOI:
https://doi.org/10.1145/3544548.3581566

Ruofei Du, Na Li, Jing Jin, Michelle Carney, Scott Miles, Maria Kleiner, Xiuxiu
Yuan, Yinda Zhang, Anuva Kulkarni, Xingyu "Bruce" Liu, Ahmed Sabie, Sergio
Escolano, Abhishek Kar, Ping Yu, Ram Iyengar, Adarsh Kowdle, and Alex Olwal.
2023. Rapsai: Accelerating Machine Learning Prototyping of Multimedia
Applications Through Visual Programming. Proceedings of the 2023 CHI Conference
on Human Factors in Computing Systems, pp. 23. DOI:
https://doi.org/10.1145/3544548.3581338 (Best Paper Honorable Mention)

Xingyu "Bruce" Liu, Jun Zhang, Leonardo Ferrer, Susan Xu, Vikas Bahirwani, Boris
Smus, Alex Olwal, and Ruofei Du. 2023. Modeling and Improving Text Stability in
Live Captions. Extended Abstracts of the 2023 CHI Conference on Human Factors in
Computing Systems, pp. 8. DOI: https://doi.org/10.1145/3544549.3585609

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

@inproceedings{Liu2023Modeling,
  title = {{Modeling and Improving Text Stability in Live Captions}},
  author = {Liu, Xingyu and Zhang, Jun and Ferrer, Leonardo and Xu, Susan and Bahirwani, Vikas and Smus, Boris and Olwal, Alex and Du, Ruofei},
  booktitle = {Extended Abstracts of the 2023 CHI Conference on Human Factors in Computing Systems},
  year = {2023},
  publisher = {ACM},
  series = {CHI EA},
  doi = {10.1145/3544549.3585609},
}

@inproceedings{Du2023Rapsai,
  title = {{Rapsai: Accelerating Machine Learning Prototyping of Multimedia Applications Through Visual Programming}},
  author = {Du, Ruofei and Li, Na and Jin, Jing and Carney, Michelle and Miles, Scott and Kleiner, Maria and Yuan, Xiuxiu and Zhang, Yinda and Kulkarni, Anuva and Liu, Xingyu and Sabie, Ahmed and Escolano, Sergio and Kar, Abhishek and Yu, Ping and Iyengar, Ram and Kowdle, Adarsh and Olwal, Alex},
  booktitle = {Proceedings of the 2023 CHI Conference on Human Factors in Computing Systems},
  year = {2023},
  publisher = {ACM},
  series = {CHI},
  doi = {10.1145/3544548.3581338},
}
```
