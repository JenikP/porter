import { ItemSize, VehicleClass } from '@porter/shared';

// CONFIGURABLE PROTOTYPE ASSUMPTIONS — must be confirmed via pilot
export interface VehicleThresholds {
  maxWeightBikeOrCarKg: number;
  maxWeightVanOrUteKg: number;
}

export const DEFAULT_VEHICLE_THRESHOLDS: VehicleThresholds = {
  maxWeightBikeOrCarKg: 30,
  maxWeightVanOrUteKg: 500,
};

export function recommendVehicle(
  size: ItemSize,
  weightKg: number | undefined,
  helperRequired: boolean,
  thresholds: VehicleThresholds = DEFAULT_VEHICLE_THRESHOLDS
): VehicleClass {
  // If item is LARGE or BULKY → van/ute
  if (size === ItemSize.LARGE || size === ItemSize.BULKY) {
    return VehicleClass.VAN_OR_UTE;
  }

  // If item is too heavy for bike/car → van/ute
  if (weightKg !== undefined && weightKg > thresholds.maxWeightBikeOrCarKg) {
    return VehicleClass.VAN_OR_UTE;
  }

  // If two-person carry required → van/ute (too awkward for a car)
  if (helperRequired) {
    return VehicleClass.VAN_OR_UTE;
  }

  // Default: bike/car
  return VehicleClass.BIKE_OR_CAR;
}

export function canVehicleCarry(
  vehicleClass: VehicleClass,
  size: ItemSize,
  weightKg: number | undefined,
  thresholds: VehicleThresholds = DEFAULT_VEHICLE_THRESHOLDS
): boolean {
  const required = recommendVehicle(size, weightKg, false, thresholds);
  if (required === VehicleClass.VAN_OR_UTE && vehicleClass === VehicleClass.BIKE_OR_CAR) {
    return false;
  }
  if (weightKg !== undefined) {
    const maxWeight = vehicleClass === VehicleClass.BIKE_OR_CAR
      ? thresholds.maxWeightBikeOrCarKg
      : thresholds.maxWeightVanOrUteKg;
    if (weightKg > maxWeight) return false;
  }
  return true;
}

export function getVehicleLabel(vehicleClass: VehicleClass): string {
  switch (vehicleClass) {
    case VehicleClass.BIKE_OR_CAR: return 'Bike or Car';
    case VehicleClass.VAN_OR_UTE: return 'Van or Ute';
    default: return vehicleClass;
  }
}

export function getItemSizeLabel(size: ItemSize): string {
  switch (size) {
    case ItemSize.ENVELOPE: return 'Envelope / Small Package';
    case ItemSize.SMALL: return 'Small (e.g. parcel, bag)';
    case ItemSize.MEDIUM: return 'Medium (e.g. box, small appliance)';
    case ItemSize.LARGE: return 'Large (e.g. couch, wardrobe)';
    case ItemSize.BULKY: return 'Bulky / Extra Large';
    default: return size;
  }
}
