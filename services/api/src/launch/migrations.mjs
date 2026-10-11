// Additive, versioned changes. Baseline tables remain compatible with existing local data.
export const migrations=[{version:1,name:'central-marketplace-baseline',sql:[]},{version:2,name:'ownership-session-and-outbox-indexes',sql:[
 'CREATE INDEX IF NOT EXISTS sessions_account_idx ON sessions(account_id)',
 'CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires)',
 'CREATE INDEX IF NOT EXISTS uploads_account_idx ON uploads(account_id)',
 'CREATE INDEX IF NOT EXISTS recovery_account_idx ON recovery(account_id)',
 'CREATE INDEX IF NOT EXISTS notification_due_idx ON notification_outbox(status,due)'
]}];
