/** Both presets contain equal-weight, filtered words; no invented popularity counts. */
function buildExhibitionSample(kind) {
  if (kind === 'search-2026') {
    const snapshot = window.EXHIBIT_SEARCH_SAMPLE;
    if (!snapshot || !Array.isArray(snapshot.words)) throw new Error('Search sample unavailable. Try the curated sample.');
    const words = [...new Set(snapshot.words)].filter(word => isAcceptableWordToken(word));
    if (!words.length) throw new Error('No usable search sample words are available.');
    return {
      label: 'June 2026 search sample',
      description: `${words.length} filtered words from OpenRush’s 1,000-query Google search snapshot, June 2026. Search estimates, not browsing history; words are shown equally.`,
      sourceUrl: snapshot.sourceUrl,
      freq: Object.fromEntries(words.map(word => [word, 1])),
    };
  }
  // Round-robin selection avoids letting the largest lexicon dominate the demo.
  const buckets = TOPIC_RULES.map(rule => [...rule.exact]
    .filter(word => isAcceptableWordToken(word) && topicForWord(word) === rule.id));
  const words = new Set();
  for (let offset = 0; words.size < 1000; offset++) {
    let found = false;
    for (const bucket of buckets) {
      if (offset < bucket.length) {
        found = true;
        words.add(bucket[offset]);
        if (words.size === 1000) break;
      }
    }
    if (!found) break;
  }
  if (!words.size) throw new Error('Sample vocabulary is unavailable. Please reload the page.');
  return {
    label: 'Curated sample',
    description: `${words.size.toLocaleString()} words across culture, tech, health, money, science, politics, social and everyday life. A curated mix, not a popularity ranking.`,
    sourceUrl: null,
    freq: Object.fromEntries([...words].map(word => [word, 1])),
  };
}
