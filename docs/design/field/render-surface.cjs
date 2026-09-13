// Offline renderer. Pass --preview for a single PNG, otherwise pipe all 240 frames to FFmpeg.
// FIELD_PLAYWRIGHT points to an installed Playwright package; FIELD_FFMPEG to an encoder executable.
const {chromium}=require(process.env.FIELD_PLAYWRIGHT || 'playwright');
const fs=require('fs');const path=require('path');const {spawn}=require('child_process');const {once}=require('events');
const root=path.resolve(__dirname,'../../..');
const output=path.join(root,'apps/web/public/media/field');
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:process.env.FIELD_BROWSER_CHANNEL || 'msedge',headless:true,args:['--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 page.on('pageerror',e=>{throw e;});
 await page.goto('file:///'+path.join(__dirname,'render-surface.html').replaceAll('\\','/'));
 await page.evaluate(()=>renderFrame(0));
 await page.screenshot({path:path.join(__dirname,'field-frame.png')});
 if(process.argv.includes('--preview')){await browser.close();return;}
 if(!process.env.FIELD_FFMPEG)throw new Error('Set FIELD_FFMPEG to the encoder executable');
 const encoder=spawn(process.env.FIELD_FFMPEG,['-y','-f','image2pipe','-vcodec','png','-framerate','24','-i','pipe:0','-an','-c:v','libx264','-preset','slow','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',path.join(output,'field-loop.mp4')],{stdio:['pipe','ignore','pipe']});
 let log='';encoder.stderr.on('data',x=>log+=x);encoder.stdin.on('error',()=>{});
 const done=once(encoder,'close');
 for(let frame=0;frame<240;frame++){
   await page.evaluate(t=>renderFrame(t),frame/24);
   const png=await page.screenshot();
   if(!encoder.stdin.write(png))await once(encoder.stdin,'drain');
   if(frame%24===0)console.log(`Rendered ${frame}/240 frames`);
 }
 encoder.stdin.end();const [code]=await done;await browser.close();
 if(code!==0)throw new Error(log);
 console.log(log.slice(-1800));
})().catch(e=>{console.error(e);process.exit(1)});
