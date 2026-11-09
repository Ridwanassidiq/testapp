/* AR Inner Voice
   Rule-based prototype: no generative AI. Rules route users through a CBT-inspired reflection.
   Distortion suggestions are educational prompts only, not diagnoses.
*/
const state = {
  step: 0, emotion: "", situation: "", thought: "", behavior: "",
  intensity: 50, distortions: [], evidenceFor: "", evidenceAgainst: "",
  alternative: "", action: "", sessionDate: new Date().toLocaleString("id-ID")
};
const steps = ["Check-in","Situasi","Pikiran","Evaluasi","Alternatif","Rangkuman"];
const stepContent = document.getElementById("stepContent");
const progressBar = document.getElementById("progressBar");
const stepLabel = document.getElementById("stepLabel");
const progressPercent = document.getElementById("progressPercent");
const panelKicker = document.getElementById("panelKicker");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");
let arActive = false;

const rules = [
  {id:"overgeneralization", label:"Generalisasi berlebihan", cues:[/\b(selalu|tidak pernah|semua|setiap kali)\b/i], desc:"Mengambil kesimpulan luas dari satu atau beberapa kejadian."},
  {id:"labeling", label:"Memberi label negatif", cues:[/\b(saya|aku) (bodoh|gagal|pecundang|tidak berguna)\b/i, /\bmemang bodoh\b/i], desc:"Memberi cap menyeluruh pada diri berdasarkan suatu kejadian."},
  {id:"catastrophizing", label:"Membayangkan kemungkinan terburuk", cues:[/\b(hancur|kiamat|habis sudah|tidak ada masa depan|pasti buruk)\b/i], desc:"Menganggap hasil terburuk seolah pasti terjadi."},
  {id:"mindreading", label:"Membaca pikiran orang lain", cues:[/\b(mereka pasti|dia pasti|semua orang menganggap|orang lain berpikir)\b/i], desc:"Menganggap tahu penilaian orang lain tanpa bukti yang cukup."},
  {id:"allornothing", label:"Berpikir hitam-putih", cues:[/\b( kalau tidak .* berarti|sempurna atau|gagal total|tidak sempurna berarti gagal)\b/i], desc:"Melihat keadaan hanya dalam dua kategori ekstrem."}
];

function suggestDistortions(text){
  const matches = rules.filter(rule => rule.cues.some(rx => rx.test(text || "")));
  return matches.length ? matches : [];
}
function escapeHTML(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function updateProgress(){
  const pct=Math.round(((state.step+1)/steps.length)*100);
  progressBar.style.width=pct+"%";stepLabel.textContent=`LANGKAH ${state.step+1} DARI ${steps.length}`;progressPercent.textContent=pct+"%";
  document.querySelectorAll(".step-names span").forEach((el,i)=>el.classList.toggle("current",i===state.step));
  backBtn.disabled=state.step===0;
  nextBtn.textContent=state.step===0?"Mulai refleksi →":state.step===5?"Simpan ringkasan":"Lanjutkan →";
}
function render(){
  updateProgress();
  const views=[renderCheckin,renderSituation,renderThought,renderEvaluation,renderAlternative,renderSummary];
  views[state.step]();
}
function renderCheckin(){
  panelKicker.textContent="LANGKAH 01 • MENGENALI EMOSI";
  stepContent.innerHTML=`<h2>Apa yang sedang kamu rasakan?</h2><p class="lead">Pilih emosi yang paling mendekati pengalamanmu saat ini. Kamu boleh memilih satu yang paling dominan.</p>
  <div class="choice-grid">${[["😔","Sedih"],["🌧️","Kecewa"],["😟","Cemas"],["😨","Takut"],["😠","Marah"],["💭","Bingung"],["☀️","Baik-baik saja"]].map(([e,v])=>`<button class="choice ${state.emotion===v?'selected':''}" data-emotion="${v}"><span class="emoji">${e}</span>${v}</button>`).join("")}</div>
  <div class="info-box">Tidak ada emosi yang salah. Pilihan ini hanya menjadi titik awal untuk memahami pengalamanmu.</div>`;
  stepContent.querySelectorAll("[data-emotion]").forEach(b=>b.onclick=()=>{state.emotion=b.dataset.emotion;render();});
}
function renderSituation(){
  panelKicker.textContent="LANGKAH 02 • EKSPLORASI SITUASI";
  stepContent.innerHTML=`<h2>Apa yang sedang terjadi?</h2><p class="lead">Ceritakan situasi yang berkaitan dengan perasaan tersebut. Tuliskan secukupnya, sesuai kenyamananmu.</p>
  <label class="field-label" for="situation">Situasi yang kamu alami</label><textarea id="situation" rows="4" placeholder="Contoh: Saya mendapat nilai ujian yang lebih rendah dari harapan...">${escapeHTML(state.situation)}</textarea>
  <label class="field-label" for="behavior">Apa yang biasanya kamu lakukan setelahnya? (opsional)</label><textarea id="behavior" rows="2" placeholder="Contoh: Menarik diri, menunda belajar, atau bercerita kepada teman...">${escapeHTML(state.behavior)}</textarea>
  <div class="info-box">Fokus pada kejadian yang dapat diamati. Hindari menyalahkan diri sendiri saat menceritakannya.</div>`;
}
function renderThought(){
  panelKicker.textContent="LANGKAH 03 • PIKIRAN OTOMATIS";
  stepContent.innerHTML=`<h2>Apa yang terlintas di pikiranmu?</h2><p class="lead">Saat situasi itu terjadi, kalimat apa yang muncul dalam pikiranmu tentang dirimu, orang lain, atau keadaan?</p>
  <label class="field-label" for="thought">Pikiran otomatis</label><textarea id="thought" rows="3" placeholder="Contoh: Saya bodoh dan tidak akan berhasil...">${escapeHTML(state.thought)}</textarea>
  <label class="field-label" for="intensity">Seberapa kuat emosi ${escapeHTML(state.emotion.toLowerCase())} yang kamu rasakan?</label>
  <div class="range-row"><input id="intensity" type="range" min="0" max="100" step="5" value="${state.intensity}"><span class="range-value" id="intensityValue">${state.intensity}/100</span></div>
  <div id="ruleSuggestions" class="info-box">Setelah kamu menuliskan pikiran, sistem aturan dapat menampilkan pola pikir yang mungkin relevan untuk ditinjau bersama konselor.</div>`;
  const range=document.getElementById("intensity");range.oninput=()=>{state.intensity=Number(range.value);document.getElementById("intensityValue").textContent=state.intensity+"/100";};
}
function renderEvaluation(){
  panelKicker.textContent="LANGKAH 04 • MENGUJI PIKIRAN";
  const matches=suggestDistortions(state.thought);
  const suggestions=matches.length?matches.map(m=>`<label class="check-row"><input type="checkbox" value="${m.id}" ${state.distortions.includes(m.id)?"checked":""}><span><b>${m.label}</b><br>${m.desc}</span></label>`).join(""):`<div class="info-box">Belum ada pola yang cocok dengan aturan kata kunci sederhana. Itu bukan berarti pikiranmu pasti adaptif atau tidak adaptif. Tinjau bersama konselor.</div>`;
  stepContent.innerHTML=`<h2>Mari periksa pikiran tersebut.</h2><p class="lead">Pikiran adalah sesuatu yang dapat diperiksa. Kita tidak perlu langsung menerima atau menolaknya.</p>
  <div class="thought-card">“${escapeHTML(state.thought||"Pikiran yang kamu tuliskan")}”</div>
  <label class="field-label">Pola pikir yang mungkin relevan (saran aturan, bukan diagnosis)</label><div class="check-list">${suggestions}</div>
  <label class="field-label" for="evidenceFor">Apa bukti yang mendukung pikiran tersebut?</label><textarea id="evidenceFor" rows="2" placeholder="Tuliskan fakta yang benar-benar terjadi...">${escapeHTML(state.evidenceFor)}</textarea>
  <label class="field-label" for="evidenceAgainst">Apa bukti yang tidak mendukung atau sudut pandang lain?</label><textarea id="evidenceAgainst" rows="2" placeholder="Adakah pengalaman atau fakta yang berbeda?">${escapeHTML(state.evidenceAgainst)}</textarea>
  <div class="info-box">Sistem hanya memberi saran berdasarkan pola kata tertentu. Konselor dan konseli perlu menilai konteks, makna, serta bukti secara bersama.</div>`;
  stepContent.querySelectorAll('input[type="checkbox"]').forEach(c=>c.onchange=()=>{state.distortions=[...stepContent.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value);});
}
function renderAlternative(){
  panelKicker.textContent="LANGKAH 05 • MEMBANGUN PERSPEKTIF";
  stepContent.innerHTML=`<h2>Sudut pandang apa yang lebih seimbang?</h2><p class="lead">Gunakan hasil evaluasi untuk menyusun kalimat yang realistis, adil terhadap diri sendiri, dan tetap sesuai fakta.</p>
  <div class="two-col"><div><label class="field-label">Pikiran awal</label><div class="thought-card">“${escapeHTML(state.thought)}”</div></div><div><label class="field-label">Bukti / sudut pandang lain</label><div class="info-box">${escapeHTML(state.evidenceAgainst||"Belum diisi")}</div></div></div>
  <label class="field-label" for="alternative">Pikiran alternatif yang ingin kamu coba</label><textarea id="alternative" rows="3" placeholder="Contoh: Nilai ini belum sesuai harapan, tetapi saya dapat belajar dari kesalahan dan mencoba strategi lain...">${escapeHTML(state.alternative)}</textarea>
  <label class="field-label" for="action">Satu langkah kecil yang ingin dilakukan (opsional)</label><textarea id="action" rows="2" placeholder="Contoh: Meninjau materi selama 20 menit dan bertanya kepada dosen...">${escapeHTML(state.action)}</textarea>
  <div class="info-box">Pikiran alternatif bukan kalimat positif yang dipaksakan. Pilih kalimat yang masuk akal dan dapat kamu yakini.</div>`;
}
function renderSummary(){
  panelKicker.textContent="LANGKAH 06 • RANGKUMAN REFLEKSI";
  stepContent.innerHTML=`<h2>Kamu sudah meluangkan waktu untuk memahami dirimu.</h2><p class="lead">Berikut rangkuman yang dapat dibahas kembali bersama konselor.</p>
  <div class="summary-grid">
    <div class="summary-box"><small>EMOSI</small><p>${escapeHTML(state.emotion)} • intensitas ${state.intensity}/100</p></div>
    <div class="summary-box"><small>SITUASI</small><p>${escapeHTML(state.situation)}</p></div>
    <div class="summary-box"><small>PIKIRAN OTOMATIS</small><p>${escapeHTML(state.thought)}</p></div>
    <div class="summary-box"><small>PIKIRAN ALTERNATIF</small><p>${escapeHTML(state.alternative)}</p></div>
  </div>
  <div class="ar-card"><div class="ar-top"><strong>✳ AR THOUGHT VISUALIZATION</strong><span>Pengalaman Augmented Reality</span></div>
  <div class="ar-placeholder"><div><div class="bubble-preview">${escapeHTML(state.alternative||state.thought||"Pikiranmu")}</div><p>Visualisasi pratinjau. Aktifkan kamera dan arahkan ke marker Hiro untuk melihat objek 3D di lingkungan nyata.</p></div></div>
  <div class="ar-controls"><button class="btn btn-primary" id="startAR">Buka kamera AR</button><button class="btn btn-quiet" id="showMarker">Panduan marker</button></div></div>
  <div class="info-box">Rangkuman ini bukan diagnosis atau kesimpulan klinis. Simpan hanya jika perangkat yang digunakan aman dan privat.</div>`;
  document.getElementById("startAR").onclick=launchAR;
  document.getElementById("showMarker").onclick=()=>toast("Cetak atau tampilkan marker Hiro. Panduan tersedia di README.");
}
function capture(){
  if(state.step===1){state.situation=document.getElementById("situation").value.trim();state.behavior=document.getElementById("behavior").value.trim();}
  if(state.step===2){state.thought=document.getElementById("thought").value.trim();state.intensity=Number(document.getElementById("intensity").value);}
  if(state.step===3){state.evidenceFor=document.getElementById("evidenceFor")?.value.trim()||"";state.evidenceAgainst=document.getElementById("evidenceAgainst")?.value.trim()||"";state.distortions=[...document.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value);}
  if(state.step===4){state.alternative=document.getElementById("alternative").value.trim();state.action=document.getElementById("action").value.trim();}
}
function valid(){
  if(state.step===0&&!state.emotion){toast("Pilih emosi yang paling mendekati.");return false;}
  if(state.step===1&&!document.getElementById("situation").value.trim()){toast("Ceritakan situasi secara singkat terlebih dahulu.");return false;}
  if(state.step===2&&!document.getElementById("thought").value.trim()){toast("Tuliskan pikiran yang muncul terlebih dahulu.");return false;}
  if(state.step===4&&!document.getElementById("alternative").value.trim()){toast("Tuliskan satu pikiran alternatif yang realistis.");return false;}
  return true;
}
function saveSession(){
  const old=JSON.parse(localStorage.getItem("ariv_sessions")||"[]");
  old.unshift({...state,sessionDate:new Date().toLocaleString("id-ID"),savedAt:new Date().toISOString()});
  localStorage.setItem("ariv_sessions",JSON.stringify(old.slice(0,30)));
  renderDashboard();
  toast("Rangkuman tersimpan di perangkat ini.");
}
nextBtn.onclick=()=>{capture();if(!valid())return;if(state.step===5){saveSession();return;}state.step++;render();};
backBtn.onclick=()=>{capture();if(state.step>0){state.step--;render();}};
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2600);}
function launchAR(){
  if(arActive)return;
  arActive=true;
  const thought=escapeHTML(state.alternative||state.thought||"Amati pikiranmu");
  const stage=document.createElement("div");stage.className="ar-stage";stage.id="arStage";
  stage.innerHTML=`<div class="ar-help">Arahkan kamera ke marker Hiro. Pastikan browser mendapat izin kamera. Tekan tombol kembali untuk menutup kamera.</div>
  <a-scene embedded vr-mode-ui="enabled:false" renderer="logarithmicDepthBuffer:true; colorManagement:true;" arjs="sourceType:webcam; debugUIEnabled:false; trackingMethod:best;" >
    <a-marker preset="hiro">
      <a-sphere position="0 0.8 0" radius="0.65" material="color:#b9a3e2; opacity:0.82; transparent:true; roughness:0.25"></a-sphere>
      <a-ring position="0 0.8 0" rotation="-90 0 0" radius-inner="0.72" radius-outer="0.77" material="color:#e9dfff; opacity:0.9"></a-ring>
      <a-entity position="0 1.65 0" text="value:${thought}; align:center; width:3.8; color:#ffffff; wrapCount:25; baseline:center"></a-entity>
      <a-entity position="0 0.05 0" text="value:PIKIRAN YANG SEDANG KAMU AMATI; align:center; width:4; color:#e6dcff; wrapCount:32"></a-entity>
    </a-marker>
    <a-entity camera></a-entity>
  </a-scene>`;
  const card=document.querySelector(".ar-card");
  const placeholder=card.querySelector(".ar-placeholder");
  placeholder.replaceWith(stage);
  const controls=card.querySelector(".ar-controls");
  controls.innerHTML=`<button class="btn btn-quiet" id="closeAR">Tutup kamera AR</button><span style="font-size:10px;color:#d1c8df;align-self:center">Marker: Hiro</span>`;
  document.getElementById("closeAR").onclick=()=>{stage.remove();const fresh=document.createElement("div");fresh.className="ar-placeholder";fresh.innerHTML=`<div><div class="bubble-preview">${thought}</div><p>Kamera AR ditutup. Kamu dapat membukanya kembali kapan saja.</p></div>`;card.insertBefore(fresh,controls);controls.innerHTML=`<button class="btn btn-primary" id="startAR">Buka kamera AR</button><button class="btn btn-quiet" id="showMarker">Panduan marker</button>`;document.getElementById("startAR").onclick=launchAR;document.getElementById("showMarker").onclick=()=>toast("Gunakan marker Hiro seperti pada README.");arActive=false;};
  // A-Frame may need a short moment to initialize; camera errors are handled by browser UI.
}
function renderJournal(){
  const sessions=JSON.parse(localStorage.getItem("ariv_sessions")||"[]");
  const list=document.getElementById("journalList");
  if(!sessions.length){list.innerHTML='<div class="info-box">Belum ada sesi tersimpan. Selesaikan satu sesi refleksi untuk melihat rangkumannya di sini.</div>';return;}
  list.innerHTML=sessions.map((s,i)=>`<article class="journal-card"><h3>Sesi ${sessions.length-i} • ${escapeHTML(s.sessionDate)}</h3><p><b>Emosi:</b> ${escapeHTML(s.emotion)} (${s.intensity}/100)<br><b>Situasi:</b> ${escapeHTML(s.situation)}<br><b>Pikiran awal:</b> ${escapeHTML(s.thought)}<br><b>Pikiran alternatif:</b> ${escapeHTML(s.alternative)}</p></article>`).join("");
}

function renderDashboard(){
  const sessions=JSON.parse(localStorage.getItem("ariv_sessions")||"[]");
  document.getElementById("sessionCount").textContent=sessions.length;
  const moodTitle=document.getElementById("lastMoodTitle");
  const moodText=document.getElementById("lastMoodText");
  if(sessions.length){
    const latest=sessions[0];
    moodTitle.textContent=latest.emotion||"Check-in tersimpan";
    moodText.textContent=`Intensitas yang kamu catat: ${Number(latest.intensity)||0}/100. Terima kasih sudah memberi ruang pada perasaanmu.`;
  }else{
    moodTitle.textContent="Mulai dari perasaanmu";
    moodText.textContent="Belum ada check-in tersimpan. Pilih waktu yang nyaman untuk memulai.";
  }
  const recent=document.getElementById("recentSessionList");
  if(!sessions.length){
    recent.innerHTML='<div class="empty-note">Belum ada catatan. Sesi refleksimu yang tersimpan akan muncul di sini.</div>';
  }else{
    recent.innerHTML=sessions.slice(0,3).map(s=>`<div class="recent-session"><span class="recent-mood">${escapeHTML(s.emotion||"✦")}</span><div><b>${escapeHTML(s.emotion||"Sesi refleksi")}</b><small>${escapeHTML(s.sessionDate||"Catatan pribadi")}</small></div><span class="recent-arrow">↗</span></div>`).join("");
  }
  renderTrendChart(sessions);
}
function renderTrendChart(sessions){
  const today=new Date();
  const days=Array.from({length:7},(_,i)=>{
    const date=new Date(today.getFullYear(),today.getMonth(),today.getDate()-6+i);
    return {date,label:date.toLocaleDateString("id-ID",{weekday:"short"}),count:0};
  });
  sessions.forEach(session=>{
    if(!session.savedAt)return;
    const saved=new Date(session.savedAt);
    if(Number.isNaN(saved.getTime()))return;
    const day=days.find(item=>item.date.toDateString()===new Date(saved.getFullYear(),saved.getMonth(),saved.getDate()).toDateString());
    if(day)day.count++;
  });
  const max=Math.max(1,...days.map(day=>day.count));
  const points=days.map((day,index)=>({x:index*103.33,y:126-(day.count/max)*90}));
  const line=points.map((point,index)=>`${index?"L":"M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  document.getElementById("chartLinePath").setAttribute("d",line);
  document.getElementById("chartAreaPath").setAttribute("d",`${line} L620 150 L0 150 Z`);
  const chart=document.querySelector(".trend-chart");
  chart.querySelectorAll(".chart-point").forEach(point=>point.remove());
  points.forEach(point=>{
    const dot=document.createElementNS("http://www.w3.org/2000/svg","circle");
    dot.setAttribute("class","chart-point");
    dot.setAttribute("cx",point.x.toFixed(1));
    dot.setAttribute("cy",point.y.toFixed(1));
    dot.setAttribute("r","4");
    chart.appendChild(dot);
  });
  document.querySelectorAll(".chart-days span").forEach((label,index)=>label.textContent=days[index].label);
  const weeklyCount=days.reduce((sum,day)=>sum+day.count,0);
  document.getElementById("chartCaption").textContent=weeklyCount
    ? `${weeklyCount} sesi tersimpan minggu ini. Setiap refleksi adalah kemajuan kecil.`
    : "Sesi refleksimu selama 7 hari akan terlihat di sini.";
  chart.setAttribute("aria-label",`Grafik menunjukkan ${weeklyCount} sesi refleksi selama tujuh hari terakhir`);
}
function showView(view){
  const isDashboard=view==="dashboard";
  document.getElementById("dashboardView").classList.toggle("hidden",!isDashboard);
  document.getElementById("sessionView").classList.toggle("hidden",view!=="session");
  document.getElementById("journalView").classList.toggle("hidden",view!=="journal");
  document.querySelectorAll(".nav-item").forEach(button=>{
    button.classList.toggle("active",button.dataset.view===view);
  });
  if(isDashboard)renderDashboard();
  if(view==="journal")renderJournal();
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".nav-item").forEach(button=>button.onclick=()=>showView(button.dataset.view));
document.querySelectorAll("[data-view-link]").forEach(link=>link.onclick=event=>{
  event.preventDefault();
  showView(link.dataset.viewLink);
});
document.getElementById("backToSession").onclick=()=>showView("session");
renderDashboard();
render();
