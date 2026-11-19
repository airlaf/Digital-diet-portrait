import './word-filter.js';
export function extractTitles(data) {
  if(data?.metadata?.data_type && data.metadata.data_type!=='history') throw Error('This is not a history export. Choose History.json.');
  const records=Array.isArray(data)?data:['history','items','entries','visits','data'].map(k=>data?.[k]).find(Array.isArray);
  if(!records) throw Error('No browsing history found. Choose the extracted History.json file.');
  const titles=records.map(r=>typeof r==='string'?r:r?.title??r?.pageTitle??r?.page_title??'').filter(t=>typeof t==='string'&&t.trim()).map(t=>ExhibitWordFilter.sanitizeText(t).trim().slice(0,500)).filter(Boolean).slice(0,10000);
  if(!titles.length) throw Error('No usable page titles remain after filtering. Try another export or the sample portrait.');
  return titles;
}
