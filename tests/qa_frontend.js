const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/../templates/index.html','utf8');
function get(from,to){const a=html.indexOf(from),b=html.indexOf(to,a);if(a<0||b<0)throw Error('function missing '+from);return html.slice(a,b)}
const code=get('function currentPendingRoll() {','async function doRoll(expr) {')+'\n'
 +get('  function safeQuestStages(raw) {','  function renderQuest(q) {')+'\n'
 +get('function renderNarration(text) {','function addMsg(role, text) {');
const cx={messages:[],readableValue:(x)=>typeof x==='string'?x:JSON.stringify(x),esc:(v)=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')};vm.createContext(cx);vm.runInContext(code,cx);
const roll=(content)=>{cx.messages=[{role:'assistant',content}];return cx.currentPendingRoll();}
assert.equal(roll('Скрытность, КС 13. Команда: /roll 1d20+3').dc,13);
assert.equal(roll('Проверка Магии, DC 14. /roll 1d20+6').expr,'1d20+6');
assert.equal(roll('Бросьте кубик для себя. /roll 1d20'),null);
assert.equal(roll('Проверка Ловкости, сложность: 15. /roll 1d20+2').dc,15);
assert.equal(roll('Результат: успех. Никакого броска.'),null);
assert.equal(cx.safeQuestStages({a:{text:'Дойти до причала',done:true},b:'Отдать колокол'}).length,2);
assert.equal(cx.safeQuestStages('Доставить колокол')[0].text,'Доставить колокол');
assert.equal(cx.safeQuestStages(null).length,0);
assert.ok(cx.renderNarration('**Тёмная таверна** и *шёпот*').includes('<strong>'));
assert.ok(cx.renderNarration('<script>alert(1)</script>').includes('&lt;script&gt;'));
console.log('JS QA checks: 10 passed');
