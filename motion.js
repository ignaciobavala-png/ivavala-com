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
