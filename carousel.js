(()=>{
 const track=document.querySelector('.work-grid');if(!track)return;
 const cards=[...track.querySelectorAll('.work-card')];if(!cards.length)return;
 const en=document.documentElement.lang==='en',reduce=matchMedia('(prefers-reduced-motion: reduce)');
 track.setAttribute('role','region');track.setAttribute('aria-roledescription',en?'carousel':'carrusel');track.setAttribute('aria-label',en?'Selected projects':'Proyectos seleccionados');track.tabIndex=0;
 cards.forEach(card=>{const surface=document.createElement('span');surface.className='orbital-surface';while(card.firstChild)surface.append(card.firstChild);card.append(surface);card.draggable=false;card.querySelectorAll('img').forEach(img=>img.draggable=false)});
 let index=-1,frame=0,drag=null,suppress=false;
 const section=track.closest('section'),stage=document.createElement('div');stage.className='showcase-stage';
 while(section.firstChild)stage.append(section.firstChild);section.append(stage);
 let pinned=false,travel=0,scrollFrame=0;
 const start=()=>section.getBoundingClientRect().top+scrollY-76;
 function syncScroll(){scrollFrame=0;if(!pinned||drag)return;const progress=Math.max(0,Math.min(1,(scrollY-start())/travel));track.scrollLeft=progress*(track.scrollWidth-track.clientWidth);update();}
 function layout(){pinned=!reduce.matches&&innerHeight>=400;travel=(cards.length-1)*Math.max(300,Math.min(550,innerHeight*.6));section.classList.toggle('scroll-showcase',pinned);section.style.setProperty('--showcase-travel',travel+'px');syncScroll();update();}
 addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(syncScroll)},{passive:true});
 const center=card=>card.offsetLeft+card.offsetWidth/2-track.clientWidth/2;
 function update(){frame=0;let selected=0,distance=Infinity;
 cards.forEach((card,i)=>{const delta=(center(card)-track.scrollLeft)/track.clientWidth,d=Math.abs(delta);if(d<distance){distance=d;selected=i}});
 track.dispatchEvent(new CustomEvent('projectmotion',{detail:{progress:track.scrollLeft/Math.max(1,track.scrollWidth-track.clientWidth)}}));
 if(selected===index)return;index=selected;cards.forEach((c,i)=>c.dataset.selected=String(i===index));track.dispatchEvent(new CustomEvent('projectchange'));}
 function go(i){i=Math.max(0,Math.min(cards.length-1,i));if(pinned){const fraction=Math.max(0,Math.min(1,center(cards[i])/Math.max(1,track.scrollWidth-track.clientWidth)));window.scrollTo({top:start()+fraction*travel,behavior:'smooth'});}else track.scrollTo({left:center(cards[i]),behavior:reduce.matches?'instant':'smooth'});}
 track.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(index+(e.key==='ArrowRight'?1:-1))}else if(e.key==='Home'||e.key==='End'){e.preventDefault();go(e.key==='Home'?0:cards.length-1)}});
 track.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;drag={x:e.clientX,left:track.scrollLeft,id:e.pointerId,moved:false};suppress=false});
 track.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>5&&!drag.moved){drag.moved=true;track.setPointerCapture(e.pointerId);track.classList.add('dragging')}if(drag.moved){e.preventDefault();track.scrollLeft=drag.left-dx}});
 function release(){if(!drag)return;const moved=drag.moved;drag=null;track.classList.remove('dragging');if(moved){suppress=true;update();go(index)}}
 track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);track.addEventListener('lostpointercapture',release);
 track.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopPropagation();suppress=false}},true);
 track.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update)},{passive:true});
 addEventListener('resize',layout);reduce.addEventListener('change',layout);
 new IntersectionObserver(([e])=>document.body.classList.toggle('showcase-active',e.isIntersecting),{threshold:.2}).observe(track);
 layout();
})();
