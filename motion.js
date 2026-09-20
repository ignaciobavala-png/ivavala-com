/* Single-pass GPU ambient surface. No geometry rebuilding or canvas paths per frame. */
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const canvas=document.createElement('canvas');canvas.id='reactive-light';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
 if(!gl){canvas.remove();document.body.classList.add('ambient-fallback');return;}
 const vertex=`attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.,1.);}`;
 const fragment=`
 precision mediump float;
 uniform vec2 u_resolution;
 uniform float u_open;
 uniform vec3 u_color;
 uniform float u_time;

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
  float ticks=step(.93,.5+.5*cos((angle-t*.08)*96.));
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
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null;}return s;}
 const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
 if(!vs||!fs){canvas.remove();document.body.classList.add('ambient-fallback');return;}
 const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS)){canvas.remove();document.body.classList.add('ambient-fallback');return;}
 gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
 const position=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 const uniforms=Object.fromEntries(['resolution','open','color','time','light'].map(key=>[key,gl.getUniformLocation(program,'u_'+key)]));
 let contextLost=false,lightTheme=document.documentElement.dataset.theme==='light';
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;cancelAnimationFrame(raf);raf=0;canvas.style.display='none';document.body.classList.add('ambient-fallback')});
 canvas.dataset.renderer='webgl';

 const cards=[...document.querySelectorAll('.work-card')], hero=document.querySelector('.header');
 const sections=[hero,...document.querySelectorAll('section')].filter(Boolean);
 const palettes=[[61,219,217],[202,242,86],[214,193,144],[138,175,230],[238,166,132],[123,199,158],[142,185,240]];
 const state={open:0,speed:1,r:61,g:219,b:217},target={...state};
 let w=0,h=0,raf=0,lastTime=0,clock=0;
 function resize(){w=innerWidth;h=innerHeight;const dpr=Math.min(devicePixelRatio||1,w<700?1:1.25);const scale=Math.min(1,Math.sqrt(1600000/(w*h*dpr*dpr)));canvas.width=Math.round(w*dpr*scale);canvas.height=Math.round(h*dpr*scale);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);update();}
 function schedule(){if(!raf&&!contextLost&&!reduce.matches&&!document.hidden)raf=requestAnimationFrame(frame);}
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
  gl.uniform1f(uniforms.time,clock*.0003);
  gl.uniform1f(uniforms.light,lightTheme?1:0);
  gl.drawArrays(gl.TRIANGLES,0,3);
 }
 function frame(time){raf=0;const dt=Math.min(40,time-lastTime||16);lastTime=time;const ease=1-Math.exp(-dt/220);
  Object.keys(state).forEach(k=>{const delta=target[k]-state[k];state[k]+=delta*ease;});
  clock+=dt*state.speed;
  draw();
  schedule();
 }
 let scrollFrame=0;addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;update()})},{passive:true});
 addEventListener('resize',resize,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else {lastTime=0;update()}});
 reduce.addEventListener('change',()=>{if(reduce.matches){cancelAnimationFrame(raf);raf=0;gl.clear(gl.COLOR_BUFFER_BIT)}update()});
 new MutationObserver(()=>{lightTheme=document.documentElement.dataset.theme==='light';schedule()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 document.querySelector('.work-grid')?.addEventListener('projectchange',update);

 resize();
})();
