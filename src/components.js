/* Shared semantic controls. All icons reference SVG files exported from the supplied kit. */
(() => {
 const A=FIGMA.assets;
 function el(tag,cls='',text=''){const e=document.createElement(tag);e.className=cls;if(text)e.textContent=text;return e;}
 function icon(id,cls=''){const a=A[id];if(!a)throw new Error(`Missing SVG ${id}`);const im=el('img',`icon ${cls}`);im.src=a.src;im.alt='';im.width=a.width+2*a.pad;im.height=a.height+2*a.pad;im.draggable=false;return im;}
 function button(label,cls,click){const b=el('button',cls,label);b.type='button';if(click)b.addEventListener('click',click);return b;}
 function label(text,required=false,optional=false){const l=el('label','field-label');l.append(document.createTextNode(text));if(required)l.append(icon('I551:21710;540:12253','required-mark'));if(optional)l.append(el('span','optional','необязательно'));return l;}
 function field(key,title,required=false,optional=false){const wrap=el('div','field');wrap.dataset.field=key;const l=label(title,required,optional);l.htmlFor=`input-${key}`;wrap.append(l);const error=el('p','field-error');error.id=`error-${key}`;error.hidden=true;wrap.append(error);return {wrap,label:l,error,insert:control=>{control.id=`input-${key}`;control.setAttribute('aria-describedby',error.id);wrap.insertBefore(control,error);return control;}};}
 function textField(key,title,value,onInput,multiline=false,required=false,placeholder=''){
  const f=field(key,title,required,!required),input=el(multiline?'textarea':'input','text-input');input.value=value;input.placeholder=placeholder;input.name=key;input.required=required;input.maxLength=multiline?5000:100;input.autocomplete='off';if(multiline)input.rows=1;
  f.insert(input);const grow=()=>{if(multiline){input.style.height='0';input.style.height=`${Math.max(45,input.scrollHeight+2)}px`;}};
  input.addEventListener('input',()=>{grow();onInput(input.value);});input.addEventListener('blur',()=>f.wrap.dispatchEvent(new CustomEvent('fieldblur',{bubbles:true,detail:key})));
  f.grow=grow;f.input=input;return f;
 }
 function segments(title,options,value,onChange,required=false){
  const wrap=el('div','segment-field');if(title)wrap.append(label(title,required));const group=el('div','segments');group.setAttribute('role','radiogroup');group.setAttribute('aria-label',title||'Период подписки');wrap.append(group);
  const items=options.map(([v,t])=>{const b=button(t,'segment',()=>{set(v);onChange(v);});b.setAttribute('role','radio');b.dataset.value=v;group.append(b);return b;});
  function set(v){items.forEach((b,i)=>{const selected=String(v)===b.dataset.value;b.setAttribute('aria-checked',String(selected));b.tabIndex=selected||(v===null&&i===0)?0:-1;});}
  items.forEach((b,i)=>b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const index=e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowRight'?1:items.length-1))%items.length;items[index].click();items[index].focus();}}));set(value);return {wrap,group,set};
 }
 function select(key,title,options,value,onChange){
  const f=field(key,title,true);const trigger=button('','select-trigger',()=>setOpen(!open));trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');const selectedText=el('span','select-value',value===null?'Выберите '+(key==='category'?'категорию':'аккаунт'):options[value][0]);selectedText.classList.toggle('placeholder',value===null);const arrow=icon('540:12384','select-arrow');trigger.append(selectedText,arrow);f.insert(trigger);
  const list=el('div','select-list');list.id=`list-${key}`;list.setAttribute('role','listbox');list.setAttribute('aria-label',title);list.hidden=true;trigger.setAttribute('aria-controls',list.id);f.wrap.insertBefore(list,f.error);let open=false,selected=value;
  const rows=options.map(([title,detail],index)=>{const row=button('','select-option',()=>{selected=index;selectedText.textContent=title;selectedText.classList.remove('placeholder');setSelected();setOpen(false);onChange(index);trigger.focus();});row.setAttribute('role','option');row.append(el('span','option-title',title));if(detail)row.append(el('span','option-detail',detail));list.append(row);return row;});
  function setSelected(){rows.forEach((r,i)=>r.setAttribute('aria-selected',String(i===selected)));}
  function setOpen(next){open=next;list.hidden=!open;trigger.setAttribute('aria-expanded',String(open));arrow.src=A[open?'540:12383':'540:12384'].src;f.wrap.dispatchEvent(new CustomEvent('disclosure',{bubbles:true,detail:{key,open}}));}
  trigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);rows[selected??0].focus();}});
  rows.forEach((r,i)=>r.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();rows[e.key==='Home'?0:e.key==='End'?rows.length-1:(i+(e.key==='ArrowDown'?1:rows.length-1))%rows.length].focus();}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setOpen(false);trigger.focus();}}));
  setSelected();return {...f,trigger,close:()=>setOpen(false),get open(){return open;}};
 }
 /** Editable account selector. The same original Figma chevron is used as in Category.
  * The dropdown stays in normal document flow and never floats over the next section.
  */
 function accountCombobox(key,title,options,value,onChange){
  const f=field(key,title,true);
  const control=el('div','account-control select-trigger');
  const input=el('input','account-input');
  input.id=`input-${key}`;input.name=key;input.type='text';input.autocomplete='off';input.spellcheck=false;input.maxLength=160;input.placeholder='Выберите аккаунт или начните вводить';input.required=true;
  input.value=value===null?'':options[value][0];input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-haspopup','listbox');input.setAttribute('aria-expanded','false');input.setAttribute('aria-describedby',f.error.id);
  const toggle=button('','account-toggle',()=>{if(open && showAll){setOpen(false);}else{setOpen(true,true);input.focus({preventScroll:true});}});
  toggle.setAttribute('aria-label','Показать все аккаунты');toggle.setAttribute('aria-haspopup','listbox');toggle.setAttribute('aria-expanded','false');toggle.append(icon('540:12384','select-arrow'));
  control.append(input,toggle);f.wrap.insertBefore(control,f.error);
  const list=el('div','select-list account-list');list.id=`list-${key}`;list.setAttribute('role','listbox');list.setAttribute('aria-label',title);list.hidden=true;f.wrap.insertBefore(list,f.error);
  input.setAttribute('aria-controls',list.id);toggle.setAttribute('aria-controls',list.id);
  let open=false,showAll=false,selected=value,active=-1;
  const rows=options.map(([name,detail,subscribed],index)=>{
   const row=button('','select-option account-option',()=>choose(index));row.type='button';row.id=`option-${key}-${index}`;row.setAttribute('role','option');row.setAttribute('aria-selected',String(value===index));row.tabIndex=-1;
   row.append(el('span','option-title',name));
   if(detail)row.append(el('span',subscribed?'option-detail has-subscriptions':'option-detail',detail));
   list.append(row);return row;
  });
  const empty=el('p','account-no-results','Совпадений не найдено');empty.hidden=true;list.append(empty);
  function setActive(index){active=index;rows.forEach((row,i)=>row.classList.toggle('is-active',i===index));if(index<0)input.removeAttribute('aria-activedescendant');else{input.setAttribute('aria-activedescendant',rows[index].id);rows[index].scrollIntoView({block:'nearest'});}}
  function filter(){
   const q=input.value.toLocaleLowerCase('ru').trim();let count=0;
   rows.forEach((row,i)=>{const visible=showAll||!q||options[i][0].toLocaleLowerCase('ru').includes(q);row.hidden=!visible;if(visible)count++;});
   empty.hidden=count!==0;
   if(active>=0&&rows[active].hidden)setActive(-1);
   return count;
  }
  function setOpen(next,all=false){
   open=next;showAll=all;list.hidden=!next;control.classList.toggle('is-open',next);control.setAttribute('aria-expanded',String(next));input.setAttribute('aria-expanded',String(next));toggle.setAttribute('aria-expanded',String(next));toggle.setAttribute('aria-label',next?'Скрыть список аккаунтов':'Показать все аккаунты');
   toggle.querySelector('img').src=A[next?'540:12383':'540:12384'].src;
   if(next)filter();else setActive(-1);
   f.wrap.dispatchEvent(new CustomEvent('disclosure',{bubbles:true,detail:{key,open}}));
  }
  function choose(index,restoreFocus=true){
   selected=index;input.value=options[index][0];rows.forEach((row,i)=>row.setAttribute('aria-selected',String(i===index)));
   setOpen(false);onChange(index);if(restoreFocus)input.focus({preventScroll:true});
  }
  input.addEventListener('input',()=>{
   selected=null;rows.forEach(row=>row.setAttribute('aria-selected','false'));onChange(null);setActive(-1);setOpen(true,false);
  });
  input.addEventListener('focus',()=>{control.classList.add('is-focused');if(!open&&!input.value.trim())setOpen(true,true);});
  input.addEventListener('blur',()=>{
   control.classList.remove('is-focused');
   // A typed full name is a valid choice too; partial/unknown names require explicit selection.
   const exact=options.findIndex(option=>option[0].toLocaleLowerCase('ru')===input.value.trim().toLocaleLowerCase('ru'));
   if(exact>=0&&exact!==selected)choose(exact,false);
   f.wrap.dispatchEvent(new CustomEvent('fieldblur',{bubbles:true,detail:key}));
  });
  input.addEventListener('keydown',event=>{
   if(event.key==='ArrowDown'||event.key==='ArrowUp'){
    event.preventDefault();if(!open)setOpen(true,false);
    const available=rows.map((row,i)=>!row.hidden?i:-1).filter(i=>i>=0);
    if(!available.length)return;
    const current=available.indexOf(active);
    const next=event.key==='ArrowDown'?available[(current+1)%available.length]:available[current<0?available.length-1:(current+available.length-1)%available.length];
    setActive(next);return;
   }
   if(event.key==='Enter'&&open){event.preventDefault();if(active>=0&&!rows[active].hidden)choose(active);else{const only=rows.map((row,i)=>!row.hidden?i:-1).filter(i=>i>=0);if(only.length===1)choose(only[0]);}}
   if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();setOpen(false);}
   if(event.key==='Tab'&&open)setOpen(false);
  });
  list.addEventListener('mousedown',event=>{if(event.target.closest('.account-option'))event.preventDefault();});
  rows.forEach((row,i)=>{
   row.addEventListener('mouseenter',()=>{if(open)setActive(i);});
   row.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);input.focus();}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();input.focus();const visible=rows.map((r,j)=>!r.hidden?j:-1).filter(j=>j>=0),pos=visible.indexOf(i);setActive(visible[(pos+(event.key==='ArrowDown'?1:visible.length-1))%visible.length]);}
   });
  });
  return {...f,input,trigger:toggle,close:()=>setOpen(false),get open(){return open;}};
 }
 function stepper(key,title,value,onChange,placeholder=''){
  const f=field(key,title,true),box=el('div','stepper'),input=el('input','stepper-input');input.type='number';input.name=key;input.min=1;input.max=999;input.step=1;input.value=value;input.placeholder=placeholder;input.id=`input-${key}`;input.required=true;input.setAttribute('aria-label',title);input.setAttribute('aria-describedby',f.error.id);
  const minus=button('','icon-button',()=>step(-1)),plus=button('','icon-button',()=>step(1));minus.setAttribute('aria-label',`Уменьшить ${title.toLowerCase()}`);plus.setAttribute('aria-label',`Увеличить ${title.toLowerCase()}`);minus.append(icon('551:23046'));plus.append(icon('551:23050'));
  function sync(){minus.disabled=!input.value||Number(input.value)<=1;plus.disabled=Number(input.value)>=999;}
  function step(delta){input.value=String(Math.max(1,Math.min(999,(Number(input.value)||0)+delta)));sync();onChange(input.value);}
  input.addEventListener('input',()=>{sync();onChange(input.value);});input.addEventListener('blur',()=>f.wrap.dispatchEvent(new CustomEvent('fieldblur',{bubbles:true,detail:key})));box.append(minus,input,plus);f.wrap.insertBefore(box,f.error);sync();return {...f,input};
 }
 function calendar(value,onChange){
  const wrap=el('div','calendar');wrap.setAttribute('role','group');wrap.setAttribute('aria-label','Календарь начала подписки');let month=new Date(value+'T12:00:00Z'),selected=value;
  function draw(){wrap.replaceChildren();const y=month.getUTCFullYear(),m=month.getUTCMonth(),nav=el('div','calendar-nav'),title=el('span','calendar-title');const name=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric',timeZone:'UTC'}).format(month).replace(' г.','');title.textContent=name[0].toUpperCase()+name.slice(1);
   const trialStart=Pricing.addDays(selected,-3),trialEnd=Pricing.addDays(selected,-1);
   const prev=button('','icon-button',()=>{month=new Date(Date.UTC(y,m-1,1,12));draw();wrap.querySelector('[aria-label="Предыдущий месяц"]').focus();});prev.setAttribute('aria-label','Предыдущий месяц');prev.append(icon('551:21505'));
   const next=button('','icon-button',()=>{month=new Date(Date.UTC(y,m+1,1,12));draw();wrap.querySelector('[aria-label="Следующий месяц"]').focus();});next.setAttribute('aria-label','Следующий месяц');next.append(icon('551:21509'));nav.append(prev,title,next);wrap.append(nav);
   const grid=el('div','calendar-grid');['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach(day=>grid.append(el('span','weekday',day)));
   const offset=(new Date(Date.UTC(y,m,1)).getUTCDay()+6)%7,days=new Date(Date.UTC(y,m+1,0)).getUTCDate();
   for(let i=0;i<42;i++){const d=i-offset+1;if(d<1||d>days){grid.append(el('span','empty-day'));continue;}const iso=Pricing.iso(new Date(Date.UTC(y,m,d,12))),b=button(String(d),'calendar-day',()=>{selected=iso;onChange(iso);draw();});b.dataset.date=iso;b.setAttribute('aria-label',`${d} ${name}`);b.setAttribute('aria-pressed',String(iso===selected));if(iso===Pricing.today())b.setAttribute('aria-current','date');if(iso>=trialStart&&iso<selected)b.classList.add('trial-day');grid.append(b);}
   wrap.append(grid,el('p','calendar-trial',`Триал: ${Pricing.formatDate(trialStart)} — ${Pricing.formatDate(trialEnd)}`));
  }
  draw();return wrap;
 }
 window.UI={el,icon,button,label,field,textField,segments,select,accountCombobox,stepper,calendar};
})();
