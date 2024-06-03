/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
  RawBuffer,
  SimConnectPeriod,
  SimConnectConstants,
  open,
  Protocol,
  SimConnectConnection,
  RecvEvent,
  RecvOpen
} from 'simconnect.js';

import { SimVars } from './simvars/index';
import { SystemEvents as SysEvents } from './system-events/index';
import { SIMCONNECT_EXCEPTION } from './utils/exceptions';

export const SimVariables = SimVars;
export const SystemEvents = Object.assign({}, SysEvents);
export const SIM_NOT_CONNECTED = `Not connected to the simulator.`;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const codeSafe = (string: { replaceAll: (arg0: string, arg1: string) => any }) =>
  string.replaceAll(` `, `_`);

/* The `SIMCONNECT_API` class is a TypeScript class that provides methods for connecting to a
simulator, handling events, getting and setting simulator variables, and scheduling tasks. */
export class SIMCONNECT_API {
  appName: string;
  simulatorName: string | undefined;
  id: number;
  reserved: Set<unknown>;
  remote: { host: string; port: number };
  connected: boolean;
  specialGetHandlers: unknown[];
  handle: SimConnectConnection;
  eventListeners: unknown;

  constructor(appName = 'SimConnect API') {
    this.appName = appName;
    this.simulatorName;

    // set up a listener list for simconnect event handling:
    this.eventListeners = {};

    // set up an event/data/request id counter:
    this.id = 1;
    this.reserved = new Set();
  }

  async connect(opts: {
    autoReconnect?: boolean;
    retries?: number;
    retryInterval?: number;
    onConnect?: (handle: SimConnectConnection, RecvOpen: RecvOpen) => void;
    onRetry?: (retries: number, intervals: number) => void;
    onException?: (exception: string) => void;
    host?: string;
    port?: number;
  }) {
    opts.autoReconnect ??= false;
    opts.retries ??= 0;
    opts.retryInterval ??= 2;
    const { host, port } = opts;
    try {
      const remote = (this.remote = host ? { host, port: port ?? 500 } : undefined);
      /* @ts-ignore */
      const { handle, recvOpen } = await open(this.appName, Protocol.FSX_SP2, remote);

      if (!handle) {
        this.connected = false;
        opts.onException('No connection handle to the simulator.');
      }

      this.handle = handle;
      this.connected = true;
      this.simulatorName = recvOpen.applicationName;
      handle.on('event', (event) => this.handleSystemEvent(event));
      handle.on('close', () => opts.autoReconnect && this.connect(opts));
      handle.on('exception', (e) => {
        this.connected = false;
        opts.onException(SIMCONNECT_EXCEPTION[e.exception]);
      });

      opts.onConnect(handle, recvOpen);
    } catch (err) {
      if (opts.retries) {
        opts.retries--;
        opts.onRetry(opts.retries, opts.retryInterval);
        setTimeout(() => this.connect(opts), 1000 * opts.retryInterval);
      } else {
        this.connected = false;
        opts.onException('No connection to the simulator.');
      }
    }
  }

  nextId() {
    if (this.id > 900) {
      this.id = 0;
    }
    let id = this.id++;
    while (this.reserved.has(id)) {
      id = this.id++;
    }
    this.reserved.add(id);
    return id;
  }

  releaseId(id: unknown) {
    this.reserved.delete(id);
  }

  // We want to make sure we only ever register for an event once
  // because MSFS does not follow the JS "register multiple handlers"
  // concept. That's up to you. So.... that's where this code comes in:
  addEventListener(eventName: string, eventHandler: (arg0: () => void) => void) {
    const { eventListeners: e } = this;
    if (!e[eventName]) {
      const eventID = this.nextId();
      this.handle.subscribeToSystemEvent(eventID, eventName);
      e[eventName] = {
        eventID,
        eventName,
        data: undefined,
        handlers: [eventHandler]
      };
      e[eventID] = e[eventName];
    }

    // do we need to send the most recently known value?
    else {
      e[eventName].handlers.push(eventHandler);
      const { data } = e[eventName];
      if (data) eventHandler(data);
    }
  }

  removeEventListener(eventName: string | number, eventHandler: () => void) {
    const { eventListeners: e } = this;
    const obj = e[eventName];
    const pos = obj.handlers.findIndex((h: unknown) => h === eventHandler);
    if (pos > -1) obj.handlers.splice(pos, 1);
  }

  handleSystemEvent(event: RecvEvent) {
    const { clientEventId: eventID, data } = event;
    const entry = this.eventListeners[eventID];

    if (!entry) {
      return console.log(`handling data for id ${eventID} without an event handler entry??`);
    }

    entry.data = data;
    entry.handlers.forEach((handle: (arg0: unknown) => unknown) => handle(data));
  }

  /**
   * Add an event listener. This returns a function that acts
   * as the corresponding `off()` function, without needing to
   * pass any arguments in.
   *
   * @param {*} eventDefinition from SystemEvents
   * @param {*} eventHandler function that gets called when the event triggers
   * @returns
   */
  on(eventDefinition: { name: string }, eventHandler: (possibleData?: unknown) => void) {
    if (!this.connected) throw new Error(SIM_NOT_CONNECTED);
    if (!eventDefinition) {
      console.error(`on() called without an event definition`);
      console.trace();
      return;
    }
    const { name: eventName } = eventDefinition;
    this.addEventListener(eventName, eventHandler);
    return () => this.off(eventName, eventHandler);
  }

  /**
   * Remove an event listener.
   *
   * @param {*} eventName the event name to stop listening to
   * @param {*} eventHandler the event handler that should no longer trigger for this event
   */
  off(eventName: string, eventHandler: () => void) {
    this.removeEventListener(eventName, eventHandler);
  }

  /**
   *
   * @param {*} triggerName
   * @param {*} value
   */
  trigger(triggerName: string, value: number) {
    if (!this.connected) throw new Error(SIM_NOT_CONNECTED);
    const { handle } = this;
    const eventID = this.nextId();
    handle.mapClientEventToSimEvent(eventID, triggerName);
    try {
      handle.transmitClientEvent(
        SimConnectConstants.OBJECT_ID_USER,
        eventID,
        value,
        1, // highest priority
        16 // group id is priority
      );
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   *
   * @param {*} DATA_ID
   * @param {*} propNames
   * @param {*} defs
   */
  addDataDefinitions(DATA_ID: number, propNames: string[], defs: unknown[]) {
    const { handle } = this;
    propNames.forEach((propName: string, pos: string | number) => {
      const def = defs[pos];
      if (def === undefined) {
        handle.clearDataDefinition(DATA_ID);
        this.releaseId(DATA_ID);
        throw new Error(`Cannot get SimVar: "${propName}" unknown.`);
      }
      handle.addToDataDefinition(
        DATA_ID,
        propName,
        def.units,
        def.data_type,
        0.0,
        SimConnectConstants.UNUSED
      );
    });
  }

  /**
   *
   * @param {*} DATA_ID
   * @param {*} REQUEST_ID
   * @param {*} propNames
   * @param {*} defs
   * @returns
   */
  generateGetPromise(DATA_ID: number, REQUEST_ID: number, propNames: unknown[], defs: unknown[]) {
    const { handle } = this;
    return new Promise((resolve) => {
      const handleDataRequest = ({ requestID, data }) => {
        if (requestID === REQUEST_ID) {
          handle.off('simObjectData', handleDataRequest);
          handle.clearDataDefinition(DATA_ID);
          const result = {};
          propNames.forEach(
            (
              propName: { replaceAll: (arg0: string, arg1: string) => unknown },
              pos: string | number
            ) => {
              result[codeSafe(propName)] = defs[pos].read(data);
            }
          );
          resolve(result);
          this.releaseId(DATA_ID);
        }
      };
      handle.on('simObjectData', handleDataRequest);
      handle.requestDataOnSimObject(
        REQUEST_ID,
        DATA_ID,
        SimConnectConstants.OBJECT_ID_USER,
        SimConnectPeriod.ONCE,
        ...[0, 0, 0, 0]
      );
    });
  }

  /**
   * Get one or more simconnect variable values.
   *
   * @param  {...any} propNames
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(propNames: any[]) {
    if (!this.connected) throw new Error(SIM_NOT_CONNECTED);

    const DATA_ID = this.nextId();
    const REQUEST_ID = DATA_ID;
    propNames = propNames.map((s) => s.replaceAll(`_`, ` `));

    const defs = propNames.map((propName) => SimVars[propName]);
    this.addDataDefinitions(DATA_ID, propNames, defs);
    return this.generateGetPromise(DATA_ID, REQUEST_ID, propNames, defs);
  }

  /**
   * Set a simconnect variable.
   *
   * @param  {...any} propNames
   * @returns
   * @throws
   */
  set(propName: string, value: string | number) {
    if (!this.connected) throw new Error(SIM_NOT_CONNECTED);
    const { handle } = this;
    /* @ts-ignore */
    propName = propName.replaceAll(`_`, ` `);
    /* @ts-ignore */
    if (value == parseFloat(value)) {
      // Extremely intentionally use coercion to see if we're dealing with a number-as-string
      /* @ts-ignore */
      value = parseFloat(value);
    }
    const DATA_ID = this.nextId();
    const def = SimVars[propName];
    if (def === undefined) {
      this.releaseId(DATA_ID);
      throw new Error(`Cannot set SimVar: "${propName}" unknown.`);
    }
    const bufferLength = 100; // TODO: we probably want to allocate only as much buffer as we actually need
    const buffer = def.write(new RawBuffer(bufferLength), value);
    const payload = { buffer, arrayCount: 0, tagged: false };
    handle.addToDataDefinition(DATA_ID, propName, def.units, def.data_type);
    handle.setDataOnSimObject(DATA_ID, SimConnectConstants.OBJECT_ID_USER, payload);
    // cleanup, with *plenty* of time for SimConnect to resolve the data object before clearing it out.
    setTimeout(() => {
      this.releaseId(DATA_ID);
      handle.clearDataDefinition(DATA_ID);
    }, 500);
  }

  /**
   * The `schedule` function allows you to repeatedly execute a handler function at a specified
   * interval, based on certain conditions.
   * @param handler - The `handler` parameter is a function that takes no arguments and returns an
   * unknown value. It is the function that will be executed at each interval.
   * @param {number} interval - The `interval` parameter is a number that represents the time interval
   * in milliseconds between each execution of the `handler` function.
   * @param {string[]} propNames - propNames is an array of string values representing the names of
   * properties that will be passed to the handler function.
   * @param {boolean} startByDefault - The `startByDefault` parameter is a boolean value that
   * determines whether the schedule should start running immediately after it is created. If
   * `startByDefault` is `true`, the schedule will start running. If `startByDefault` is `false`, the
   * schedule will not start running until the `
   * @returns An array containing two functions is being returned. The first function starts the
   * schedule and the second function stops the schedule.
   */
  schedule(
    handler: (arg0: unknown) => void,
    interval: number,
    propNames: string[],
    startByDefault: boolean
  ) {
    if (!this.connected) throw new Error(SIM_NOT_CONNECTED);
    let running = startByDefault;
    const run = async () => {
      handler(await this.get(propNames));
      if (running) setTimeout(run, interval);
    };
    run();
    return {
      start: () => {
        running = true;
        run();
      },
      stop: () => (running = false)
    };
  }
}
