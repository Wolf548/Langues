import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || "/opt/render/project/src/data";
const USERS = path.join(DATA_DIR, "users.json");
const PROG  = path.join(DATA_DIR, "progress.json");
const QRTXT = path.join(DATA_DIR, "qr.txt");
const QRPNG = path.join(DATA_DIR, "qr.png");

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS)) fs.writeFileSync(USERS, JSON.stringify({ users: [] }, null, 2));
  if (!fs.existsSync(PROG))  fs.writeFileSync(PROG, JSON.stringify({}, null, 2));
}
export function getPaths(){ ensure(); return { DATA_DIR, USERS, PROG, QRTXT, QRPNG }; }

export function addUser(id) {
  ensure();
  const db = JSON.parse(fs.readFileSync(USERS, "utf-8"));
  if (!db.users.includes(id)) { db.users.push(id); fs.writeFileSync(USERS, JSON.stringify(db, null, 2)); }
}

export function getUsers() {
  ensure();
  return JSON.parse(fs.readFileSync(USERS, "utf-8")).users;
}

export function saveScore(userId, isoWeek, lang, delta) {
  ensure();
  const db = JSON.parse(fs.readFileSync(PROG, "utf-8"));
  db[userId] ??= {};
  db[userId][isoWeek] ??= {};
  db[userId][isoWeek][lang] ??= 0;
  db[userId][isoWeek][lang] += delta;
  fs.writeFileSync(PROG, JSON.stringify(db, null, 2));
}

export function getWeekly(userId, isoWeek) {
  ensure();
  const db = JSON.parse(fs.readFileSync(PROG, "utf-8"));
  return (db[userId] && db[userId][isoWeek]) || {};
}

export function saveQRString(qr) {
  ensure();
  fs.writeFileSync(QRTXT, qr, "utf-8");
}