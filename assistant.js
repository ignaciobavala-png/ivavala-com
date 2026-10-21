/* Asistente de IVAVALA: una "mente" en vez de una caja de chat. Una esfera de
   particulas que respira, escucha mientras escribis, piensa mientras espera la
   respuesta y pulsa mientras la va diciendo; la respuesta aparece palabra por
   palabra en tipografia grande. Habla con /api/chat (Groq, con limites del lado
   del servidor) y al final deriva a Ignacio por WhatsApp o deja el contacto
   para recibir un resumen por mail. Todo texto entra con textContent: nada de
   HTML del visitante ni del modelo llega al DOM. */
(function(){
 var root=document.getElementById('chat');
 if(!root)return;
 var EN=document.documentElement.lang==='en';
 var WA='https://wa.me/5491127343775';
 var TS_KEY='0x4AAAAAAEd2UwMVyDyHqSFZ';
 var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 var T=EN?{
  tag:'IVAVALA · assistant',
  st:{idle:'ready',listen:'listening',think:'thinking',speak:'answering'},
  hello:'Hi. Ask me anything about your project.',
  helloSub:'Websites, online stores, custom systems. I answer in seconds.',
  ph:['How much does an online store cost?','Can you replace my spreadsheets?','What happens after you deliver?','I need a website for my business'],
  chips:['How much does it cost?','How long does it take?','What does included maintenance mean?','Do I need texts and photos ready?','How do we start?'],
  send:'Ask',note:'AI assistant: it can make mistakes. Ignacio confirms the final proposal.',
  err:'Something failed. Message Ignacio on WhatsApp and he’ll reply today.',
  you:'You asked',wa:'Chat on WhatsApp →',mail:'Have him write to me',
  contact:'Your email or WhatsApp',name:'Name (optional)',go:'Send me the summary',
  bad:'Enter a valid email or WhatsApp number.',sending:'Sending…',
  done:'Done. Ignacio got the conversation and will write to you. If you left an email, the summary is on its way.',
  waText:'Hi Ignacio, I come from the assistant on ivavala.com. I need: ',
  reset:'New question'
 }:{
  tag:'IVAVALA · asistente',
  st:{idle:'listo',listen:'escuchando',think:'pensando',speak:'respondiendo'},
  hello:'Hola. Preguntame lo que quieras sobre tu proyecto.',
  helloSub:'Páginas web, tiendas online, sistemas a medida. Respondo en segundos.',
  ph:['¿Cuánto cuesta una tienda online?','¿Puedo dejar de usar planillas?','¿Qué pasa después de la entrega?','Necesito una web para mi negocio'],
  chips:['¿Cuánto cuesta?','¿Cuánto tarda?','¿Qué es mantenimiento incluido?','¿Necesito textos y fotos listos?','¿Cómo empezamos?'],
  send:'Preguntar',note:'Asistente con IA: puede equivocarse. La propuesta final la confirma Ignacio.',
  err:'Algo falló. Escribile a Ignacio por WhatsApp y te responde hoy.',
  you:'Preguntaste',wa:'Hablar por WhatsApp →',mail:'Que me escriba',
  contact:'Tu mail o WhatsApp',name:'Nombre (opcional)',go:'Enviarme el resumen',
  bad:'Ingresá un mail o un WhatsApp válido.',sending:'Enviando…',
  done:'Listo. Ignacio recibió la conversación y te escribe. Si dejaste un mail, el resumen va en camino.',
  waText:'Hola Ignacio, vengo del asistente de ivavala.com. Necesito: ',
  reset:'Nueva pregunta'
 };
 var MAX=12,history=[],busy=false,tsId=null,state='idle',phI=0;

 function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}

 /* ── estructura ─────────────────────────────────────────────── */
 root.classList.add('mind');root.setAttribute('role','region');root.setAttribute('aria-label',T.tag);
 var cv=el('canvas','mind-orb');cv.setAttribute('aria-hidden','true');
 var stage=el('div','mind-stage');
 var qEl=el('p','mind-q');
 var ans=el('div','mind-a');ans.setAttribute('role','status');ans.setAttribute('aria-live','polite');
 var act=el('div','mind-act');
 stage.append(qEl,ans,act);
 var chips=el('div','mind-chips');
 var form=el('form','mind-form');form.setAttribute('novalidate','');
 var hp=el('input');hp.type='text';hp.name='hp';hp.tabIndex=-1;hp.autocomplete='off';hp.className='mind-hp';hp.setAttribute('aria-hidden','true');
 var inp=el('input','mind-in');inp.type='text';inp.maxLength=500;inp.autocomplete='off';inp.setAttribute('aria-label',T.ph[0]);inp.placeholder=T.ph[0];
 var sendBtn=el('button','mind-send',T.send);sendBtn.type='submit';
 form.append(hp,inp,sendBtn);
 var ts=el('div');ts.id='chat-ts';
 root.append(cv,stage,chips,form,ts);

 /* ── estado ─────────────────────────────────────────────────── */
 function setState(s){state=s;root.dataset.s=s}
 setState('idle');

 function say(text,small){
  ans.textContent='';ans.classList.toggle('long',text.length>200);
  var words=String(text).split(/\s+/),i=0;
  setState('speak');
  var frag=document.createDocumentFragment();
  words.forEach(function(w,k){
   var s=el('span','w',w);s.style.animationDelay=(reduce?0:k*38)+'ms';
   frag.append(s,document.createTextNode(' '));
  });
  ans.append(frag);
  var total=reduce?0:words.length*38+420;
  setTimeout(function(){if(!busy)setState(inp===document.activeElement&&inp.value?'listen':'idle')},total);
  return total;
 }
 function hello(){
  qEl.textContent='';act.textContent='';
  ans.textContent='';ans.classList.remove('long');
  ans.append(el('span','w hello',T.hello));
 }
 hello();

 chips.append.apply(chips,T.chips.map(function(q){
  var c=el('button','mind-chip',q);c.type='button';
  c.addEventListener('click',function(){ask(q)});return c;
 }));

 setInterval(function(){if(document.activeElement!==inp&&!inp.value){phI=(phI+1)%T.ph.length;inp.placeholder=T.ph[phI]}},3800);
 inp.addEventListener('input',function(){if(!busy)setState(inp.value?'listen':'idle')});
 inp.addEventListener('focus',function(){if(!busy&&inp.value)setState('listen')});
 inp.addEventListener('blur',function(){if(!busy)setState('idle')});

 /* ── derivacion ─────────────────────────────────────────────── */
 function waLink(){
  var first='';
  for(var i=0;i<history.length;i++){if(history[i].role==='user'){first=history[i].content;break}}
  return WA+'?text='+encodeURIComponent(T.waText+first.slice(0,180));
 }
 function handoff(){
  act.textContent='';
  var a=el('a','mind-btn p',T.wa);a.href=waLink();a.target='_blank';a.rel='noopener noreferrer';
  var m=el('button','mind-btn',T.mail);m.type='button';
  var f=el('form','mind-lead');f.setAttribute('novalidate','');f.hidden=true;
  var c=el('input');c.type='text';c.placeholder=T.contact;c.setAttribute('aria-label',T.contact);c.autocomplete='email';
  var n=el('input');n.type='text';n.placeholder=T.name;n.setAttribute('aria-label',T.name);n.autocomplete='name';n.maxLength=80;
  var b=el('button',null,T.go);b.type='submit';
  var st=el('p','mind-st');
  f.append(c,n,b,st);
  act.append(a,m,f);
  m.addEventListener('click',function(){f.hidden=false;m.hidden=true;c.focus()});
  f.addEventListener('submit',function(e){
   e.preventDefault();
   var v=c.value.trim();
   var okMail=/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v),okTel=/^[+\d\s().-]+$/.test(v)&&v.replace(/\D/g,'').length>=8;
   if(!okMail&&!okTel){st.className='mind-st err';st.textContent=T.bad;return}
   b.disabled=true;st.className='mind-st';st.textContent=T.sending;
   var fail=function(){b.disabled=false;st.className='mind-st err';st.textContent=T.err};
   var post=function(token){
    fetch('/api/chat/lead',{method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({contacto:v,nombre:n.value.trim(),messages:history.slice(-12),lang:EN?'en':'es',turnstile:token||'',hp_c7:''})})
    .then(function(r){return r.ok?r.json():Promise.reject(r.status)})
    .then(function(){st.className='mind-st ok';st.textContent=T.done;c.disabled=n.disabled=true})
    .catch(fail);
   };
   if(window.turnstile){
    try{
     if(tsId===null){tsId=window.turnstile.render('#chat-ts',{sitekey:TS_KEY,execution:'execute',appearance:'interaction-only',language:EN?'en':'es',callback:post,'error-callback':fail,'timeout-callback':fail});}
     else{window.turnstile.reset(tsId);window.turnstile.execute(tsId)}
     return;
    }catch(err){}
   }
   post('');
  });
 }

 /* ── pregunta / respuesta ───────────────────────────────────── */
 function ask(q){
  q=String(q||'').trim();
  if(!q||busy)return;
  if(history.filter(function(m){return m.role==='user'}).length>=MAX)return;
  busy=true;inp.value='';sendBtn.disabled=true;chips.classList.add('off');
  history.push({role:'user',content:q});
  qEl.textContent=T.you+': '+q;act.textContent='';
  ans.textContent='';ans.classList.remove('long');
  setState('think');
  fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({messages:history.slice(-12),lang:EN?'en':'es',hp:hp.value})})
  .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
  .then(function(o){
   if(!o.ok||!o.j||!o.j.reply){say(T.err);handoff();return}
   history.push({role:'assistant',content:o.j.reply});
   say(o.j.reply);
   if(o.j.handoff)handoff();
  })
  .catch(function(){say(T.err);handoff()})
  .then(function(){busy=false;sendBtn.disabled=false;if(innerWidth>700)inp.focus({preventScroll:true})});
 }
 form.addEventListener('submit',function(e){e.preventDefault();ask(inp.value)});

 /* ── la esfera ──────────────────────────────────────────────── */
 var ctx=cv.getContext('2d');
 if(!ctx)return;
 var N=innerWidth<700?800:1500,P=[],i;
 var G=Math.PI*(3-Math.sqrt(5));
 for(i=0;i<N;i++){
  var y=1-2*(i+.5)/N,r=Math.sqrt(1-y*y),th=G*i;
  P.push({x:Math.cos(th)*r,y:y,z:Math.sin(th)*r,s:Math.random()*6.28,h:(y+1)/2});
 }
 var W=0,H=0,dpr=1,mx=0,my=0,tmx=0,tmy=0,ang=0,t0=performance.now(),visible=true,raf=0;
 // parametros por estado; se interpolan para que los cambios sean suaves
 var TG={idle:{sp:.16,amp:.07,br:.95,rad:1,gl:.38},listen:{sp:.28,amp:.11,br:1.15,rad:1.04,gl:.5},think:{sp:1.5,amp:.26,br:1.25,rad:.94,gl:.62},speak:{sp:.38,amp:.16,br:1.2,rad:1.02,gl:.55}};
 var cur={sp:.16,amp:.07,br:.95,rad:1,gl:.38};
 function size(){
  var b=root.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);
  W=Math.max(2,b.width);H=Math.max(2,b.height);
  cv.width=W*dpr|0;cv.height=H*dpr|0;cv.style.width=W+'px';cv.style.height=H+'px';
 }
 size();addEventListener('resize',size);
 root.addEventListener('pointermove',function(e){var b=root.getBoundingClientRect();tmx=((e.clientX-b.left)/b.width-.5)*2;tmy=((e.clientY-b.top)/b.height-.5)*2},{passive:true});
 function col(h,a){
  // cian -> azul -> violeta segun la altura en la esfera
  var hue=218+h*50;return 'hsla('+hue+',88%,'+(52-h*8)+'%,'+a+')';
 }
 function frame(now){
  raf=requestAnimationFrame(frame);
  if(!visible)return;
  var dt=Math.min(.05,(now-t0)/1000);t0=now;
  var g=TG[state],k=Math.min(1,dt*4);
  for(var key in cur)cur[key]+=(g[key]-cur[key])*k;
  mx+=(tmx-mx)*.05;my+=(tmy-my)*.05;
  ang+=dt*cur.sp;
  // pulso al hablar: la esfera "late" al ritmo de las palabras
  var pulse=state==='speak'?1+Math.sin(now/115)*.035+Math.sin(now/47)*.012:state==='think'?1+Math.sin(now/180)*.02:1;
  var wide=W>720;
  var R=Math.min(W*(wide?.22:.34),H*(wide?.30:.22))*cur.rad*pulse;
  var cx=W/2,cy=wide?H*.37:H*.25,time=now/1000;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,W,H);
  // halo
  var gr=ctx.createRadialGradient(cx,cy,R*.1,cx,cy,R*2.1);
  gr.addColorStop(0,'rgba(37,71,245,'+cur.gl*.34+')');gr.addColorStop(.5,'rgba(124,92,255,'+cur.gl*.12+')');gr.addColorStop(1,'rgba(37,71,245,0)');
  ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  var co=ctx.createRadialGradient(cx,cy,0,cx,cy,R*.9);
  co.addColorStop(0,'rgba(255,255,255,'+cur.gl*1.3+')');co.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=co;ctx.fillRect(0,0,W,H);
  var ca=Math.cos(ang+mx*.6),sa=Math.sin(ang+mx*.6),cb=Math.cos(.35+my*.4),sb=Math.sin(.35+my*.4);
  for(var j=0;j<N;j++){
   var p=P[j];
   var n=Math.sin(p.x*2.3+time*.9+p.s)*Math.cos(p.y*1.9-time*.7)+Math.sin(p.z*2.6+time*1.1)*.6;
   var d=1+cur.amp*n/1.6;
   var x=p.x*d,y=p.y*d,z=p.z*d;
   var x1=x*ca-z*sa,z1=x*sa+z*ca;
   var y2=y*cb-z1*sb,z2=y*sb+z1*cb;
   var sc=3/(3+z2);
   var depth=(z2+1)/2;
   var a=Math.min(1,(.16+.84*depth)*cur.br*.85);
   ctx.fillStyle=col(p.h,a);
   var s=(.9+2*depth)*sc*(wide?1:.8);
   ctx.beginPath();ctx.arc(cx+x1*R*sc,cy+y2*R*sc,s,0,6.283);ctx.fill();
  }
 }
 if('IntersectionObserver' in window){
  new IntersectionObserver(function(en){visible=en[0].isIntersecting}).observe(root);
 }
 document.addEventListener('visibilitychange',function(){visible=!document.hidden});
 if(reduce){TG.idle.sp=0;TG.listen.sp=0;TG.think.sp=0;TG.speak.sp=0}
 raf=requestAnimationFrame(frame);
})();
