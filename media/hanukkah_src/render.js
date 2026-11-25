const {chromium}=require('playwright');
const [,,html,out,fps,dur,only]=process.argv;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('file://'+html);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
const times=only?only.split(',').map(Number):[...Array(Math.round(dur*fps)).keys()].map(i=>i/fps);
let i=0;for(const t of times){await p.evaluate(t=>window.seek(t),t);
 await p.screenshot({path:`${out}/f${String(only?t:i).padStart(5,'0')}.${only?'png':'jpg'}`,...(only?{}:{type:'jpeg',quality:92})});i++}
await b.close()})();
