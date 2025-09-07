import fs from "fs";
const USERS = "data/users.json";
const PROG  = "data/progress.json";

function ensure() {
  if (!fs.existsSync("data")) fs.mkdirSync("data");
  if (!fs.existsSync(USERS)) fs.writeFileSync(USERS, JSON.stringify({ users: [] }, null, 2));
  if (!fs.existsSync(PROG))  fs.writeFileSync(PROG, JSON.stringify({}, null, 2));
}

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
