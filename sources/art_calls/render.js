const {chromium}=require('playwright');const {spawn}=require('child_process');const path=require('path');
(async()=>{
 const [,,mode,out,fps='30']=process.argv;
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 pg.on('console',m=>console.log('PAGE',m.text()));pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.goto('file://'+path.resolve(__dirname,'index.html')+'?render');
 await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(500);
 if(mode==='stills'){
   const ts=out.split(',').map(Number);
   for(const t of ts){await pg.evaluate(t=>seek(t),t);await pg.screenshot({path:path.resolve(__dirname,`t${t}.png`)});}
 } else {
   const F=+fps,N=Math.round(56*F);
   const ff=spawn('ffmpeg',['-y','-f','image2pipe','-framerate',String(F),'-i','-','-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-profile:v','high','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
   for(let i=0;i<N;i++){await pg.evaluate(t=>seek(t),i/F);const buf=await pg.screenshot({type:'jpeg',quality:96});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(i%150===0)console.log('frame',i,'/',N);}
   ff.stdin.end();await new Promise(r=>ff.on('close',r));
 }
 await b.close();
})();
