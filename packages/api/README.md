<img src="https://github.com/tcavenezuela/simconnect.js/assets/8359234/e8a8b35c-fc78-4615-a39f-db1a840bfaa9" alt="simconnect.js" width="250"/> 

[![npm version](https://badge.fury.io/js/@simconnect.js%2Fapi.svg)](https://badge.fury.io/js/@simconnect.js%2Fapi)
![ts](https://badgen.net/badge/Built%20With/TypeScript/blue)
[![release](https://github.com/tcavenezuela/simconnect.js/actions/workflows/release.yml/badge.svg?branch=master)](https://github.com/tcavenezuela/simconnect.js/actions/workflows/release.yml)

[SimConnect](https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/SimConnect_SDK.htm) client implementation for NodeJS.

# @simconnect.js/api

This package provides a more user-friendly wrapper with predefined simvars values.

- [Read our contribution guidelines](https://github.com/tcavenezuela/simconnect.js/blob/master/.github/CONTRIBUTING.md).

## Quick start

1. Install required libraries:

```bash
yarn add simconnect.js @simconnect.js/api
```

2. Import the module and create a new connection constructor:

```js
import { SIMCONNECT_API } from "@simconnect.js/api";

const simconnect = new SIMCONNECT_API();

simconnect.connect({
    autoReconnect: true,
    retries: Infinity,
    retryInterval: 5,
    onConnect: connect,
    onRetry: (_retries, interval) =>
      console.log(`Connection failed: retrying in ${interval} seconds.`),
    onException: (e) => {
      console.log("exception", e);
    },
  });

async function connect(handle, recvOpen) {
  console.log(`Simulator connected`, recvOpen);

  const [start, stop] = simconnect.schedule(
    (data) => {
      console.log("data", data);
    },
    1000,
    ["PLANE ALTITUDE"],
    true
  );

  const unpauseOff = simconnect.on(SystemEvents.UNPAUSED, () => {
    console.log(`sim unpaused`);
    unpauseOff();
  });

  const unpauseOn = simconnect.on(SystemEvents.PAUSE, () => {
    console.log(`sim paused`);
    unpauseOn();
  });
}
```

## Methods:

### connect:

Opens a connection with a running simulator stream:

```js
simconnect.connect({
  autoReconnect: true,
  retries: Infinity,
  retryInterval: 5,
  onConnect: connect,
  onRetry: (_retries, interval) =>
    console.log(`Connection failed: retrying in ${interval} seconds.`),
  onException: (e) => {
    console.log("exception", e);
  },
});
```

connect method takes several options:

- autoReconnect[boolean]: Boolean indicator that performs an automatic reconnection when it is detected that the simulator is not connected or stopped being connected.
- retries[number]: Number of attempts it will make when making a reconnection.
- retryInterval[number]: Interval in seconds that it will do when it is making a reconnection, example: if you put 5, every 5 seconds it will try to reconnect.
- onConnect[function]: Callback function that is executed when a succesfully connection is made.
- onRetry[function]: Callback function that is executed when a retry is made.
- onException[function]: Callback function that is executed when an exception is made.

### on:

Starts listening for a specific simconnect event with a specific handler. Returns a corresponding arg-less `off()` function to clean up the listener. See the "System events" section below for details on the event definition.

#### System events (used for on/off handling):

All event names in https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Events_And_Data/SimConnect_SubscribeToSystemEvent.htm are supported as constants on the `SystemEvents` object, importable alongside SIMCONNECT_API:

```javascript
import { SystemEvents, SIMCONNECT_API } from "@simconnect.js/api";

const simconnect = new SIMCONNECT_API();

simconnect.connect({
  retries: Infinity,
  retryInterval: 5,
  onConnect: () => {
    simconnect.on(SystemEvents.PAUSED, () => {
      // ...
    });
  },
});
```

Note that the event names are keys from the `SystemEvents` object, using UPPER_SNAKE_CASE, not strings.

### off:

Stop listening for a specific simconnect event with a specific handler. You'll typically not need to call this function directly, as you can just use the function that `on` returns. See the "System events" section above for more details on the event definition.

### get:

Accepts a list of simvars (with spaces or underscores) and async-returns a key/value pair object with each simvar as key (with spaces replaced by underscores).

### schedule:

Sets up a periodic call to `handler` every `interval` milliseconds with the result of `get(...propNames)`. Returns an arg-less `off()` to end the scheduled call.

### set:

Accepts a single simvar and the value its should be set to. This will throw "SimVar ... is not settable" when attempting to set the value for a read-only variable.

### trigger:

Triggers a simconnect event, with optional value.

### Supported Simvars:

All simvars are supported, barring several simvars with data types for which I need to figure out how to actually deference then, such as LatLonAlt structs, or the (super rare) bool/string combination, as well a any simvar that is officially deprecated, or marked as "legacy, do not use these going forward". If you get an error about an unknown Simvar, look up that variable on the [SimConnect variables list](https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Simulation_Variables.htm) and see if it's either deprecated, or part of a collection that is considered legacy.

- [x] Camera Variables (_not verified_)
- [x] Services Variables (_not verified_)
- [x] Miscellaneous Variables (_not verified_)
- Aircraft SimVars:
  - [x] Aircraft Autopilot/Assistant Variables (_not verified_)
  - [x] Aircraft Brake/Landing Gear Variables (_not verified_)
  - [x] Aircraft Control Variables (_not verified_)
  - [x] Aircraft Electrics Variables (_not verified_)
  - [x] Aircraft Engine Variables (_not verified_)
  - [x] Aircraft Flight Model Variables (_not verified_)
  - [x] Aircraft Fuel Variables (_not verified_)
  - [x] Aircraft Misc. Variables (_not verified_)
  - [x] Aircraft Radio Navigation Variables (_not verified_)
  - [x] Aircraft System Variables (_not verified_)
  - [x] Helicopter Variables (_not verified_)

Further more, all environment variables listed over on https://docs.flightsimulator.com/html/Additional_Information/Reverse_Polish_Notation.htm#EnvironmentVariables are supported as well.

### Supported SimEvents:

SimEvents are resolved by key name, so as long as you use a valid key name, you can trigger it.

> See https://docs.flightsimulator.com/html/Programming_Tools/Event_IDs/Event_IDs.htm for the full list.
