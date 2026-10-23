// Общие функции графиков трекера
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const D=s=>{const[d,m,y]=s.split('.').map(Number);return new Date(y,m-1,d)};
const fmt=d=>d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'2-digit'});
const num=(v,p=1)=>v.toLocaleString('ru-RU',{minimumFractionDigits:p,maximumFractionDigits:p});
const NS='http://www.w3.org/2000/svg';
const el=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e};

function tipFor(box){const t=document.createElement('div');t.className='tip';box.appendChild(t);return t}

function lineChart(id,series,o){
  const box=document.getElementById(id);box.innerHTML='';
  if(series.length>1){const lg=document.createElement('div');lg.className='legend';lg.innerHTML=series.map(s=>`<span><i style="background:var(${s.c})${s.dash?';background:repeating-linear-gradient(90deg,var('+s.c+') 0 4px,transparent 4px 7px)':''}"></i>${s.name}</span>`).join('');box.appendChild(lg)}
  const W=o.w||560,H=o.h||260,m={t:14,r:o.r||64,b:28,l:40};
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':o.aria},box);
  const all=series.flatMap(s=>s.pts);
  const x0=o.x0||Math.min(...all.map(p=>+p.d)),x1=o.x1||Math.max(...all.map(p=>+p.d));
  const y0=o.y0,y1=o.y1;
  const X=v=>m.l+(v-x0)/(x1-x0)*(W-m.l-m.r),Y=v=>H-m.b-(v-y0)/(y1-y0)*(H-m.t-m.b);
  for(let v=y0;v<=y1+1e-9;v+=o.step){el('line',{x1:m.l,x2:W-m.r,y1:Y(v),y2:Y(v),stroke:css('--grid'),'stroke-width':1},svg);el('text',{x:m.l-8,y:Y(v)+4,'text-anchor':'end'},svg).textContent=num(v,0)}
  // x ticks: quarters
  const s0=new Date(x0);for(let d=new Date(s0.getFullYear(),Math.ceil((s0.getMonth()+1)/3)*3,1);+d<=x1;d.setMonth(d.getMonth()+3)){const tx=X(+d);el('text',{x:tx,y:H-8,'text-anchor':'middle'},svg).textContent=d.toLocaleDateString('ru-RU',{month:'short'}).replace('.','')+' ’'+String(d.getFullYear()).slice(2)}
  if(o.band){const[b0,b1,lab]=o.band;el('rect',{x:m.l,width:W-m.l-m.r,y:Y(b1),height:Y(b0)-Y(b1),fill:css('--good'),opacity:.1},svg);el('text',{x:m.l+6,y:Y(b1)+13,style:'fill:var(--good)'},svg).textContent=lab}
  series.forEach(s=>{
    const c=css(s.c);const d=s.pts.map((p,i)=>(i?'L':'M')+X(+p.d)+','+Y(p.v)).join('');
    el('path',{d,fill:'none',stroke:c,'stroke-width':2,'stroke-linejoin':'round','stroke-dasharray':s.dash||''},svg);
    s.pts.forEach((p,i)=>{if(s.noDots&&i)return;el('circle',{cx:X(+p.d),cy:Y(p.v),r:i===s.pts.length-1?5:3.5,fill:c,stroke:css('--panel'),'stroke-width':2},svg)});
    const L=s.pts[s.pts.length-1];if(!s.noEnd)el('text',{x:X(+L.d)+9,y:Y(L.v)+4+(s.dy||0),class:'lbl'},svg).textContent=num(L.v,s.p??1)+(s.unit||'');
    if(s.first){const F=s.pts[0];el('text',{x:X(+F.d),y:Y(F.v)-10,class:'lbl','text-anchor':'start'},svg).textContent=num(F.v,s.p??1)+(s.unit||'')}
  });
  // hover
  const tip=tipFor(box);const vl=el('line',{y1:m.t,y2:H-m.b,stroke:css('--ink3'),'stroke-width':1,opacity:0},svg);
  const xs=[...new Set(all.map(p=>+p.d))].sort((a,b)=>a-b);
  const hit=el('rect',{x:m.l,y:m.t,width:W-m.l-m.r,height:H-m.t-m.b,fill:'transparent'},svg);
  const move=e=>{const r=svg.getBoundingClientRect();const sx=(e.clientX-r.left)/r.width*W;let best=xs[0];xs.forEach(v=>{if(Math.abs(X(v)-sx)<Math.abs(X(best)-sx))best=v});
    vl.setAttribute('x1',X(best));vl.setAttribute('x2',X(best));vl.setAttribute('opacity',.5);
    const rows=series.map(s=>{const p=s.pts.find(p=>+p.d===best);return p?`${series.length>1?s.name+': ':''}<b>${num(p.v,s.p??1)}${s.unit||''}</b>`:null}).filter(Boolean);
    tip.innerHTML=`${fmt(new Date(best))}<br>`+rows.join('<br>');tip.style.left=(X(best)/W*100)+'%';tip.style.top=(m.t/H*100+10)+'%';tip.classList.add('on')};
  hit.addEventListener('pointermove',move);hit.addEventListener('pointerleave',()=>{tip.classList.remove('on');vl.setAttribute('opacity',0)});
}


function dayBars(id,vals,o){
  const box=document.getElementById(id);const W=o.w||1000,H=o.h||220,m={t:16,r:10,b:24,l:40};
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':o.aria},box);
  const Y=v=>H-m.b-(v-o.y0)/(o.y1-o.y0)*(H-m.t-m.b);
  for(let v=o.y0;v<=o.y1;v+=o.step){el('line',{x1:m.l,x2:W-m.r,y1:Y(v),y2:Y(v),stroke:css('--grid')},svg);el('text',{x:m.l-8,y:Y(v)+4,'text-anchor':'end'},svg).textContent=v}
  const defs=el('defs',{},svg);const pat=el('pattern',{id:id+'h',width:6,height:6,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},defs);
  el('rect',{width:6,height:6,fill:css('--panel')},pat);el('rect',{width:3,height:6,fill:css('--s2')},pat);
  const bw=(W-m.l-m.r)/vals.length;const tip=tipFor(box);
  vals.forEach((v,i)=>{const x=m.l+i*bw+bw*.15,w=bw*.7,y=Y(Math.min(v.v,o.y1));const r=Math.min(3,w/2);
    const fill=v.inc?`url(#${id}h)`:(o.bad&&o.bad(v.v)?css('--s2'):css('--s1'));
    el('path',{d:`M${x},${Y(o.y0)}V${y+r}a${r},${r} 0 0 1 ${r},-${r}h${w-2*r}a${r},${r} 0 0 1 ${r},${r}V${Y(o.y0)}Z`,fill,stroke:v.inc?css('--s2'):'none','stroke-width':v.inc?1:0},svg);
    if(o.labels||i%2===0)el('text',{x:x+w/2,y:H-8,'text-anchor':'middle'},svg).textContent=i+1;
    const hit=el('rect',{x:m.l+i*bw,y:m.t,width:bw,height:H-m.t-m.b,fill:'transparent'},svg);
    hit.addEventListener('pointerenter',()=>{tip.innerHTML=`${i+1}.10 · <b>${num(v.v,0)} ${o.unit}</b>${v.inc?'<br>пропущен приём пищи':''}`;tip.style.left=((x+w/2)/W*100)+'%';tip.style.top=(y/H*100)+'%';tip.classList.add('on')});
    hit.addEventListener('pointerleave',()=>tip.classList.remove('on'));
  });
  el('line',{x1:m.l,x2:W-m.r,y1:Y(o.goal),y2:Y(o.goal),stroke:css('--ink'),'stroke-width':1.5,'stroke-dasharray':'5 3'},svg);
  el('text',{x:W-m.r,y:Y(o.goal)-6,'text-anchor':'end',class:'lbl'},svg).textContent=o.goalLbl;
}

// Универсальные столбики: items = [{v, label, tip, color:'--s1', inc:true}]
function bars(id,items,o){
  const box=document.getElementById(id);box.innerHTML='';
  const W=o.w||1000,H=o.h||240,m={t:18,r:o.goal!=null?58:12,b:26,l:44};
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':o.aria||''},box);
  const Y=v=>H-m.b-(Math.min(v,o.y1)-o.y0)/(o.y1-o.y0)*(H-m.t-m.b);
  for(let v=o.y0;v<=o.y1+1e-9;v+=o.step){el('line',{x1:m.l,x2:W-m.r,y1:Y(v),y2:Y(v),stroke:css('--grid')},svg);el('text',{x:m.l-8,y:Y(v)+4,'text-anchor':'end'},svg).textContent=o.fmtY?o.fmtY(v):num(v,0)}
  if(o.band){el('rect',{x:m.l,width:W-m.l-m.r,y:Y(o.band[1]),height:Y(o.band[0])-Y(o.band[1]),fill:css('--good'),opacity:.1},svg)}
  const id2=id+'-hatch';const defs=el('defs',{},svg);const pat=el('pattern',{id:id2,width:6,height:6,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},defs);
  el('rect',{width:6,height:6,fill:css('--panel')},pat);el('rect',{width:2.5,height:6,fill:css('--ink3')},pat);
  const n=items.length,bw=(W-m.l-m.r)/n,every=o.labelEvery||1;const tip=tipFor(box);
  items.forEach((it,i)=>{
    const gap=Math.min(bw*.25,8),x=m.l+i*bw+gap/2,w=Math.max(bw-gap,1),y=Y(Math.max(it.v,o.y0)),r=Math.min(3,w/2);
    const h=Y(o.y0)-y;
    if(h>0.5)el('path',{d:`M${x},${Y(o.y0)}V${y+r}a${r},${r} 0 0 1 ${r},-${r}h${w-2*r}a${r},${r} 0 0 1 ${r},${r}V${Y(o.y0)}Z`,fill:it.inc?`url(#${id2})`:css(it.color||'--s1'),stroke:it.inc?css('--ink3'):'none','stroke-width':it.inc?1:0},svg);
    if(it.mark)el('circle',{cx:x+w/2,cy:Y(o.y0)+7,r:2.5,fill:css('--ink')},svg);
    if(o.valueLabels&&it.v>0)el('text',{x:x+w/2,y:y-6,'text-anchor':'middle',class:'lbl'},svg).textContent=o.valueLabels(it.v);
    if(it.label&&i%every===0)el('text',{x:x+w/2,y:H-6,'text-anchor':'middle'},svg).textContent=it.label;
    const hit=el('rect',{x:m.l+i*bw,y:m.t,width:bw,height:H-m.t-m.b,fill:'transparent'},svg);
    hit.addEventListener('pointerenter',()=>{tip.innerHTML=it.tip||num(it.v,0);tip.style.left=((x+w/2)/W*100)+'%';tip.style.top=(Math.min(y,H-m.b-20)/H*100)+'%';tip.classList.add('on')});
    hit.addEventListener('pointerleave',()=>tip.classList.remove('on'));
  });
  if(o.goal!=null){el('line',{x1:m.l,x2:W-m.r,y1:Y(o.goal),y2:Y(o.goal),stroke:css('--ink'),'stroke-width':1.5,'stroke-dasharray':'5 3'},svg);
    el('text',{x:W-m.r+6,y:Y(o.goal)+4,'text-anchor':'start',class:'lbl'},svg).textContent=o.goalLbl||num(o.goal,0)}
}
const MONTHS=['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const WD=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const mlabel=ym=>MONTHS[+ym.slice(5,7)-1]+' ’'+ym.slice(2,4);
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const wday=iso=>(new Date(iso+'T12:00:00').getDay()+6)%7;
