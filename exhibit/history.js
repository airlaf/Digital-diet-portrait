export function extractTitles(data) {
  if(data?.metadata?.data_type && data.metadata.data_type!=='history') throw Error('This is not a history export. Choose History.json.');
  const records=Array.isArray(data)?data:['history','items','entries','visits','data'].map(k=>data?.[k]).find(Array.isArray);
  if(!records) throw Error('No browsing history found. Choose the extracted History.json file.');
  const titles=records.map(r=>typeof r==='string'?r:r?.title??r?.pageTitle??r?.page_title??'').filter(t=>typeof t==='string'&&t.trim()).map(t=>t.trim().slice(0,500)).slice(0,10000);
  if(!titles.length) throw Error('This export contains no page titles to draw. Try another export or the sample portrait.');
  return titles;
}
