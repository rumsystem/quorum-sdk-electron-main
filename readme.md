# Quorum-sdk-electron-main

Quorum-sdk includes two npm packages:

1. Quorum-sdk-electron-main
2. [Quorum-sdk-electron-renderer](https://bitbucket.org/pressone/quorum-sdk-electron-renderer)

![](https://user-images.githubusercontent.com/8716838/155666826-cf8ac265-232f-4b35-893d-32dea6b2005c.png)

> Quorum-sdk-electron-main is the package for your Electron main process to run a [Quorum](https://github.com/rumsystem/quorum) server.

## Install

```
$ yarn add quorum-sdk-electron-main
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