import { VehicleClass, TimeOption, RateCardValues, PriceBreakdown } from '@porter/shared';
import { loadConfig } from '@porter/config';

export interface PricingInputs {
  vehicleClass: VehicleClass;
  distanceKm: number;
  durationMinutes: number;
  timeOption: TimeOption;
  stairs: number;
  helperRequired: boolean;
  waitingMinutes?: number;
  rateCard: RateCardValues;
}

export function calculatePrice(inputs: PricingInputs): PriceBreakdown {
  const cfg = loadConfig();
  const { vehicleClass, distanceKm, durationMinutes, timeOption, stairs, helperRequired, waitingMinutes = 0, rateCard } = inputs;

  // Base fare by vehicle
  const baseFare = vehicleClass === VehicleClass.BIKE_OR_CAR
    ? rateCard.baseFareBikeOrCar
    : rateCard.baseFareVanOrUte;

  // Distance fare
  const distanceFare = distanceKm * rateCard.perKmRate;

  // Time fare
  const timeFare = durationMinutes * rateCard.perMinuteRate;

  // Subtotal before multipliers
  const subtotalBeforeMultiplier = baseFare + distanceFare + timeFare;

  // Urgency multiplier
  let urgencyMultiplier = 1.0;
  if (timeOption === TimeOption.FLEXIBLE_WINDOW) {
    urgencyMultiplier = rateCard.flexibleWindowMultiplier;
  } else if (timeOption === TimeOption.WITHIN_3_HOURS) {
    urgencyMultiplier = rateCard.within3HoursMultiplier;
  } else if (timeOption === TimeOption.WITHIN_1_HOUR) {
    urgencyMultiplier = rateCard.within1HourMultiplier;
  }

  const subtotalAfterMultiplier = subtotalBeforeMultiplier * urgencyMultiplier;

  // Stairs charge
  const stairsCharge = stairs * rateCard.stairsPerFlight;

  // Helper charge
  const helperCharge = helperRequired ? rateCard.helperCharge : 0;

  // Waiting charge
  const billableWaitingMinutes = Math.max(0, waitingMinutes - rateCard.freeWaitingMinutes);
  const waitingCharge = billableWaitingMinutes * rateCard.waitingPerMinute;

  // Total before commission
  const subtotal = subtotalAfterMultiplier + stairsCharge + helperCharge + waitingCharge;

  // Minimum price check
  const minPrice = vehicleClass === VehicleClass.BIKE_OR_CAR
    ? rateCard.minPriceBikeOrCar
    : rateCard.minPriceVanOrUte;

  const total = Math.max(subtotal, minPrice);

  // Commission
  const commission = total * (rateCard.commissionPercent / 100);

  return {
    baseFare: Math.round(baseFare * 100) / 100,
    distanceFare: Math.round(distanceFare * 100) / 100,
    timeFare: Math.round(timeFare * 100) / 100,
    urgencyMultiplier,
    stairsCharge: Math.round(stairsCharge * 100) / 100,
    helperCharge: Math.round(helperCharge * 100) / 100,
    waitingCharge: Math.round(waitingCharge * 100) / 100,
    subtotal: Math.round((subtotalAfterMultiplier + stairsCharge + helperCharge + waitingCharge) * 100) / 100,
    commission: Math.round(commission * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function getDriverEarnings(jobPrice: number, commission: number): number {
  return Math.round((jobPrice - commission) * 100) / 100;
}

export function generateQuoteId(): string {
  return 'QT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}
