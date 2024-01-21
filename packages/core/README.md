<img src="https://github.com/tcavenezuela/simconnect.js/assets/8359234/e8a8b35c-fc78-4615-a39f-db1a840bfaa9" alt="simconnect.js" width="250"/> 

[![npm version](https://badge.fury.io/js/simconnect.js.svg)](https://badge.fury.io/js/simconnect.js)
![ts](https://badgen.net/badge/Built%20With/TypeScript/blue)
[![release](https://github.com/tcavenezuela/simconnect.js/actions/workflows/release.yml/badge.svg?branch=master)](https://github.com/tcavenezuela/simconnect.js/actions/workflows/release.yml)

[SimConnect](https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/SimConnect_SDK.htm) client implementation for NodeJS.

# simconnect.js

This package allows you to use simconnect with Node.JS.

- [Read our contribution guidelines](https://github.com/tcavenezuela/simconnect.js/blob/master/.github/CONTRIBUTING.md).

## Quick start

1. Install `simconnect.js`:

```bash
yarn add simconnect.js
```

2. Import the module and create a new connection using the `open` method:

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

## Methods:

### Open:

Opens a connection with a running simulator stream:

```js
open('My SimConnect client', Protocol.FSX_SP2);
```

open method takes 2 required arguments and 1 optional:

- appName[string]: connection identifier in string.
- protocolVersion[Protocol]: minimum simulator protocol enum, you can get this importing `Protocol` from simconnect.js.
- options[ConnectionOptions]: connection options (host, port) commonly used when you whan to use connect a simulator via network.

this method returns:

- recvOpen: contains simulator information.
- handle: used for accessing the SimConnect APIs.

## Running simconnect over network:

If the Node.js application runs on the same computer as the flight simulator you don't need to worry about this part.

To connect from an external computer you must configure SimConnect to accept connections from other hosts. This procedure is also described in the official docs, but here is the short version:

1. Open `SimConnect.xml`.

    - FSX: `X:\Users\<USER>\AppData\Roaming\Microsoft\FSX`
    - MSFS: `X:\Users\<USER>\AppData\Local\Packages\Microsoft.FlightSimulator_**********\LocalCache`.

1. Set property `<Address>0.0.0.0</Address>`. Example of a working SimConnect.xml file:

    ```xml
    <?xml version="1.0" encoding="Windows-1252"?>
    <SimBase.Document Type="SimConnect" version="1,0">
        <Filename>SimConnect.xml</Filename>
        <SimConnect.Comm>
            <Protocol>IPv4</Protocol>
            <Scope>local</Scope>
            <Port>5111</Port>
            <MaxClients>64</MaxClients>
            <MaxRecvSize>41088</MaxRecvSize>
            <Address>0.0.0.0</Address>
        </SimConnect.Comm>
    </SimBase.Document>
    ```

Connecting from a remote script can be done by providing the IP address of the flight simulator PC and the port number when calling `open`:

```js
const options = { remote: { host: 'localhost', port: 5111 } };

open('My SimConnect client', Protocol.FSX_SP2, options).then(/* ... */).catch(/* try again? */);
```

Note that if no connection options are specified, `simconnect.js` will auto-discover connection details in the following order:

1. Look for a [`SimConnect.cfg`](https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/SimConnect_CFG_Definition.htm) in the folder where Node.js is located. If the script is running in Electron, this will be the folder where the Electron executable is installed.
2. Look for a [`SimConnect.cfg`](https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/SimConnect_CFG_Definition.htm) in the user's home directory (`%USERPROFILE%`, eg. `C:\Users\<username>`)
3. Look for a named pipe in the Windows registry, automatically set by the simulator
4. Look for a port number in the Windows registry, automatically set by the simulator. simconnect.js will then connect to `localhost:<port>`.
