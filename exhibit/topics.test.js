import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('word-filter.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('../sketch.js',import.meta.url),'utf8'),context);
const classify=word=>vm.runInContext(`topicForWord(${JSON.stringify(word)})`,context);
const cases={
 personal:'recipes baking sourdough groceries hiking camping flights hotels vacation furniture gardening renovations',
 culture:'galleries podcasts concerts playlists books designers',
 tech:'coding cybersecurity developers headphones',
 health:'skincare moisturizer workouts',
 politics:'lawmakers ballots tariffs',
 science:'fossils galaxies planets bacteria',
 social:'friendship dating messaging',
 money:'investing mortgages budgeting cryptocurrency fintech',
};
test('everyday browsing vocabulary gets meaningful categories',()=>{
 for(const [topic,words] of Object.entries(cases))for(const word of words.split(' '))assert.equal(classify(word),topic,word);
});
test('plural and verb inflections work without an NLP dependency',()=>{
 for(const [word,topic] of Object.entries({recipes:'personal',galleries:'culture',concerts:'culture',baked:'personal',camped:'personal',debugged:'tech',studied:'other'}))assert.equal(classify(word),topic,word);
});
test('unknown words stay unclassified; existing strong topics are preserved',()=>{
 for(const w of ['zzqvvzz','something','perhaps'])assert.equal(classify(w),'other',w);
 for(const [w,t] of Object.entries({senate:'politics',javascript:'tech',yoga:'health',climate:'science',instagram:'social',mortgage:'money',cinema:'culture'}))assert.equal(classify(w),t,w);
});
test('category counts and portrait words use the same assignments',()=>{
 const counts=vm.runInContext(`aggregateTopicWordCounts({recipes:3,podcasts:2,developers:4,zzqvvzz:1})`,context);
 assert.equal(counts.personal,3);assert.equal(counts.culture,2);assert.equal(counts.tech,4);assert.equal(counts.other,1);
});
