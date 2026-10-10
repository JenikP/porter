import React from 'react';

interface PriceBreakdownProps {
  breakdown: {
    baseFare?: number;
    distanceFare?: number;
    timeFare?: number;
    stairsCharge?: number;
    helperCharge?: number;
    waitingCharge?: number;
    subtotal?: number;
    commission?: number;
    total: number;
  };
  showCommission?: boolean;
}

export function PriceBreakdown({ breakdown, showCommission = false }: PriceBreakdownProps) {
  const rows: { label: string; value: number }[] = [];
  if (breakdown.baseFare) rows.push({ label: 'Base fare', value: breakdown.baseFare });
  if (breakdown.distanceFare) rows.push({ label: 'Distance', value: breakdown.distanceFare });
  if (breakdown.timeFare) rows.push({ label: 'Time', value: breakdown.timeFare });
  if (breakdown.stairsCharge) rows.push({ label: 'Stairs', value: breakdown.stairsCharge });
  if (breakdown.helperCharge) rows.push({ label: 'Second person', value: breakdown.helperCharge });
  if (breakdown.waitingCharge) rows.push({ label: 'Waiting time', value: breakdown.waitingCharge });
  if (breakdown.subtotal) rows.push({ label: 'Subtotal', value: breakdown.subtotal });
  if (showCommission && breakdown.commission) rows.push({ label: 'Platform fee', value: breakdown.commission });

  return (
    <div className="space-y-2">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          <span className="text-gray-900">${value.toFixed(2)}</span>
        </div>
      ))}
      <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200">
        <span>Total</span>
        <span className="text-gray-900">${breakdown.total.toFixed(2)}</span>
      </div>
    </div>
  );
}
