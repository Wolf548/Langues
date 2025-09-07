import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import express from "express";
import cron from "node-cron";
import Pino from "pino";
import QRCode from "qrcode";
import qrcodeTerminal from "qrcode-terminal";
import dayjs from "dayjs";
import { ROTATION, LINKS } from "./lessons.js";
import { QCM } from "./qcmBank.js";
import { addUser, getUsers, saveScore, getWeekly, getPaths, saveQRString } from "./storage.js";
import { generateQuizHTML } from "./quizTemplate.js";

const { DATA_DIR, QRTXT, QRPNG } = getPaths();

const TZ = process.env.TZ || "Europe/Paris";
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || "https://example.onrender.com";

const logger = Pino({ level: "info" });

const app = express();
app.get("/health", (_, res) => res.json({ ok: true }));

// QR page (évite le QR coupé dans logs)
app.get("/qr", (_, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<html><body><h1>QR WhatsApp</h1><p>Si l'image n'apparaît pas, regarde les logs Render (QR ASCII).</p><img src="/qr.png" style="max-width:360px;border:1px solid #ccc;border-radius:8px"/></body></html>`);
});
app.get("/qr.png", async (_, res) => {
  res.setHeader("Content-Type", "image/png");
  const fs = await import("fs");
  if (fs.existsSync(QRPNG)) fs.createReadStream(QRPNG).pipe(res);
  else res.status(404).end();
});

// Quiz HTML (navigateur)
app.get("/quiz/today", (req, res) => {
  const { langs, dateTitle } = todayInfo();
  const html = generateQuizHTML(dateTitle, langs[0], langs[1], QCM);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.listen(PORT, () => logger.info(`Web ok :${PORT}`));

function todayInfo() {
  const now = dayjs();            // le conteneur tourne déjà avec TZ défini
  const dow = now.day();          // 0=dim..6=sam
  const langs = ROTATION[dow] || ROTATION[1];
  const dateTitle = now.format("dddd DD/MM/YYYY");
  return { now, dow, langs, dateTitle };
}

let sock;
startSock().catch(err => logger.error({ err }, "Erreur démarrage Baileys"));

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState(`${DATA_DIR}/auth`);
  sock = makeWASocket({
    printQRInTerminal: false, // on gère l’affichage custom
    auth: state,
    logger
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      // QR en terminal (petit) + PNG servi à /qr
      qrcodeTerminal.generate(qr, { small: true });
      saveQRString(qr);
      try {
        await QRCode.toFile(QRPNG, qr, { width: 360 });
        logger.info(`QR PNG écrit. Ouvre ${BASE_URL}/qr pour scanner.`);
      } catch (e) {
        logger.warn({ e }, "Impossible d'écrire le QR PNG");
      }
    }
    if (connection === "close") {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.warn({ shouldReconnect }, "Connexion fermée");
      if (shouldReconnect) startSock();
    } else if (connection === "open") {
      logger.info("✅ Connecté à WhatsApp");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const m of messages || []) {
      if (!m.message) continue;
      const jid = m.key.remoteJid;
      const body =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.templateButtonReplyMessage?.selectedId ||
        m.message.buttonsResponseMessage?.selectedButtonId ||
        "";

      // Enregistrer l’utilisateur
      addUser(jid);

      const lower = body.trim().toLowerCase();

      if (lower === "/start" || lower === "start") {
        const { langs, dateTitle } = todayInfo();
        await sendLesson(jid, langs, dateTitle);
        continue;
      }
      if (lower === "/today") {
        const { langs, dateTitle } = todayInfo();
        await sendLesson(jid, langs, dateTitle);
        continue;
      }

      // Réponses A/B/C/D en fallback texte
      if (/^[abcd]$/i.test(lower)) {
        await sock.sendMessage(jid, { text: "Réponse notée 👍. Je comptabilise au bilan hebdo." });
        continue;
      }

      // Réponses via boutons template
      const btnId =
        m.message.templateButtonReplyMessage?.selectedId ||
        m.message.buttonsResponseMessage?.selectedButtonId ||
        "";
      if (btnId.startsWith("q|")) {
        const [_, lang, corr, pick, wk] = btnId.split("|");
        const ok = Number(pick) === Number(corr);
        await sock.sendMessage(jid, { text: ok ? "✅ Correct !" : "❌ Incorrect." });
        saveScore(jid, wk, lang, ok ? 1 : 0);
      }
    }
  });

  // CRON quotidien 10:00 Europe/Paris (utilise TZ du service)
  cron.schedule("0 10 * * *", async () => {
    const { langs, dateTitle, now } = todayInfo();
    const users = getUsers();
    for (const jid of users) {
      await sendLesson(jid, langs, dateTitle);
      if (now.day() === 6) { // samedi
        await sock.sendMessage(jid, { text: `🧪 QCM révision du samedi — ${langs.join(" + ")}` });
        await sendQCM(jid, langs);
      }
      if (now.day() === 0) { // dimanche
        const wk = now.isoWeek?.() || 0;
        const stats = getWeekly(jid, wk);
        const table = Object.entries(stats).map(([l, s]) => `• ${l}: ${s} pts`).join("\n") || "(pas de réponses enregistrées)";
        await sock.sendMessage(jid, { text: `📊 Bilan semaine ${wk}\n${table}` });
      }
    }
  });
}

async function sendLesson(jid, langs, dateTitle) {
  await sock.sendMessage(jid, { text: `📚 Leçon du jour — ${dateTitle}\nLangues : ${langs.join(" + ")}` });
  for (const L of langs) {
    const links = (LINKS[L] || []).map(x => `• ${x.t}: ${x.u}`).join("\n");
    await sock.sendMessage(jid, { text: `🔹 ${L}\nRessources :\n${links || "Bientôt..."}` });
  }
  await sendQCM(jid, langs);
  await sock.sendMessage(jid, { text: `🖥️ Quiz cliquable dans le navigateur : ${BASE_URL}/quiz/today` });
}

async function sendQCM(jid, langs) {
  const now = dayjs();
  const wk = now.isoWeek?.() || 0;
  for (const L of langs) {
    const qs = QCM[L] || [];
    if (!qs.length) continue;
    await sock.sendMessage(jid, { text: `📝 QCM — ${L}` });
    for (let i = 0; i < Math.min(4, qs.length); i++) {
      const q = qs[i];
      // Quick reply buttons (template)
      const templateButtons = q.choices.map((c, idx) => ({
        index: idx + 1,
        quickReplyButton: { displayText: `${String.fromCharCode(65+idx)}. ${c}`, id: `q|${L}|${q.correct}|${idx}|${wk}` }
      }));
      try {
        await sock.sendMessage(jid, {
          text: `Q${i+1}. ${q.q}`,
          templateButtons
        });
      } catch {
        // Fallback si templateButtons refusé
        await sock.sendMessage(jid, {
          text: `Q${i+1}. ${q.q}\nA) ${q.choices[0]}\nB) ${q.choices[1]}\nC) ${q.choices[2]}\nD) ${q.choices[3]}\nRéponds par A/B/C/D.`
        });
      }
    }
  }
}