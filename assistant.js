/* El asistente del visitante en ivavala.com. No es un chat de soporte: es una
   "mente" (la esfera de particulas) que guia al visitante hasta su plan en tres
   preguntas con tarjetas (a que se dedica, que tiene hoy, para cuando), le
   muestra el plan con su precio y lo lleva a agendar la videollamada. Lo que no
   entra en las tarjetas lo responde la IA (/api/chat, Groq, con limites del lado
   del servidor), que recibe lo que el visitante ya eligio.
   Todo texto entra con textContent: nada de HTML del visitante ni del modelo
   llega al DOM. */
(function(){
 var root=document.getElementById('chat');
 if(!root)return;
 var EN=document.documentElement.lang==='en';
 var WA='https://wa.me/5491127343775';
 var TS_KEY='0x4AAAAAAEd2UwMVyDyHqSFZ';
 var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

 // Planes: la misma informacion que la seccion Precios. price en pesos (0 = sin precio publicado).
 var PLANS=EN?{
  landing:{name:'Landing',price:420,inc:['A page that is the public face of your business','WhatsApp button and contact form','Live in 1 to 2 weeks','3 months of maintenance included']},
  backend:{name:'Landing with backend',price:900,inc:['Everything in Landing','A panel to upload products, prices and stock yourself','Orders arrive sorted on WhatsApp','Your own database, no platform fees']},
  comercio:{name:'Large business',price:1500,from:true,inc:['Everything in Landing with backend','AI assistant answering questions 24/7','Users and permissions for your team','Ready for more products, orders and visits']}
 }:{
  landing:{name:'Landing',price:700000,inc:['Una página que es la cara visible de tu negocio','Botón de WhatsApp y formulario de contacto','En línea en 1 a 2 semanas','3 meses de mantenimiento incluidos']},
  backend:{name:'Landing con backend',price:1500000,inc:['Todo lo de Landing','Panel para cargar productos, precios y stock vos mismo','Pedidos que te llegan ordenados por WhatsApp','Base de datos propia, sin abonos de plataformas']},
  comercio:{name:'Comercio grande',price:2500000,from:true,inc:['Todo lo de Landing con backend','Asistente con IA que responde consultas las 24 horas','Usuarios y permisos para tu equipo','Preparado para más productos, pedidos y visitas']}
 };

 var T=EN?{
  name:'Your assistant',
  st:{idle:'online',think:'thinking',speak:'answering'},
  rail:['Your business','Today','Timing','Your plan'],
  steps:[
   {k:'Your business',m:'Hi, I’m your assistant. What do you do?',q:'Hi, I’m your assistant. I’ll help you find the right plan for your business in under a minute. What do you do?',
    o:[['Independent professional','Doctors, lawyers, accountants, coaches','landing'],['I sell products and manage stock','Wholesale, retail, shops','backend'],['Large business','High volume, a team, more traffic','comercio'],['Something else','Tell me and I’ll point you','otro']]},
   {k:'Today',q:'What do you have online today?',o:[['Nothing yet','We start from scratch'],['Just Instagram or social media','We add a site that sells'],['A website that doesn’t work for me','We rebuild it properly']]},
   {k:'Timing',q:'When do you need it?',o:[['This month','We start right away'],['In 1 or 2 months','We plan it calmly'],['No rush','We look at it together']]}
  ],
  other:'Tell me in one line what you do and what you need, and I’ll tell you which plan fits.',
  rec:'This is your plan.',recK:'Your plan',noPrice:'',
  call:'Book a video call →',callNote:'20 minutes with Ignacio to look at your project. No commitment.',
  more:'I have another question',restart:'Start over',
  youK:'Your answers',youQ:'You asked',chatK:'Your question',
  askLink:'Another question? Type it',ph:'Or type your question…',send:'Ask',
  note:'AI assistant: it can make mistakes. Ignacio confirms the final proposal.',
  err:'Something failed. Message Ignacio on WhatsApp and he’ll reply today.',
  mail:'Have him write to me',
  contact:'Your email or WhatsApp',nameF:'Name (optional)',go:'Send',
  bad:'Enter a valid email or WhatsApp number.',sending:'Sending…',
  sent:'Done. Ignacio got the conversation and will write to you.',
  waCall:'Hi Ignacio, I come from ivavala.com and I want to book a video call.',
  ctx:'What I already answered: ',plan:'Plan',
  brief:'Build my project brief',briefing:'Building your brief…',briefTitle:'Your project brief',copy:'Copy',copied:'Copied',dl:'Download',briefErr:'Could not build it now. Try again or write to Ignacio.'
 }:{
  name:'Tu asistente',
  st:{idle:'en línea',think:'pensando',speak:'respondiendo'},
  rail:['Tu negocio','Hoy','Tiempos','Tu plan'],
  steps:[
   {k:'Tu negocio',m:'Hola, soy tu asistente. ¿A qué te dedicás?',q:'Hola, soy tu asistente. Te ayudo a encontrar el plan justo para tu negocio en menos de un minuto. ¿A qué te dedicás?',
    o:[['Soy profesional independiente','Médicos, abogados, contadores, coaches','landing'],['Vendo productos y manejo stock','Mayoristas, minoristas, tiendas','backend'],['Tengo un comercio grande','Mucho movimiento, equipo, más volumen','comercio'],['Otra cosa','Contame y te oriento','otro']]},
   {k:'Hoy',q:'¿Qué tenés hoy en internet?',o:[['Nada todavía','Arrancamos de cero'],['Solo Instagram o redes','Sumamos una web que vende'],['Una web que no me sirve','La rehacemos bien']]},
   {k:'Tiempos',q:'¿Para cuándo lo necesitás?',o:[['Este mes','Arrancamos ya'],['En 1 o 2 meses','Lo planificamos con tiempo'],['Sin apuro','Lo vemos juntos']]}
  ],
  other:'Contame en una línea a qué te dedicás y qué necesitás, y te digo qué plan te sirve.',
  rec:'Este es tu plan.',recK:'Tu plan',noPrice:'',
  call:'Agendar videollamada →',callNote:'20 minutos con Ignacio para ver tu proyecto. Sin compromiso.',
  more:'Tengo otra pregunta',restart:'Empezar de nuevo',
  youK:'Tus respuestas',youQ:'Preguntaste',chatK:'Tu pregunta',
  askLink:'¿Otra duda? Escribime tu pregunta',ph:'O escribí tu pregunta…',send:'Preguntar',
  note:'Asistente con IA: puede equivocarse. La propuesta final la confirma Ignacio.',
  err:'Algo falló. Escribile a Ignacio por WhatsApp y te responde hoy.',
  mail:'Que me escriba',
  contact:'Tu mail o WhatsApp',nameF:'Nombre (opcional)',go:'Enviar',
  bad:'Ingresá un mail o un WhatsApp válido.',sending:'Enviando…',
  sent:'Listo. Ignacio recibió la conversación y te escribe.',
  waCall:'Hola Ignacio, vengo de ivavala.com y quiero agendar una videollamada.',
  ctx:'Lo que ya respondí: ',plan:'Plan',
  brief:'Armar el brief de mi proyecto',briefing:'Armando tu brief…',briefTitle:'El brief de tu proyecto',copy:'Copiar',copied:'Copiado',dl:'Descargar',briefErr:'No pude armarlo ahora. Probá de nuevo o escribile a Ignacio.'
 };
 var MAX=12,history=[],answers=[],plan=null,busy=false,tsId=null,state='idle',ctxSent=false,step=0;

 function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
 // En el celular el asistente es minimo: saludo corto, sin bajadas y la
 // pregunta libre plegada hasta que el visitante la pide.
 function isMob(){return matchMedia('(max-width:700px)').matches}
 function openAsk(){root.classList.add('ask');inp.focus({preventScroll:true})}
 // Al cambiar de paso en el celular, el asistente vuelve arriba de la pantalla.
 function keep(){if(!isMob())return;var r=root.getBoundingClientRect();if((r.top<0||r.top>innerHeight*.35)&&root.scrollIntoView)root.scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'})}
 function track(name){try{if(window.ivEv)window.ivEv(name)}catch(e){}}
 // Precio segun el idioma: pesos en castellano, dolares en ingles.
 function ars(n){return EN?'USD '+Math.round(n).toLocaleString('en-US'):'$'+Math.round(n).toLocaleString('es-AR')}

 /* ── estructura ─────────────────────────────────────────────── */
 root.classList.add('mind','g2');root.setAttribute('role','region');root.setAttribute('aria-label',T.name);
 var rail=el('ol','g2-rail');
 var railItems=T.rail.map(function(r,i){var li=el('li');li.append(el('span','g2-rn',String(i+1).padStart(2,'0')),el('span','g2-rl',r));rail.append(li);return li});
 var stage=el('div','g2-stage');
 var side=el('div','g2-side');
 var cv=el('canvas','mind-orb');cv.setAttribute('aria-hidden','true');
 var who=el('div','g2-who');var stEl=el('span','g2-st',T.st.idle);who.append(el('b',null,T.name),stEl);
 side.append(cv,who);
 var main=el('div','g2-main');
 var kick=el('p','g2-k');
 var youQ=el('p','g2-you');
 var text=el('div','g2-text');text.setAttribute('role','status');text.setAttribute('aria-live','polite');
 var opts=el('div','g2-opts');
 var out=el('div','g2-out');
 main.append(kick,youQ,text,opts,out);
 stage.append(side,main);
 var crumbs=el('div','g2-crumbs');
 var form=el('form','mind-form');form.setAttribute('novalidate','');
 var hp=el('input');hp.type='text';hp.name='hp';hp.tabIndex=-1;hp.autocomplete='off';hp.className='mind-hp';hp.setAttribute('aria-hidden','true');
 var inp=el('input','mind-in');inp.type='text';inp.maxLength=400;inp.autocomplete='off';inp.setAttribute('aria-label',T.ph);inp.placeholder=T.ph;
 var sendBtn=el('button','mind-send',T.send);sendBtn.type='submit';
 form.append(hp,inp,sendBtn);
 var askBtn=el('button','g2-asklink',T.askLink);askBtn.type='button';askBtn.addEventListener('click',openAsk);
 var note=el('p','mind-note',T.note);
 var ts=el('div');ts.id='chat-ts';
 root.append(rail,stage,crumbs,askBtn,form,note,ts);

 function setState(s){state=s;root.dataset.s=s;stEl.textContent=T.st[s]||T.st.idle}
 setState('idle');
 function setRail(n){railItems.forEach(function(li,i){li.className=i<n?'done':i===n?'on':''})}

 /* ── texto grande, palabra por palabra ──────────────────────── */
 function say(s){
  text.textContent='';text.classList.toggle('long',s.length>160);
  if(reduce){text.textContent=s;return 0}
  var words=String(s).split(/\s+/);
  words.forEach(function(w,k){var sp=el('span','w',w);sp.style.animationDelay=(k*32)+'ms';text.append(sp,document.createTextNode(' '))});
  setState('speak');
  var total=words.length*32+400;
  setTimeout(function(){if(!busy)setState('idle')},total);
  return total;
 }
 function clearOut(){opts.textContent='';out.textContent='';youQ.textContent=''}

 /* ── respuestas elegidas, tocables para volver ──────────────── */
 function drawCrumbs(){
  crumbs.textContent='';
  if(!answers.length)return;
  crumbs.append(el('span','g2-ck',T.youK));
  answers.forEach(function(a,i){
   var b=el('button','g2-crumb',a);b.type='button';
   b.addEventListener('click',function(){if(busy)return;answers=answers.slice(0,i);if(i===0)plan=null;ctxSent=false;showStep(i)});
   crumbs.append(b);
  });
 }

 /* ── flujo guiado ───────────────────────────────────────────── */
 function showStep(i){
  step=i;setRail(i);clearOut();drawCrumbs();
  var s=T.steps[i];
  kick.textContent=String(i+1).padStart(2,'0')+' · '+s.k;
  var d=say((isMob()&&s.m)||s.q);
  setTimeout(function(){
   if(step!==i)return;
   s.o.forEach(function(o,k){
    var b=el('button','g2-opt');b.type='button';
    b.append(el('span','g2-on',String(k+1).padStart(2,'0')),el('span','g2-ot',o[0]),el('span','g2-os',o[1]),el('span','g2-oa','→'));
    b.style.animationDelay=(k*70)+'ms';
    b.addEventListener('click',function(){pick(i,o)});
    opts.append(b);
   });
  },reduce?0:Math.min(d,900));
 }
 function pick(i,o){
  answers[i]=o[0];answers=answers.slice(0,i+1);
  if(i===0){
   track('advisor:start');
   if(o[2]==='otro'){plan=null;drawCrumbs();clearOut();setRail(3);kick.textContent=T.chatK;say(T.other);openAsk();keep();return}
   plan=o[2];
  }
  if(i<T.steps.length-1)showStep(i+1);
  else recommend();
  keep();
 }
 function callLink(){
  var p=plan&&PLANS[plan];
  var lines=[T.waCall];
  if(p)lines.push(T.plan+': '+p.name+(p.price?' ('+money(p)+')':''));
  if(answers.length)lines.push(answers.join(' · '));
  return WA+'?text='+encodeURIComponent(lines.join('\n'));
 }
 // "desde" para el plan sin techo de alcance.
 function money(p){return (p.from?(EN?'from ':'desde '):'')+ars(p.price)}
 function countUp(node,to,pre){
  pre=pre||'';
  if(reduce||!to){node.textContent=to?pre+ars(to):'';return}
  var t0=performance.now(),dur=900;
  (function f(now){var k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,3);node.textContent=pre+ars(to*e);if(k<1)requestAnimationFrame(f)})(t0);
 }
 function recommend(){
  setRail(3);clearOut();drawCrumbs();
  kick.textContent='04 · '+T.recK;
  var p=PLANS[plan];
  say(T.rec);
  var c=el('div','g2-plan');
  var top=el('div','g2-plan-top');
  top.append(el('b','g2-plan-n',p.name));
  var price=el('span','g2-plan-p');top.append(price);
  c.append(top);
  if(!p.price&&T.noPrice)c.append(el('p','g2-plan-x',T.noPrice));
  var ul=el('ul','g2-plan-i');p.inc.forEach(function(x,k){var li=el('li',null,x);li.style.animationDelay=(250+k*90)+'ms';ul.append(li)});
  c.append(ul);
  var call=el('a','g2-call',T.call);call.href=callLink();call.target='_blank';call.rel='noopener noreferrer';
  call.addEventListener('click',function(){track('advisor:call:'+plan)});
  var with_=el('p','g2-plan-x g2-with');
  var face=el('img');face.src='/img/yo.webp';face.alt='Ignacio Vavala';face.width=28;face.height=28;
  with_.append(face,el('span',null,T.callNote));
  c.append(call,with_);
  out.append(c);
  countUp(price,p.price,p.from?(EN?'from ':'desde '):'');
  var row=el('div','g2-row');
  var more=el('button','g2-link',T.more);more.type='button';more.addEventListener('click',openAsk);
  var again=el('button','g2-link',T.restart);again.type='button';again.addEventListener('click',restart);
  row.append(more,again);out.append(row);
  track('advisor:plan:'+plan);
 }
 function restart(){answers=[];plan=null;history=[];ctxSent=false;showStep(0)}

 /* ── brief del proyecto ─────────────────────────────────────── */
 function buildBrief(btn,card){
  btn.disabled=true;btn.textContent=T.briefing;
  fetch('/api/chat/brief',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({messages:history.slice(-12),lang:EN?'en':'es',hp:''})})
  .then(function(r){return r.ok?r.json():Promise.reject(r.status)})
  .then(function(j){
   if(!j||!j.brief)throw 0;
   var txt=String(j.brief);
   card.textContent='';
   var h=el('p','mind-brief-t',T.briefTitle);
   var pre=el('pre','mind-brief-b',txt);
   var row=el('div','mind-brief-r');
   var cp=el('button','mind-btn',T.copy);cp.type='button';
   cp.addEventListener('click',function(){
    var ok=function(){cp.textContent=T.copied;setTimeout(function(){cp.textContent=T.copy},1800)};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(ok,function(){});
   });
   var dl=el('button','mind-btn',T.dl);dl.type='button';
   dl.addEventListener('click',function(){
    var u=URL.createObjectURL(new Blob([T.briefTitle+'\n\n'+txt+'\n\nivavala.com'],{type:'text/plain;charset=utf-8'}));
    var l=document.createElement('a');l.href=u;l.download='brief-ivavala.txt';document.body.append(l);l.click();l.remove();
    setTimeout(function(){URL.revokeObjectURL(u)},4000);
   });
   row.append(cp,dl);card.append(h,pre,row);card.hidden=false;
   btn.hidden=true;
  })
  .catch(function(){btn.disabled=false;btn.textContent=T.brief;say(T.briefErr)});
 }

 /* ── derivacion despues de una pregunta libre ───────────────── */
 function handoff(){
  var box=el('div','g2-hand');
  var call=el('a','g2-call',T.call);call.href=callLink();call.target='_blank';call.rel='noopener noreferrer';
  call.addEventListener('click',function(){track('advisor:call:'+(plan||'chat'))});
  var m=el('button','mind-btn',T.mail);m.type='button';
  var br=el('button','mind-btn',T.brief);br.type='button';
  var f=el('form','mind-lead');f.setAttribute('novalidate','');f.hidden=true;
  var c=el('input');c.type='text';c.placeholder=T.contact;c.setAttribute('aria-label',T.contact);c.autocomplete='email';
  var n=el('input');n.type='text';n.placeholder=T.nameF;n.setAttribute('aria-label',T.nameF);n.autocomplete='name';n.maxLength=80;
  var b=el('button',null,T.go);b.type='submit';
  var st=el('p','mind-st');
  f.append(c,n,b,st);
  var card=el('div','mind-brief');card.hidden=true;
  var row=el('div','g2-hand-r');row.append(m,br);
  box.append(call,row,f,card);
  out.append(box);
  br.addEventListener('click',function(){buildBrief(br,card)});
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
    .then(function(){
     st.className='mind-st ok';st.textContent=T.sent;c.disabled=n.disabled=true;track('advisor:lead');
     // Conversion de Ads del formulario: era del formulario de contacto, que se fue.
     try{if(window.gtag)gtag('event','conversion',{send_to:'AW-18493149456/p45_CJibm5AdEJCinPJE',value:1.0,currency:'ARS'})}catch(e){}
    })
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

 /* ── pregunta libre a la IA ─────────────────────────────────── */
 function ask(q){
  q=String(q||'').trim();
  if(!q||busy)return;
  if(history.filter(function(m){return m.role==='user'}).length>=MAX)return;
  busy=true;inp.value='';sendBtn.disabled=true;
  clearOut();setRail(3);
  kick.textContent=T.chatK;youQ.textContent=T.youQ+': '+q;text.textContent='';
  // La primera pregunta libre lleva lo que ya eligio con las tarjetas, asi la
  // IA no vuelve a preguntarlo. En pantalla se ve solo la pregunta.
  var content=q;
  if(!ctxSent&&answers.length){
   var p=plan&&PLANS[plan];
   content=T.ctx+answers.join('; ')+(p?'; '+T.plan+': '+p.name:'')+'. '+q;
   ctxSent=true;
  }
  history.push({role:'user',content:content});
  track('advisor:ask');
  setState('think');
  fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({messages:history.slice(-12),lang:EN?'en':'es',hp:hp.value})})
  .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
  .then(function(o){
   if(!o.ok||!o.j||!o.j.reply){say(T.err);handoff();return}
   history.push({role:'assistant',content:o.j.reply});
   say(o.j.reply);
   if(o.j.handoff||plan)handoff();
  })
  .catch(function(){say(T.err);handoff()})
  .then(function(){busy=false;sendBtn.disabled=false});
 }
 form.addEventListener('submit',function(e){e.preventDefault();ask(inp.value)});

 // Arranca cuando la seccion entra en pantalla, para que la primera pregunta
 // se escriba frente al visitante y no mientras esta arriba en la pagina.
 var started=false;
 function start(){if(started)return;started=true;showStep(0)}
 if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(en){if(en[0].isIntersecting){start();io.disconnect()}},{threshold:.25});
  io.observe(root);
 }else start();

 /* ── la esfera ──────────────────────────────────────────────── */
 var ctx=cv.getContext('2d');
 if(!ctx)return;
 var N=innerWidth<700?520:1100,P=[],i;
 var G=Math.PI*(3-Math.sqrt(5));
 for(i=0;i<N;i++){
  var y=1-2*(i+.5)/N,r=Math.sqrt(1-y*y),th=G*i;
  P.push({x:Math.cos(th)*r,y:y,z:Math.sin(th)*r,s:Math.random()*6.28,h:(y+1)/2});
 }
 var W=0,H=0,dpr=1,mx=0,my=0,tmx=0,tmy=0,ang=0,t0=performance.now(),visible=true;
 var TG={idle:{sp:.18,amp:.07,br:.95,rad:1,gl:.4},think:{sp:1.5,amp:.26,br:1.25,rad:.94,gl:.65},speak:{sp:.4,amp:.16,br:1.2,rad:1.03,gl:.56}};
 var cur={sp:.18,amp:.07,br:.95,rad:1,gl:.4};
 function size(){
  var b=cv.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);
  W=Math.max(2,b.width);H=Math.max(2,b.height);
  cv.width=W*dpr|0;cv.height=H*dpr|0;
 }
 size();addEventListener('resize',size);
 root.addEventListener('pointermove',function(e){var b=root.getBoundingClientRect();tmx=((e.clientX-b.left)/b.width-.5)*2;tmy=((e.clientY-b.top)/b.height-.5)*2},{passive:true});
 function col(h,a){var hue=218+h*50;return 'hsla('+hue+',88%,'+(52-h*8)+'%,'+a+')'}
 function frame(now){
  requestAnimationFrame(frame);
  if(!visible)return;
  var dt=Math.min(.05,(now-t0)/1000);t0=now;
  var g=TG[state]||TG.idle,k=Math.min(1,dt*4);
  for(var key in cur)cur[key]+=(g[key]-cur[key])*k;
  mx+=(tmx-mx)*.05;my+=(tmy-my)*.05;
  ang+=dt*cur.sp;
  var pulse=state==='speak'?1+Math.sin(now/115)*.03+Math.sin(now/47)*.01:state==='think'?1+Math.sin(now/180)*.02:1;
  var R=Math.min(W,H)*.36*cur.rad*pulse,cx=W/2,cy=H/2,time=now/1000;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
  var gr=ctx.createRadialGradient(cx,cy,R*.1,cx,cy,R*1.9);
  gr.addColorStop(0,'rgba(37,71,245,'+cur.gl*.3+')');gr.addColorStop(.55,'rgba(124,92,255,'+cur.gl*.1+')');gr.addColorStop(1,'rgba(37,71,245,0)');
  ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  var ca=Math.cos(ang+mx*.6),sa=Math.sin(ang+mx*.6),cb=Math.cos(.35+my*.4),sb=Math.sin(.35+my*.4);
  for(var j=0;j<N;j++){
   var p=P[j];
   var n=Math.sin(p.x*2.3+time*.9+p.s)*Math.cos(p.y*1.9-time*.7)+Math.sin(p.z*2.6+time*1.1)*.6;
   var d=1+cur.amp*n/1.6;
   var x=p.x*d,yy=p.y*d,z=p.z*d;
   var x1=x*ca-z*sa,z1=x*sa+z*ca;
   var y2=yy*cb-z1*sb,z2=yy*sb+z1*cb;
   var sc=3/(3+z2),depth=(z2+1)/2;
   ctx.fillStyle=col(p.h,Math.min(1,(.16+.84*depth)*cur.br*.85));
   ctx.beginPath();ctx.arc(cx+x1*R*sc,cy+y2*R*sc,(.8+1.8*depth)*sc*(W<300?.7:1),0,6.283);ctx.fill();
  }
 }
 if('IntersectionObserver' in window){
  new IntersectionObserver(function(en){visible=en[0].isIntersecting}).observe(cv);
 }
 document.addEventListener('visibilitychange',function(){visible=!document.hidden});
 if(reduce){TG.idle.sp=TG.think.sp=TG.speak.sp=0}
 requestAnimationFrame(frame);
})();
