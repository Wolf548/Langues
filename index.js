import express from "express";
import cron from "node-cron";
import { Telegraf, Markup } from "telegraf";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);
import { ROTATION, LINKS } from "./lessons.js";
import { QCM } from "./qcmBank.js";
import { generateQuizHTML } from "./quizTemplate.js";
import { addUser, getUsers, saveScore, getWeekly } from "./storage.js";

dayjsBase.extend(utc);
dayjsBase.extend(timezone);
const dayjs = dayjsBase;

const TZ = process.env.TZ || "Europe/Paris";
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN; // Telegram @BotFather token

if (!BOT_TOKEN) {
  console.warn("⚠️  Env BOT_TOKEN manquant (Telegram). Le bot Telegram ne démarrera pas.");
}

const app = express();

// --- Helpers ---
function todayInfo() {
  const now = dayjs().tz(TZ);
  const dow = now.day(); // 0=Sun..6=Sat
  const langs = ROTATION[dow] || ROTATION[1];
  const dateTitle = now.format("dddd DD/MM/YYYY");
  return { now, dow, langs, dateTitle };
}

// --- Web routes ---
app.get("/health", (_, res) => res.json({ ok: true }));
app.get("/quiz/today", (req, res) => {
  const { langs, dateTitle } = todayInfo();
  const html = generateQuizHTML(dateTitle, langs[0], langs[1], QCM);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// Optional: endpoint pour déclencher à la main
app.get("/cron/daily", async (req, res) => {
  await sendDailyLessons();
  res.json({ sent: true });
});

app.listen(PORT, () => {
  console.log(`✅ Web en ligne sur : :${PORT} (TZ=${TZ})`);
});

// --- Telegram bot ---
let bot;
if (BOT_TOKEN) {
  bot = new Telegraf(BOT_TOKEN);

  bot.start((ctx) => {
    addUser(ctx.chat.id);
    const { langs, dateTitle } = todayInfo();
    ctx.reply(
      `Bienvenue 👋\nJe t'enverrai la leçon tous les jours à 10h.\nAujourd'hui (${dateTitle}) : ${langs.join(" + ")}.\n\nTape /today pour la leçon du jour, /quiz pour le quiz HTML.`
    );
  });

  bot.command("today", async (ctx) => {
    const { langs, dateTitle } = todayInfo();
    await sendLessonToChat(ctx.chat.id, langs, dateTitle);
  });

  bot.command("quiz", (ctx) => {
    const base = process.env.BASE_URL || "https://example.onrender.com";
    ctx.reply(`Quiz cliquable du jour : ${base}/quiz/today`);
  });

  bot.on("callback_query", async (ctx) => {
    // payload: q|lang|correctIndex|pickedIndex|week
    try {
      const data = String(ctx.callbackQuery.data || "");
      const [tag, lang, corr, pick, wk] = data.split("|");
      if (tag !== "q") return ctx.answerCbQuery();
      const correct = Number(corr);
      const picked = Number(pick);
      const ok = picked === correct;
      await ctx.answerCbQuery(ok ? "✅ Correct !" : "❌ Incorrect", { show_alert: false });
      // garder un score simple : +1 par bonne réponse
      saveScore(ctx.chat.id, wk, lang, ok ? 1 : 0);
      // griser le clavier
      const keyboard = ctx.update.callback_query.message.reply_markup?.inline_keyboard || [];
      const disabled = keyboard.map(row => row.map(btn => ({ ...btn, callback_data: "disabled" })));
      await ctx.editMessageReplyMarkup({ inline_keyboard: disabled });
    } catch {
      // ignore
    }
  });

  bot.launch().then(() => console.log("🤖 Telegram bot démarré."));
}

// --- Cron 10:00 Europe/Paris ---
cron.schedule("0 10 * * *", async () => {
  await sendDailyLessons();
}, { timezone: TZ });

async function sendDailyLessons() {
  if (!bot) return;
  const { langs, dateTitle, now } = todayInfo();
  const users = getUsers();
  for (const chatId of users) {
    await sendLessonToChat(chatId, langs, dateTitle);
    // Samedi : QCM révision (simple — on renvoie le QCM du jour)
    if (now.day() === 6) {
      await bot.telegram.sendMessage(chatId, `🧪 QCM révision du samedi — ${langs.join(" + ")}`);
      await sendQCM(chatId, langs);
    }
    // Dimanche : bilan
    if (now.day() === 0) {
      const wk = now.isoWeek();
      const stats = getWeekly(chatId, wk);
      const table = Object.entries(stats).map(([l, s]) => `• ${l}: ${s} pts`).join("\n") || "(pas de réponses enregistrées)";
      await bot.telegram.sendMessage(chatId, `📊 Bilan semaine ${wk}\n${table}`);
    }
  }
}

async function sendLessonToChat(chatId, langs, dateTitle) {
  const wk = dayjs().tz(TZ).isoWeek();
  await bot.telegram.sendMessage(chatId, `📚 Leçon du jour — ${dateTitle}\nLangues : ${langs.join(" + ")}`);
  for (const L of langs) {
    const links = (LINKS[L] || []).map(x => `• ${x.t}: ${x.u}`).join("\n");
    await bot.telegram.sendMessage(
      chatId,
      `🔹 ${L}\nRessources utiles :\n${links || "Bientôt..." }`
    );
  }
  await sendQCM(chatId, langs, wk);
  const base = process.env.BASE_URL || "https://example.onrender.com";
  await bot.telegram.sendMessage(chatId, `🖥️ Quiz cliquable dans le navigateur : ${base}/quiz/today`);
}

async function sendQCM(chatId, langs, wk = dayjs().tz(TZ).isoWeek()) {
  for (const L of langs) {
    const qs = QCM[L] || [];
    if (!qs.length) continue;
    await bot.telegram.sendMessage(chatId, `📝 QCM — ${L}`);
    for (let i = 0; i < Math.min(4, qs.length); i++) {
      const q = qs[i];
      const buttons = q.choices.map((c, idx) =>
        [{ text: `${String.fromCharCode(65+idx)}. ${c}`, callback_data: `q|${L}|${q.correct}|${idx}|${wk}` }]
      );
      await bot.telegram.sendMessage(chatId, `Q${i+1}. ${q.q}`, {
        reply_markup: { inline_keyboard: buttons }
      });
    }
  }
}
