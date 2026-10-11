import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import {createHash} from 'node:crypto';
const mode=process.argv[2],directory=path.resolve(process.argv[3]||'.data/staging-backup');
if(!['backup','verify-restore'].includes(mode))throw new Error('Usage: node scripts/staging-backup.mjs backup|verify-restore /private/backup-directory');
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL required');
const source=new pg.Pool({connectionString:process.env.DATABASE_URL});
const clientEnvironment=connection=>{const url=new URL(connection);return {...process.env,PGDATABASE:decodeURIComponent(url.pathname.slice(1)),PGHOST:url.hostname,PGPORT:url.port||'5432',PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),...(url.searchParams.get('sslmode')?{PGSSLMODE:url.searchParams.get('sslmode')}:{})};};
const snapshot=async pool=>{const tables=['porter_state','accounts','sessions','recovery','commands','uploads','webhook_events','devices','notification_outbox','telemetry','schema_migrations'];const result={};for(const table of tables){const rows=(await pool.query(`SELECT * FROM ${table}`)).rows;const canonical=rows.map(r=>JSON.stringify(Object.fromEntries(Object.entries(r).sort(([a],[b])=>a.localeCompare(b))))).sort();result[table]={rows:rows.length,sha256:createHash('sha256').update(JSON.stringify(canonical)).digest('hex')};}return result;};
try{
 if(mode==='backup'){
  await fs.mkdir(directory,{recursive:true,mode:0o700});
  // libpq reads the connection only from the child environment, never command arguments.
  const result=spawnSync(process.env.PG_DUMP_BIN||'pg_dump',['--format=custom','--no-owner','--no-acl','--file',path.join(directory,'database.dump')],{env:clientEnvironment(process.env.DATABASE_URL),encoding:'utf8'});if(result.error||result.status!==0)throw new Error('pg_dump failed. Install compatible PostgreSQL client tools and verify private connection access.');
  await fs.chmod(path.join(directory,'database.dump'),0o600);
  await fs.writeFile(path.join(directory,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),tables:await snapshot(source)},null,2),{mode:0o600});
  if(process.env.DOCUMENT_STORAGE!=='http')await fs.cp(path.resolve(process.env.DOCUMENT_STORAGE_PATH||'.data/private-uploads'),path.join(directory,'private-uploads'),{recursive:true});
  else throw new Error('Database dump created, but full backup is incomplete: configure a private object-storage backup and recovery drill');
  const files={};for(const name of await fs.readdir(path.join(directory,'private-uploads')))files[name]=createHash('sha256').update(await fs.readFile(path.join(directory,'private-uploads',name))).digest('hex');await fs.writeFile(path.join(directory,'files.json'),JSON.stringify(files),{mode:0o600});
  console.log('Backup created: database dump, private file copy and checksummed manifest. Encrypt and store off-host. Quiesce mutations during this backup.');
 }else{
  if(!process.env.PORTER_RESTORE_DATABASE_URL||process.env.PORTER_RESTORE_DATABASE_URL===process.env.DATABASE_URL)throw new Error('A distinct disposable PORTER_RESTORE_DATABASE_URL is required');
  const restored=new pg.Pool({connectionString:process.env.PORTER_RESTORE_DATABASE_URL});
  try{
   const present=(await restored.query("SELECT tablename FROM pg_tables WHERE schemaname='public'")).rows;if(present.length)throw new Error('Restore target must be empty; no existing database will be overwritten');
   const result=spawnSync(process.env.PG_RESTORE_BIN||'pg_restore',['--no-owner','--no-acl','--exit-on-error','--dbname',decodeURIComponent(new URL(process.env.PORTER_RESTORE_DATABASE_URL).pathname.slice(1)),path.join(directory,'database.dump')],{env:clientEnvironment(process.env.PORTER_RESTORE_DATABASE_URL),encoding:'utf8'});if(result.error||result.status!==0)throw new Error('pg_restore failed; inspect database permissions and compatible client tools');
   const expected=JSON.parse(await fs.readFile(path.join(directory,'manifest.json'),'utf8'));if(JSON.stringify(expected.tables)!==JSON.stringify(await snapshot(restored)))throw new Error('Restored rows do not match backup checksums');
   const uploads=(await restored.query('SELECT id,data,mime FROM uploads')).rows;
   const expectedFiles=JSON.parse(await fs.readFile(path.join(directory,'files.json'),'utf8'));
   for(const upload of uploads.filter(u=>u.data.startsWith('storage:'))){if(process.env.DOCUMENT_STORAGE==='http')throw new Error('Object storage restore verification requires a separate provider recovery drill');const content=await fs.readFile(path.join(directory,'private-uploads',upload.id));if(createHash('sha256').update(content).digest('hex')!==expectedFiles[upload.id])throw new Error('Restored private document checksum mismatch');}
   console.log('PASS: restored database row counts/checksums and private document files verified against backup manifest.');
  }finally{await restored.end();}
 }
}finally{await source.end();}
