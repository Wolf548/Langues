// Génère une page HTML avec 2 sections de QCM cliquables (lang1 + lang2)
export function generateQuizHTML(dateTitle, lang1, lang2, qcmBank) {
  const block = (lang) => {
    const qs = qcmBank[lang] || [];
    const items = qs.map((item, i) => `
      <div class="card">
        <div class="q"><strong>Q${i+1}.</strong> ${item.q}</div>
        <div class="choices">
          ${item.choices.map((c, j) => `
            <button class="choice" data-corr="${item.correct}" data-i="${j}">${String.fromCharCode(97+j)}) ${c}</button>
          `).join("")}
        </div>
        <div class="result"></div>
      </div>
    `).join("");

    return `<h2>${lang}</h2>${items || "<p>Aucun QCM pour le moment.</p>"}`;
  };

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Quiz — ${dateTitle}: ${lang1} + ${lang2}</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:24px;line-height:1.5}
h1,h2{margin-bottom:.4em}
.card{border:1px solid #ddd;border-radius:12px;padding:14px 16px;margin:14px 0}
.choices{display:grid;gap:8px;margin-top:6px}
.choice{padding:10px 12px;border-radius:8px;border:1px solid #ccc;background:#fff;text-align:left;cursor:pointer}
.choice.correct{border-color:#2e7d32;box-shadow:0 0 0 2px #e8f5e9 inset}
.choice.wrong{border-color:#c62828;box-shadow:0 0 0 2px #ffebee inset}
.result{margin-top:8px;font-weight:600}
.ok{color:#2e7d32}.ko{color:#c62828}
#score{position:sticky;top:0;background:#fff;border:1px solid #eee;border-radius:10px;padding:8px 12px;margin-bottom:14px}
.small{color:#444;font-size:.95em}
</style></head>
<body>
<h1>Quiz du jour — ${dateTitle}</h1>
<p class="small">Clique sur une réponse pour voir ✅/❌. Le score se met à jour.</p>
<div id="score">Score : <span id="ok">0</span> / <span id="tot">0</span></div>
${block(lang1)}
${block(lang2)}
<script>
const ok=document.getElementById('ok'), tot=document.getElementById('tot');
let s=0,t=0;
document.querySelectorAll('.card').forEach(card=>{
  let answered=false;
  const res=card.querySelector('.result');
  card.querySelectorAll('.choice').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(answered) return;
      answered=true;
      const corr=parseInt(btn.dataset.corr,10);
      const pick=parseInt(btn.dataset.i,10);
      card.querySelectorAll('.choice').forEach((b,j)=>{
        b.disabled=true;
        if(j===corr) b.classList.add('correct');
      });
      if(pick===corr){
        btn.classList.add('correct');
        res.textContent='✅ Correct !';
        res.classList.add('ok');
        s++; ok.textContent=s;
      }else{
        btn.classList.add('wrong');
        res.textContent='❌ Incorrect.';
        res.classList.add('ko');
      }
      t++; tot.textContent=t;
    });
  });
});
</script>
</body></html>`;
}
}
