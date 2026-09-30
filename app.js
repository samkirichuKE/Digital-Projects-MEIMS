
const D=window.ME_DATA || {projects:[], indicators:[], beneficiaryMasters:[], districts:[], sexes:['Male','Female'], quarters:['Q1','Q2','Q3','Q4']};
const KEY='fao_mne_mvp_v9';
function safeLoad(){try{const raw=window.localStorage.getItem(KEY);return raw?JSON.parse(raw):{};}catch(e){try{window.localStorage.removeItem(KEY);}catch(_e){};return {};}}
const saved=safeLoad();
if(Array.isArray(saved.customIndicators)) D.indicators.push(...saved.customIndicators);
function safeSave(data){try{window.localStorage.setItem(KEY,JSON.stringify(data));}catch(e){console.warn('Local storage unavailable; session will not persist.',e);}}

const state={
  projects:saved.projects||D.projects.map(p=>({...p,districts:[]})),
  role:saved.role||'M&E Manager',
  beneficiaryEntries:saved.beneficiaryEntries||[],
  beneficiaryTargets:saved.beneficiaryTargets||{},
  resultEntries:saved.resultEntries||[],
  resultTargets:saved.resultTargets||{},
  submissions:saved.submissions||[],
  settings:saved.settings||{project:'All',year:new Date().getFullYear()},
  customIndicators:saved.customIndicators||[]
};
let editingBeneficiaryId=null;
function save(){safeSave(state)}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function fmt(n){if(n===null||n===undefined||n==='')return '—';return Number(n).toLocaleString(undefined,{maximumFractionDigits:1})}
function pct(a,t){return t?Math.round((Number(a)/Number(t))*1000)/10:0}
function perfClass(q){return q>=75?'green':q>=50?'amber':'red'}
function perfLabel(q){return q>=75?'On track':q>=50?'Moderate':'Needs attention'}
function resultYears(){return Array.from({length:13},(_,i)=>2023+i)}
function beneficiaryYears(){return Array.from({length:17},(_,i)=>2024+i)}
const DEFAULT_PROJECT_DISTRICTS={
  EbAM:['Chitipa','Karonga','Rumphi','Nkhata Bay','Dedza','Mangochi','Zomba','Thyolo','Neno','Mwanza','Nsanje'],
  AFR100:['Mangochi','Ntcheu'],
  ACE:['Mchinji']
};
function projects(){return state.projects||D.projects}
function districtsForProject(project){return (projects().find(p=>p.name===project)?.districts?.length?projects().find(p=>p.name===project).districts:DEFAULT_PROJECT_DISTRICTS[project]||[])}
function roleCanManage(){return state.role==='M&E Manager'}
state.projects.forEach(p=>{if(!p.districts||!p.districts.length){p.districts=DEFAULT_PROJECT_DISTRICTS[p.name]||[]}});
save();

function yearOptions(list,selected){return list.map(y=>`<option value="${y}" ${Number(y)===Number(selected)?'selected':''}>${y}</option>`).join('')}
function periodsFor(freq){freq=(freq||'').toLowerCase();if(freq.includes('mid-term')&&freq.includes('endline'))return ['Mid-Term','Endline'];if(freq.includes('mid-term'))return ['Mid-Term'];if(freq.includes('endline'))return ['Endline'];if(freq.includes('annual'))return ['Annual'];if(freq.includes('semi-annual')||freq.includes('semi annual')||freq.includes('semiannual'))return ['Semi-Annual 1','Semi-Annual 2'];if(freq.includes('quarter'))return ['Q1','Q2','Q3','Q4'];if(freq.includes('monthly'))return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return ['Annual']}
function projectOptions(selected='All'){return ['All',...projects().map(p=>p.name)].map(x=>`<option value="${esc(x)}" ${x===selected?'selected':''}>${esc(x==='All'?'All Projects':x)}</option>`).join('')}
function resultIndicatorOptions(project='All',level='All',selected=''){return D.indicators.filter(i=>(project==='All'||i.project===project)&&(level==='All'||i.level===level)).map(i=>`<option value="${esc(i.id)}" ${i.id===selected?'selected':''}>${esc(i.id)} — ${esc(i.indicator)}</option>`).join('')}
function page(title,body){document.querySelector('#app').innerHTML=`<div class="shell"><aside class="sidebar"><div class="brand"><b>FAO Malawi Digital M&E</b><span>Dynamic Monitoring & Evaluation System</span></div><nav class="nav">
<button class="${location.hash===''||location.hash==='#dashboard'?'active':''}" onclick="go('dashboard')">🏠 Main Dashboard</button>
<button class="${location.hash==='#beneficiary-entry'?'active':''}" onclick="go('beneficiary-entry')">👥 Beneficiary Data Entry</button>
<button class="${location.hash==='#results-dashboard'?'active':''}" onclick="go('results-dashboard')">📊 Results Framework Dashboard</button>
<button class="${location.hash==='#results-entry'?'active':''}" onclick="go('results-entry')">📝 Results Data Entry</button>
<button class="${location.hash==='#indicators'?'active':''}" onclick="go('indicators')">🎯 Indicators</button>
<button class="${location.hash==='#targets'?'active':''}" onclick="go('targets')">🎯 Target Management</button>
<button class="${location.hash==='#approvals'?'active':''}" onclick="go('approvals')">✓ Approvals</button>
<button class="${location.hash==='#admin'?'active':''}" onclick="go('admin')">⚙ Administration</button>
</nav></aside><main class="main"><header class="top"><h1>${esc(title)}</h1><div class="small">FAO Malawi • Digital M&E System &nbsp; <label>Role <select class="select" style="width:auto" onchange="setRole(this.value)"><option ${state.role==='M&E Manager'?'selected':''}>M&E Manager</option><option ${state.role==='Data Entry Officer'?'selected':''}>Data Entry Officer</option><option ${state.role==='Project Manager'?'selected':''}>Project Manager</option></select></label></div></header><section class="content">${body}</section></main></div>`}
function go(h){location.hash=h}
function setRole(r){state.role=r;save();render()}
function kpi(label,value,sub='',statusClass=''){
 const icons={'Beneficiaries achieved':'👥','Target':'🎯','% achieved':'📊','Projects reporting':'📁','Reporting records':'📝'};
 const icon=icons[label]||'';
 return `<div class="card kpi"><div class="label"><span class="kpi-icon" aria-hidden="true">${icon}</span>${esc(label)}</div><div class="value ${statusClass}">${value}</div><div class="sub">${esc(sub)}</div></div>`;
}
function kpiPerformance(label,value,sub,q){
 return kpi(label,value,sub,perfClass(q)+' kpi-performance');
}
function filtersBar(idPrefix,includeQuarter=false){
 return `<div class="toolbar">
 <label class="filter-label">Project</label><select id="${idPrefix}Project" class="select">${projectOptions('All')}</select>
 <label class="filter-label">Year</label><select id="${idPrefix}Year" class="select">${yearOptions(beneficiaryYears(),2026)}</select>
 ${includeQuarter?`<label class="filter-label">Quarter</label><select id="${idPrefix}Quarter" class="select"><option value="All">All Quarters</option>${D.quarters.map(q=>`<option>${q}</option>`).join('')}</select>`:''}
 </div>`
}
function sumBenef(filters={}){
 return D.beneficiaryMasters.reduce((acc,m)=>{
   if(filters.project&&filters.project!=='All'&&m.Project!==filters.project)return acc;
   if(filters.support&&filters.support!=='All'&&m['Technical Support']!==filters.support)return acc;
   if(filters.area&&filters.area!=='All'&&m['Support Area']!==filters.area)return acc;
   for(const e of state.beneficiaryEntries){
     if(e.project!==m.Project||e.indicator!==m.Indicator||e.technicalSupport!==m['Technical Support']||e.supportArea!==m['Support Area'])continue;
     if(filters.project&&filters.project!=='All'&&e.project!==filters.project)continue;
     if(filters.year&&Number(e.year)!==Number(filters.year))continue;
     if(filters.quarter&&filters.quarter!=='All'&&e.quarter!==filters.quarter)continue;
     acc.ach+=Number(e.achievement||0); acc.target+=Number(e.target||0);
   }
   return acc;
 },{ach:0,target:0})
}
function beneficiaryDashboard(){
 const body=`<div class="toolbar">
 <label class="filter-label">Project</label><select id="bdProject" class="select" onchange="renderBeneficiaryDashboard()">${projectOptions('All')}</select>
 <label class="filter-label">Year</label><select id="bdYear" class="select" onchange="renderBeneficiaryDashboard()">${yearOptions(beneficiaryYears(),2026)}</select>
 <label class="filter-label">Quarter</label><select id="bdQuarter" class="select" onchange="renderBeneficiaryDashboard()"><option value="All">All Quarters</option>${D.quarters.map(q=>`<option>${q}</option>`).join('')}</select>
 </div>
 <div class="legend"><span><i class="dot green"></i> ≥75% On track</span><span><i class="dot amber"></i> 50–74.9% Moderate</span><span><i class="dot red"></i> &lt;50% Needs attention</span></div>
 <div id="bdContent"></div>`;
 return body;
}
function dashboardRows(analysis,project,year,quarter){
 const entries=state.beneficiaryEntries;
 const inScope=e=>(project==='All'||e.project===project)&&(quarter==='All'||e.quarter===quarter);
 if(analysis==='year'){
   const years=[...new Set(entries.filter(inScope).map(e=>Number(e.year)).filter(y=>y>=2024&&y<=2040))].sort((a,b)=>a-b);
   return years.map(y=>aggregateBenef(entries.filter(e=>inScope(e)&&Number(e.year)===y),String(y)));
 }
 if(analysis==='quarter'){
   return D.quarters.map(q=>aggregateBenef(entries.filter(e=>inScope(e)&&Number(e.year)===year&&e.quarter===q),q));
 }
 if(analysis==='project'){
   return projects().map(p=>aggregateBenef(entries.filter(e=>Number(e.year)===year&&(quarter==='All'||e.quarter===quarter)&&e.project===p.name),p.name)).filter(x=>x.t||x.a);
 }
 if(analysis==='district'){
   const ds=project==='All'?[...new Set(entries.filter(e=>Number(e.year)===year&&(quarter==='All'||e.quarter===quarter)).map(e=>e.district))]:districtsForProject(project);
   return ds.map(d=>aggregateBenef(entries.filter(e=>Number(e.year)===year&&(quarter==='All'||e.quarter===quarter)&&(project==='All'||e.project===project)&&e.district===d),d)).filter(x=>x.t||x.a);
 }
 return D.sexes.map(g=>aggregateBenef(entries.filter(e=>Number(e.year)===year&&(quarter==='All'||e.quarter===quarter)&&(project==='All'||e.project===project)&&e.sex===g),g)).filter(x=>x.t||x.a);
}
function supportBreakdownRows(project,year,quarter,mode){
 const entries=state.beneficiaryEntries.filter(e=>(project==='All'||e.project===project)&&Number(e.year)===Number(year)&&(quarter==='All'||e.quarter===quarter));
 const key=mode==='area'?'supportArea':'technicalSupport';
 const labels=[...new Set(entries.map(e=>e[key]).filter(Boolean))].sort();
 return labels.map(label=>aggregateBenef(entries.filter(e=>e[key]===label),label)).filter(x=>x.t||x.a);
}
function aggregateBenef(rows,label){const t=rows.reduce((s,e)=>s+Number(e.target||0),0),a=rows.reduce((s,e)=>s+Number(e.achievement||0),0);return {label,t,a,p:pct(a,t)}}
function renderBeneficiaryDashboard(){
 const c=document.querySelector('#bdContent'); if(!c)return;
 const project=document.querySelector('#bdProject').value, year=Number(document.querySelector('#bdYear').value), quarter=document.querySelector('#bdQuarter').value;
 const oldChart=document.querySelector('#bdChartType')?.value||'line';
 const oldAnalysis=document.querySelector('#bdAnalysis')?.value||'year';
 const oldSupport=document.querySelector('#bdSupportBreakdown')?.value||'technical';
 const entries=state.beneficiaryEntries.filter(e=>(project==='All'||e.project===project)&&Number(e.year)===year&&(quarter==='All'||e.quarter===quarter));
 const target=entries.reduce((s,e)=>s+Number(e.target||0),0), ach=entries.reduce((s,e)=>s+Number(e.achievement||0),0), q=pct(ach,target);
 const projectRows=projects().map(p=>aggregateBenef(entries.filter(e=>e.project===p.name),p.name)).filter(x=>x.t||x.a);
 const rows=dashboardRows(oldAnalysis,project,year,quarter);
 const titleMap={year:'Beneficiary trend by year',quarter:`Beneficiary trend by quarter — ${year}`,project:'Beneficiaries by project',district:'Beneficiaries by district',gender:'Beneficiaries by gender'};
 c.innerHTML=`<div class="grid kpis">${kpi('Beneficiaries achieved',fmt(ach),`${year}${quarter==='All'?'':' • '+quarter}`)}${kpi('Target',fmt(target),'Selected period')}${kpiPerformance('% achieved',q+'%',perfLabel(q),q)}${kpi('Projects reporting',projectRows.length,'Selected filters')}${kpi('Reporting records',entries.length,'Beneficiary records')}</div>
 <div class="card chart-card" style="margin-top:16px">
   <div class="chart-header">
     <div><h2 style="margin:0">${titleMap[oldAnalysis]}</h2><span class="small">Hover over chart elements to see target, achievement and performance.</span></div>
     <div class="chart-controls">
       <label class="filter-label">Chart</label>
       <select id="bdChartType" class="select" onchange="renderBeneficiaryDashboard()">
         <option value="line" ${oldChart==='line'?'selected':''}>Line</option>
         <option value="bar" ${oldChart==='bar'?'selected':''}>Bar</option>
         <option value="pie" ${oldChart==='pie'?'selected':''}>Pie</option>
       </select>
       <label class="filter-label">Analysis</label>
       <select id="bdAnalysis" class="select" onchange="renderBeneficiaryDashboard()">
         <option value="year" ${oldAnalysis==='year'?'selected':''}>Trend by Year</option>
         <option value="quarter" ${oldAnalysis==='quarter'?'selected':''}>Trend by Quarter</option>
         <option value="project" ${oldAnalysis==='project'?'selected':''}>Compare by Project</option>
         <option value="district" ${oldAnalysis==='district'?'selected':''}>Compare by District</option>
         <option value="gender" ${oldAnalysis==='gender'?'selected':''}>Compare by Gender</option>
       </select>
     </div>
   </div>
   ${dashboardChart(rows,oldChart,oldAnalysis)}
 </div>
 <div class="card" style="margin-top:16px">
   <div class="metric"><h2 style="margin:0">Beneficiaries by technical support and support area</h2><span class="small">Switch between technical-support type and individual support-area analysis.</span></div>
   <div class="toolbar" style="margin-top:12px">
     <label class="filter-label">Breakdown</label>
     <select id="bdSupportBreakdown" class="select" onchange="renderSupportBreakdown()">
       <option value="technical" ${oldSupport==='technical'?'selected':''}>Technical Support</option>
       <option value="area" ${oldSupport==='area'?'selected':''}>Support Area</option>
     </select>
   </div>
   <div id="bdSupportChart"></div>
 </div>
 <div class="grid two" style="margin-top:16px"><div class="card"><h2>Performance by project</h2>${projectRows.map(x=>`<div class="metric"><span><b>${esc(x.label)}</b><br><span class="small">${fmt(x.a)} / ${fmt(x.t)}</span></span><strong class="${perfClass(x.p)}Text">${x.p}%</strong></div><div class="progress ${perfClass(x.p)}"><span style="width:${Math.min(x.p,100)}%"></span></div>`).join('')||'<div class="empty">No beneficiary data reported for the selected filters.</div>'}</div><div class="card"><h2>Reporting note</h2><p class="small">Achievement status uses the beneficiary threshold: green ≥75%, amber 50–74.9%, red &lt;50%. Targets and achievements are aggregated from the underlying project, support area, sex, district, quarter and year records.</p></div></div>`;
 renderSupportBreakdown();
 bindChartTooltips();
}
function renderSupportBreakdown(){
 const project=document.querySelector('#bdProject')?.value||'All';
 const year=Number(document.querySelector('#bdYear')?.value||2026);
 const quarter=document.querySelector('#bdQuarter')?.value||'All';
 const mode=document.querySelector('#bdSupportBreakdown')?.value||'technical';
 const sc=document.querySelector('#bdSupportChart'); if(!sc)return;
 const rows=supportBreakdownRows(project,year,quarter,mode);
 sc.innerHTML=dashboardChart(rows,'bar',mode);
 bindChartTooltips(sc);
}
function bindChartTooltips(root=document){
 const container=root===document?document:root;
 container.querySelectorAll('.chart [data-tip]').forEach(el=>{
   if(el.dataset.tipBound)return;
   el.dataset.tipBound='1';
   el.addEventListener('mouseenter',e=>showChartTooltip(e,el.dataset.tip));
   el.addEventListener('mousemove',e=>showChartTooltip(e,el.dataset.tip));
   el.addEventListener('mouseleave',hideChartTooltip);
 });
}
function showChartTooltip(e,text){
 let tip=document.querySelector('#chartTooltip');
 if(!tip){tip=document.createElement('div');tip.id='chartTooltip';tip.className='chart-tooltip';document.body.appendChild(tip);}
 tip.textContent=text; tip.style.left=(e.clientX+14)+'px'; tip.style.top=(e.clientY+14)+'px'; tip.style.display='block';
}
function hideChartTooltip(){const tip=document.querySelector('#chartTooltip');if(tip)tip.style.display='none';}

function dashboardChart(rows,type,analysis){
 if(!rows.length)return '<div class="empty">No data available for the selected filters.</div>';
 if(type==='pie')return pieChart(rows);
 return svgChart(rows,type,analysis);
}
function svgChart(rows,type,analysis){
 const W=900,H=340,padL=58,padR=25,padT=30,padB=55,max=Math.max(1,...rows.flatMap(r=>[r.t,r.a])),iw=W-padL-padR,ih=H-padT-padB;
 const xAt=i=>rows.length===1?padL+iw/2:padL+i*iw/(rows.length-1);
 const yAt=v=>H-padB-(Number(v||0)/max)*ih;
 const labels=rows.map((r,i)=>`<text x="${xAt(i)}" y="${H-22}" text-anchor="middle" font-size="11" fill="#667085">${esc(r.label)}</text>`).join('');
 if(type==='bar'){
   const step=iw/Math.max(rows.length,1), bw=Math.min(34,step*.26);
   const bars=rows.map((r,i)=>{const x=padL+i*step+step/2;const ty=yAt(r.t),ay=yAt(r.a),h=H-padB-ty,ha=H-padB-ay;return `<rect x="${x-bw-3}" y="${ty}" width="${bw}" height="${h}" fill="#1769c2" rx="4" data-tip="${esc(r.label)} • Target: ${fmt(r.t)} • Achievement: ${fmt(r.a)} • ${r.p}% achieved"><title>${esc(r.label)} — Target: ${fmt(r.t)}</title></rect><rect x="${x+3}" y="${ay}" width="${bw}" height="${ha}" fill="var(--${perfClass(r.p)})" rx="4" data-tip="${esc(r.label)} • Target: ${fmt(r.t)} • Achievement: ${fmt(r.a)} • ${r.p}% achieved"><title>${esc(r.label)} — Achievement: ${fmt(r.a)}; Target: ${fmt(r.t)}; ${r.p}% achieved</title></rect>`}).join('');
   return `<svg viewBox="0 0 ${W} ${H}" class="chart"><line x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}" stroke="#dce3ec"/>${bars}${labels}<text x="${padL}" y="16" font-size="11" fill="#1769c2">Target</text><text x="${padL+65}" y="16" font-size="11" fill="#475467">Achievement (colour = performance)</text></svg>`;
 }
 const targetPts=rows.map((r,i)=>`${xAt(i)},${yAt(r.t)}`).join(' ');
 const line=rows.map((r,i)=>`<circle cx="${xAt(i)}" cy="${yAt(r.a)}" r="7" fill="var(--${perfClass(r.p)})" data-tip="${esc(r.label)} • Target: ${fmt(r.t)} • Achievement: ${fmt(r.a)} • ${r.p}% achieved"><title>${esc(r.label)} — Achievement: ${fmt(r.a)}; Target: ${fmt(r.t)}; ${r.p}% achieved</title></circle>`).join('');
 return `<svg viewBox="0 0 ${W} ${H}" class="chart"><line x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}" stroke="#dce3ec"/><polyline points="${targetPts}" fill="none" stroke="#1769c2" stroke-width="3" stroke-dasharray="7 5"/>${rows.length>1?`<polyline points="${rows.map((r,i)=>`${xAt(i)},${yAt(r.a)}`).join(' ')}" fill="none" stroke="#475467" stroke-width="2"/>`:''}${line}${labels}<text x="${padL}" y="16" font-size="11" fill="#1769c2">Target</text><text x="${padL+65}" y="16" font-size="11" fill="#475467">Achievement</text></svg>`;
}
function pieChart(rows){
 const total=rows.reduce((s,r)=>s+r.a,0);if(!total)return '<div class="empty">No achievement data available for a pie chart.</div>';
 const cx=250,cy=165,r=115;let angle=-Math.PI/2;const slices=rows.map((row,i)=>{const start=angle,delta=(row.a/total)*Math.PI*2;angle+=delta;const end=angle,large=delta>Math.PI?1:0;const x1=cx+r*Math.cos(start),y1=cy+r*Math.sin(start),x2=cx+r*Math.cos(end),y2=cy+r*Math.sin(end);const path=`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;return `<path d="${path}" fill="var(--${['blue','green','amber','red'][i%4]})" data-tip="${esc(row.label)} • Target: ${fmt(row.t)} • Achievement: ${fmt(row.a)} • ${row.p}% achieved"><title>${esc(row.label)} — Achievement: ${fmt(row.a)}; Target: ${fmt(row.t)}; ${row.p}% achieved</title></path>`}).join('');
 const legend=rows.map((row,i)=>`<div class="metric"><span><i class="dot ${['blue','green','amber','red'][i%4]}"></i>${esc(row.label)}</span><strong>${fmt(row.a)} (${Math.round(row.a/total*1000)/10}%)</strong></div>`).join('');
 return `<div class="pie-layout"><svg viewBox="0 0 500 330" class="chart piechart">${slices}</svg><div>${legend}</div></div>`;
}
function dashboard(){return beneficiaryDashboard()}
function beneficiaryEntry(){
 const first=D.beneficiaryMasters[0]||{};
 return `<div class="card"><h2>Beneficiary reporting data entry</h2><div class="alert">Beneficiary indicators are reported by <b>Sex</b>, <b>Reporting Quarter</b>, <b>District</b> and <b>Year</b>. The year is typable and must be a four-digit year from 2024 to 2040. A separate target is maintained for each reporting quarter.</div>
 <div class="form-grid" style="margin-top:18px">
 <div class="field"><label>Project</label><select id="bproject" class="select" style="width:100%" onchange="updateBenefProject()">${projects().map(p=>`<option>${esc(p.name)}</option>`).join('')}</select></div>
 <div class="field"><label>Indicator</label><select id="bindicator" class="select" style="width:100%" onchange="updateBenefMaster()"></select></div>
 <div class="field"><label>Technical Support</label><select id="btech" class="select" style="width:100%" onchange="updateBenefArea()"></select></div>
 <div class="field"><label>Support Area</label><select id="barea" class="select" style="width:100%" onchange="updateBenefTarget()"></select></div>
 <div class="field"><label>Sex</label><select id="bsex" class="select" style="width:100%" onchange="updateBenefGenderTotal();updateBenefTarget()">${D.sexes.map(x=>`<option>${x}</option>`).join('')}</select></div><div class="field"><label>Gender Total (Male + Female)</label><div id="bgenderTotal" class="status-box neutral">0 beneficiaries</div><div class="small">Calculated automatically from Male and Female records for the selected project, indicator, support area, district, quarter and year.</div></div>
 <div class="field"><label>District</label><select id="bdistrict" class="select" style="width:100%" onchange="updateBenefGenderTotal();updateBenefTarget()">${districtsForProject(projects()[0]?.name||'').map(x=>`<option>${x}</option>`).join('')}</select></div>
 <div class="field"><label>Reporting Quarter</label><select id="bquarter" class="select" style="width:100%" onchange="updateBenefGenderTotal();updateBenefTarget()">${D.quarters.map(x=>`<option>${x}</option>`).join('')}</select></div>
 <div class="field"><label>Reporting Year</label><input id="byear" class="input" style="width:100%" type="number" min="2024" max="2040" step="1" placeholder="YYYY" oninput="updateBenefGenderTotal();updateBenefTarget()"></div>
 <div class="field"><label>Quarter Target</label><input id="btarget" class="input" style="width:100%" type="number" min="0" step="any" placeholder="Enter target"></div>
 <div class="field"><label>Achievement</label><input id="bach" class="input" style="width:100%" type="number" min="0" step="any" placeholder="Enter achievement" oninput="updateBenefPerformance();updateBenefGenderTotal()"></div><div class="field"><label>% Achievement</label><div id="bachPct" class="status-box red">0.0% — Needs attention</div></div><div class="field full"><label>Note / Explanation</label><textarea id="bnote" class="input" rows="3" placeholder="Explain reasons for the achievement, shortfalls or exceptional performance..."></textarea></div>
 </div><div class="small" id="btargetNote" style="margin-top:8px"></div>
 <div style="margin-top:18px;text-align:right"><button class="btn primary" id="benefSave" onclick="saveBeneficiary()">Save Beneficiary Record</button></div></div>
 <div class="card" style="margin-top:16px"><h2>Recent beneficiary records</h2><div class="table-wrap"><table class="table"><thead><tr><th>Project</th><th>Support</th><th>Area</th><th>Sex</th><th>District</th><th>Quarter</th><th>Year</th><th>Target</th><th>Achievement</th><th>%</th><th>Note</th><th>Actions</th></tr></thead><tbody>${state.beneficiaryEntries.slice(-50).reverse().map(e=>`<tr><td>${esc(e.project)}</td><td>${esc(e.technicalSupport)}</td><td>${esc(e.supportArea)}</td><td>${esc(e.sex)}</td><td>${esc(e.district)}</td><td>${e.quarter}</td><td>${e.year}</td><td>${fmt(e.target)}</td><td>${fmt(e.achievement)}</td><td><span class="badge ${perfClass(pct(e.achievement,e.target))}">${pct(e.achievement,e.target)}%</span></td><td>${esc(e.note||'')}</td><td>${roleCanManage()?`<button class="btn smallbtn" onclick="editBeneficiary(${e.id})">Edit</button> <button class="btn danger smallbtn" onclick="deleteBeneficiary(${e.id})">Delete</button>`:'—'}</td></tr>`).join('')||'<tr><td colspan="12" class="empty">No beneficiary records entered yet.</td></tr>'}</tbody></table></div></div>`;
}
function updateBenefProject(){
 const p=document.querySelector('#bproject').value;
 const ds=districtsForProject(p), sel=document.querySelector('#bdistrict'), old=sel.value;
 sel.innerHTML=ds.map(x=>`<option>${esc(x)}</option>`).join(''); if(ds.includes(old))sel.value=old;
 updateBenefMaster();
}
function editBeneficiary(id){
 if(!roleCanManage()){alert('Only the M&E Manager can edit beneficiary records.');return}
 const e=state.beneficiaryEntries.find(x=>x.id===id); if(!e)return; editingBeneficiaryId=id;
 document.querySelector('#bproject').value=e.project; updateBenefProject();
 document.querySelector('#bindicator').value=e.indicator; updateBenefMaster();
 document.querySelector('#btech').value=e.technicalSupport; updateBenefArea();
 document.querySelector('#barea').value=e.supportArea; document.querySelector('#bsex').value=e.sex; document.querySelector('#bdistrict').value=e.district; document.querySelector('#bquarter').value=e.quarter; document.querySelector('#byear').value=e.year; document.querySelector('#btarget').value=e.target; document.querySelector('#bach').value=e.achievement; document.querySelector('#bnote').value=e.note||''; updateBenefPerformance();
 const b=document.querySelector('#benefSave'); b.textContent='Update Beneficiary Record'; b.onclick=()=>updateBeneficiary(id); window.scrollTo({top:0,behavior:'smooth'});
}
function updateBeneficiary(id){
 if(!roleCanManage()){alert('Only the M&E Manager can update beneficiary records.');return}
 const y=Number(document.querySelector('#byear').value); if(!Number.isInteger(y)||y<2024||y>2040){alert('Reporting Year must be a four-digit year from 2024 to 2040.');return}
 const e=state.beneficiaryEntries.find(x=>x.id===id); if(!e)return;
 Object.assign(e,{project:document.querySelector('#bproject').value,indicator:document.querySelector('#bindicator').value,technicalSupport:document.querySelector('#btech').value,supportArea:document.querySelector('#barea').value,sex:document.querySelector('#bsex').value,district:document.querySelector('#bdistrict').value,quarter:document.querySelector('#bquarter').value,year:y,target:Number(document.querySelector('#btarget').value),achievement:Number(document.querySelector('#bach').value),note:document.querySelector('#bnote').value.trim(),updatedAt:new Date().toISOString()});
 state.beneficiaryTargets[benefKey()]=e.target; save(); alert('Beneficiary record updated.'); editingBeneficiaryId=null; render();
}
function deleteBeneficiary(id){if(!roleCanManage()){alert('Only the M&E Manager can delete beneficiary records.');return} if(!confirm('Delete this beneficiary record?'))return; state.beneficiaryEntries=state.beneficiaryEntries.filter(x=>x.id!==id); if(editingBeneficiaryId===id)editingBeneficiaryId=null; save(); render()}
function updateBenefMaster(){
 const p=document.querySelector('#bproject').value;
 const masters=D.beneficiaryMasters.filter(x=>x.Project===p);
 const ind=[...new Set(masters.map(x=>x.Indicator))],tech=[...new Set(masters.map(x=>x['Technical Support']))];
 const is=document.querySelector('#bindicator'),ts=document.querySelector('#btech');
 const oldI=is.value,oldT=ts.value;
 is.innerHTML=ind.map(x=>`<option>${esc(x)}</option>`).join('');
 if(ind.includes(oldI))is.value=oldI;
 ts.innerHTML=tech.map(x=>`<option>${esc(x)}</option>`).join('');
 if(tech.includes(oldT))ts.value=oldT;
 updateBenefArea(); updateBenefTarget(); updateBenefGenderTotal();
}
function updateBenefArea(){
 const p=document.querySelector('#bproject').value, ind=document.querySelector('#bindicator').value, tech=document.querySelector('#btech').value;
 const areas=D.beneficiaryMasters.filter(x=>x.Project===p&&x.Indicator===ind&&x['Technical Support']===tech).map(x=>x['Support Area']);
 document.querySelector('#barea').innerHTML=areas.map(x=>`<option>${esc(x)}</option>`).join('');
 updateBenefTarget(); updateBenefGenderTotal();
}
function benefKey(){
 const p=document.querySelector('#bproject').value,ind=document.querySelector('#bindicator').value,tech=document.querySelector('#btech').value,area=document.querySelector('#barea').value,sex=document.querySelector('#bsex').value,district=document.querySelector('#bdistrict').value,q=document.querySelector('#bquarter').value,y=document.querySelector('#byear').value;
 return [p,ind,tech,area,sex,district,y,q].join('|');
}
function updateBenefGenderTotal(){
 const box=document.querySelector('#bgenderTotal'); if(!box)return;
 const p=document.querySelector('#bproject')?.value, ind=document.querySelector('#bindicator')?.value, tech=document.querySelector('#btech')?.value, area=document.querySelector('#barea')?.value, district=document.querySelector('#bdistrict')?.value, q=document.querySelector('#bquarter')?.value, y=Number(document.querySelector('#byear')?.value||0);
 const currentId=editingBeneficiaryId;
 const rows=state.beneficiaryEntries.filter(e=>e.id!==currentId&&e.project===p&&e.indicator===ind&&e.technicalSupport===tech&&e.supportArea===area&&e.district===district&&e.quarter===q&&Number(e.year)===y);
 let male=rows.filter(e=>e.sex==='Male').reduce((s,e)=>s+Number(e.achievement||0),0);
 let female=rows.filter(e=>e.sex==='Female').reduce((s,e)=>s+Number(e.achievement||0),0);
 const currentSex=document.querySelector('#bsex')?.value;
 const currentAchievement=Number(document.querySelector('#bach')?.value||0);
 if(currentSex==='Male') male+=currentAchievement;
 if(currentSex==='Female') female+=currentAchievement;
 const total=male+female;
 box.className='status-box neutral';
 box.textContent=`${fmt(total)} beneficiaries (Male: ${fmt(male)} • Female: ${fmt(female)})`;
}
function updateBenefTarget(){
 const y=Number(document.querySelector('#byear')?.value||0),q=document.querySelector('#bquarter')?.value||'Q1';
 const key=benefKey(); const existing=state.beneficiaryTargets[key];
 const t=document.querySelector('#btarget'); const note=document.querySelector('#btargetNote');
 if(t){t.value=existing??'';note.textContent=(y>=2024&&y<=2040)?`Target is stored for ${q} ${y} for the selected project, support area, sex and district.`:'Enter a four-digit year from 2024 to 2040.';updateBenefPerformance();updateBenefGenderTotal()}
}
function updateBenefPerformance(){const t=Number(document.querySelector('#btarget')?.value||0),a=Number(document.querySelector('#bach')?.value||0),box=document.querySelector('#bachPct');if(!box)return;const p=pct(a,t);box.className=`status-box ${perfClass(p)}`;box.textContent=`${p}% — ${perfLabel(p)}`}
function saveBeneficiary(){
 const y=Number(document.querySelector('#byear').value);
 if(!Number.isInteger(y)||y<2024||y>2040){alert('Reporting Year must be a four-digit year from 2024 to 2040.');return}
 const target=Number(document.querySelector('#btarget').value),ach=Number(document.querySelector('#bach').value);
 if(!isFinite(target)||target<0){alert('Enter a valid quarterly target.');return}
 if(!isFinite(ach)||ach<0){alert('Enter a valid achievement.');return}
 const p=document.querySelector('#bproject').value,ind=document.querySelector('#bindicator').value,tech=document.querySelector('#btech').value,area=document.querySelector('#barea').value,sex=document.querySelector('#bsex').value,district=document.querySelector('#bdistrict').value,q=document.querySelector('#bquarter').value;
 const key=[p,ind,tech,area,sex,district,y,q].join('|');
 state.beneficiaryTargets[key]=target;
 state.beneficiaryEntries.push({id:Date.now(),project:p,indicator:ind,technicalSupport:tech,supportArea:area,sex,district,quarter:q,year:y,target,achievement:ach,note:document.querySelector('#bnote').value.trim(),enteredAt:new Date().toISOString(),status:'Submitted'});
 state.submissions.push({id:Date.now()+1,type:'Beneficiary',project:p,indicator:ind,year:y,period:q,status:'Submitted'});
 save();alert('Beneficiary data saved and submitted.');render();
}
function resultsDashboard(){
 return `<div class="toolbar"><label class="filter-label">Project</label><select id="rdProject" class="select" onchange="renderResultsDashboard()">${projectOptions('All')}</select><label class="filter-label">Year</label><select id="rdYear" class="select" onchange="renderResultsDashboard()">${yearOptions(resultYears(),2026)}</select><label class="filter-label">Indicator Level</label><select id="rdLevel" class="select" onchange="renderResultsDashboard()"><option value="All">All Indicator Levels</option>${[...new Set(D.indicators.map(i=>i.level))].filter(Boolean).map(x=>`<option>${esc(x)}</option>`).join('')}</select></div><div id="rdContent"></div>`;
}
function resultAch(i,y){return state.resultEntries.filter(e=>e.indicatorId===i.id&&Number(e.year)===Number(y)).reduce((s,e)=>s+Number(e.achievement||0),0)}
function resultTarget(i,y){let ps=periodsFor(i.frequency);return ps.reduce((s,p)=>s+Number(state.resultTargets[`${i.id}|${y}|${p}`]??periodDefault(i,p)),0)}
function periodDefault(i,p){let base=Number(i.target)||0,ps=periodsFor(i.frequency);if(ps.length===1)return base;if(['Q1','Q2','Q3','Q4'].includes(p))return base/4;if(p.startsWith('Semi'))return base/2;return base}
function renderResultsDashboard(){
 const c=document.querySelector('#rdContent');if(!c)return;
 const project=document.querySelector('#rdProject').value,year=Number(document.querySelector('#rdYear').value),level=document.querySelector('#rdLevel').value;
 const inds=D.indicators.filter(i=>(project==='All'||i.project===project)&&(level==='All'||i.level===level));
 const rows=inds.map(i=>{
   let a=resultAch(i,year),t=resultTarget(i,year);
   const hasData=state.resultEntries.some(e=>e.indicatorId===i.id&&Number(e.year)===Number(year));
   return {...i,a,t,p:pct(a,t),hasData};
 });
 const total=rows.length;
 const withData=rows.filter(x=>x.hasData).length;
 const achieved=rows.filter(x=>x.hasData&&x.p>=75).length;
 const onTrack=rows.filter(x=>x.hasData&&x.p>=50&&x.p<75).length;
 const offTrack=rows.filter(x=>x.hasData&&x.p<50).length;
 const noData=rows.filter(x=>!x.hasData).length;
 const totalT=rows.reduce((s,x)=>s+x.t,0),totalA=rows.reduce((s,x)=>s+x.a,0);

 c.innerHTML=`<div class="grid kpis">
   ${kpi('Total Indicators',total,'Selected filters')}
   ${kpi('Indicators with Data',withData,`${withData}/${total}`)}
   ${kpi('Indicators Achieved',achieved,'≥75% achieved','green')}
   ${kpi('Indicators on Track',onTrack,'50–<75% achieved','amber')}
   ${kpi('Indicators Off-Track',offTrack,'<50% achieved','red')}
   ${kpi('Indicators with no Data',noData,'No reported record')}
 </div>
 <div class="legend results-legend" style="margin-top:16px">
   <span><i class="dot green"></i> ≥75% Achieved</span>
   <span><i class="dot amber"></i> 50–&lt;75% On Track</span>
   <span><i class="dot red"></i> &lt;50% Off-Track</span>
 </div>
 <div class="card" style="margin-top:16px">
   <h2>Results Framework indicator performance</h2>
   <div class="table-wrap"><table class="table"><thead><tr><th>Indicator</th><th>Project</th><th>Level</th><th>Target</th><th>Achievement</th><th>%</th><th>Status</th></tr></thead>
   <tbody>${rows.map(x=>`<tr><td><b>${esc(x.id)}</b><br>${esc(x.indicator)}</td><td>${esc(x.project)}</td><td>${esc(x.level)}</td><td>${fmt(x.t)}</td><td>${fmt(x.a)}</td><td>${x.hasData?x.p+'%':'—'}</td><td>${x.hasData?`<span class="badge ${perfClass(x.p)}">${x.p>=75?'Achieved':x.p>=50?'On Track':'Off-Track'}</span><div class="progress ${perfClass(x.p)}" style="margin-top:6px"><span style="width:${Math.min(x.p,100)}%"></span></div>`:'<span class="badge neutral">No Data</span>'}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">No indicators match the filters.</td></tr>'}</tbody></table></div>
 </div>`;
}

function resultsEntry(){
 const p=projects()[0]?.name||'', levels=[...new Set(D.indicators.filter(i=>i.project===p).map(i=>i.level))].filter(Boolean).sort(), l=levels[0]||'All';
 return `<div class="card"><h2>Results Framework data entry</h2><div class="alert">This module is independent from Beneficiary reporting. Select the project, reporting year, indicator level and indicator; the reporting period is determined by the indicator frequency.</div><div class="form-grid" style="margin-top:18px">
 <div class="field"><label>Project</label><select id="rproject" class="select" style="width:100%" onchange="updateResultEntryProject()">${projects().map(x=>`<option>${esc(x.name)}</option>`).join('')}</select></div>
 <div class="field"><label>Reporting Year</label><select id="ryear" class="select" style="width:100%">${yearOptions(resultYears(),2026)}</select></div>
 <div class="field"><label>Indicator Level</label><select id="rlevel" class="select" style="width:100%" onchange="updateResultEntryLevel()"><option value="All">All Indicator Levels</option>${levels.map(x=>`<option ${x===l?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
 <div class="field full"><label>Indicator</label><select id="rindicator" class="select" style="width:100%" onchange="updateResultPeriod()">${resultIndicatorOptions(p,l)}</select></div>
 <div class="field"><label>Reporting Period</label><select id="rperiod" class="select" style="width:100%" onchange="updateResultTarget()"></select></div>
 <div class="field"><label>Period Target</label><input id="rtarget" class="input" style="width:100%" readonly></div>
 <div class="field"><label>Achievement</label><input id="rach" class="input" style="width:100%" type="number" step="any" oninput="updateResultCalc()"></div>
 <div class="field"><label>% Achievement</label><input id="rpct" class="input" style="width:100%" readonly></div>
 </div><div style="margin-top:18px;text-align:right"><button class="btn primary" onclick="saveResult()">Save Results Record</button></div></div>`;
}
function updateResultEntryProject(){
 const p=document.querySelector('#rproject').value, ls=[...new Set(D.indicators.filter(i=>i.project===p).map(i=>i.level))].filter(Boolean).sort(), sel=document.querySelector('#rlevel');
 sel.innerHTML='<option value="All">All Indicator Levels</option>'+ls.map(x=>`<option>${esc(x)}</option>`).join('');if(ls.length)sel.value=ls[0];updateResultEntryLevel();
}
function updateResultEntryLevel(){const p=document.querySelector('#rproject').value,l=document.querySelector('#rlevel').value,sel=document.querySelector('#rindicator');sel.innerHTML=resultIndicatorOptions(p,l);updateResultPeriod()}
function updateResultPeriod(){const i=D.indicators.find(x=>x.id===document.querySelector('#rindicator').value),sel=document.querySelector('#rperiod');sel.innerHTML=periodsFor(i?.frequency).map(x=>`<option>${x}</option>`).join('');updateResultTarget()}
function updateResultTarget(){const i=D.indicators.find(x=>x.id===document.querySelector('#rindicator').value),y=Number(document.querySelector('#ryear').value),p=document.querySelector('#rperiod').value,k=`${i?.id}|${y}|${p}`;document.querySelector('#rtarget').value=i?state.resultTargets[k]??periodDefault(i,p):'';updateResultCalc()}
function updateResultCalc(){const a=Number(document.querySelector('#rach').value||0),t=Number(document.querySelector('#rtarget').value||0);document.querySelector('#rpct').value=pct(a,t)+'%'}
function saveResult(){const i=D.indicators.find(x=>x.id===document.querySelector('#rindicator').value),y=Number(document.querySelector('#ryear').value),p=document.querySelector('#rperiod').value,a=Number(document.querySelector('#rach').value),t=Number(document.querySelector('#rtarget').value);if(!i||!p||!isFinite(a)){alert('Complete the result reporting fields.');return}state.resultTargets[`${i.id}|${y}|${p}`]=t;state.resultEntries.push({id:Date.now(),indicatorId:i.id,project:i.project,year:y,period:p,target:t,achievement:a,status:'Submitted',enteredAt:new Date().toISOString()});state.submissions.push({id:Date.now()+1,type:'Results',project:i.project,indicator:i.indicator,year:y,period:p,status:'Submitted'});save();alert('Results data saved and submitted.');render()}
function indicators(){
 const projects=[...new Set(D.indicators.map(i=>i.project))].filter(Boolean), comps=[...new Set(D.indicators.map(i=>i.component))].filter(Boolean), levels=[...new Set(D.indicators.map(i=>i.level))].filter(Boolean);
 return `<div class="toolbar"><select id="ifProject" class="select" onchange="updateIndicatorFilters()"><option value="All">All Projects</option>${projectRows.map(x=>`<option>${esc(x)}</option>`).join('')}</select><select id="ifComponent" class="select"><option value="All">All Components</option>${comps.map(x=>`<option>${esc(x)}</option>`).join('')}</select><select id="ifLevel" class="select"><option value="All">All Indicator Levels</option>${levels.map(x=>`<option>${esc(x)}</option>`).join('')}</select><input id="iq" class="input search" placeholder="Search indicators…" oninput="filterIndicators()"></div><div class="card"><div id="indicatorCount" class="small"></div><div class="table-wrap"><table class="table" id="indicatorTable"><thead><tr><th>Code</th><th>Project</th><th>Component</th><th>Indicator</th><th>Level</th><th>Unit</th><th>Target</th><th>Frequency</th></tr></thead><tbody>${D.indicators.map(i=>`<tr data-project="${esc(i.project)}" data-component="${esc(i.component)}" data-level="${esc(i.level)}"><td><b>${esc(i.id)}</b></td><td>${esc(i.project)}</td><td>${esc(i.component)}</td><td>${esc(i.indicator)}</td><td>${esc(i.level)}</td><td>${esc(i.unit)}</td><td>${fmt(i.target)}</td><td>${esc(i.frequency)}</td></tr>`).join('')}</tbody></table></div></div>`}
function updateIndicatorFilters(){const p=document.querySelector('#ifProject').value,c=document.querySelector('#ifComponent'),l=document.querySelector('#ifLevel');const cs=[...new Set(D.indicators.filter(i=>i.project===p).map(i=>i.component))].filter(Boolean).sort(),ls=[...new Set(D.indicators.filter(i=>i.project===p).map(i=>i.level))].filter(Boolean).sort();c.innerHTML='<option value="All">All Components</option>'+cs.map(x=>`<option>${esc(x)}</option>`).join('');l.innerHTML='<option value="All">All Indicator Levels</option>'+ls.map(x=>`<option>${esc(x)}</option>`).join('');filterIndicators()}
function filterIndicators(){const p=document.querySelector('#ifProject').value,c=document.querySelector('#ifComponent').value,l=document.querySelector('#ifLevel').value,q=document.querySelector('#iq').value.toLowerCase();let n=0;document.querySelectorAll('#indicatorTable tbody tr').forEach(r=>{const ok=(p==='All'||r.dataset.project===p)&&(c==='All'||r.dataset.component===c)&&(l==='All'||r.dataset.level===l)&&r.innerText.toLowerCase().includes(q);r.style.display=ok?'':'none';if(ok)n++});document.querySelector('#indicatorCount').textContent=`Showing ${n} of ${D.indicators.length} indicators`}
function targets(){const ps=[...new Set(D.indicators.map(i=>i.project))].filter(Boolean),cs=[...new Set(D.indicators.map(i=>i.component))].filter(Boolean),ls=[...new Set(D.indicators.map(i=>i.level))].filter(Boolean);return `<div class="toolbar"><select id="tProject" class="select" onchange="updateTargetFilters()"><option value="All">All Projects</option>${ps.map(x=>`<option>${esc(x)}</option>`).join('')}</select><select id="tComponent" class="select"><option value="All">All Components</option>${cs.map(x=>`<option>${esc(x)}</option>`).join('')}</select><select id="tLevel" class="select"><option value="All">All Indicator Levels</option>${ls.map(x=>`<option>${esc(x)}</option>`).join('')}</select><select id="tYear" class="select">${yearOptions(resultYears(),2026)}</select></div><div class="card"><h2>Results Framework target register</h2><div id="targetCount" class="small"></div><div class="table-wrap"><table class="table" id="targetTable"><thead><tr><th>Indicator</th><th>Project</th><th>Component</th><th>Level</th><th>Frequency</th><th>Period</th><th>Target</th></tr></thead><tbody>${D.indicators.flatMap(i=>periodsFor(i.frequency).map(p=>`<tr data-project="${esc(i.project)}" data-component="${esc(i.component)}" data-level="${esc(i.level)}"><td>${esc(i.id)} — ${esc(i.indicator)}</td><td>${esc(i.project)}</td><td>${esc(i.component)}</td><td>${esc(i.level)}</td><td>${esc(i.frequency)}</td><td>${p}</td><td>${fmt(state.resultTargets[`${i.id}|2026|${p}`]??periodDefault(i,p))}</td></tr>`)).join('')}</tbody></table></div></div>`}
function updateTargetFilters(){const p=document.querySelector('#tProject').value,c=document.querySelector('#tComponent'),l=document.querySelector('#tLevel');const cs=[...new Set(D.indicators.filter(i=>p==='All'||i.project===p).map(i=>i.component))].filter(Boolean).sort(),ls=[...new Set(D.indicators.filter(i=>p==='All'||i.project===p).map(i=>i.level))].filter(Boolean).sort();c.innerHTML='<option value="All">All Components</option>'+cs.map(x=>`<option>${esc(x)}</option>`).join('');l.innerHTML='<option value="All">All Indicator Levels</option>'+ls.map(x=>`<option>${esc(x)}</option>`).join('');filterTargets()}
function filterTargets(){const p=document.querySelector('#tProject').value,c=document.querySelector('#tComponent').value,l=document.querySelector('#tLevel').value;let n=0;document.querySelectorAll('#targetTable tbody tr').forEach(r=>{const ok=(p==='All'||r.dataset.project===p)&&(c==='All'||r.dataset.component===c)&&(l==='All'||r.dataset.level===l);r.style.display=ok?'':'none';if(ok)n++});document.querySelector('#targetCount').textContent=`Showing ${n} target periods`}
function approvals(){return `<div class="card"><h2>Submissions for review</h2><div class="table-wrap"><table class="table"><thead><tr><th>Type</th><th>Project</th><th>Indicator</th><th>Period</th><th>Status</th><th>Action</th></tr></thead><tbody>${state.submissions.slice().reverse().map(s=>`<tr><td>${esc(s.type)}</td><td>${esc(s.project)}</td><td>${esc(s.indicator)}</td><td>${s.year} ${s.period}</td><td><span class="badge ${s.status==='Approved'?'green':'amber'}">${s.status}</span></td><td>${s.status==='Submitted'?`<button class="btn success" onclick="approve(${s.id})">Approve</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">No submissions yet.</td></tr>'}</tbody></table></div></div>`}
function approve(id){let s=state.submissions.find(x=>x.id===id);if(s)s.status='Approved';save();render()}
function admin(){
 const ps=projects(), comps=[...new Set(D.indicators.map(i=>i.component))].filter(Boolean).sort(), levels=[...new Set(D.indicators.map(i=>i.level))].filter(Boolean).sort();
 return `<div class="grid three">${kpi('Projects',ps.length)}${kpi('Results indicators',D.indicators.length)}${kpi('Beneficiary reporting templates',D.beneficiaryMasters.length)}</div>
 <div class="card" style="margin-top:16px"><h2>Project Definition</h2><div class="alert">Create and maintain projects used throughout the M&E system. Districts are linked to each project and therefore drive the beneficiary data-entry district list.</div>
 <div class="form-grid"><div class="field"><label>Project Name</label><input id="pname" class="input"></div><div class="field"><label>Project Symbol</label><input id="psymbol" class="input"></div><div class="field"><label>Project Budget</label><input id="pbudget" class="input" type="number"></div><div class="field"><label>Project Starting Date</label><input id="pstart" class="input" type="date"></div><div class="field"><label>Project Ending Date</label><input id="pend" class="input" type="date"></div><div class="field"><label>Project Manager</label><input id="pmanager" class="input"></div><div class="field"><label>M&E Focal Point</label><input id="pfocal" class="input"></div><div class="field full"><label>Districts of Implementation</label><div id="pdistricts" class="checkbox-grid">${D.districts.map(d=>`<label class="check-item"><input type="checkbox" name="projectDistrict" value="${esc(d)}"><span>${esc(d)}</span></label>`).join('')}</div><div class="small">Select all districts where the project is implemented. These selections determine the District list in beneficiary data entry.</div></div></div><div style="margin-top:16px"><button class="btn primary" id="projectSaveBtn" onclick="addProject()">Add Project</button></div></div>
 <div class="card" style="margin-top:16px"><h2>Defined Projects</h2><div class="table-wrap"><table class="table"><thead><tr><th>Project</th><th>Symbol</th><th>Budget</th><th>Dates</th><th>Districts</th><th>Manager</th><th>M&E Focal Point</th><th>Action</th></tr></thead><tbody>${ps.map(p=>`<tr><td><b>${esc(p.name)}</b></td><td>${esc(p.symbol||p.code||'')}</td><td>${fmt(p.budget)}</td><td>${esc(p.startDate||'')} – ${esc(p.endDate||'')}</td><td>${esc((p.districts||DEFAULT_PROJECT_DISTRICTS[p.name]||[]).join(', '))}</td><td>${esc(p.manager||'')}</td><td>${esc(p.focal||'')}</td><td>${roleCanManage()?`<button class="btn smallbtn" onclick='editProject(${JSON.stringify(p.name)})'>Edit</button> <button class="btn danger smallbtn" onclick='deleteProject(${JSON.stringify(p.name)})'>Delete</button>`:'—'}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="card" style="margin-top:16px"><h2>Indicator Definition</h2><div class="alert">Define new Results Framework indicators using the categories already contained in the Results Framework. These indicators become available in Indicators, Target Management and Results Data Entry.</div>
 <div class="form-grid" style="margin-top:14px"><div class="field"><label>Project</label><select id="niproject" class="select">${projects().map(p=>`<option>${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label>Indicator Code</label><input id="niid" class="input" placeholder="e.g. Out. 4.1"></div><div class="field"><label>Component</label><select id="nicomponent" class="select">${comps.map(x=>`<option>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>Indicator Level</label><select id="nilevel" class="select">${levels.map(x=>`<option>${esc(x)}</option>`).join('')}</select></div><div class="field full"><label>Indicator</label><input id="niindicator" class="input"></div><div class="field"><label>Unit of Measure</label><input id="niunit" class="input"></div><div class="field"><label>Baseline</label><input id="nibase" class="input" type="number"></div><div class="field"><label>Overall Target</label><input id="nitarget" class="input" type="number"></div><div class="field"><label>Disaggregation</label><input id="nidisagg" class="input" placeholder="Sex, District, etc."></div><div class="field"><label>Frequency</label><select id="nifreq" class="select"><option>Annual</option><option>Quarterly</option><option>Semi-Annual</option><option>Monthly</option><option>Mid-Term</option><option>Endline</option><option>Mid-Term and Endline</option></select></div><div class="field"><label>Calculation Method</label><select id="nicalc" class="select"><option>Cumulative Sum</option><option>Latest Value</option><option>Average</option><option>Calculated Ratio</option></select></div><div class="field"><label>Means of Verification</label><input id="nimov" class="input"></div><div class="field"><label>Consolidated Dashboard</label><select id="niconsolidated" class="select"><option value="true">Yes</option><option value="false">No</option></select></div></div><div style="margin-top:16px"><button class="btn primary" onclick="addIndicatorDefinition()">Add Indicator</button></div></div>
 <div class="card" style="margin-top:16px"><h2>Indicator Categories in Results Framework</h2><div class="table-wrap"><table class="table"><thead><tr><th>Component</th><th>Indicator Levels</th><th>Number of Indicators</th></tr></thead><tbody>${comps.map(c=>{const ls=[...new Set(D.indicators.filter(i=>i.component===c).map(i=>i.level))].filter(Boolean).join(', ');return `<tr><td>${esc(c)}</td><td>${esc(ls)}</td><td>${D.indicators.filter(i=>i.component===c).length}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="card" style="margin-top:16px"><h2>System Configuration</h2><ul class="small"><li>Current role: <b>${esc(state.role)}</b>. Only M&E Manager can edit/delete beneficiary records and manage projects and indicators.</li><li>Main Dashboard is the Beneficiaries Dashboard.</li><li>Results Framework has its own independent dashboard.</li><li>Beneficiary year validation: 2024–2040.</li></ul><button class="btn" onclick="downloadData()">Export System Data JSON</button></div>`
}
function editProject(name){if(!roleCanManage())return;const p=projects().find(x=>x.name===name);if(!p)return;document.querySelector('#pname').value=p.name;document.querySelector('#psymbol').value=p.symbol||p.code||'';document.querySelector('#pbudget').value=p.budget||'';document.querySelector('#pstart').value=p.startDate||'';document.querySelector('#pend').value=p.endDate||'';document.querySelector('#pmanager').value=p.manager||'';document.querySelector('#pfocal').value=p.focal||'';const ds=p.districts||DEFAULT_PROJECT_DISTRICTS[p.name]||[];document.querySelectorAll('input[name="projectDistrict"]').forEach(o=>o.checked=ds.includes(o.value));const b=document.querySelector('#projectSaveBtn');b.textContent='Update Project';b.onclick=()=>updateProject(name);window.scrollTo({top:0,behavior:'smooth'})}
function updateProject(oldName){if(!roleCanManage())return;const name=document.querySelector('#pname').value.trim();if(!name)return alert('Project Name is required.');if(name!==oldName&&projects().some(p=>p.name===name))return alert('A project with this name already exists.');const p=projects().find(x=>x.name===oldName);if(!p)return;Object.assign(p,{name,symbol:document.querySelector('#psymbol').value.trim(),code:document.querySelector('#psymbol').value.trim(),budget:Number(document.querySelector('#pbudget').value||0),startDate:document.querySelector('#pstart').value,endDate:document.querySelector('#pend').value,districts:[...document.querySelectorAll('input[name="projectDistrict"]:checked')].map(o=>o.value),manager:document.querySelector('#pmanager').value.trim(),focal:document.querySelector('#pfocal').value.trim()});save();alert('Project updated.');render()}
function addIndicatorDefinition(){if(!roleCanManage())return alert('Only the M&E Manager can define indicators.');const project=document.querySelector('#niproject').value,indicator=document.querySelector('#niindicator').value.trim(),id=document.querySelector('#niid').value.trim();if(!project||!indicator||!id)return alert('Project, Indicator Code and Indicator are required.');if(D.indicators.some(i=>i.id===id&&i.project===project))return alert('That indicator code already exists for this project.');const p=projects().find(x=>x.name===project);const obj={id,project,projectCode:p?.symbol||p?.code||'',component:document.querySelector('#nicomponent').value,level:document.querySelector('#nilevel').value,indicator,unit:document.querySelector('#niunit').value.trim(),baseline:Number(document.querySelector('#nibase').value||0),target:Number(document.querySelector('#nitarget').value||0),disaggregation:document.querySelector('#nidisagg').value.trim(),mov:document.querySelector('#nimov').value.trim(),frequency:document.querySelector('#nifreq').value,calculation:document.querySelector('#nicalc').value,consolidated:document.querySelector('#niconsolidated').value==='true',custom:true};D.indicators.push(obj);state.customIndicators.push(obj);save();alert('Indicator defined successfully.');render()}
function addProject(){if(!roleCanManage()){alert('Only the M&E Manager can add projects.');return}const name=document.querySelector('#pname').value.trim();if(!name){alert('Project Name is required.');return}if(projects().some(p=>p.name===name)){alert('A project with this name already exists.');return}const ds=[...document.querySelectorAll('input[name="projectDistrict"]:checked')].map(o=>o.value);state.projects.push({name,code:document.querySelector('#psymbol').value.trim(),symbol:document.querySelector('#psymbol').value.trim(),budget:Number(document.querySelector('#pbudget').value||0),startDate:document.querySelector('#pstart').value,endDate:document.querySelector('#pend').value,districts:ds,manager:document.querySelector('#pmanager').value.trim(),focal:document.querySelector('#pfocal').value.trim(),status:'Active'});save();alert('Project added.');render()}
function deleteProject(name){if(!roleCanManage()){alert('Only the M&E Manager can delete projects.');return}if(!confirm(`Delete project ${name}? Existing historical beneficiary records will be retained but the project will no longer appear in the project master.`))return;state.projects=projects().filter(p=>p.name!==name);save();render()}
function downloadData(){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({masterData:D,transactionData:state},null,2)],{type:'application/json'}));a.download='fao_mne_system_v10_data.json';a.click()}
function render(){
 const h=location.hash.slice(1)||'dashboard';
 const map={dashboard:['Beneficiaries Dashboard',dashboard],['beneficiary-entry']:['Beneficiary Data Entry',beneficiaryEntry],['results-dashboard']:['Results Framework Dashboard',resultsDashboard],['results-entry']:['Results Framework Data Entry',resultsEntry],indicators:['Results Framework Indicators',indicators],targets:['Target Management',targets],approvals:['Approvals',approvals],admin:['Administration',admin]};
 const [t,f]=map[h]||map.dashboard;page(t,f());
 if(h==='dashboard')setTimeout(renderBeneficiaryDashboard,0);
 if(h==='beneficiary-entry')setTimeout(()=>{updateBenefMaster();updateBenefPerformance();updateBenefGenderTotal()},0);
 if(h==='results-entry')setTimeout(()=>{updateResultPeriod()},0);
 if(h==='results-dashboard')setTimeout(renderResultsDashboard,0);
 if(h==='indicators')setTimeout(filterIndicators,0);
 if(h==='targets')setTimeout(filterTargets,0);
}
window.addEventListener('hashchange',()=>{try{render()}catch(e){showBootError(e)}});
function showBootError(e){
 const msg=e&&e.message?e.message:String(e);
 const stack=e&&e.stack?e.stack:'';
 const el=document.querySelector('#app');
 if(el) el.innerHTML=`<div style="font-family:Arial,sans-serif;padding:32px;max-width:900px;margin:40px auto"><h1 style="color:#b42318">Digital M&E System could not start</h1><p>The application encountered a browser error. Your saved browser data has been protected and can be reset safely.</p><div style="background:#fef3f2;border:1px solid #fecdca;padding:14px;border-radius:8px;margin:16px 0"><b>Error:</b> ${esc(msg)}</div><button onclick="try{localStorage.removeItem('${KEY}')}catch(e){};location.reload()" style="padding:10px 16px;border:0;border-radius:6px;background:#1769c2;color:white;cursor:pointer">Reset local application data and reload</button><details style="margin-top:20px"><summary>Technical details</summary><pre style="white-space:pre-wrap">${esc(stack)}</pre></details></div>`;
}
try{render()}catch(e){showBootError(e)}
