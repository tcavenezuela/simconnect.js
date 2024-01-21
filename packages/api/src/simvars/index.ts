/* eslint-disable @typescript-eslint/ban-ts-comment */
// See https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Simulation_Variables.htm

import { AircraftAutopilotAssistantVariables } from './aircraft-autopilot-assistant-variables';
import { AircraftBakeLandingGearVariables } from './aircraft-brake-landing-gear-variables';
import { AircraftControlVariables } from './aircraft-control-variables';
import { AircraftElectricsVariables } from './aircraft-electrics-variables';
import { AircraftEngineVariables } from './aircraft-engine-variables';
import { AircraftFlightModelVariables } from './aircraft-flight-model-variables';
import { AircraftFuelVariables } from './aircraft-fuel-variables';
import { AircraftMiscVariables } from './aircraft-misc-variables';
import { AircraftRadioNavigationVariables } from './aircraft-radio-navigation-variables';
import { AircraftSystemVariables } from './aircraft-system-variables';
import { CameraVariables } from './camera-variables';
import { MiscellaneousVariables } from './miscellaneous-variables';
import { HelicopterVariables } from './helicopter-variables';
import { ServiceVariables } from './services-variables';
import { WASMGaugeAPITokenVariables } from './wasm-gauge-api-token-variables';
import { EnvironmentVariables } from './environment-variables';

const SimVars = {
  ...AircraftAutopilotAssistantVariables,
  ...AircraftBakeLandingGearVariables,
  ...AircraftControlVariables,
  ...AircraftElectricsVariables,
  ...AircraftEngineVariables,
  ...AircraftFlightModelVariables,
  ...AircraftFuelVariables,
  ...AircraftMiscVariables,
  ...AircraftRadioNavigationVariables,
  ...AircraftSystemVariables,
  ...CameraVariables,
  ...MiscellaneousVariables,
  ...HelicopterVariables,
  ...ServiceVariables,
  ...WASMGaugeAPITokenVariables,
  ...EnvironmentVariables
};

/* @ts-ignore */
Object.entries(SimVars).forEach(([key, value]) => (value.name = key));

// Make sure that variables that use a :number suffix resolve
// to the ":index" definition for that variable, and to make
// sure that underscores in varnames get replaced spaces, we
// use a Proxy to intercept all property access.
const proxy = new Proxy(SimVars, {
  get(target, prop) {
    /* @ts-ignore */
    if (prop.includes(`:`)) prop = prop.replace(/:.*/, `:index`);
    return target[prop];
  }
});

export { proxy as SimVars };
