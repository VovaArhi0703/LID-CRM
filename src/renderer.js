/* Figma primitives shared by screens and all component states. No icon library. */
(() => {
 const rgba=(c,a=1)=>`rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},${(c.a??1)*a})`;
 const paints=n=>(n||[]).filter(p=>p.visible!==false);
 const clone=n=>JSON.parse(JSON.stringify(n));
 function background(p){
  if(p.type==='SOLID')return rgba(p.color,p.opacity??1);
  if(p.type==='IMAGE')return 'url("assets/avatar.jpg") center / cover no-repeat';
  const stops=p.gradientStops?.map(s=>`${rgba(s.color,p.opacity??1)} ${s.position*100}%`).join(',');
  const m=p.gradientTransform;
  if(p.type==='GRADIENT_LINEAR'){
   const angle=m?Math.atan2(m[0][0],-m[0][1])*180/Math.PI:180;
   return `linear-gradient(${angle}deg,${stops})`;
  }
  if(p.type==='GRADIENT_ANGULAR')return `conic-gradient(from 90deg,${stops})`;
  return `radial-gradient(ellipse,${stops})`;
 }
 function appearance(el,n){
  const s=el.style, fills=paints(n.fills),strokes=paints(n.strokes);
  s.background=fills.map(background).reverse().map((x,i)=>x.startsWith('rgb')&&fills.length>1?`linear-gradient(${x},${x})`:x).join(',');
  s.borderRadius=n.type==='ELLIPSE'?'50%':`${n.topLeftRadius??n.cornerRadius??0}px ${n.topRightRadius??n.cornerRadius??0}px ${n.bottomRightRadius??n.cornerRadius??0}px ${n.bottomLeftRadius??n.cornerRadius??0}px`;
  s.opacity=n.opacity??1;
  const shadows=[];
  if(strokes[0]?.type==='SOLID')shadows.push(`inset 0 0 0 ${n.strokeWeight}px ${rgba(strokes[0].color,strokes[0].opacity??1)}`);
  for(const e of n.effects||[]){
   if(e.visible===false)continue;
   if(e.type==='DROP_SHADOW'||e.type==='INNER_SHADOW')shadows.push(`${e.type==='INNER_SHADOW'?'inset ':''}${e.offset.x}px ${e.offset.y}px ${e.radius}px ${e.spread||0}px ${rgba(e.color)}`);
   if(e.type==='BACKGROUND_BLUR')s.backdropFilter=`blur(${e.radius}px)`;
   if(e.type==='LAYER_BLUR')s.filter=`blur(${e.radius}px)`;
  }
  s.boxShadow=shadows.join(',');
  if(n.clipsContent)s.overflow='hidden';
 }
 function textStyle(el,n){
  const s=el.style, font=n.fontName||{};
  s.fontFamily=`"${font.family||'Manrope'}",sans-serif`;
  s.fontWeight=font.variationSettings?.wght||({Light:300,Medium:500,SemiBold:600,Bold:700,ExtraBold:800}[font.style])||400;
  s.fontSize=`${n.fontSize}px`;
  s.lineHeight=n.lineHeight?.unit==='PIXELS'?`${n.lineHeight.value}px`:n.lineHeight?.unit==='PERCENT'?`${n.lineHeight.value/100}`:'normal';
  s.letterSpacing=n.letterSpacing?.unit==='PERCENT'?`${n.letterSpacing.value/100}em`:`${n.letterSpacing?.value||0}px`;
  s.textAlign=(n.textAlignHorizontal||'LEFT').toLowerCase();
  const p=paints(n.fills)[0];if(p?.color)s.color=rgba(p.color,p.opacity??1);
 }
 function render(n,root=false){
  const el=document.createElement('div');el.className='node';el.dataset.node=n.id;el.dataset.name=n.name;el._figma=n;
  if(n.visible===false)el.hidden=true;
  if(n.type==='GROUP'){
   el.classList.add('figma-group');el.style.display=n.visible===false?'none':'contents';
   for(const c of n.children||[])el.append(render(c));return el;
  }
  const s=el.style;s.width=`${n.width}px`;s.height=`${n.height}px`;
  if(!root){
   const m=n.relativeTransform||[[1,0,n.x],[0,1,n.y]];
   s.left=`${m[0][2]}px`;s.top=`${m[1][2]}px`;
   if(m[0][0]!==1||m[1][1]!==1||m[0][1]||m[1][0])s.transform=`matrix(${m[0][0]},${m[1][0]},${m[0][1]},${m[1][1]},0,0)`;
  }else{el.classList.add('root-node');}
  if(n.asset){
   const im=document.createElement('img');im.src=n.asset.src;im.alt='';im.draggable=false;im.style.cssText=`position:absolute;left:${-n.asset.pad}px;top:${-n.asset.pad}px;width:${n.width+2*n.asset.pad}px;height:${n.height+2*n.asset.pad}px;max-width:none;`;el.append(im);el.classList.add('asset-node');return el;
  }
  if(n.type==='TEXT'){
   el.classList.add('text-node');textStyle(el,n);
   if(n.segments?.length>1)for(const seg of n.segments){const sp=document.createElement('span');textStyle(sp,seg);sp.textContent=seg.characters;el.append(sp);}
   else el.textContent=n.characters;
   return el;
  }
  appearance(el,n);
  for(const c of n.children||[])el.append(render(c));
  return el;
 }
 function find(root,id){return root.dataset?.node===id?root:root.querySelector(`[data-node="${id}"]`);}
 function named(root,name){return [...root.querySelectorAll('[data-name]')].find(e=>e.dataset.name===name);}
 function text(root,value){return [...root.querySelectorAll('.text-node')].find(e=>e.textContent===value);}
 function action(el,label,fn,role='button'){
  if(!el)return;el.classList.add('interactive');el.tabIndex=0;el.setAttribute('role',role);el.setAttribute('aria-label',label);
  el.addEventListener('click',e=>{e.stopPropagation();fn(e);});
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();fn(e);}});
 }
 window.Design={render,appearance,textStyle,find,named,text,action,clone,rgba,paints};
})();
