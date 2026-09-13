const {chromium}=require(process.env.FIELD_PLAYWRIGHT||'playwright');
const fs=require('fs');const path=require('path');const assert=require('assert/strict');
const root=path.resolve(__dirname,'../../..');const output=path.join(__dirname,'asset-checks');fs.mkdirSync(output,{recursive:true});
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:5180/docs/design/field/render-surface.html');
const seam=await page.evaluate(()=>{renderFrame(0);const a=document.querySelector('canvas').toDataURL();renderFrame(10);const b=document.querySelector('canvas').toDataURL();renderFrame(5);const c=document.querySelector('canvas').toDataURL();return{identicalEndpoints:a===b,deformation:a!==c}});assert(seam.identicalEndpoints&&seam.deformation);
await page.goto('http://127.0.0.1:5180/docs/design/field/preview.html');
const metadata=await page.evaluate(async()=>{const v=document.querySelector('video');if(v.readyState<1)await new Promise((r,j)=>{v.onloadedmetadata=r;v.onerror=()=>j(Error('decode failed'))});return{duration:v.duration,width:v.videoWidth,height:v.videoHeight}});assert.equal(metadata.duration,10);assert.equal(metadata.width,1920);assert.equal(metadata.height,1080);
for(const width of [1440,390]){
await page.setViewportSize({width,height:width===390?844:1000});
await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('video')].map(v=>new Promise(r=>{v.currentTime=2.5;v.addEventListener('seeked',r,{once:true})})));scrollTo(0,0)});
await page.screenshot({path:path.join(output,`hero-${width}.png`)});
await page.locator('.about').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`about-${width}.png`)});
}
await page.evaluate(()=>{const v=document.querySelector('video');v.currentTime=0;window.wraps=0;let last=0;v.addEventListener('timeupdate',()=>{if(v.currentTime<last)window.wraps++;last=v.currentTime});return v.play()});
await page.waitForFunction(()=>window.wraps>=2,{},{timeout:26000});
const playback=await page.evaluate(()=>({wraps:window.wraps,paused:document.querySelector('video').paused,error:document.querySelector('video').error}));assert(!playback.error&&!playback.paused);
assert.deepEqual(errors,[]);
const result={metadata,seam,decodedFrameVerification:"See encoding-verification.json; browser canvas sampling returned zero samples",playback,errors,bytes:fs.statSync(path.join(root,'apps/web/public/media/field/field-loop.mp4')).size,posterBytes:fs.statSync(path.join(root,'apps/web/public/media/field/field-poster.webp')).size};
assert(result.bytes<=3000000);assert(result.posterBytes<=200000);
fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
