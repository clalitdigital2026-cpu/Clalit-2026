// usage: node icon.js jobs.json  -> each job {name,color,sw,out_svg,out_png,size}
const fs=require('fs'),sharp=require('sharp');
const jobs=JSON.parse(fs.readFileSync(process.argv[2]));
(async()=>{for(const j of jobs){
 let s=fs.readFileSync(`node_modules/lucide-static/icons/${j.name}.svg`,'utf8');
 s=s.replace(/<!--[\s\S]*?-->/g,'').replace(/stroke="currentColor"/,`stroke="#${j.color}"`).replace(/stroke-width="[\d.]+"/,`stroke-width="${j.sw}"`).replace(/class="[^"]*"/,'');
 s=s.replace(/width="24"/,`width="${j.size}"`).replace(/height="24"/,`height="${j.size}"`);
 fs.writeFileSync(j.out_svg,s);
 await sharp(Buffer.from(s),{density:300}).resize(j.size,j.size).png().toFile(j.out_png);
}})();
