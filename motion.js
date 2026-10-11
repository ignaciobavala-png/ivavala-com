/* Single-pass GPU ambient surface. No geometry rebuilding or canvas paths per frame. */
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const canvas=document.createElement('canvas');canvas.id='reactive-light';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
 let gl;
 try{gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'});}catch(error){console.warn('[ambient] WebGL unavailable',error);}
 if(!gl){canvas.remove();document.body.classList.add('ambient-fallback');return;}
 const vertex=`attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.,1.);}`;
 const fragment=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
 precision highp float;
#else
 precision mediump float;
#endif
 uniform vec2 u_resolution;
 uniform float u_open;
 uniform vec3 u_color;
 uniform float u_time;
 uniform float u_tick;

 uniform float u_light;
 void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution;
  float aspect=u_resolution.x/u_resolution.y;
  vec2 p=(uv-vec2(.5,.5))*vec2(aspect,1.);
  p/=max(.43,min(aspect*.43,.62));
  // The circle expands beyond the viewport into an open current as the hero leaves.
  float expansion=u_open*5.;
  vec2 field=p+vec2(0.,expansion+u_open*.85);
  float radius=length(field);
  float angle=atan(field.y,field.x);
  float t=u_time;
  float d=radius-(1.+expansion);
  float travel=angle-t;
  // Every moving feature shares this single direction and continuous phase.
  float ring=exp(-abs(d)*145.);
  float halo=exp(-d*d*115.);
  float outer=exp(-abs(d-.105)*190.);
  float inner=exp(-abs(d+.06)*180.);
  float flow=.5+.5*sin(travel*7.+d*65.);
  flow=flow*flow*flow;
  float counter=.5+.5*cos(travel*11.-d*90.);
  counter=counter*counter*counter;
  float filament=.5+.5*sin(d*235.+travel*4.);
  float arc=pow(.5+.5*cos(travel),16.);
  float arc2=pow(.5+.5*cos(travel+2.),24.);
  float ticks=step(.93,.5+.5*cos((angle-u_tick)*96.));
  float gauge=exp(-abs(d-.16)*230.)*ticks*(1.-u_open);
  vec3 blue=vec3(.16,.34,.95);
  vec3 cyan=mix(vec3(.15,.86,.95),u_color,.3);
  vec3 energy=cyan*(ring*(.3+arc*1.7)+halo*(.035+flow*.15)*filament);
  energy+=blue*(outer*(.12+counter*.4)+halo*arc2*.32);
  energy+=vec3(.7,.96,1.)*ring*arc*.7;
  energy+=cyan*(inner*.075+gauge*.12);
  energy+=blue*exp(-d*d*12.)*.045;
  float center=mix(smoothstep(.62,.96,radius),1.,u_open);
  vec3 base=mix(vec3(.023,.043,.073),vec3(.953,.973,.98),u_light);
  base*=mix(.55,1.,smoothstep(.2,1.25,radius))*(1.-u_light)+u_light;
  float edge=abs(uv.x-.5);
  energy*=mix(1.,smoothstep(.475,.5,edge)*.55,u_open);
  vec3 color=mix(base+energy*center,base-energy*.45*center,u_light);
  gl_FragColor=vec4(color,1.);
 }`;
 let uniforms,ready=false,contextLost=false,lightTheme=document.documentElement.dataset.theme==='light';
 function fallback(reason){
  ready=false;cancelAnimationFrame(raf);raf=0;
  document.body.classList.remove('webgl-active');
  document.body.classList.add('ambient-fallback');
  canvas.style.display='none';canvas.dataset.renderer=reason;
 }
 function shader(type,source){
  const shader=gl.createShader(type);if(!shader)throw new Error('Could not allocate shader');
  gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
   const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(message||'Shader compilation failed');
  }
  return shader;
 }
 function initialize(){
  let vs,fs,program,buffer;
  try{
   vs=shader(gl.VERTEX_SHADER,vertex);fs=shader(gl.FRAGMENT_SHADER,fragment);
   program=gl.createProgram();if(!program)throw new Error('Could not allocate program');
   gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Program linking failed');
   gl.useProgram(program);
   buffer=gl.createBuffer();if(!buffer)throw new Error('Could not allocate buffer');
   gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
   const position=gl.getAttribLocation(program,'a_position');
   gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
   uniforms=Object.fromEntries(['resolution','open','color','time','tick','light'].map(key=>[key,gl.getUniformLocation(program,'u_'+key)]));
   ready=true;contextLost=false;lastTime=0;
   canvas.style.display='';canvas.dataset.renderer='webgl';
   document.body.classList.remove('ambient-fallback');
   resize();
  }catch(error){
   if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);
   console.warn('[ambient] WebGL initialization failed',error);fallback('initialization-failed');
  }finally{if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs)}
 }
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;fallback('context-lost')});
 canvas.addEventListener('webglcontextrestored',initialize);

 const cards=[...document.querySelectorAll('.work-card')], hero=document.querySelector('.header');
 const sections=[hero,...document.querySelectorAll('section')].filter(Boolean);
 const palettes=[[61,219,217],[202,242,86],[214,193,144],[138,175,230],[238,166,132],[123,199,158],[142,185,240]];
 const state={open:0,speed:1,r:61,g:219,b:217},target={...state};
 let w=0,h=0,raf=0,lastTime=0,clock=0,tickClock=0;
 function resize(){if(!ready||contextLost)return;w=Math.max(1,innerWidth);h=Math.max(1,innerHeight);const dpr=Math.min(devicePixelRatio||1,w<700?1:1.25);const scale=Math.min(1,Math.sqrt(1600000/(w*h*dpr*dpr)));canvas.width=Math.round(w*dpr*scale);canvas.height=Math.round(h*dpr*scale);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);update();}
 function schedule(){if(!raf&&ready&&!contextLost&&!reduce.matches&&!document.hidden)raf=requestAnimationFrame(frame);}
 function update(){
  const mid=h*.5;let nearest=0,best=Infinity;
  const depth=Math.max(0,scrollY)/Math.max(h,1);
  const opening=Math.min(1,depth/.9);
  target.open=opening*opening*(3.-2.*opening);
  target.speed=1.+Math.min(3.,depth*.45);

  sections.forEach((el,i)=>{const r=el.getBoundingClientRect(),dist=Math.abs(r.top+Math.min(r.height,h)*.5-mid);if(dist<best){best=dist;nearest=i}});
  let c=palettes[nearest%palettes.length];
  let card=null;
  const selected=document.querySelector('.work-card[data-selected="true"]');
  if(!card&&selected){const r=selected.getBoundingClientRect();if(r.top<h*.8&&r.bottom>h*.2)card=selected;}
  if(!card){let distance=h*.55;cards.forEach(el=>{const r=el.getBoundingClientRect(),d=Math.abs(r.top+r.height*.5-mid);if(r.bottom>0&&r.top<h&&d<distance){card=el;distance=d}})}
  if(card)c=palettes[(cards.indexOf(card)+1)%palettes.length];
  [target.r,target.g,target.b]=c;

  schedule();
 }
 function draw(){
  gl.uniform1f(uniforms.open,state.open);
  gl.uniform3f(uniforms.color,state.r/255,state.g/255,state.b/255);
  gl.uniform1f(uniforms.time,clock);
  gl.uniform1f(uniforms.tick,tickClock);
  gl.uniform1f(uniforms.light,lightTheme?1:0);
  gl.drawArrays(gl.TRIANGLES,0,3);
 }
 function frame(time){raf=0;if(!ready||contextLost||reduce.matches||document.hidden)return;const dt=Math.min(40,time-lastTime||16);lastTime=time;const ease=1-Math.exp(-dt/220);
  Object.keys(state).forEach(k=>{const delta=target[k]-state[k];state[k]+=delta*ease;});
  const advance=dt*state.speed*.0003;
  clock=(clock+advance)%(Math.PI*2);tickClock=(tickClock+advance*.08)%(Math.PI*2);
  draw();
  document.body.classList.add('webgl-active');
  schedule();
 }
 let scrollFrame=0;addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;update()})},{passive:true});
 addEventListener('resize',resize,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else {lastTime=0;update()}});
 reduce.addEventListener('change',()=>{if(reduce.matches){cancelAnimationFrame(raf);raf=0;document.body.classList.remove('webgl-active')}update()});
 new MutationObserver(()=>{lightTheme=document.documentElement.dataset.theme==='light';schedule()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 document.querySelector('.work-grid')?.addEventListener('projectchange',update);

 initialize();
})();

/* Anillo que acompaña al cursor. Solo con mouse; la flecha nativa queda. Repite
   la forma del aro del hero. pointer-events:none: nunca se come un clic. */
(()=>{
 if(!matchMedia('(hover: hover) and (pointer: fine)').matches||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const ring=document.createElement('div');ring.id='cursor-ring';ring.setAttribute('aria-hidden','true');
 const label=document.createElement('span');label.textContent=document.documentElement.lang==='en'?'drag':'arrastrar';ring.append(label);
 document.body.append(ring);
 let tx=0,ty=0,x=0,y=0,raf=0,lastHot=null;
 const loop=()=>{x+=(tx-x)*.2;y+=(ty-y)*.2;ring.style.transform=`translate3d(${x}px,${y}px,0)`;raf=Math.abs(tx-x)+Math.abs(ty-y)>.1?requestAnimationFrame(loop):0};
 addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse')return;
  tx=e.clientX;ty=e.clientY;
  if(!ring.classList.contains('on')){x=tx;y=ty;ring.classList.add('on')}
  const t=e.target.closest?e.target:null;
  ring.classList.toggle('drag',!!(t&&t.closest('.work-grid'))&&!(t&&t.closest('a,button')));
  const hot=t&&t.closest('a,button,summary,label,[role="button"]');
  ring.classList.toggle('hot',!!hot);
  // Sobre un boton relleno del mismo turquesa el anillo desaparece: ahi se invierte.
  if(hot!==lastHot){lastHot=hot;ring.classList.toggle('inv',!!hot&&getComputedStyle(hot).backgroundColor===getComputedStyle(ring,'::before').borderTopColor)}
  if(!raf)raf=requestAnimationFrame(loop);
 },{passive:true});
 document.documentElement.addEventListener('mouseleave',()=>ring.classList.remove('on'));
 addEventListener('pointerdown',()=>ring.classList.add('down'),{passive:true});
 addEventListener('pointerup',()=>ring.classList.remove('down'),{passive:true});
})();

/* Servicios: un solo escenario que se reacomoda segun el servicio. Los nombres y
   descripciones viven en el HTML (indexables); esto dibuja y cambia el estado.
   Desktop: hover previsualiza, clic selecciona. Mobile: el que cruza el medio de
   la pantalla al scrollear queda activo. */
(()=>{
 const sx=document.getElementById('sx'),stage=document.getElementById('sx-stage');
 if(!sx||!stage)return;
 const en=document.documentElement.lang==='en';
 const items=[...sx.querySelectorAll('.sx-item')],keys=items.map(i=>i.dataset.sx);
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),narrow=matchMedia('(max-width: 899px)');
 const host=en?'yourbusiness.com':'tunegocio.com';
 const URLS={web:host,ecommerce:host+(en?'/shop':'/tienda'),custom:host+'/panel',events:host+(en?'/door':'/puerta')};
 const live='<i class="sx-live"></i>';
 const T=en?{start:'Get started',cart:'Cart · 2',price:'$ 48,900',add:'Add to cart',pay:'Payment<b>Approved ✓</b>',live:live+'Live',sales:'Sales<b>$ 1.2M</b>',res:'Bookings<b>84</b>',bar:'Bar<b>+12%</b>',door:'Door 1',ticket:'Invite · VIP',ok:'Access OK ✓',inside:'Checked in<b>312 / 400</b>'}
  :{start:'Empezar',cart:'Carrito · 2',price:'$ 48.900',add:'Agregar al carrito',pay:'Pago<b>Aprobado ✓</b>',live:live+'En vivo',sales:'Ventas<b>$ 1,2M</b>',res:'Reservas<b>84</b>',bar:'Barra<b>+12%</b>',door:'Puerta 1',ticket:'Invitación · VIP',ok:'Acceso OK ✓',inside:'Ingresaron<b>312 / 400</b>'};
 const H=(x,y)=>[x,y,0,0,'0'];
 // [x, y, ancho, alto, estilo, etiqueta] en % del cuerpo de la ventana. El mismo
 // indice es el mismo bloque en los cuatro estados: por eso se transforma.
 const L={
  web:[[4,6,10,5,'a'],[58,8,9,2.4,'l'],[70,8,9,2.4,'l'],[83,5,13,8,'b'],[4,22,58,8,'h'],[4,33,40,8,'h'],[4,47,50,2.6,'l'],[4,53,38,2.6,'l'],[4,62,20,9,'a',T.start],[68,22,28,49,'f'],[4,78,29,17,'b'],[35.5,78,29,17,'b'],[67,78,29,17,'b'],[7,85,16,2.4,'l'],[38.5,85,16,2.4,'l'],[70,85,16,2.4,'l'],H(82,46),H(82,60)],
  ecommerce:[[4,6,10,5,'a'],[52,8,9,2.4,'l'],[64,8,9,2.4,'l'],[78,4.5,18,9,'b',T.cart],[54,19,36,6,'h'],[54,29,30,8,'T',T.price],[54,42,40,2.6,'l'],[54,48,30,2.6,'l'],[54,57,42,10,'a',T.add],[4,18,44,60,'f'],[4,82,13,13,'b'],[19,82,13,13,'b'],[54,73,42,22,'b',T.pay],[34,82,14,13,'b'],[57,88,18,2.4,'l'],H(80,88),H(26,48),H(82,60)],
  custom:[[4,6,10,5,'a'],[52,8,9,2.4,'l'],[64,8,9,2.4,'l'],[78,4.5,18,9,'b',T.live],[4,17,17,78,'b'],[6.5,23,12,5,'f'],[6.5,32,10,2.4,'l'],[6.5,38,12,2.4,'l'],[24,17,23,22,'b',T.sales],[49,17,23,22,'b',T.res],[74,17,22,22,'f',T.bar],[24,43,48,52,'b chart'],[74,43,22,52,'b'],[76.5,50,17,2.4,'l'],[76.5,57,12,2.4,'l'],[76.5,64,15,2.4,'l'],[6.5,44,9,2.4,'l'],[76.5,71,10,2.4,'l']],
  events:[[4,6,10,5,'a'],[52,8,9,2.4,'l'],[64,8,9,2.4,'l'],[78,4.5,18,9,'b',T.door],[6,17,50,78,'b'],[6,17,50,15,'f',T.ticket],[10,38,30,4,'h'],[10,46,20,2.4,'l'],[10,55,24,35,'b qr'],[62,17,34,24,'a',T.ok],[62,45,34,22,'b',T.inside],[62,71,34,24,'b'],[38,58,14,2.4,'l'],[65,78,22,2.4,'l'],[65,84,16,2.4,'l'],[65,90,20,2.4,'l'],[38,64,10,2.4,'l'],H(80,60)]
 };

 // QR de mentira, determinista: tres marcas de esquina y el resto pseudoaleatorio.
 const qr=(()=>{let s=7,r='';const N=21,fin=(x,y)=>[[0,0],[14,0],[0,14]].some(([a,b])=>x>=a&&x<a+7&&y>=b&&y<b+7);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){let on;
   if(fin(x,y)){const a=x<7?x:x-14,b=y<7?y:y-14;on=a===0||a===6||b===0||b===6||(a>1&&a<5&&b>1&&b<5)}
   else{s=(s*9301+49297)%233280;on=s/233280>.52}
   if(on)r+=`<rect x="${x}" y="${y}" width="1" height="1"/>`}
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}">${r}</svg>`)}")`})();

 stage.innerHTML='<div class="sx-win sx-init"><div class="sx-bar"><i></i><i></i><i></i><span class="sx-url"></span><span class="sx-cap"></span></div><div class="sx-body"></div></div>';
 const win=stage.firstChild,url=win.querySelector('.sx-url'),cap=win.querySelector('.sx-cap'),body=win.querySelector('.sx-body');
 const atoms=Array.from({length:18},(_,i)=>{const a=document.createElement('div');a.className='sx-a';a.style.setProperty('--d',i*22+'ms');a.append(document.createElement('span'));body.append(a);return a});
 atoms[11].insertAdjacentHTML('beforeend','<div class="sx-chart">'+[38,55,44,68,52,76,61,90].map((v,n)=>`<i style="--v:${v}%;--n:${n}"></i>`).join('')+'</div>');
 const q=document.createElement('div');q.className='sx-qr';q.style.setProperty('--qr',qr);atoms[8].append(q);

 let shown=-1,selected=0,tick=0;
 const show=i=>{
  if(i===shown)return;shown=i;const k=keys[i],t=++tick;
  L[k].forEach(([x,y,w,h,st,lab],n)=>{const a=atoms[n],sp=a.firstChild;
   a.style.setProperty('--x',x+'%');a.style.setProperty('--y',y+'%');a.style.setProperty('--w',w+'%');a.style.setProperty('--h',h+'%');
   const [kind,...extra]=st.split(' ');a.className='sx-a k-'+kind+(extra.length?' '+extra.join(' '):'');
   lab=lab||'';if(sp.dataset.l===lab)return;sp.dataset.l=lab;sp.style.opacity=0;
   setTimeout(()=>{if(t!==tick)return;sp.innerHTML=lab;sp.style.opacity=1},reduce.matches||win.classList.contains('sx-init')?0:280)});
  url.style.opacity=0;setTimeout(()=>{if(t!==tick)return;url.textContent=URLS[k];url.style.opacity=1},reduce.matches?0:200);
  // En mobile el escenario fijo tapa el titulo que pasa por debajo: lo repite.
  cap.textContent=items[i].querySelector('.sx-idx').textContent+' · '+items[i].querySelector('.sx-name').textContent;
 };
 const select=i=>{selected=i;items.forEach((it,n)=>{it.classList.toggle('is-on',n===i);if(!narrow.matches)it.querySelector('.sx-btn').setAttribute('aria-expanded',n===i)});show(i)};
 const syncAria=()=>items.forEach((it,n)=>it.querySelector('.sx-btn').setAttribute('aria-expanded',narrow.matches||n===selected));
 show(0);requestAnimationFrame(()=>requestAnimationFrame(()=>win.classList.remove('sx-init')));
 syncAria();narrow.addEventListener?.('change',syncAria);

 items.forEach((it,i)=>{const b=it.querySelector('.sx-btn');
  b.addEventListener('click',()=>select(i));
  b.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse'||narrow.matches)return;items.forEach(o=>o.classList.toggle('is-prev',o===it));show(i)});
 });
 sx.querySelector('.sx-list').addEventListener('pointerleave',()=>{items.forEach(o=>o.classList.remove('is-prev'));if(!narrow.matches)show(selected)});

 // Mobile: activa el servicio que cruza la franja de abajo del escenario fijo.
 if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>{if(!narrow.matches)return;es.forEach(e=>{if(e.isIntersecting)select(items.indexOf(e.target))})},{rootMargin:'-55% 0px -40% 0px'});
  items.forEach(it=>io.observe(it));
 }

 // Profundidad: la ventana se inclina apenas hacia el mouse. Solo mouse fino.
 if(matchMedia('(hover: hover) and (pointer: fine)').matches&&!reduce.matches){
  let tx=0,ty=0,x=0,y=0,raf=0;
  const loop=()=>{x+=(tx-x)*.08;y+=(ty-y)*.08;win.style.setProperty('--ry',(x*5).toFixed(2)+'deg');win.style.setProperty('--rx',(-y*4).toFixed(2)+'deg');raf=Math.abs(tx-x)+Math.abs(ty-y)>.002?requestAnimationFrame(loop):0};
  sx.addEventListener('pointermove',e=>{if(narrow.matches)return;const r=stage.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/r.width*2));ty=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/r.height*2));if(!raf)raf=requestAnimationFrame(loop)});
  sx.addEventListener('pointerleave',()=>{tx=ty=0;if(!raf)raf=requestAnimationFrame(loop)});
 }
})();
