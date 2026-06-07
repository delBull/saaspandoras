import postgres from "postgres";
import { ENV } from "./config.mjs";

let _sql;
export function getSql() {
  if (_sql) return _sql;
  _sql = postgres(ENV.DB_URL, { max: 5, prepare: false, connect_timeout: 5 });
  return _sql;
}

export async function close() {
  if (_sql) { await _sql.end(); _sql = null; }
}
