import { JobStatus } from '@porter/shared';

export interface StateTransition {
  from: JobStatus;
  to: JobStatus;
  actor: 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'SYSTEM';
  conditions?: string[];
  sideEffects?: string[];
  notification?: string;
  paymentImpact?: 'authorize' | 'capture' | 'hold' | 'refund' | 'none';
  auditEvent: string;
}

export const JOB_STATE_TRANSITIONS: StateTransition[] = [
  // DRAFT → QUOTED
  { from: JobStatus.DRAFT, to: JobStatus.QUOTED, actor: 'SYSTEM',
    notification: 'QuoteGenerated',
    paymentImpact: 'none',
    auditEvent: 'QUOTE_GENERATED' },

  // QUOTED → BOOKED
  { from: JobStatus.QUOTED, to: JobStatus.BOOKED, actor: 'CUSTOMER',
    conditions: ['Payment authorized'],
    sideEffects: ['Record payment authorization'],
    notification: 'BookingConfirmed',
    paymentImpact: 'authorize',
    auditEvent: 'JOB_BOOKED' },

  // BOOKED → SEARCHING
  { from: JobStatus.BOOKED, to: JobStatus.SEARCHING, actor: 'SYSTEM',
    conditions: ['Driver search started'],
    sideEffects: ['Find eligible drivers', 'Send offers'],
    notification: 'DriverSearchStarted',
    paymentImpact: 'none',
    auditEvent: 'DRIVER_SEARCH_STARTED' },

  // SEARCHING → ASSIGNED
  { from: JobStatus.SEARCHING, to: JobStatus.ASSIGNED, actor: 'DRIVER',
    conditions: ['Driver accepted offer', 'Driver is eligible'],
    sideEffects: ['Notify customer', 'Record assignment'],
    notification: 'DriverAssigned',
    paymentImpact: 'none',
    auditEvent: 'DRIVER_ASSIGNED' },

  // SEARCHING → UNMATCHED
  { from: JobStatus.SEARCHING, to: JobStatus.UNMATCHED, actor: 'SYSTEM',
    conditions: ['All offers declined or timed out', 'Search window expired'],
    sideEffects: ['Notify customer', 'Alert admin'],
    notification: 'JobUnmatched',
    paymentImpact: 'none',
    auditEvent: 'JOB_UNMATCHED' },

  // ASSIGNED → EN_ROUTE_TO_PICKUP
  { from: JobStatus.ASSIGNED, to: JobStatus.EN_ROUTE_TO_PICKUP, actor: 'DRIVER',
    conditions: ['Driver started navigation'],
    sideEffects: ['Share live location'],
    notification: 'DriverHeadingToPickup',
    paymentImpact: 'none',
    auditEvent: 'DRIVER_EN_ROUTE' },

  // EN_ROUTE_TO_PICKUP → AT_PICKUP
  { from: JobStatus.EN_ROUTE_TO_PICKUP, to: JobStatus.AT_PICKUP, actor: 'DRIVER',
    conditions: ['Driver arrived at pickup'],
    sideEffects: ['Stop live location sharing until pickup confirmed'],
    notification: 'DriverArrivedAtPickup',
    paymentImpact: 'none',
    auditEvent: 'DRIVER_AT_PICKUP' },

  // AT_PICKUP → PICKED_UP
  { from: JobStatus.AT_PICKUP, to: JobStatus.PICKED_UP, actor: 'DRIVER',
    conditions: ['Pickup photo taken', 'Item verified or noted'],
    sideEffects: ['Resume live location sharing'],
    notification: 'ItemPickedUp',
    paymentImpact: 'none',
    auditEvent: 'ITEM_PICKED_UP' },

  // PICKED_UP → EN_ROUTE_TO_DROPOFF
  { from: JobStatus.PICKED_UP, to: JobStatus.EN_ROUTE_TO_DROPOFF, actor: 'DRIVER',
    conditions: ['Driver started navigation to drop-off'],
    sideEffects: ['Update tracking'],
    notification: 'DriverHeadingToDropoff',
    paymentImpact: 'none',
    auditEvent: 'DRIVER_EN_ROUTE_DROPOFF' },

  // EN_ROUTE_TO_DROPOFF → AT_DROPOFF
  { from: JobStatus.EN_ROUTE_TO_DROPOFF, to: JobStatus.AT_DROPOFF, actor: 'DRIVER',
    conditions: ['Driver arrived at drop-off'],
    sideEffects: ['Request recipient code if enabled'],
    notification: 'DriverArrivedAtDropoff',
    paymentImpact: 'none',
    auditEvent: 'DRIVER_AT_DROPOFF' },

  // AT_DROPOFF → DELIVERED
  { from: JobStatus.AT_DROPOFF, to: JobStatus.DELIVERED, actor: 'DRIVER',
    conditions: ['Delivery photo taken', 'Recipient verified if code required'],
    sideEffects: ['Capture payment', 'Record delivery time'],
    notification: 'Delivered',
    paymentImpact: 'capture',
    auditEvent: 'JOB_DELIVERED' },

  // DELIVERED → COMPLETED
  { from: JobStatus.DELIVERED, to: JobStatus.COMPLETED, actor: 'SYSTEM',
    conditions: ['Dispute window passed without dispute'],
    sideEffects: ['Credit driver earnings', 'Generate receipt'],
    paymentImpact: 'none',
    auditEvent: 'JOB_COMPLETED' },

  // DELIVERED → DISPUTED
  { from: JobStatus.DELIVERED, to: JobStatus.DISPUTED, actor: 'CUSTOMER',
    conditions: ['Dispute raised within window'],
    sideEffects: ['Hold driver payout', 'Notify admin'],
    notification: 'DisputeCreated',
    paymentImpact: 'hold',
    auditEvent: 'DISPUTE_CREATED' },

  // DISPUTED → RESOLVED
  { from: JobStatus.DISPUTED, to: JobStatus.RESOLVED, actor: 'ADMIN',
    conditions: ['Admin resolved dispute'],
    sideEffects: ['Process refund if applicable', 'Adjust driver pay'],
    paymentImpact: 'refund',
    auditEvent: 'DISPUTE_RESOLVED' },

  // RESOLVED → COMPLETED
  { from: JobStatus.RESOLVED, to: JobStatus.COMPLETED, actor: 'SYSTEM',
    sideEffects: ['Credit remaining driver earnings'],
    paymentImpact: 'none',
    auditEvent: 'JOB_COMPLETED_AFTER_DISPUTE' },

  // BOOKED/ASSIGNED/EN_ROUTE_TO_PICKUP → CANCELLED by customer
  { from: JobStatus.BOOKED, to: JobStatus.CANCELLED, actor: 'CUSTOMER',
    conditions: ['Cancellation before driver assigned — free'],
    sideEffects: ['Release payment authorization'],
    notification: 'BookingCancelled',
    paymentImpact: 'refund',
    auditEvent: 'JOB_CANCELLED' },

  { from: JobStatus.ASSIGNED, to: JobStatus.CANCELLED, actor: 'CUSTOMER',
    conditions: ['Cancellation after driver assigned — fee applies'],
    sideEffects: ['Apply cancellation fee', 'Notify driver'],
    notification: 'BookingCancelled',
    paymentImpact: 'refund',
    auditEvent: 'JOB_CANCELLED_AFTER_ASSIGNMENT' },

  // ASSIGNED → CANCELLED by driver
  { from: JobStatus.ASSIGNED, to: JobStatus.CANCELLED, actor: 'DRIVER',
    conditions: ['Driver cancelled before pickup'],
    sideEffects: ['Re-enter SEARCHING state', 'Alert admin'],
    notification: 'DriverCancelledJob',
    paymentImpact: 'none',
    auditEvent: 'DRIVER_CANCELLED' },

  // EN_ROUTE_TO_PICKUP/AT_PICKUP/PICKED_UP/EN_ROUTE_TO_DROPOFF/AT_DROPOFF → CANCELLED
  // (these states to CANCELLED by admin only in exceptional circumstances)
  { from: JobStatus.EN_ROUTE_TO_PICKUP, to: JobStatus.CANCELLED, actor: 'ADMIN',
    conditions: ['Admin force-cancellation'],
    sideEffects: ['Notify both parties', 'Process refund'],
    notification: 'JobCancelledByAdmin',
    paymentImpact: 'refund',
    auditEvent: 'ADMIN_CANCELLED' },

  // UNMATCHED → BOOKED (customer re-requesting)
  { from: JobStatus.UNMATCHED, to: JobStatus.BOOKED, actor: 'CUSTOMER',
    conditions: ['Customer re-triggers search'],
    sideEffects: ['Re-enter SEARCHING state'],
    paymentImpact: 'none',
    auditEvent: 'JOB_RELISTED' },

  // ASSIGNED → SEARCHING (driver cancellation after assignment)
  { from: JobStatus.ASSIGNED, to: JobStatus.SEARCHING, actor: 'SYSTEM',
    conditions: ['Driver timed out on cancellation response'],
    sideEffects: ['Re-assign to next driver'],
    paymentImpact: 'none',
    auditEvent: 'AUTO_REASSIGN' },
];

export function canTransition(
  from: JobStatus,
  to: JobStatus,
  actor: 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'SYSTEM'
): StateTransition | null {
  return JOB_STATE_TRANSITIONS.find(
    t => t.from === from && t.to === to && (t.actor === actor || t.actor === 'SYSTEM')
  ) || null;
}

export function getNextStates(current: JobStatus): JobStatus[] {
  return [...new Set(
    JOB_STATE_TRANSITIONS
      .filter(t => t.from === current)
      .map(t => t.to)
  )];
}

export function isTerminalState(status: JobStatus): boolean {
  return [JobStatus.COMPLETED, JobStatus.CANCELLED].includes(status);
}

export function requiresDriverAssignment(status: JobStatus): boolean {
  return [JobStatus.SEARCHING, JobStatus.ASSIGNED, JobStatus.EN_ROUTE_TO_PICKUP,
    JobStatus.AT_PICKUP, JobStatus.PICKED_UP, JobStatus.EN_ROUTE_TO_DROPOFF,
    JobStatus.AT_DROPOFF, JobStatus.DELIVERED].includes(status);
}

export function getStatusDisplayInfo(status: JobStatus): {
  label: string;
  description: string;
  color: string;
  icon: string;
} {
  const map: Record<JobStatus, { label: string; description: string; color: string; icon: string }> = {
    [JobStatus.DRAFT]: { label: 'Draft', description: 'Booking in progress', color: 'neutral', icon: 'edit' },
    [JobStatus.QUOTED]: { label: 'Quote Ready', description: 'Review and pay', color: 'info', icon: 'receipt' },
    [JobStatus.BOOKED]: { label: 'Confirmed', description: 'Finding a driver', color: 'info', icon: 'check-circle' },
    [JobStatus.SEARCHING]: { label: 'Searching', description: 'Connecting you with a driver', color: 'warning', icon: 'search' },
    [JobStatus.ASSIGNED]: { label: 'Driver Assigned', description: 'Driver is on the way', color: 'primary', icon: 'car' },
    [JobStatus.EN_ROUTE_TO_PICKUP]: { label: 'Driver En Route', description: 'Heading to pickup', color: 'primary', icon: 'navigation' },
    [JobStatus.AT_PICKUP]: { label: 'Driver Arrived', description: 'At pickup location', color: 'primary', icon: 'map-marker' },
    [JobStatus.PICKED_UP]: { label: 'Item Collected', description: 'On the way to you', color: 'primary', icon: 'package' },
    [JobStatus.EN_ROUTE_TO_DROPOFF]: { label: 'In Transit', description: 'Heading to drop-off', color: 'primary', icon: 'truck' },
    [JobStatus.AT_DROPOFF]: { label: 'Arrived', description: 'At drop-off location', color: 'primary', icon: 'flag' },
    [JobStatus.DELIVERED]: { label: 'Delivered', description: 'Waiting for confirmation', color: 'success', icon: 'check' },
    [JobStatus.COMPLETED]: { label: 'Completed', description: 'Job complete', color: 'success', icon: 'check-circle' },
    [JobStatus.CANCELLED]: { label: 'Cancelled', description: 'Job cancelled', color: 'error', icon: 'x-circle' },
    [JobStatus.UNMATCHED]: { label: 'No Driver Found', description: 'We could not find a driver', color: 'error', icon: 'alert-circle' },
    [JobStatus.DISPUTED]: { label: 'Under Review', description: 'Issue reported', color: 'warning', icon: 'alert-triangle' },
    [JobStatus.RESOLVED]: { label: 'Resolved', description: 'Issue resolved', color: 'info', icon: 'check-square' },
  };
  return map[status] || { label: status, description: '', color: 'neutral', icon: 'help-circle' };
}
