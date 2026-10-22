// A D1-shaped binding over a sql.js database (owner direction, 21 October 2026). It lets the builder's shared API
// (lib/authorization/api.mjs) run unchanged in the page for visitors without an account: prepare().bind().first(),
// .all(), .run() and batch() behave as they do on Cloudflare D1. Used by app/grc-rmf-training/workspace/local-api.ts
// and by tests/authorization.test.mjs.
const clean = values => values.map(v => v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v);

export function d1(db) {
 const rows = (sql, values) => {
  const s = db.prepare(sql);
  try { s.bind(values); const out = []; while (s.step()) out.push(s.getAsObject()); return out; } finally { s.free(); }
 };
 const statement = (sql, values = []) => ({
  sql, values,
  bind: (...v) => statement(sql, clean(v)),
  first: async () => rows(sql, values)[0] ?? null,
  all: async () => ({ results: rows(sql, values), success: true }),
  run: async () => { rows(sql, values); return { success: true, meta: { changes: db.getRowsModified() } }; },
 });
 return {
  prepare: sql => statement(sql),
  batch: async list => {
   db.exec('BEGIN');
   try { const out = list.map(s => { rows(s.sql, s.values); return { success: true }; }); db.exec('COMMIT'); return out; }
   catch (error) { db.exec('ROLLBACK'); throw error; }
  },
 };
}

// The builder's tables, from the same migrations D1 applies.
export function createSchema(db, migrations) {
 for (const part of migrations) for (const statement of part.split('--> statement-breakpoint')) if (statement.trim()) db.exec(statement);
}
