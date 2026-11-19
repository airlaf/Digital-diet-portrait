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
  // Use genuinely uncategorized search words for natural camera-color tiles.
  // Sample evenly across the alphabetized pool rather than taking only its first letters.
  const snapshot = window.EXHIBIT_SEARCH_SAMPLE;
  const miscPool = [...new Set(snapshot?.words || [])]
    .filter(word => isAcceptableWordToken(word) && topicForWord(word) === TOPIC_IDS.OTHER)
    .sort();
  const miscCount = Math.min(400, miscPool.length);
  const miscWords = Array.from({ length: miscCount }, (_, i) =>
    miscPool[Math.floor(i * (miscPool.length - 1) / Math.max(1, miscCount - 1))]);
  const topicTarget = 1000 - miscCount;
  // Round-robin selection avoids letting the largest lexicon dominate the demo.
  const buckets = TOPIC_RULES.map(rule => [...rule.exact]
    .filter(word => isAcceptableWordToken(word) && topicForWord(word) === rule.id));
  const words = new Set();
  for (let offset = 0; words.size < topicTarget; offset++) {
    let found = false;
    for (const bucket of buckets) {
      if (offset < bucket.length) {
        found = true;
        words.add(bucket[offset]);
        if (words.size === topicTarget) break;
      }
    }
    if (!found) break;
  }
  for (const word of miscWords) words.add(word);
  if (!words.size) throw new Error('Sample vocabulary is unavailable. Please reload the page.');
  return {
    label: 'Curated sample',
    description: `${words.size.toLocaleString()} words: ${words.size - miscCount} across eight topics and ${miscCount} miscellaneous words from the June 2026 search sample. Miscellaneous tiles retain camera colors. A curated mix, not a popularity ranking.`,
    sourceUrl: miscCount ? snapshot.sourceUrl : null,
    freq: Object.fromEntries([...words].map(word => [word, 1])),
  };
}
