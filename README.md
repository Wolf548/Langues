# Render Lang Bot

## 1) Créer un bot Telegram
- Ouvre @BotFather dans Telegram → `/newbot`
- Récupère le **BOT_TOKEN**

## 2) Déployer sur Render
- Nouveau > **Web Service** > Connecter repo GitHub (ou "Public Git repo")
- Runtime: Node
- Variables d’environnement :
  - `BOT_TOKEN` = ton token Telegram
  - `TZ` = `Europe/Paris`
  - `BASE_URL` = l’URL Render (une fois connue)
- **Disk** persistant: 1 GB sur `/opt/render/project/src/data`
- Health check: `/health`

## 3) Démarrer
- Lance le service.
- Dans Telegram, envoie `/start` à ton bot → tu es inscrit.
- À **10h** chaque jour, tu reçois la leçon (2 langues) + QCM cliquables.
- Page quiz navigateur : `https://YOUR-SERVICE.onrender.com/quiz/today`
