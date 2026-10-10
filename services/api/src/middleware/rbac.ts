import { AuthRequest } from './auth';

export type Resource =
  | 'jobs' | 'drivers' | 'customers' | 'payments' | 'disputes'
  | 'pricing' | 'reports' | 'settings' | 'audit' | 'payouts';

export type Action = 'read' | 'write' | 'delete' | 'admin';

const permissions: Record<string, Record<Resource, Action[]>> = {
  CUSTOMER: {
    jobs: ['read', 'write'],
    drivers: ['read'],
    customers: ['read'],
    payments: ['read'],
    disputes: ['read', 'write'],
    pricing: [],
    reports: [],
    settings: [],
    audit: [],
    payouts: [],
  },
  DRIVER: {
    jobs: ['read', 'write'],
    drivers: ['read'],
    customers: ['read'],
    payments: ['read'],
    disputes: ['read', 'write'],
    pricing: [],
    reports: [],
    settings: [],
    audit: [],
    payouts: ['read'],
  },
  SUPPORT_ADMIN: {
    jobs: ['read', 'write'],
    drivers: ['read'],
    customers: ['read'],
    payments: ['read'],
    disputes: ['read', 'write'],
    pricing: [],
    reports: ['read'],
    settings: [],
    audit: ['read'],
    payouts: ['read'],
  },
  MANAGER_ADMIN: {
    jobs: ['read', 'write', 'admin'],
    drivers: ['read', 'write'],
    customers: ['read', 'write'],
    payments: ['read', 'write'],
    disputes: ['read', 'write'],
    pricing: ['read', 'write'],
    reports: ['read', 'write'],
    settings: ['read', 'write'],
    audit: ['read', 'write'],
    payouts: ['read', 'write'],
  },
};

export function canAccess(role: string, resource: Resource, action: Action): boolean {
  const rolePerms = permissions[role];
  if (!rolePerms) return false;
  const actions = rolePerms[resource];
  if (!actions) return false;
  if (actions.includes('admin')) return true;
  return actions.includes(action);
}

export function checkAccess(role: string, resource: Resource, action: Action): void {
  if (!canAccess(role, resource, action)) {
    throw new Error(`Access denied: ${role} cannot ${action} ${resource}`);
  }
}
