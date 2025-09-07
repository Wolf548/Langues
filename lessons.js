// Rotation 2 langues / jour (Europe/Paris)
// Lundi Arabe + Allemand, Mardi Italien + Russe, Mercredi Wenzhounais + Espagnol,
// Jeudi Anglais + Français, Vendredi Chinois + Arabe, Samedi Allemand + Espagnol, Dimanche Italien + Russe

export const ROTATION = {
  1: ["Arabe", "Allemand"],      // Monday
  2: ["Italien", "Russe"],       // Tuesday
  3: ["Wenzhounais", "Espagnol"],// Wednesday
  4: ["Anglais", "Français"],    // Thursday
  5: ["Chinois", "Arabe"],       // Friday
  6: ["Allemand", "Espagnol"],   // Saturday
  0: ["Italien", "Russe"]        // Sunday (dayjs isoWeekday: we’ll map manually)
};

// Liens gratuits pratiques par langue (envoyés avec la leçon)
export const LINKS = {
  "Arabe": [
    { t: "Forvo (prononciation)", u: "https://forvo.com/languages/ar/" },
    { t: "Madinah Arabic (cours)", u: "https://www.madinaharabic.com/" },
    { t: "Easy Arabic (YT)", u: "https://www.youtube.com/playlist?list=PLf1CIpPfxnycFjq8hVv7lcIdti1zt6Qh3" }
  ],
  "Allemand": [
    { t: "Forvo", u: "https://forvo.com/languages/de/" },
    { t: "DW Nicos Weg", u: "https://learngerman.dw.com/fr/nicos-weg/c-36519689" },
    { t: "Easy German (YT)", u: "https://www.youtube.com/c/easygerman" }
  ],
  "Italien": [
    { t: "Forvo", u: "https://forvo.com/languages/it/" },
    { t: "Duolingo IT", u: "https://fr.duolingo.com/course/it/fr/Apprendre-l'italien" },
    { t: "Easy Italian (YT)", u: "https://www.youtube.com/playlist?list=PL3B01192726B4A3E7" }
  ],
  "Russe": [
    { t: "Forvo", u: "https://forvo.com/languages/ru/" },
    { t: "Russian for Free", u: "https://www.russianforfree.com/" },
    { t: "Russian with Max (YT)", u: "https://www.youtube.com/c/RussianWithMax" }
  ],
  "Wenzhounais": [
    { t: "Phrasebook Wiktionary", u: "https://en.wiktionary.org/wiki/Appendix:Wenzhounese_phrasebook" }
  ],
  "Espagnol": [
    { t: "Forvo", u: "https://forvo.com/languages/es/" },
    { t: "Duolingo ES", u: "https://fr.duolingo.com/course/es/fr/Apprendre-l'espagnol" },
    { t: "Easy Spanish (YT)", u: "https://www.youtube.com/c/EasySpanishVideos" }
  ],
  "Anglais": [
    { t: "Forvo", u: "https://forvo.com/languages/en/" },
    { t: "BBC Learning English", u: "https://www.bbc.co.uk/learningenglish" }
  ],
  "Français": [
    { t: "Dictées en ligne", u: "https://dictee.app/" },
    { t: "Le Monde (articles)", u: "https://www.lemonde.fr/" }
  ],
  "Chinois": [
    { t: "Forvo", u: "https://forvo.com/languages/zh/" },
    { t: "Arch Chinese (caractères)", u: "https://www.archchinese.com/" },
    { t: "Mandarin Corner (YT)", u: "https://www.youtube.com/c/MandarinCorner" }
  ]
};
