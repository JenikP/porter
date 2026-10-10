import React from 'react';
import { StatusChip } from './StatusChip';

export interface StatusBadgeProps {
  status: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

/** Task-spec alias for job/dispute status chips used across roles. */
export function StatusBadge(props: StatusBadgeProps) {
  return <StatusChip {...props} />;
}
