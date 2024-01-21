<img src="https://github.com/tcavenezuela/simconnect.js/assets/8359234/e8a8b35c-fc78-4615-a39f-db1a840bfaa9" alt="simconnect.js" width="250"/> 

[![npm version](https://badge.fury.io/js/simconnect.js.svg)](https://badge.fury.io/js/simconnect.js)
![ts](https://badgen.net/badge/Built%20With/TypeScript/blue)
[![release](https://github.com/tcavenezuela/simconnect.js/actions/workflows/release.yml/badge.svg?branch=master)](https://github.com/tcavenezuela/simconnect.js/actions/workflows/release.yml)

[SimConnect](https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/SimConnect_SDK.htm) client implementation for NodeJS.

## Packages

- [✈️ `simconnect.js`](https://github.com/tcavenezuela/simconnect.js/tree/master/packages/core) Core package that allows you to use simconnect with Node.JS.
- [🚀 `@simconnect.js/api`](https://github.com/tcavenezuela/simconnect.js/tree/master/packages/api) - API package that provides a more user-friendly wrapper with predefined simvars values.

## Quick start

### Installation

```bash
yarn install simconnect.js
```

> Refer to the [package documentation](https://github.com/tcavenezuela/simconnect.js/tree/master/packages/core) for details on SimConnect APIs and usage and the [official SimConnect documentation](https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/SimConnect_API_Reference.htm).

```js
import { open, Protocol } from 'simconnect.js';

const EVENT_ID_PAUSE = 1;

open('My SimConnect client', Protocol.FSX_SP2)
    .then(function ({ recvOpen, handle }) {
        console.log('Connected to', recvOpen.applicationName);

        handle.on('event', function (recvEvent) {
            switch (recvEvent.clientEventId) {
                case EVENT_ID_PAUSE:
                    console.log(recvEvent.data === 1 ? 'Sim paused' : 'Sim unpaused');
                    break;
            }
        });
        handle.on('exception', function (recvException) {
            console.log(recvException);
        });
        handle.on('quit', function () {
            console.log('Simulator quit');
        });
        handle.on('close', function () {
            console.log('Connection closed unexpectedly (simulator CTD?)');
        });

        handle.subscribeToSystemEvent(EVENT_ID_PAUSE, 'Pause');
    })
    .catch(function (error) {
        console.log('Connection failed:', error);
    });
```

## Motivation

I found on the internet several libraries made by simmers and i found that there are several very good libraries but everything was scattered between different repositories. With this package I wanted to mix the best of the community with a monorepo, so we can have the best possible library 🥳.

**simconnect.js** is based on the following repositories:

- [node-simconnect](https://github.com/EvenAR/node-simconnect) by [Even Rognlien](https://github.com/EvenAR)
- [msfs-simconnect-api-wrapper](https://github.com/Pomax/msfs-simconnect-api-wrapper) by [Pomax](https://github.com/Pomax)

_Special thanks_ ✨ to these repositories and their creators, without them simconnect.js would not be possible. 🚀🥳

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you want contribute, follow contribution guidelines here: [Contribution Guideline](https://github.com/tcavenezuela/simconnect.js/blob/master/.github/CONTRIBUTING.md).

## License

Distributed under the MIT License. See [LICENSE](https://github.com/tcavenezuela/simconnect.js/blob/master/LICENSE) for more information.