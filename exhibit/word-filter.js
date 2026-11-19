/* Shared by the phone, relay and portrait. Keep additions here, not in each UI. */
(() => {
  const exact = new Set(`anal anally anus arse ass asses asshole assholes bastard bastards bitch bitches bitchy blowjob blowjobs boner boners boob boobs boobies breast breasts cock cocks cunt cunts cum cums cumming cumshot cumshots dildo dildos dick dicks erection erections fetish fetishes handjob handjobs hentai horny intercourse jizz kink kinky lust milf milfs naked nipple nipples nude nudes nudity nsfw orgasm orgasms orgy orgies penis penises pussy pussies rape raped rapes rapist sex sexual sexually sexuality sexy sext sexting slut sluts slutty sperm testicle testicles tit tits titties vagina vaginal vulva whore whores xxx xvideos xhamster redtube youporn onlyfans`.split(/\s+/));
  function normalize(value) {
    return String(value).normalize('NFKD').toLowerCase()
      .replace(/[\p{M}\p{Cf}]/gu, '')
      .replace(/^[^\p{L}\p{N}@$]+|[^\p{L}\p{N}@$]+$/gu, '')
      .replace(/[013457@$!]/g, c => ({0:'o',1:'i',3:'e',4:'a',5:'s',7:'t','@':'a','$':'s','!':'i'}[c]))
      .replace(/[^a-z]/g, '');
  }
  function isBlocked(value) {
    const word = normalize(value);
    return exact.has(word) || /porn|fuck|shit/.test(word) || /^(masturbat|ejaculat|orgasm|erotic|paedophil|pedophil|faggot)/.test(word);
  }
  function sanitizeText(value) {
    // Remove zero-width characters before splitting so they cannot break a match.
    return String(value ?? '').replace(/\p{Cf}/gu, '').replace(/[\p{L}\p{M}\p{N}@$!*._-]+/gu, token => isBlocked(token) ? ' ' : token);
  }
  globalThis.ExhibitWordFilter = Object.freeze({isBlocked, sanitizeText});
})();
