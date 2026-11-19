import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function context(){
 const c=vm.createContext({window:{}});
 for(const file of ['word-filter.js','../sketch.js','data/search-sample.js','samples.js'])vm.runInContext(fs.readFileSync(new URL(file,import.meta.url),'utf8'),c);
 return c;
}
test('curated sample balances 600 topic words with 400 search-derived miscellaneous words',()=>{
 const c=context();const result=vm.runInContext(`buildExhibitionSample('curated')`,c);
 assert.equal(Object.keys(result.freq).length,1000);
 assert.ok(Object.values(result.freq).every(n=>n===1));
 c.freq=result.freq;
 const counts=vm.runInContext('aggregateTopicWordCounts(freq)',c);
 assert.equal(counts.other,400);
 const sourceWords=new Set(c.window.EXHIBIT_SEARCH_SAMPLE.words);
 for(const word of Object.keys(result.freq)){
  c.word=word;
  if(vm.runInContext("topicForWord(word) === TOPIC_IDS.OTHER",c))assert.ok(sourceWords.has(word),word);
 }
 for(const [topic,count] of Object.entries(counts))if(topic!=='other')assert.equal(count,75,`${topic}: ${count}`);
 assert.equal(vm.runInContext('Object.keys(freq).some(w=>ExhibitWordFilter.isBlocked(w))',c),false);
});
test('search sample has provenance and distinct filtered words, not fabricated rank weights',()=>{
 const c=context();const result=vm.runInContext(`buildExhibitionSample('search-2026')`,c);
 assert.equal(Object.keys(result.freq).length,704);
 assert.ok(Object.values(result.freq).every(n=>n===1));
 assert.match(result.sourceUrl,/openrush.com/);
 assert.match(result.description,/June 2026/);
 c.freq=result.freq;
 assert.equal(vm.runInContext('Object.keys(freq).some(w=>ExhibitWordFilter.isBlocked(w))',c),false);
 assert.equal(vm.runInContext('window.EXHIBIT_SEARCH_SAMPLE.sourceQueryCount',c),1000);
});
test('both presets use the public-display filter at selection time',()=>{
 const c=context();vm.runInContext(`window.EXHIBIT_SEARCH_SAMPLE.words.push('porn','fuck','anal');`,c);
 const result=vm.runInContext(`buildExhibitionSample('search-2026')`,c);
 assert.equal(result.freq.porn,undefined);assert.equal(result.freq.fuck,undefined);assert.equal(result.freq.anal,undefined);
});
