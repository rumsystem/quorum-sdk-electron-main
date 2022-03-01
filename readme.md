# Quorum-sdk-electron-main

Quorum-sdk includes two npm packages:

1. Quorum-sdk-electron-main
2. [Quorum-sdk-electron-renderer](https://bitbucket.org/pressone/quorum-sdk-electron-renderer)

![](https://user-images.githubusercontent.com/8716838/155664505-9385309e-9b9d-4a74-b6d3-f68e0930b4c0.png)

> Quorum-sdk-electron-main is the package for your Electron main process to run a [Quorum](https://github.com/rumsystem/quorum) server.

## Install

```
$ npm install quorum-sdk-electron-main
```

## Setup

In Electron main.js

```js
const Quorum = require('quorum-sdk-electron-main');

Quorum.init();
```

## Setup for Electron Building

In package.json, add `extraResources` config for adding quorum binary to electron app when packaging:

```json
{
  ...
  "build": {
    ...
    "mac": {
      ...
      "extraResources": [
        "./node_modules/quorum-sdk-electron-main/quorum_bin/quorum_darwin"
      ]
    },
    "win": {
      ...
      "extraResources": [
        "./node_modules/quorum-sdk-electron-main/quorum_bin/quorum_win.exe"
      ]
    },
    "linux": {
      ...
      "extraResources": [
        "./node_modules/quorum-sdk-electron-main/quorum_bin/quorum_linux"
      ]
    }
  }
}
```

## Final

You have installing and setup quorum server in main process, for the next step, your can go to setup [Quorum-sdk-electron-renderer](https://bitbucket.org/pressone/quorum-sdk-electron-renderer) and interact with this quorum server.