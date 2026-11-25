const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/../templates/index.html','utf8');
const from='async function doSheet() {';
const a=html.indexOf(from),b=html.indexOf('/* NOTES',a);assert(a>=0&&b>a);
const state={ name:'Илар Ветролист',level:1,xp:50,xp_next:100,race:'Эльф',class:'Маг',background:'Мудрец',hp:10,max_hp:10,
 stats:{int:16,dex:14},inventory:[{name:'Посох',quantity:1}],conditions:[{name:'Укрыт',effect:'за опорой'}],
 quests:[{id:'final',name:'Серебряный колокол',type:'main',status:'completed',stages:{phase1:{text:'Вернуть Майре',done:true}},rewards:{xp:50}}],
 notes:[],level_history:[],spells_known:['Окутание светом']};
const modalContent={innerHTML:''};const modalEl={classList:{add:(x)=>{assert.equal(x,'open')}}};
const cx={state,modalContent,modalEl,Number,Math,Object,Array,
 esc:(x)=>String(typeof x==='object'?(x.name||x.text||JSON.stringify(x)):x).replaceAll('<','&lt;'),
 readableValue:(x)=> typeof x==='object'?x.name||x.text||JSON.stringify(x):String(x),
 formatCoins:()=> '0',getPositionInfo:()=>({icon:'',label:'Стоит',mod:0}), getCoverInfo:()=>({icon:'',label:'нет'})};
vm.createContext(cx);vm.runInContext(html.slice(a,b),cx);
vm.runInContext('doSheet()',cx).then(()=>{
  assert(modalContent.innerHTML.includes('Серебряный колокол'));
  assert(modalContent.innerHTML.includes('Вернуть Майре'));
  assert(modalContent.innerHTML.includes('50 / 100'));
  assert(modalContent.innerHTML.includes('Укрыт'));
  assert(modalContent.innerHTML.includes('Посох ×1'));
  console.log('Sheet regression: 5 checks passed');
}).catch(e=>{console.error(e);process.exit(1)});
