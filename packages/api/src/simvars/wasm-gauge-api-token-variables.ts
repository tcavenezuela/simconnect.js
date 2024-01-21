import { define } from './simvar-utils';

// data types
import { Float64 } from './simvar-utils';

// data units
import { Radians } from './simvar-utils';

export const WASMGaugeAPITokenVariables = {
  'TRAILING EDGE FLAPS0 LEFT ANGLE': define(`TESTING`, Radians, Float64),
  'TRAILING EDGE FLAPS0 RIGHT ANGLE': define(`TESTING`, Radians, Float64)
};
