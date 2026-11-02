/* Subscription rules. Monetary calculations are rounded to kopecks, display separately. */
(() => {
 const PRICES={standard:790,plus:1490,premium:2490};
 // Shared local demo data: the subscription count drives both the dropdown label and the client discount.
 const ACCOUNTS=[
  {name:'ООО «Грейд» · CL-0184',subscriptions:2},
  {name:'АО «Пульс» · CL-0201',subscriptions:0},
  {name:'ООО «Пиксель» · CL-0242',subscriptions:1},
  {name:'ООО «Орбита» · CL-0307',subscriptions:5}
 ];
 const accountHasSubscriptions=index=>Number.isInteger(index) && (ACCOUNTS[index]?.subscriptions??0)>0;
 const subscriptionLabel=count=>!count?'Нет подписок':`${count} ${count%10===1&&count%100!==11?'активная подписка':count%10>=2&&count%10<=4&&(count%100<12||count%100>14)?'активные подписки':'активных подписок'}`;
 const RATES={RUB:1,USD:0.01,EUR:0.0092}; // Explicit demo conversion rates.
 const discount=months=>Number(months)===12?.1:Number(months)===6?.05:0;
 const round=n=>Math.round((n+Number.EPSILON)*100)/100;
 const iso=date=>`${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;
 const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 function addDays(value,count){const d=new Date(value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+count);return iso(d);}
 function addMonths(value,count){const [y,m,d]=value.split('-').map(Number);const end=new Date(Date.UTC(y,m-1+count,1,12));end.setUTCDate(Math.min(d,new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).getUTCDate()));return iso(end);}
 const endDate=s=>addDays(addMonths(s.start,Number(s.months)+(Number(s.months)===12?1:0)),3);
 const formatDate=value=>{const [y,m,d]=value.split('-');return `${d}.${m}.${y.slice(-2)}`;};
 const money=(n,c='RUB')=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:c||'RUB',minimumFractionDigits:0,maximumFractionDigits:c==='RUB'?0:2}).format(n*RATES[c||'RUB']);
 function calculate(s){
  const months=Number(s.months),employees=Number(s.employees)||0,rate=PRICES[s.plan];
  const licenses=round(rate*employees*months);
  const modules=round(((s.modules[0]?290*employees:0)+(s.modules[1]?2100:0)+(s.modules[2]?1800:0))*months);
  const before=round(licenses+modules),termDiscount=round(before*discount(months));
  const clientPercent=accountHasSubscriptions(s.account)?.03:0;
  const clientDiscount=round((before-termDiscount)*clientPercent);
  return {rate,licenses,modules,termDiscount,clientDiscount,clientPercent,total:round(Math.max(0,before-termDiscount-clientDiscount)),before};
 }
 function quote(s){
  const rub=calculate(s),fx=RATES[s.currency||'RUB'];
  const licenses=round(rub.licenses*fx),modules=round(rub.modules*fx),before=round(licenses+modules);
  const termDiscount=round(before*discount(s.months)),clientDiscount=round((before-termDiscount)*rub.clientPercent);
  return {...rub,rate:round(rub.rate*fx),licenses,modules,before,termDiscount,clientDiscount,total:round(before-termDiscount-clientDiscount)};
 }
 const moneyValue=(n,c='RUB')=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:c||'RUB',minimumFractionDigits:c==='RUB'?0:2,maximumFractionDigits:c==='RUB'?0:2}).format(n);
 function validate(s){
  const errors={};
  if(!s.name.trim())errors.name='Введите название подписки.';
  else if(s.name.trim().length<2)errors.name='Введите не менее 2 символов.';
  else if(s.name.length>100)errors.name='Не более 100 символов.';
  if(!s.category)errors.category='Выберите категорию.';
  if(!['RUB','USD','EUR'].includes(s.currency))errors.currency='Выберите валюту.';
  if(!Number.isInteger(s.account)||s.account<0||s.account>3)errors.account='Выберите аккаунт клиента из предложенного списка.';
  for(const key of ['employees','funnels'])if(!/^\d+$/.test(String(s[key]))||Number(s[key])<1||Number(s[key])>999)errors[key]='Укажите целое число от 1 до 999.';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s.start)||!Number.isFinite(Date.parse(s.start)))errors.start='Выберите дату начала.';
  if(s.description.length>5000)errors.description='Не более 5000 символов.';
  if(s.comment.length>5000)errors.comment='Не более 5000 символов.';
  return errors;
 }
 const api={PRICES,ACCOUNTS,accountHasSubscriptions,subscriptionLabel,RATES,discount,today,addDays,addMonths,endDate,formatDate,money,moneyValue,calculate,quote,validate,iso};
 if(typeof module!=='undefined')module.exports=api;else window.Pricing=api;
})();
