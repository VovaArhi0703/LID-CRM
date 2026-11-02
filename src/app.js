(() => {
 const {el,icon,button,label,field,textField,segments,select,accountCombobox,stepper,calendar}=UI;
 const P=Pricing,C=FIGMA.components,app=document.getElementById('app');
 const periodOptions=[[1,'1 мес.'],[6,'6 мес. −5%'],[12,'12 + 1 мес. −10%']];
 const categories=['Софт / CRM для продаж','Обучение команды','Автоматизация процессов','Аналитика продаж'];
 const accounts=P.ACCOUNTS.map(({name,subscriptions})=>[name,P.subscriptionLabel(subscriptions),subscriptions>0]);
 const plans=[
  {id:'standard',name:'Стандарт',tag:'Начните с главного',description:'Контакты и сделки под контролем с первого дня.',features:['Контакты и история общения','До 3 воронок продаж','Базовые отчёты по сделкам','Задачи и напоминания'],special:['Обещания в деле','Кто ждёт кого']},
  {id:'plus',name:'Плюс',tag:'Уверенность в решениях',description:'Больше автоматизации — меньше рутины для менеджеров.',features:['Всё из тарифа «Стандарт»','Неограниченные воронки','Роботы и автоматизация задач','Аналитика продаж и KPI'],special:['Передача без потерь','Радар рисков'],badge:'Самый популярный'},
  {id:'premium',name:'Премиум',tag:'Управляйте масштабом',description:'Сложные процессы, безопасность и масштаб.',features:['Всё из тарифа «Плюс»','Роли и права доступа','Единый вход SSO','Персональный менеджер'],special:['Репетиция процессов','Атлас потерь'],badge:'Максимум возможностей'}
 ];
 const modules=[['Расширенная аналитика','Пользовательские отчёты, KPI и прогноз выручки',290],['Поддержка 24/7','Техническая помощь менеджерам в любое время',2100],['Интеграции и API','Связь с телефонией, ERP и внутренними системами',1800]];
 let term=6,pricingChoices,state,modal,form,summary,backdrop,returnFocus,formFields={},disclosures=[],calendarOpen=false,calendarHost,startButton,endDisplay,submitted=false,receipt,successCard,successBackdrop;
 const announce=t=>{document.getElementById('announcer').textContent=t;};
 const setPersistentVisibility=(node,visible)=>{if(!node)return;node.classList.toggle('is-hidden',!visible);node.setAttribute('aria-hidden',String(!visible));};
 const newState=plan=>({plan,months:term,currency:'RUB',name:'',description:'',comment:'',category:'',account:null,employees:'1',funnels:'1',start:P.today(),trial:3,modules:[false,false,false]});
 const bonus=()=>{const p=el('p','bonus');p.append(el('span','','БОНУС'),document.createTextNode(' + 1 месяц в подарок'));return p;};
 function feature(text,kind='black'){const row=el('div','feature');row.append(icon(kind==='white'?'554:26399':kind==='purple'?'540:11800':'540:11799'),el('span','',text));return row;}
 function planHeading(plan,selected=false){const h=el('div','plan-heading');h.append(el('p','plan-eyebrow',selected?'Выбранный тариф':plan.tag),el('h2','plan-title',plan.name),el('p','plan-description',plan.description));return h;}
 function selectedPlan(plan){const card=el('section',`selected-plan ${plan.id}`);card.setAttribute('aria-label','Выбранный тариф');card.append(planHeading(plan,true));const list=el('div','selected-features');plan.features.forEach(t=>list.append(feature(t,plan.id==='premium'?'white':'black')));plan.special.forEach(t=>list.append(feature(t,'purple')));card.append(list);return card;}
 function makeHeader(){
  const h=el('header','site-header'),brand=button('','brand',()=>showHeaderMessage('LID CRM'));brand.setAttribute('aria-label','LID CRM — тарифы');brand.append(icon('556:28247'),el('span','wordmark','LID CRM'));
  const right=el('div','header-right'),nav=el('nav','site-navigation');nav.setAttribute('aria-label','Основная навигация');
  ['Главная','Возможности','Клиенты','Тарифы','Поддержка'].forEach(t=>{const b=button(t,t==='Тарифы'?'nav-link active':'nav-link',()=>{if(t==='Тарифы'){showHeaderMessage(t);return;}showHeaderMessage(t);});if(t==='Тарифы')b.setAttribute('aria-current','page');nav.append(b);});
  const actions=el('div','header-actions'),tools=el('div','header-tools'),help=button('','header-icon',()=>showHeaderMessage('Поддержка'));help.setAttribute('aria-label','Помощь');help.append(icon('558:28996'));
  const notifications=button('','header-icon notifications',()=>showHeaderMessage('Уведомления'));notifications.setAttribute('aria-label','Уведомления: 3');notifications.append(icon('558:29000'),el('span','notification-count','3'));
  const panel=button('','panel-button',()=>showHeaderMessage('Панель'));const panelIcon=icon('558:29011');panelIcon.style.transform='rotate(180deg)';panel.append(panelIcon,document.createTextNode('Панель'));tools.append(help,notifications,panel);
  const user=button('','user-profile',()=>showHeaderMessage('Профиль'));user.setAttribute('aria-label','Иван Иванов, ID 20481');const name=el('span','user-name');name.append(el('span','','Иван Иванов'),el('small','','ID 20481'));const avatar=el('img','avatar');avatar.src='assets/avatar.jpg';avatar.alt='';avatar.width=46;avatar.height=46;user.append(name,avatar);actions.append(tools,user);right.append(nav,actions);h.append(brand,right);return h;
 }
 function showHeaderMessage(title){document.querySelector('.header-popover')?.remove();const p=el('section','header-popover');p.setAttribute('role','dialog');p.setAttribute('aria-label',title);p.append(el('strong','',title),el('p','',`В текущем функционале это не предусмотренно.`));const close=button('Закрыть','small-button',()=>p.remove());p.append(close);document.body.append(p);close.focus();announce('В текущем функционале это не предусмотренно.');}
 function pricingCard(plan){
  const card=el('article',`pricing-card ${plan.id}`);card.dataset.plan=plan.id;if(plan.badge)card.append(el('div','plan-badge',plan.badge));card.append(planHeading(plan));
  const benefits=el('div','plan-benefits'),base=el('div','base-features');plan.features.forEach(t=>base.append(feature(t,plan.id==='premium'?'white':'black')));benefits.append(base);
  const unique=el('div','special-features');plan.special.forEach(t=>{const r=el('div','special-feature');r.append(el('span','',t),el('span','feature-badge','Уникальность LID'));unique.append(r);});benefits.append(unique);card.append(benefits);
  const footer=el('div','card-footer'),price=el('div','card-price');footer.append(price,button('Выбрать тариф',`primary-button ${plan.id==='premium'?'accent':''}`,()=>openModal(plan.id)));footer.lastChild.setAttribute('aria-label',`Выбрать тариф ${plan.name}`);card.append(footer);return card;
 }
 // Figma's four angular-gradient layers live *behind* the pricing card.
 // The visible 76px beneath the card matches the background-coloured masking
 // rectangle at y=899 (the card bottom is y=823 in the 1920px source frame).
 function pricingTile(plan){
  const tile=el('div',`pricing-tile ${plan.id}`);
  const glow=el('div','pricing-glow');
  glow.setAttribute('aria-hidden','true');
  for(let layer=0;layer<4;layer++)glow.append(el('span',`pricing-glow-layer ${layer<2?'glow-left':'glow-right'}`));
  const backgroundStrip=el('span','pricing-glow-mask');
  backgroundStrip.setAttribute('aria-hidden','true');
  tile.append(glow,backgroundStrip,pricingCard(plan));
  return tile;
 }
 function renderPrices(){
  document.querySelectorAll('.pricing-card').forEach(card=>{const rate=P.PRICES[card.dataset.plan],price=card.querySelector('.card-price');price.replaceChildren();const previous=el('s','previous-price',P.money(rate)+' / мес');setPersistentVisibility(previous,term!==1);
   const row=el('div','amount-row');row.append(el('strong','amount',P.money(Math.round(rate*(1-P.discount(term))))),el('span','unit','/чел. в мес.'));price.append(previous,row,el('p','price-note',term===1?'Оплата за 1 месяц':`Экономия ${term===6?5:10}% при оплате за ${term} мес.`));
  });const b=document.querySelector('.pricing-period .bonus');setPersistentVisibility(b,term===12);
 }
 function makePage(){
  app.replaceChildren();const h=makeHeader(),main=el('div','pricing-content'),top=el('div','pricing-heading'),heading=el('div','heading-copy');heading.append(el('h1','','Выберете тариф'));
  const help=el('p','help-copy');help.append(icon('556:28103'),el('span','','Цена за одного сотрудника в месяц. Нажмите «Выбрать тариф» — настройки откроются в отдельном окне.'));heading.append(help);
  const choices=segments('',periodOptions,term,value=>{term=value;renderPrices();});pricingChoices=choices;choices.wrap.classList.add('pricing-period','has-bonus');const pricingBonus=bonus();choices.wrap.append(pricingBonus);setPersistentVisibility(pricingBonus,term===12);top.append(heading,choices.wrap);main.append(top);
  const cards=el('div','plan-cards');plans.forEach(plan=>cards.append(pricingTile(plan)));main.append(cards);app.append(h,main);renderPrices();
 }
 function changed(key,value){state[key]=value;validateField(key,false);if(receipt){receipt.remove();receipt=null;}updateSummary();}
 function validateField(key,force){const f=formFields[key];if(!f)return;const error=P.validate(state)[key];if(!force&&!f.wrap.classList.contains('invalid'))return;f.error.textContent=error||'';f.error.hidden=!error;f.wrap.classList.toggle('invalid',!!error);const target=f.input||f.trigger||f.group||f.wrap.querySelector('input,button');target?.setAttribute('aria-invalid',String(!!error));}
 function updateDates(){startButton.querySelector('.date-value').textContent=P.formatDate(state.start);endDisplay.querySelector('.date-value').textContent=P.formatDate(P.endDate(state));endDisplay.title='Рассчитывается автоматически: оплаченный срок, подарочный месяц при выборе 12 месяцев и 3 дня триала.';}
 function toggleCalendar(next){calendarOpen=next;calendarHost.replaceChildren();calendarHost.hidden=!next;startButton.setAttribute('aria-expanded',String(next));startButton.querySelector('img').src=FIGMA.assets[next?'I551:21946;551:21742':'551:21718'].src;
  if(next)calendarHost.append(calendar(state.start,value=>{changed('start',value);updateDates();toggleCalendar(false);startButton.focus({preventScroll:true});}));
 }
 function makeForm(){
  form=el('form','settings');form.noValidate=true;form.setAttribute('aria-label','Параметры подписки');formFields={};disclosures=[];
  for(const [key,title,multi,required,placeholder] of [['name','Название подписки',false,true,'Введите название подписки'],['description','Описание',true,false,'Введите описание']]){const f=textField(key,title,state[key],v=>changed(key,v),multi,required,placeholder);formFields[key]=f;form.append(f.wrap);}
  const category=select('category','Категория',categories.map(t=>[t]),null,i=>changed('category',categories[i]));formFields.category=category;disclosures.push(category);form.append(category.wrap);
  const billing=el('div','billing-row'),period=segments('Период подписки',periodOptions,state.months,v=>{state.months=v;term=v;pricingChoices?.set(v);renderPrices();setPersistentVisibility(period.wrap.querySelector('.bonus'),v===12);history.replaceState(null,'',`#configure?plan=${state.plan}&months=${v}`);updateDates();updateSummary();},true);period.wrap.classList.add('period-field','has-bonus');const periodBonus=bonus();period.wrap.append(periodBonus);setPersistentVisibility(periodBonus,state.months===12);
  const currency=segments('Выбор валюты',[['USD','USD'],['RUB','RUB'],['EUR','EUR']],state.currency,v=>changed('currency',v),true);currency.wrap.dataset.field='currency';const currencyError=el('p','field-error');currencyError.id='error-currency';currencyError.hidden=true;currency.group.setAttribute('aria-describedby',currencyError.id);currency.wrap.append(currencyError);formFields.currency={wrap:currency.wrap,error:currencyError,group:currency.group};billing.append(period.wrap,currency.wrap);form.append(billing);
  const dates=el('div','dates-block'),dateRow=el('div','dates-row'),start=field('start','Дата начала',true),end=field('end','Дата окончания'),trial=el('div','trial-field');
  startButton=button('','date-trigger',()=>toggleCalendar(!calendarOpen));startButton.append(el('span','date-value'),icon('551:21718'));startButton.setAttribute('aria-expanded','false');startButton.setAttribute('aria-controls','start-calendar');start.insert(startButton);formFields.start={...start,trigger:startButton};
  endDisplay=el('div','date-output');endDisplay.setAttribute('role','status');endDisplay.setAttribute('aria-label','Дата окончания, рассчитана автоматически');endDisplay.append(el('span','date-value'),icon('551:21718'));end.insert(endDisplay);
  trial.append(label('Триальный период (дней)'),el('output','trial-value','3'));dateRow.append(start.wrap,end.wrap,trial);dates.append(dateRow);calendarHost=el('div','calendar-slot');calendarHost.id='start-calendar';calendarHost.hidden=true;dates.append(calendarHost);form.append(dates);updateDates();
  const account=accountCombobox('account','Аккаунт клиента',accounts,null,i=>changed('account',i));account.wrap.classList.add('account-field');formFields.account=account;disclosures.push(account);form.append(account.wrap);
  const counters=el('div','counters-row');for(const [key,title] of [['employees','Количество сотрудников'],['funnels','Количество воронок']]){const f=stepper(key,title,state[key],v=>changed(key,v),'0');formFields[key]=f;counters.append(f.wrap);}form.append(counters);
  const addons=el('div','addons');addons.append(label('Дополнительные модули CRM',false,true));modules.forEach(([title,description,rate],i)=>{const b=button('','addon',()=>{state.modules[i]=!state.modules[i];b.setAttribute('aria-pressed',String(state.modules[i]));b.querySelector('img').src=FIGMA.assets[state.modules[i]?'551:23046':'551:23050'].src;updateSummary();});b.dataset.module=i;b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',title);const copy=el('span','addon-copy');copy.append(el('span','addon-title',title),el('span','addon-description',description));b.append(icon('551:23050'),copy,el('span','addon-price'));addons.append(b);});form.append(addons);
  const comment=textField('comment','Комментарий','',v=>changed('comment',v),true,false,'Введите комментарий');formFields.comment=comment;form.append(comment.wrap);
  form.addEventListener('fieldblur',e=>validateField(e.detail,true));form.addEventListener('submit',e=>{e.preventDefault();checkout();});form.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'&&e.target.name!=='account'&&!e.defaultPrevented){e.preventDefault();checkout();}});return form;
 }
 function makeSummary(plan){
  summary=el('aside','summary');summary.append(selectedPlan(plan));const total=el('section','calculation');total.setAttribute('aria-label','Расчёт подписки');
  const heading=el('div','calculation-heading');heading.append(el('p','calculation-eyebrow','Настройка тарифа'),el('h2','subscription-name',''),el('p','subscription-category',''));total.append(heading);
  const rows=el('dl','calculation-rows');['Сотрудников','Воронки продаж','Период оплаты','Цена за сотрудника в мес.','Лицензии CRM','Доп. модули','Скидка за срок','Скидка клиента'].forEach((t,i)=>{const row=el('div','calculation-row');row.dataset.row=i;row.append(el('dt','',t),el('dd',''));rows.append(row);});total.append(rows);
  const footer=el('div','calculation-footer'),price=el('div','total-price');price.append(el('s','previous-price'),el('strong','amount'),el('p','access-note'));footer.append(price,button('Перейти к оплате','primary-button accent',checkout));total.append(footer);summary.append(total);return summary;
 }
 function updateSummary(){
  if(!summary)return;if(receipt){receipt.remove();receipt=null;}const result=P.quote(state),hasCurrency=!!state.currency,hasEmployees=/^\d+$/.test(String(state.employees))&&Number(state.employees)>0&&Number(state.employees)<=999;const m=n=>hasCurrency?P.moneyValue(n,state.currency):'—';
  summary.querySelector('.subscription-name').textContent=state.name.trim()||'Название подписки';summary.querySelector('.subscription-category').textContent=state.category||'Категория не выбрана';
  const values=[hasEmployees?`${state.employees} чел.`:'—',state.funnels||'—',`${state.months} ${state.months===1?'месяц':'месяцев'}`,m(result.rate),hasEmployees?m(result.licenses):'—',hasEmployees?m(result.modules):'—',hasEmployees?'−'+m(result.termDiscount):'—',hasEmployees&&result.clientPercent>0?'−'+m(result.clientDiscount):'—'];
  summary.querySelectorAll('.calculation-row').forEach((row,i)=>{row.querySelector('dd').textContent=values[i];row.classList.toggle('discount-row',i===6||(i===7&&result.clientPercent>0));if(i===7)row.querySelector('dt').textContent=result.clientPercent>0?'Скидка клиента · 3%':'Скидка клиента';});
  const old=summary.querySelector('.total-price .previous-price');old.textContent=hasEmployees?m(result.before):'—';old.hidden=!(hasCurrency&&hasEmployees&&(result.termDiscount>0||result.clientDiscount>0));summary.querySelector('.total-price .amount').textContent=hasEmployees?m(result.total):'—';
  const note=summary.querySelector('.access-note');note.replaceChildren(document.createTextNode(`Доступ на ${state.months} ${state.months===1?'месяц':'месяцев'}`));if(state.months===12)note.append(document.createTextNode(' '),el('span','access-bonus','+ 1 в подарок'));
  form?.querySelectorAll('.addon-price').forEach((p,i)=>{p.textContent=`+ ${P.money(modules[i][2],state.currency||'RUB')}${i===0?' / чел. / мес.':' / мес.'}`;});
  if(hasEmployees&&hasCurrency)announce(`Итого ${m(result.total)}`);
 }
 function checkout(){
  submitted=true;const errors=P.validate(state);Object.keys(formFields).forEach(key=>validateField(key,true));
  if(Object.keys(errors).length){const first=formFields[Object.keys(errors)[0]],control=first?.input||first?.trigger||first?.group?.querySelector('button');control?.focus();announce(`Проверьте форму: ${Object.values(errors).join(' ')}`);return;}
  const order={...state,employees:Number(state.employees),funnels:Number(state.funnels),end:P.endDate(state),calculation:P.quote(state),baseCalculationRub:P.calculate(state),createdAt:new Date().toISOString(),demo:true};
  try{localStorage.setItem('lid-crm-subscription',JSON.stringify(order));}catch{}
  closeModal(false);
  showSuccessCard();
  announce('Ваши деньги успешно списаны на счёт создателя.');
 }
 function showSuccessCard(){
  closeSuccessCard(false);
  app.inert=true;
  successBackdrop=el('div','modal-backdrop payment-backdrop');
  successBackdrop.addEventListener('click',closeSuccessCard);
  document.body.append(successBackdrop);
  successCard=el('section','payment-success');
  successCard.setAttribute('role','dialog');
  successCard.setAttribute('aria-modal','true');
  successCard.setAttribute('aria-label','Успешная оплата');
  successCard.tabIndex=-1;
  successCard.append(
    el('h3','payment-success-title','Ваши деньги успешно списаны на счёт создателя'),
    el('p','payment-success-note','(шутка).'),
    button('Спасибо, хорошо','primary-button accent',closeSuccessCard)
  );
  document.body.append(successCard);
  document.body.classList.add('modal-open');
  successCard.querySelector('button').focus({preventScroll:true});
 }
 function closeSuccessCard(restoreFocus=true){
  if(!successCard&&!successBackdrop)return;
  successCard?.remove();successBackdrop?.remove();successCard=successBackdrop=null;
  app.inert=false;
  document.body.classList.remove('modal-open');
  if(restoreFocus)returnFocus?.focus({preventScroll:true});
 }
 function openModal(plan){
  if(modal)closeModal();document.querySelector('.header-popover')?.remove();returnFocus=document.activeElement;state=newState(plan);submitted=false;calendarOpen=false;receipt=null;app.inert=true;
  backdrop=el('div','modal-backdrop');backdrop.addEventListener('click',closeModal);document.body.append(backdrop);modal=el('section','subscription-modal');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Настройка подписки');modal.tabIndex=-1;
  const close=button('Закрыть настройки','modal-close',closeModal);modal.append(close);summary=null;modal.append(makeForm(),makeSummary(plans.find(p=>p.id===plan)));document.body.append(modal);document.body.classList.add('modal-open');history.replaceState(null,'',`#configure?plan=${plan}&months=${term}`);updateSummary();modal.focus({preventScroll:true});Object.values(formFields).forEach(f=>f.grow?.());
 }
 function closeModal(restoreFocus=true){if(!modal)return;modal.remove();backdrop.remove();modal=form=summary=backdrop=receipt=null;app.inert=false;document.body.classList.remove('modal-open');history.replaceState(null,'','#pricing');if(restoreFocus)returnFocus?.focus({preventScroll:true});}
 function gallery(){app.replaceChildren();document.body.classList.add('gallery');const h=el('header');h.append(el('h1','','Компоненты и состояния из JSON'));const a=el('a','','Вернуться к тарифам');a.href='#pricing';h.append(a);app.append(h);FIGMA.sets.forEach(set=>{const section=el('section');section.append(el('h2','',set.name));const row=el('div','variant-row');set.variants.forEach(id=>{const n=C[id],f=el('figure');f.append(el('figcaption','',n.name),Design.render(n,true));row.append(f);});section.append(row);app.append(section);});}
 if(location.hash.startsWith('#components'))gallery();else{const params=new URLSearchParams(location.hash.split('?')[1]);if([1,6,12].includes(Number(params.get('months'))))term=Number(params.get('months'));makePage();if(location.hash.startsWith('#configure'))openModal(plans.some(p=>p.id===params.get('plan'))?params.get('plan'):'plus');}
 addEventListener('hashchange',()=>{if(location.hash.startsWith('#components')||document.body.classList.contains('gallery'))location.reload();else if(location.hash==='#pricing')closeModal();else if(location.hash.startsWith('#configure')&&!modal)openModal('plus');});
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){const p=document.querySelector('.header-popover');if(p){p.remove();return;}if(successCard){closeSuccessCard();return;}const open=disclosures.find(d=>d.open);if(open){open.close();open.trigger.focus();}else if(calendarOpen){toggleCalendar(false);startButton.focus();}else closeModal();}
  if(e.key==='Tab'&&modal){const items=[...modal.querySelectorAll('button,input,textarea,[tabindex="0"]')].filter(n=>!n.disabled&&n.getClientRects().length);if(e.shiftKey&&(document.activeElement===items[0]||document.activeElement===modal)){e.preventDefault();items.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0].focus();}}
 });
 document.addEventListener('click',e=>{for(const d of disclosures)if(d.open&&!d.wrap.contains(e.target))d.close();if(calendarOpen&&!e.composedPath().some(n=>n.classList?.contains('dates-block')))toggleCalendar(false);});
})();
