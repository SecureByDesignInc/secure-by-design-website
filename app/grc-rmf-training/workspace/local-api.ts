'use client';
// The ATO Package Builder without an account (owner direction, 21 October 2026): every feature, no sign-in.
//
// For a visitor who isn't signed in, the page runs the same API code the Worker runs (lib/authorization/api.mjs)
// against a SQLite database (sql.js) held in this page's memory, with the schema from drizzle/0014 and 0015. Nothing is
// sent to Secure By Design or stored on the device: the work lasts until the page is closed or reloaded. Signing in
// keeps work in the learner's account instead.
import {authorizationHandler} from '../../../lib/authorization/api.mjs';
import {createSchema, d1} from '../../../lib/authorization/sqljs-d1.mjs';
import schema14 from '../../../drizzle/0014_authorization_workspace.sql?raw';
import schema15 from '../../../drizzle/0015_auth_one_enclave.sql?raw';

const WASM = '/grc-rmf-training/workspace/sql-wasm-1.14.2.wasm';
const VISITOR = {id: 'visitor', email: null};

let database: Promise<ReturnType<typeof d1>> | null = null;
function open() {
 database ??= (async () => {
  const initSqlJs = (await import('sql.js')).default as unknown as (config: {locateFile: () => string}) => Promise<{Database: new () => any}>;
  const SQL = await initSqlJs({locateFile: () => WASM});
  const db = new SQL.Database();
  createSchema(db, [schema14, schema15]);
  return d1(db);
 })();
 database.catch(() => {database = null;});
 return database;
}

/** Runs one builder API call in this page and returns its reply, as fetch() would. */
export async function localApi(method: string, path: string, body?: unknown): Promise<{ok: boolean; status: number; data: any}> {
 const DB = await open();
 const request = new Request(location.origin + '/api/authorization' + path, {method, headers: body === undefined ? {} : {'content-type': 'application/json'}, body: body === undefined ? undefined : JSON.stringify(body)});
 const response = await authorizationHandler(request, {DB, LOCAL: true}, VISITOR);
 let data: any = null; try {data = await response.json();} catch {}
 return {ok: response.ok, status: response.status, data};
}
