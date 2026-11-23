/* Agenda de videollamada: modal que se abre desde los botones "Agendar
   videollamada" (planes y asistente). Los horarios salen de /api/agenda
   (lunes a viernes, 9 a 18 hs de Argentina); al confirmar, el worker me avisa
   por mail. Sin JS, los botones siguen siendo links a WhatsApp. */
(function(){
 var EN=document.documentElement.lang==='en';
 var TZ='America/Argentina/Buenos_Aires';
 var TS_KEY='0x4AAAAAAEd2UwMVyDyHqSFZ';
 var WA='https://wa.me/5491127343775';
 var L=EN?{
  h:'Book a video call',sub:'20 minutes with Ignacio to look at your project. No commitment. Times are in Argentina time (UTC-3).',
  day:'Pick a day',time:'Pick a time',name:'Your name',contact:'Email or WhatsApp',note:'Anything I should know? (optional)',
  go:'Confirm booking',sending:'Booking…',none:'No free times right now.',load:'Loading times…',
  bad:'Add your name and a valid email or WhatsApp number.',pick:'Pick a day and a time first.',
  taken:'Someone just took that time. Pick another one.',err:'Could not book it. Try again or write on WhatsApp:',
  okH:'Booked!',ok1:'I got your booking and will confirm it with you by the contact you left.',
  yours:'your time',close:'Close',wa:'WhatsApp',slotWord:'Selected',
  waMsg:'Hi Ignacio, I come from ivavala.com and I want to book a video call.',locale:'en-US'
 }:{
  h:'Agendar videollamada',sub:'20 minutos con Ignacio para ver tu proyecto. Sin compromiso. Horarios en hora de Argentina (UTC-3).',
  day:'Elegí un día',time:'Elegí un horario',name:'Tu nombre',contact:'Mail o WhatsApp',note:'¿Algo que deba saber? (opcional)',
  go:'Confirmar turno',sending:'Agendando…',none:'No hay horarios libres por ahora.',load:'Cargando horarios…',
  bad:'Poné tu nombre y un mail o WhatsApp válido.',pick:'Elegí primero un día y un horario.',
  taken:'Alguien acaba de tomar ese horario. Elegí otro.',err:'No pude agendarlo. Probá de nuevo o escribime por WhatsApp:',
  okH:'¡Listo, quedó agendado!',ok1:'Recibí tu turno y te lo confirmo por el contacto que dejaste.',
  yours:'tu hora',close:'Cerrar',wa:'WhatsApp',slotWord:'Elegido',
  waMsg:'Hola Ignacio, vengo de ivavala.com y quiero agendar una videollamada.',locale:'es-AR'
 };
 var fDay=new Intl.DateTimeFormat(L.locale,{timeZone:TZ,weekday:'short',day:'numeric',month:'short'});
 var fDayKey=new Intl.DateTimeFormat('en-CA',{timeZone:TZ});
 var fHour=new Intl.DateTimeFormat(L.locale,{timeZone:TZ,hour:'2-digit',minute:'2-digit',hour12:false});
 var fLocal=new Intl.DateTimeFormat(L.locale,{hour:'2-digit',minute:'2-digit',hour12:false});
 var localTz=''; try{localTz=Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){}
 var sameTz=!localTz||localTz===TZ||localTz==='America/Buenos_Aires';

 function el(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n}
 function track(n){try{if(navigator.sendBeacon)navigator.sendBeacon('/api/e',new Blob([JSON.stringify({n:n,p:location.pathname,l:EN?'en':'es',r:document.referrer||''})],{type:'application/json'}))}catch(e){}}
 function attribution(){try{return JSON.parse(localStorage.getItem('ivv_attr')||'null')}catch(e){return null}}

 var link=document.createElement('link');link.rel='stylesheet';link.href='/agenda.css?v=1';document.head.appendChild(link);

 var dlg,days,times,pickEl,form,st,go,planName='',days_by={},keys=[],slot=null,tsId=null,built=false,okBox,body;

 function build(){
  if(built)return;built=true;
  dlg=el('dialog','ag');dlg.setAttribute('aria-labelledby','ag-h');
  var inn=el('div','ag-in');
  var top=el('div','ag-top'),hd=el('div');
  var h=el('h2','ag-h',L.h);h.id='ag-h';
  hd.append(h,el('p','ag-sub',L.sub));
  var x=el('button','ag-x','×');x.type='button';x.setAttribute('aria-label',L.close);
  x.addEventListener('click',function(){dlg.close()});
  top.append(hd,x);
  body=el('div');body.style.cssText='display:flex;flex-direction:column;gap:1rem';
  var d1=el('div');d1.append(el('p','ag-k',L.day));days=el('div','ag-days');d1.append(days);
  var d2=el('div');d2.append(el('p','ag-k',L.time));times=el('div','ag-times');d2.append(times);
  pickEl=el('p','ag-pick');pickEl.hidden=true;
  form=el('form','ag-f');form.setAttribute('novalidate','');
  var n=el('input');n.type='text';n.name='nombre';n.placeholder=L.name;n.setAttribute('aria-label',L.name);n.autocomplete='name';n.maxLength=100;
  var c=el('input');c.type='text';c.name='contacto';c.placeholder=L.contact;c.setAttribute('aria-label',L.contact);c.autocomplete='email';c.maxLength=150;
  var t=el('textarea');t.name='nota';t.placeholder=L.note;t.setAttribute('aria-label',L.note);t.maxLength=1000;
  var hp=el('input','ag-hp');hp.type='text';hp.name='hp_c7';hp.tabIndex=-1;hp.autocomplete='off';hp.setAttribute('aria-hidden','true');
  go=el('button','ag-go',L.go);go.type='submit';
  st=el('p','ag-st');st.setAttribute('role','status');
  var ts=el('div');ts.id='ag-ts';
  form.append(n,c,t,hp,go,st,ts);
  body.append(d1,d2,pickEl,form);
  okBox=el('div','ag-ok');okBox.hidden=true;
  okBox.append(el('b',null,L.okH),el('p',null,L.ok1));
  inn.append(top,body,okBox);dlg.append(inn);document.body.append(dlg);
  dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
  form.addEventListener('submit',submit);
 }

 function load(){
  days.textContent='';times.textContent='';days.append(el('p','ag-empty',L.load));
  fetch('/api/agenda',{cache:'no-store'}).then(function(r){return r.ok?r.json():Promise.reject(r.status)}).then(function(j){
   days_by={};keys=[];
   (j.slots||[]).forEach(function(s){
    var k=fDayKey.format(new Date(s));
    if(!days_by[k]){days_by[k]=[];keys.push(k)}
    days_by[k].push(s);
   });
   drawDays();
  }).catch(function(){days.textContent='';days.append(el('p','ag-empty',L.err+' '));days.lastChild.append(waLink())});
 }
 function waLink(){var a=el('a',null,'WhatsApp');a.href=WA+'?text='+encodeURIComponent(L.waMsg);a.target='_blank';a.rel='noopener noreferrer';return a}

 function drawDays(){
  days.textContent='';times.textContent='';
  if(!keys.length){days.append(el('p','ag-empty',L.none));return}
  keys.forEach(function(k){
   var first=days_by[k][0],parts=fDay.formatToParts(new Date(first));
   var wd='',dn='',mo='';parts.forEach(function(p){if(p.type==='weekday')wd=p.value;if(p.type==='day')dn=p.value;if(p.type==='month')mo=p.value});
   var b=el('button','ag-day');b.type='button';b.setAttribute('aria-pressed','false');
   b.append(el('span',null,wd.replace('.','')),el('b',null,dn),el('span',null,mo.replace('.','')));
   b.addEventListener('click',function(){
    [].forEach.call(days.children,function(x){x.setAttribute('aria-pressed','false')});
    b.setAttribute('aria-pressed','true');drawTimes(k);
   });
   days.append(b);
  });
 }
 function drawTimes(k){
  times.textContent='';slot=null;pickEl.hidden=true;
  days_by[k].forEach(function(s){
   var d=new Date(s),b=el('button','ag-t',fHour.format(d));b.type='button';b.setAttribute('aria-pressed','false');
   if(!sameTz)b.append(el('small',null,L.yours+' '+fLocal.format(d)));
   b.addEventListener('click',function(){
    [].forEach.call(times.children,function(x){x.setAttribute('aria-pressed','false')});
    b.setAttribute('aria-pressed','true');slot=s;
    pickEl.textContent=L.slotWord+': '+fDay.format(d)+' · '+fHour.format(d)+' (AR)';pickEl.hidden=false;
   });
   times.append(b);
  });
 }

 function submit(e){
  e.preventDefault();
  var f=form.elements,nombre=f.nombre.value.trim(),c=f.contacto.value.trim();
  var okMail=/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(c),okTel=/^[+\d\s().-]+$/.test(c)&&c.replace(/\D/g,'').length>=8;
  st.className='ag-st';
  if(!slot){st.className='ag-st err';st.textContent=L.pick;return}
  if(!nombre||(!okMail&&!okTel)){st.className='ag-st err';st.textContent=L.bad;return}
  go.disabled=true;st.textContent=L.sending;
  var fail=function(msg){go.disabled=false;st.className='ag-st err';st.textContent=msg||L.err;if(!msg){st.append(' ',waLink())}};
  var post=function(token){
   fetch('/api/agenda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    slot:slot,nombre:nombre,contacto:c,nota:f.nota.value.trim(),plan:planName,lang:EN?'en':'es',
    turnstile:token||'',hp_c7:f.hp_c7.value,attribution:attribution()
   })}).then(function(r){return r.json().then(function(j){return{s:r.status,j:j}})}).then(function(o){
    if(o.s===409){fail(L.taken);load();slot=null;pickEl.hidden=true;return}
    if(o.s>=400||!o.j.ok){fail();return}
    body.hidden=true;okBox.hidden=false;track('agenda:booked');
    try{if(window.gtag)gtag('event','conversion',{send_to:'AW-18493149456/p45_CJibm5AdEJCinPJE',value:1.0,currency:'ARS'})}catch(x){}
   }).catch(function(){fail()});
  };
  if(window.turnstile){
   try{
    if(tsId===null)tsId=window.turnstile.render('#ag-ts',{sitekey:TS_KEY,execution:'execute',appearance:'interaction-only',language:EN?'en':'es',callback:post,'error-callback':function(){fail()},'timeout-callback':function(){fail()}});
    else{window.turnstile.reset(tsId);window.turnstile.execute(tsId)}
    return;
   }catch(err){}
  }
  post('');
 }

 function open(plan){
  build();planName=plan||'';slot=null;
  body.hidden=false;okBox.hidden=true;pickEl.hidden=true;st.textContent='';go.disabled=false;
  if(!dlg.open)dlg.showModal();
  load();track('agenda:open');
 }

 document.addEventListener('click',function(e){
  if(!e.target.closest)return;
  var p=e.target.closest('.pl-go'),a=e.target.closest('.g2-call');
  if(!p&&!a)return;
  if(e.metaKey||e.ctrlKey||e.shiftKey||e.button===1)return;
  e.preventDefault();
  var plan='';
  if(p){var card=p.closest('.pl'),n=card&&card.querySelector('.pl-name');plan=n?n.textContent:''}
  else{try{var m=decodeURIComponent((a.getAttribute('href')||'').split('text=')[1]||'').match(/^Plan:(.+?)(?: \(|$)/m);plan=m?m[1]:''}catch(x){}}
  open(plan);
 },true);
})();
