import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function layout(stacked=false){
 const c=vm.createContext({min:Math.min,max:Math.max,window:{matchMedia:()=>({matches:stacked}),innerWidth:1440,innerHeight:900},windowWidth:1200,windowHeight:700});
 vm.runInContext(fs.readFileSync(new URL('../sketch.js',import.meta.url),'utf8'),c);return c;
}
test('camera covers full portrait height across laptop and fullscreen ratios',()=>{
 const c=layout();
 for(const [vw,vh,cw,ch] of [[640,480,1440,900],[1920,1080,1440,900],[1280,720,1920,1080],[640,480,1366,768],[720,1280,1440,900]]){
 const r=vm.runInContext(`letterboxRectWithSideInsets(${vw},${vh},${cw},${ch},236,236)`,c);
 assert.ok(r.oy<=0);assert.ok(r.oy+r.dh>=ch-1e-8);assert.ok(r.ox<=236);assert.ok(r.ox+r.dw>=cw-236-1e-8);
 assert.ok(Math.abs(r.dw/r.dh-vw/vh)<1e-8,'camera aspect is preserved');
 }
});
test('mobile retains contain sizing and desktop reads current viewport dimensions',()=>{
 const mobile=layout(true);const r=vm.runInContext('letterboxRectWithSideInsets(640,480,390,300,0,0)',mobile);
 assert.equal(r.dw,390);assert.equal(r.dh,292.5);
 const desktop=layout();vm.runInContext('live=true',desktop);
 assert.deepEqual(Array.from(vm.runInContext('liveCanvasWidthHeight()',desktop)),[1440,900]);
});
