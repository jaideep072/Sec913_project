// translate.js — free translation via MyMemory API.
// No API key needed. CORS-enabled, callable directly from the browser.
// Limits: ~5 000 chars/day per IP (50 000 with an email in `de` param).
// Each request: max ~500 bytes.

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

/** Supported target languages (common subset). */
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'bn', name: 'Bengali' },
  { code: 'tr', name: 'Turkish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'el', name: 'Greek' },
];

function decodeHtml(html) {
  if (!html) return '';
  if (typeof document !== 'undefined') {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

/**
 * Translate a single block of text.
 * @param {string} text   — text to translate
 * @param {string} target — target language code (e.g. 'es')
 * @param {string} source — source language code (default 'en')
 * @returns {Promise<string>} translated text
 */
export async function translateText(text, target, source = 'en') {
  if (!text || !target || target === source) return text;

  // Split text into small segments that fit comfortably in MyMemory API limits
  const maxSegmentLength = 300;
  const segments = [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n+/);
  
  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (trimmedPara === '') continue;
    
    if (trimmedPara.length <= maxSegmentLength) {
      segments.push(trimmedPara);
    } else {
      // Split paragraph by sentences
      const sentences = trimmedPara.match(/[^.!?\n]+[.!?\n]*/g) || [trimmedPara];
      let currentSegment = '';
      
      for (const sentence of sentences) {
        if ((currentSegment + sentence).length > maxSegmentLength) {
          if (currentSegment) {
            segments.push(currentSegment.trim());
          }
          if (sentence.length > maxSegmentLength) {
            // Split long sentence by clauses or commas
            const clauses = sentence.split(/[,;]/);
            let currentClause = '';
            for (const clause of clauses) {
              if ((currentClause + clause).length > maxSegmentLength) {
                if (currentClause) segments.push(currentClause.trim());
                currentClause = clause;
              } else {
                currentClause = currentClause ? currentClause + ', ' + clause : clause;
              }
            }
            if (currentClause) currentSegment = currentClause;
          } else {
            currentSegment = sentence;
          }
        } else {
          currentSegment = currentSegment ? currentSegment + ' ' + sentence : sentence;
        }
      }
      if (currentSegment) segments.push(currentSegment.trim());
    }
  }

  if (segments.length === 0) return '';

  // Translate each segment and join
  const results = await Promise.all(
    segments.map(async (seg) => {
      const params = new URLSearchParams({
        q: seg,
        langpair: `${source}|${target}`,
        de: 'student@stemportal.local'
      });

      try {
        const res = await fetch(`${MYMEMORY_URL}?${params}`);
        const data = await res.json();
        const translated = data?.responseData?.translatedText;
        return translated ? decodeHtml(translated) : seg;
      } catch {
        return seg; // fallback to original on error
      }
    })
  );

  return results.join('\n\n');
}

