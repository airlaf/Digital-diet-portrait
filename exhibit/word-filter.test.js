import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import './word-filter.js';
import {extractTitles} from './history.js';
const {isBlocked,sanitizeText}=globalThis.ExhibitWordFilter;
test('explicit terms, inflections and common obfuscation are removed',()=>{
 for(const word of ['porn','PornHub','pornographic','fuck','fucking','motherfucker','anal','anally','blowjobs','shit','bullshit','p0rnhub','f.u.c.k','f_u_c_k','f*uck','fück','ＦＵＣＫ','fu\u200bck','a$$hole']) assert.ok(isBlocked(word),word);
 assert.equal(sanitizeText('art PornHub f.u.c.k anal music').replace(/\s+/g,' ').trim(),'art music');
});
test('ordinary words are not accidentally matched by anal, ass or sex substrings',()=>{
 for(const word of ['analysis','analytics','analog','canal','class','classic','assignment','assistant','Sussex','Essex','Scunthorpe','Dickens','cocktail']) assert.equal(isBlocked(word),false,word);
});
test('phone preview excludes explicit words and rejects an empty result',()=>{
 assert.deepEqual(extractTitles({history:[{title:'porn music'},{title:'anal'}]}),['music']);
 assert.throws(()=>extractTitles({history:[{title:'porn fuck anal'}]}),/filtering/);
});
test('portrait JSON, CSV, paste, NLP and fallback all filter before counting',()=>{
 const context=vm.createContext({});
 vm.runInContext(readFileSync(new URL('word-filter.js',import.meta.url),'utf8'),context);
 vm.runInContext(readFileSync(new URL('../sketch.js',import.meta.url),'utf8'),context);
 for(const code of [
  `wordFreqFromPlainText('porn pornhub fuck anal music garden')`,
  `parseHistoryJsonText(JSON.stringify({history:[{title:'porn pornhub fuck anal music garden'}]}))`,
  `parseHistoryCsv('title,url\\nporn pornhub fuck anal music garden,https://example.org')`,
 ]) {const result=vm.runInContext(code,context);assert.ok(result.music);for(const w of ['porn','pornhub','fuck','anal'])assert.equal(result[w],undefined);}
 context.nlp=()=>({terms:()=>({forEach:fn=>{for(const word of ['fuck','anal','music'])fn({has:tag=>tag==='#Noun',text:()=>word});}})});
 assert.equal(vm.runInContext(`wordFreqFromPlainText('fuck anal music').fuck`,context),undefined);
});
