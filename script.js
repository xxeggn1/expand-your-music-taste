/* ==========================================================================
   EXPAND YOUR MUSIC TASTE — quiz engine + Last.fm integration + manual albums
   Albums shown in results come from TWO sources, merged and scored together:
     1) Live Last.fm tag/artist lookups (as before)
     2) A hand-picked MANUAL_ALBUMS list below, so certain records always
        have a shot at appearing even if a given Last.fm tag comes back thin.
   Manual albums still get real cover art / description / links pulled live
   from Last.fm's album.getInfo — only the "which albums exist" part is
   hardcoded, not the artwork or metadata.
   ========================================================================== */

const LASTFM_API_KEY = '67e0d954a7e0731a2b34da83292bd5e3';
const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/';

const RESULTS_PER_PAGE = 6;
const MAX_PAGES = 3;
const MAX_RESULTS = RESULTS_PER_PAGE * MAX_PAGES; // hard cap: 18 albums, 3 pages, no more.

/* -------------------------------------------------- quiz content */

const GENRES = [
  ['Rock','rock'], ['Alt Rock','alternative rock'], ['Post-Punk','post-punk'],
  ['Shoegaze','shoegaze'], ['Grunge','grunge'], ['Punk','punk'],
  ['Pop','pop'], ['Synth-Pop','synthpop'], ['Hip-Hop','hip hop'],
  ['Trap','trap'], ['Boom Bap','boom bap'], ['R&B','rnb'],
  ['Neo-Soul','neo soul'], ['Soul','soul'], ['Funk','funk'],
  ['Disco','disco'], ['Electronic','electronic'], ['House','house'],
  ['Techno','techno'], ['Synthwave','synthwave'], ['Ambient','ambient'],
  ['IDM','idm'], ['Jazz','jazz'], ['Jazz Fusion','jazz fusion'],
  ['Classical','classical'], ['Metal','metal'], ['Black Metal','black metal'],
  ['Doom Metal','doom metal'], ['Indie','indie'], ['Indie Folk','indie folk'],
  ['Folk','folk'], ['Country','country'], ['Reggae','reggae'],
  ['Dub','dub'], ['Latin','latin'], ['Reggaeton','reggaeton'],
  ['K-Pop','k-pop'], ['Blues','blues'], ['Ska','ska'],
  ['Emo','emo'], ['Lo-Fi','lo-fi'], ['Experimental','experimental'],
];

/* ==========================================================================
   MANUAL ALBUMS — edit this list freely.
   Each entry:
     artist, name, year   — real facts about the release
     genreTag             — MUST exactly match one of the tag values in the
                             GENRES array above (the second item in each pair,
                             e.g. 'shoegaze', 'alternative rock', 'k-pop')
     tags                 — any of the mood/production/energy/context/
                             instrumentation VALUES used in the QUESTIONS
                             below (not the labels). Valid values to pick from:
       mood:            upbeat, chillout, dark, melancholic, experimental
       production:      lo-fi  (leave out entirely for "polished/doesn't matter")
       energy:          energetic, groovy, atmospheric
       context:         study, workout, party, late night, driving
       instrumentation: guitar, electronic, piano, bass
   The more tags an entry shares with a user's answers, the more likely it
   is to surface. You don't need to fill in every category — a couple of
   well-chosen tags per album is plenty.
   ========================================================================== */
const MANUAL_ALBUMS = [
  { artist:'Slowdive', name:'Souvlaki', year:1993, genreTag:'shoegaze',
    tags:['dreamy','atmospheric','guitar','late night'] },
  { artist:'My Bloody Valentine', name:'Loveless', year:1991, genreTag:'shoegaze',
    tags:['dreamy','atmospheric','guitar','experimental'] },
  { artist:'Radiohead', name:'In Rainbows', year:2007, genreTag:'alternative rock',
    tags:['melancholic','atmospheric','guitar','study'] },
  { artist:'Radiohead', name:'Kid A', year:2000, genreTag:'alternative rock',
    tags:['dark','experimental','electronic','late night'] },
  { artist:'Nirvana', name:'Nevermind', year:1991, genreTag:'grunge',
    tags:['energetic','guitar','dark'] },
  { artist:'Kendrick Lamar', name:'To Pimp a Butterfly', year:2015, genreTag:'hip hop',
    tags:['dark','melancholic','bass','study'] },
  { artist:'J Dilla', name:'Donuts', year:2006, genreTag:'boom bap',
    tags:['chillout','bass','study','instrumental'] },
  { artist:"D'Angelo", name:'Voodoo', year:2000, genreTag:'neo soul',
    tags:['groovy','chillout','late night'] },
  { artist:'Erykah Badu', name:'Mama\u2019s Gun', year:2000, genreTag:'neo soul',
    tags:['groovy','chillout','vocal'] },
  { artist:'Daft Punk', name:'Discovery', year:2001, genreTag:'house',
    tags:['upbeat','energetic','electronic','party'] },
  { artist:'Aphex Twin', name:'Selected Ambient Works 85-92', year:1992, genreTag:'ambient',
    tags:['chillout','atmospheric','electronic','study'] },
  { artist:'Boards of Canada', name:'Music Has the Right to Children', year:1998, genreTag:'idm',
    tags:['atmospheric','melancholic','electronic','late night'] },
  { artist:'John Coltrane', name:'A Love Supreme', year:1965, genreTag:'jazz',
    tags:['atmospheric','experimental','instrumental'] },
  { artist:'Miles Davis', name:'Kind of Blue', year:1959, genreTag:'jazz',
    tags:['chillout','atmospheric','instrumental','late night'] },
  { artist:'Black Sabbath', name:'Paranoid', year:1970, genreTag:'metal',
    tags:['dark','energetic','guitar'] },
  { artist:'Mitski', name:'Be the Cowboy', year:2018, genreTag:'indie',
    tags:['melancholic','vocal','study'] },
  { artist:'Big Thief', name:'U.F.O.F.', year:2019, genreTag:'indie folk',
    tags:['dreamy','atmospheric','guitar'] },
  { artist:'Fleet Foxes', name:'Fleet Foxes', year:2008, genreTag:'folk',
    tags:['chillout','guitar','driving'] },
  { artist:'Bon Iver', name:'For Emma, Forever Ago', year:2007, genreTag:'folk',
    tags:['melancholic','atmospheric','guitar','late night'] },
  { artist:'Fela Kuti', name:'Zombie', year:1976, genreTag:'funk',
    tags:['groovy','energetic','party'] },
  { artist:'Bob Marley & The Wailers', name:'Legend', year:1984, genreTag:'reggae',
    tags:['chillout','groovy','driving'] },
  { artist:'ABBA', name:'Arrival', year:1976, genreTag:'disco',
    tags:['upbeat','party','vocal'] },
  { artist:'NewJeans', name:'Get Up', year:2023, genreTag:'k-pop',
    tags:['upbeat','energetic','party'] },
  { artist:'Frank Ocean', name:'Blonde', year:2016, genreTag:'rnb',
    tags:['melancholic','atmospheric','late night'] },
  { artist:'Rage Against the Machine', name:'Rage Against the Machine', year:1992, genreTag:'punk',
    tags:['dark','energetic','guitar','workout'] },
  { artist:'Death Grips', name:'The Money Store', year:2012, genreTag:'experimental',
    tags:['dark','energetic','experimental','workout'] },
  { artist:'Burial', name:'Untrue', year:2007, genreTag:'electronic',
    tags:['dark','atmospheric','late night','electronic'] },
  { artist:'Amy Winehouse', name:'Back to Black', year:2006, genreTag:'soul',
    tags:['melancholic','vocal','late night'] },
  { artist:'Tyler, The Creator', name:'Flower Boy', year:2017, genreTag:'hip hop',
    tags:['dreamy','melancholic','driving'] },
  { artist:'Vince Guaraldi Trio', name:'A Charlie Brown Christmas', year:1965, genreTag:'jazz',
    tags:['chillout','piano','instrumental'] },
];

// Several real search terms per genre (not albums) so a single genre pick
// pulls from many corners of Last.fm's catalog instead of one query's top
// results — this is what makes the randomizer feel like it's drawing from
// the whole catalog rather than a small fixed set.
const GENRE_QUERY_TERMS = {
  'Rock': ['rock', 'classic rock', 'alternative rock', 'indie rock', 'punk rock'],
  'Pop': ['pop', 'pop rock', 'synth pop', 'dance pop', 'indie pop'],
  'Hip-Hop': ['hip hop', 'rap', 'trap', 'conscious hip hop', 'boom bap'],
  'R&B': ['r&b', 'soul', 'neo soul', 'contemporary r&b', 'funk'],
  'Indie': ['indie', 'indie folk', 'indie pop', 'dream pop', 'lo-fi'],
  'Metal': ['metal', 'heavy metal', 'metalcore', 'death metal', 'thrash metal'],
  'Jazz': ['jazz', 'smooth jazz', 'bebop', 'jazz fusion', 'big band'],
  'Folk': ['folk', 'folk rock', 'singer songwriter', 'americana', 'bluegrass'],
  'Electronic': ['electronic', 'house', 'techno', 'edm', 'ambient'],
  'K-pop': ['k-pop', 'korean pop', 'k-hip hop', 'k-rnb', 'korean ballad'],
};

const QUESTIONS = [
  {
    key:'genre', eyebrow:'Question 1 of 10 — lay the foundation',
    title:'Pick your poison. Subgenres welcome, snobbery encouraged.',
    type:'genre',
    options: GENRES.map(([label,tag])=>({label, value:tag})),
  },
  {
    key:'era', eyebrow:'Question 2 of 10 — set the dial',
    title:'What decade should the needle drop on?',
    options:[
      {label:'60s–70s — roots & revolution', value:'70s'},
      {label:'80s–90s — neon & noise', value:'90s'},
      {label:'2000s–2010s — the blog era', value:'2000s'},
      {label:'2020s–now — fresh pressings', value:'2020s'},
      {label:'Shuffle across every decade', value:''},
    ],
  },
  {
    key:'mood', eyebrow:'Question 3 of 10 — feelings check',
    title:'What mood are you chasing right now?',
    options:[
      {label:'Energetic & upbeat', value:'upbeat'},
      {label:'Chill & mellow', value:'chillout'},
      {label:'Dark & intense', value:'dark'},
      {label:'Emotional & introspective', value:'melancholic'},
      {label:'Experimental & weird', value:'experimental'},
    ],
  },
  {
    key:'vocal', eyebrow:'Question 4 of 10 — mic check',
    title:'How loud should the singer be in the room?',
    options:[
      {label:'Powerful, belting vocals', value:'vocal'},
      {label:'Soft, airy vocals', value:'dreamy'},
      {label:'Rap / spoken word', value:'rap'},
      {label:'Instrumental — no vocals', value:'instrumental'},
      {label:'Surprise me either way', value:''},
    ],
  },
  {
    key:'popularity', eyebrow:'Question 5 of 10 — cred check',
    title:'Chart-topper energy, deep-cut mystery, or both?',
    options:[
      {label:'Give me the known hits', value:'mainstream'},
      {label:'Take me underground', value:'underground'},
      {label:'A bit of both', value:'mixed'},
    ],
  },
  {
    key:'production', eyebrow:'Question 6 of 10 — texture check',
    title:'How should the recording sound — studio-shiny or tape-hiss real?',
    options:[
      {label:'Polished & pristine', value:''},
      {label:'Raw & lo-fi', value:'lo-fi'},
      {label:'Doesn\u2019t matter one bit', value:''},
    ],
  },
  {
    key:'energy', eyebrow:'Question 7 of 10 — set the speed',
    title:'Pick a tempo — how fast is your foot tapping?',
    options:[
      {label:'High energy, fast', value:'energetic'},
      {label:'Mid-tempo groove', value:'groovy'},
      {label:'Slow & atmospheric', value:'atmospheric'},
    ],
  },
  {
    key:'discovery', eyebrow:'Question 8 of 10 — risk tolerance',
    title:'How far outside your usual crate should we drag you?',
    options:[
      {label:'Keep it close to familiar', value:'close'},
      {label:'Push me a little further', value:'stretch'},
      {label:'Take me somewhere totally new', value:'deep'},
    ],
  },
  {
    key:'context', eyebrow:'Question 9 of 10 — scene-setting',
    title:'Where will this album actually get played?',
    options:[
      {label:'Studying / focusing', value:'study'},
      {label:'Working out', value:'workout'},
      {label:'Hosting a party', value:'party'},
      {label:'Late-night wind-down', value:'late night'},
      {label:'On a road trip', value:'driving'},
    ],
  },
  {
    key:'instrumentation', eyebrow:'Question 10 of 10 — the finish line',
    title:'Last one. What\u2019s actually driving the sound?',
    options:[
      {label:'Guitars', value:'guitar'},
      {label:'Synths & electronics', value:'electronic'},
      {label:'Piano & orchestration', value:'piano'},
      {label:'Beats & bass', value:'bass'},
      {label:'A mix of everything', value:''},
    ],
  },
];

/* -------------------------------------------------- state */

const state = { step:0, answers:{}, results:[], page:0 };

/* -------------------------------------------------- Last.fm calls */

function lfmUrl(params){
  const p = new URLSearchParams({ api_key:LASTFM_API_KEY, format:'json', ...params });
  return `${LASTFM_BASE}?${p.toString()}`;
}

async function fetchTopAlbumsByTag(tag, limit=50, page=1){
  try{
    const res = await fetch(lfmUrl({ method:'tag.gettopalbums', tag, limit, page }));
    if(!res.ok) return [];
    const data = await res.json();
    const list = data?.albums?.album || data?.topalbums?.album || [];
    return list.map(a=>({
      name:a.name,
      artist: (typeof a.artist === 'string') ? a.artist : (a.artist?.name || ''),
      url:a.url,
    })).filter(a=>a.name && a.artist);
  }catch(e){ return []; }
}

async function fetchAlbumInfo(artist, album){
  try{
    const res = await fetch(lfmUrl({ method:'album.getinfo', artist, album, autocorrect:1 }));
    if(!res.ok) return null;
    const data = await res.json();
    const info = data?.album;
    if(!info) return null;
    const images = info.image || [];
    const img = (images.find(i=>i.size==='extralarge') || images.find(i=>i.size==='large') || images[images.length-1] || {})['#text'] || '';
    const tags = (info.tags?.tag || []).map(t=>t.name);
    let summary = (info.wiki?.summary || '').replace(/<a[^>]*>.*?<\/a>/gi,'').replace(/<[^>]+>/g,'').trim();
    // NOTE: info.wiki.published is the date the *wiki text* was last edited,
    // not the album's release date — using it for the year was the cause of
    // decades-old albums showing up labelled "2020s". Year comes from tags now.
    return {
      name: info.name, artist: info.artist, url: info.url,
      image: img, tags, summary,
      listeners: info.listeners || '0',
    };
  }catch(e){ return null; }
}

// Reads an actual release year/decade out of the album's own Last.fm tags,
// since those are crowd-assigned to the record itself rather than a wiki edit.
function deriveEra(tags){
  for(const t of tags){
    const m = t.trim().match(/^(19|20)\d{2}$/);
    if(m) return { exactYear: m[0], decadeStart: null };
  }
  for(const t of tags){
    const d = tagToDecadeStart(t);
    if(d !== null) return { exactYear: null, decadeStart: d };
  }
  return { exactYear: null, decadeStart: null };
}

/* -------------------------------------------------- scoring / curation */

// Real year ranges for hard filtering — this is what actually keeps a
// "80s-90s" answer from letting a 2020s album slip through.
const ERA_RANGES = {
  '70s':   [1960, 1979],
  '90s':   [1980, 1999],
  '2000s': [2000, 2019],
  '2020s': [2020, 2029],
};

function shuffleInPlace(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Picks a random page (1..maxPage) of Last.fm's ranked list for a tag, so
// two calls with the same tag don't always fetch the identical top-50 —
// still real, tag-matched albums (just a different, still-popular slice of
// the ranking), which is what lets the *candidate pool itself* vary between
// runs instead of only ever drawing from one fixed list.
function randomPage(maxPage){
  return Math.floor(Math.random() * maxPage) + 1;
}

// Splits scored entries into `bucketCount` priority tiers (tier 0 = most
// relevant to the quiz answers) and shuffles the order *within* each tier
// only. This is what makes retaking the quiz with identical answers surface
// a different set/order of albums each time without sacrificing accuracy —
// an album in a lower tier can never jump ahead of one in a higher tier, so
// results still track the answers; only the pick among comparably-relevant
// albums is randomized.
function tierShuffle(entries, bucketCount = 8){
  if(entries.length <= 1) return entries;
  const priorities = entries.map(e => e.priority);
  const max = Math.max(...priorities), min = Math.min(...priorities);
  const range = Math.max(max - min, 1e-9);
  const buckets = Array.from({ length: bucketCount }, () => []);
  entries.forEach(e => {
    const norm = (e.priority - min) / range; // 0 (least relevant) .. 1 (most)
    let idx = bucketCount - 1 - Math.floor(norm * bucketCount);
    idx = Math.min(Math.max(idx, 0), bucketCount - 1);
    buckets[idx].push(e);
  });
  buckets.forEach(shuffleInPlace);
  return buckets.flat();
}

function eraTagsFor(era){
  // Extra single-word tags to broaden the candidate pool for that range.
  const map = {
    '70s':['70s','60s','classic rock'],
    '90s':['90s','80s'],
    '2000s':['2000s','2010s'],
    '2020s':['2020s'],
  };
  return map[era] || [];
}

function tagToDecadeStart(tag){
  const t = tag.toLowerCase().trim();
  let m = t.match(/^(19|20)(\d)0s$/);           // "1980s"
  if(m) return parseInt(m[1] + m[2] + '0', 10);
  m = t.match(/^(\d)0s$/);                       // "80s"
  if(m){ const d = parseInt(m[1] + '0', 10); return d < 30 ? 2000 + d : 1900 + d; }
  return null;
}

function matchesEra(info, era){
  if(!era) return true;
  const range = ERA_RANGES[era];
  if(!range) return true;
  const { exactYear, decadeStart } = deriveEra(info.tags);
  if(exactYear){
    const y = parseInt(exactYear, 10);
    return y >= range[0] && y <= range[1];
  }
  if(decadeStart !== null){
    const decadeEnd = decadeStart + 9;
    return decadeStart <= range[1] && decadeEnd >= range[0];
  }
  return false; // unverifiable era → exclude rather than risk a wrong decade
}

// Scores every MANUAL_ALBUMS entry against the current answers using the
// same tag-overlap idea as the live Last.fm lists, so manual picks compete
// fairly instead of being force-inserted regardless of fit. Genre and era
// (when the user picked one) are hard requirements; everything else adds
// bonus score based on how many other answers the album's tags match.
function scoreManualAlbums(answers){
  const wantedTags = [answers.mood, answers.production, answers.energy, answers.context, answers.instrumentation]
    .filter(Boolean);
  const results = [];
  MANUAL_ALBUMS.forEach(m=>{
    if(answers.genre && m.genreTag !== answers.genre) return;
    if(answers.era){
      const range = ERA_RANGES[answers.era];
      if(range && !(m.year >= range[0] && m.year <= range[1])) return;
    }
    const hits = m.tags.filter(t => wantedTags.includes(t)).length;
    results.push({
      album: { name:m.name, artist:m.artist, url:'' },
      score: 60 + hits * 15, // baseline competitive with a strong live hit, boosted per matching tag
      hits: hits + 1,
      manualYear: m.year,
    });
  });
  return results;
}

async function buildResults(answers){
  const genreTag = answers.genre;
  const secondaryTags = [answers.mood, answers.production, answers.energy, answers.context, answers.instrumentation]
    .filter(Boolean);
  const eraTags = eraTagsFor(answers.era);
  const compoundTag = answers.era ? `${answers.era} ${genreTag}` : null;

  const [primary, compound] = await Promise.all([
    fetchTopAlbumsByTag(genreTag, 50, randomPage(2)),
    compoundTag ? fetchTopAlbumsByTag(compoundTag, 50, randomPage(2)) : Promise.resolve([]),
  ]);
  const secondaryLists = await Promise.all(
    [...secondaryTags, ...eraTags].map(t => fetchTopAlbumsByTag(t, 40, randomPage(3)))
  );

  const scoreMap = new Map();
  const key = a => `${a.artist}|||${a.name}`.toLowerCase();

  // Compound "era + genre" tag (e.g. "90s rock") is the strongest signal we
  // have, so it's weighted above even the plain genre list.
  compound.forEach((a,i)=>{
    scoreMap.set(key(a), { album:a, score:(50-i)*3, hits:2 });
  });

  primary.forEach((a,i)=>{
    const k = key(a);
    if(scoreMap.has(k)){ scoreMap.get(k).score += (50-i)*2; scoreMap.get(k).hits += 1; }
    else{ scoreMap.set(k, { album:a, score:(50-i)*2, hits:1 }); }
  });

  const allowCrossTag = answers.discovery !== 'close';
  secondaryLists.forEach(list=>{
    list.forEach((a,i)=>{
      const k = key(a);
      if(scoreMap.has(k)){
        const entry = scoreMap.get(k);
        entry.score += (40-i);
        entry.hits += 1;
      } else if(allowCrossTag){
        scoreMap.set(k, { album:a, score:(40-i)*0.4, hits:1 });
      }
    });
  });

  // Merge in the manual catalog, scored against the same answers. If a
  // manual album happens to also show up from Last.fm's live lists above,
  // the live entry (with its accumulated score) wins and the manual score
  // is skipped for that title, so nothing is scored twice.
  scoreManualAlbums(answers).forEach(entry=>{
    const k = key(entry.album);
    if(!scoreMap.has(k)) scoreMap.set(k, entry);
  });

  let scored = Array.from(scoreMap.values());

  // Same "mainstream vs underground vs mixed" intent as before, just
  // expressed as one comparable number so it can drive the tiered shuffle
  // below instead of a single fixed sort.
  const priorityOf = (entry) => {
    if(answers.popularity === 'underground') return -(entry.score / entry.hits);
    if(answers.popularity === 'mainstream') return entry.score;
    return entry.score * entry.hits;
  };
  scored.forEach(entry => { entry.priority = priorityOf(entry); });
  scored = tierShuffle(scored, 8);

  // De-dupe by artist so one act can't fill the whole shelf.
  const seenArtist = new Map();
  const candidates = [];
  for(const entry of scored){
    const artistKey = entry.album.artist.toLowerCase();
    const count = seenArtist.get(artistKey) || 0;
    if(count >= 2) continue;
    seenArtist.set(artistKey, count+1);
    candidates.push(entry.album);
    // Cast a wide net — era filtering below will reject a lot of these.
    if(candidates.length >= MAX_RESULTS * 5) break;
  }

  // Enrich with real details from Last.fm and hard-filter by era as we go.
  // Manual albums use their own known `year` for the era check (since we
  // already have ground truth), rather than relying on Last.fm's own tags
  // possibly missing a clear decade/year tag for that release.
  const enriched = [];
  const batchSize = 6;
  for(let i=0; i<candidates.length && enriched.length < MAX_RESULTS; i += batchSize){
    const batch = candidates.slice(i, i+batchSize);
    const infos = await Promise.all(batch.map(c => fetchAlbumInfo(c.artist, c.name)));
    infos.forEach((info, idx)=>{
      const c = batch[idx];
      const manual = MANUAL_ALBUMS.find(m =>
        m.artist.toLowerCase() === c.artist.toLowerCase() &&
        m.name.toLowerCase() === c.name.toLowerCase()
      );
      const eraOk = manual
        ? (!answers.era || (ERA_RANGES[answers.era] &&
            manual.year >= ERA_RANGES[answers.era][0] &&
            manual.year <= ERA_RANGES[answers.era][1]))
        : matchesEra(info || {tags:[]}, answers.era);

      if(info && info.name && info.artist && eraOk){
        if(!info.summary){
          const shownTags = info.tags.slice(0,3);
          info.summary = shownTags.length
            ? `A ${genreLabel(genreTag)} record carrying the tags ${shownTags.join(', ')}.`
            : `A ${genreLabel(genreTag)} record, sitting quietly in Last.fm's crates.`;
        }
        // If Last.fm didn't return any usable tags for era display, fall
        // back to the manual album's known year so it still shows correctly.
        if(manual && !info.tags.some(t => /^(19|20)\d{2}$/.test(t.trim()))){
          info.tags = [...info.tags, String(manual.year)];
        }
        enriched.push(info);
      }
    });
  }

  return enriched.slice(0, MAX_RESULTS);
}

function genreLabel(tag){
  const found = GENRES.find(([,t]) => t === tag);
  return found ? found[0] : tag;
}

/* -------------------------------------------------- DOM: quiz */

const quizEl = document.getElementById('quiz');
const resultsEl = document.getElementById('results');
const heroEl = document.getElementById('hero');

const progressFill = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');
const progressGenre = document.getElementById('progress-genre');
const tonearm = document.getElementById('tonearm');
const qEyebrow = document.getElementById('q-eyebrow');
const qTitle = document.getElementById('q-title');
const qOptions = document.getElementById('q-options');
const skipBtn = document.getElementById('quiz-skip');

const CIRCUMFERENCE = 2 * Math.PI * 24; // matches r=24 in the SVG

function startQuiz(){
  heroEl.style.display = 'none';
  quizEl.classList.add('active');
  resultsEl.classList.remove('active');
  state.step = 0;
  state.answers = {};
  renderQuestion();
}

function renderQuestion(){
  const q = QUESTIONS[state.step];
  qEyebrow.textContent = q.eyebrow;
  qTitle.textContent = q.title;
  qOptions.className = 'q-options' + (q.type === 'genre' ? ' genre-grid' : '');
  qOptions.innerHTML = '';

  q.options.forEach(opt=>{
    const btn = document.createElement('button');
    btn.className = 'opt';
    btn.type = 'button';
    btn.textContent = opt.label;
    if(state.answers[q.key] === opt.value){ btn.classList.add('selected'); }
    btn.addEventListener('click', ()=>{
      state.answers[q.key] = opt.value;
      state.answers[q.key + '_label'] = opt.label;
      advance();
    });
    qOptions.appendChild(btn);
  });

  skipBtn.style.visibility = q.type === 'genre' ? 'hidden' : 'visible';

  const pct = state.step / QUESTIONS.length;
  const offset = CIRCUMFERENCE * (1 - pct);
  progressFill.style.strokeDasharray = `${CIRCUMFERENCE}`;
  progressFill.style.strokeDashoffset = `${offset}`;
  progressLabel.innerHTML = `<b>${state.step+1}</b> / ${QUESTIONS.length}`;
  progressGenre.textContent = state.answers.genre_label ? `Genre: ${state.answers.genre_label}` : '';
  tonearm.style.transform = `rotate(${-24 + pct*30}deg)`;
}

function advance(){
  if(state.step < QUESTIONS.length - 1){
    state.step += 1;
    renderQuestion();
  } else {
    finishQuiz();
  }
}

skipBtn.addEventListener('click', ()=>{
  const q = QUESTIONS[state.step];
  if(state.answers[q.key] === undefined){ state.answers[q.key] = ''; state.answers[q.key+'_label'] = ''; }
  advance();
});

async function finishQuiz(){
  quizEl.classList.remove('active');
  resultsEl.classList.add('active');
  renderResultsSummary();
  renderState('loading');
  window.scrollTo({ top:0, behavior:'smooth' });

  try{
    const results = await buildResults(state.answers);
    state.results = results;
    state.page = 0;
    if(!results.length){ renderState('empty'); }
    else{ renderAlbumPage(); }
  }catch(e){
    renderState('error');
  }
}

/* -------------------------------------------------- DOM: results */

const summaryEl = document.getElementById('results-summary');
const stateBoxEl = document.getElementById('state-box');
const albumGridEl = document.getElementById('album-grid');
const pagerEl = document.getElementById('pager');

function renderResultsSummary(){
  const a = state.answers;
  summaryEl.innerHTML = `
    <p class="eyebrow" style="text-align:center; justify-content:center;"><span class="eq-bars" aria-hidden="true"><span></span><span></span><span></span><span></span></span> Your shelf, freshly pulled</p>
    <h2><span class="marker">${a.genre_label || 'Your genre'}</span>, interrogated across ${QUESTIONS.length} questions</h2>
    <div class="tag-row">
      ${[a.era_label, a.mood_label, a.vocal_label, a.popularity_label, a.production_label, a.energy_label, a.discovery_label, a.context_label, a.instrumentation_label]
        .filter(Boolean).map(t=>`<span class="tag-pill">${t}</span>`).join('')}
    </div>
  `;
}

function renderState(kind){
  albumGridEl.innerHTML = '';
  pagerEl.innerHTML = '';
  if(kind === 'loading'){
    stateBoxEl.innerHTML = `
      <div class="eq-bars" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
      <div class="vinyl"></div>
      <p>Crate-digging through Last.fm for records that actually match&hellip; hang tight, this needle doesn't skip.</p>`;
    stateBoxEl.className = 'state-box';
  } else if(kind === 'empty'){
    stateBoxEl.innerHTML = `<p>Well, that's awkward — the crate came up empty for that exact combo. Retake the quiz and loosen one constraint; the algorithm will forgive you.</p>`;
    stateBoxEl.className = 'state-box';
  } else if(kind === 'error'){
    stateBoxEl.innerHTML = `<p>Last.fm didn't pick up the phone. Check your connection and give the quiz another spin.</p>`;
    stateBoxEl.className = 'state-box error';
  }
  stateBoxEl.style.display = 'block';
}

function renderAlbumPage(){
  stateBoxEl.style.display = 'none';
  const start = state.page * RESULTS_PER_PAGE;
  const pageItems = state.results.slice(start, start + RESULTS_PER_PAGE);

  albumGridEl.innerHTML = pageItems.map((album, i)=>{
    const artHtml = album.image
      ? `<img src="${album.image}" alt="${escapeHtml(album.name)} cover art" loading="lazy">`
      : `<div class="no-art">No cover art on file — click through to Last.fm</div>`;
    const genre = album.tags.find(t => GENRES.some(([,tag]) => tag === t.toLowerCase())) || album.tags[0] || genreLabel(state.answers.genre);
    const { exactYear, decadeStart } = deriveEra(album.tags);
    const yearText = exactYear ? exactYear : (decadeStart !== null ? `${decadeStart}s` : 'Year unknown');
    const yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(album.artist + ' ' + album.name)}`;
    const sp = `https://open.spotify.com/search/${encodeURIComponent(album.artist + ' ' + album.name)}`;
    const tilt = ((i % 2 === 0) ? -1 : 1) * (0.6 + (i % 3) * 0.5);
    const style = `--tilt:${tilt}deg; animation-delay:${i * 0.05}s;`;
    return `
      <article class="album-card" style="${style}">
        <div class="album-art">${artHtml}</div>
        <div class="album-body">
          <p class="album-meta">${escapeHtml(genre)} &middot; ${escapeHtml(yearText)}</p>
          <h3 class="album-title">${escapeHtml(album.name)}</h3>
          <p class="album-artist">${escapeHtml(album.artist)}</p>
          <p class="album-desc">${escapeHtml(truncate(album.summary, 160))}</p>
          <div class="album-links">
            <a href="${album.url}" target="_blank" rel="noopener">Last.fm ↗</a>
            <a href="${sp}" target="_blank" rel="noopener">Spotify ↗</a>
            <a href="${yt}" target="_blank" rel="noopener">YouTube ↗</a>
          </div>
        </div>
      </article>`;
  }).join('');

  renderPager();
}

function renderPager(){
  const totalPages = Math.min(MAX_PAGES, Math.ceil(state.results.length / RESULTS_PER_PAGE));
  if(totalPages <= 1){ pagerEl.innerHTML = ''; return; }

  let dots = '';
  for(let i=0;i<totalPages;i++){
    dots += `<button class="pager-dot ${i===state.page?'active':''}" data-page="${i}" aria-label="Page ${i+1}"></button>`;
  }
  pagerEl.innerHTML = `
    <button id="pager-prev" ${state.page===0?'disabled':''} aria-label="Previous page">&larr;</button>
    <div class="pager-dots">${dots}</div>
    <button id="pager-next" ${state.page>=totalPages-1?'disabled':''} aria-label="Next page">&rarr;</button>
  `;
  document.getElementById('pager-prev')?.addEventListener('click', ()=>{ state.page--; renderAlbumPage(); window.scrollTo({top:summaryEl.offsetTop-40, behavior:'smooth'}); });
  document.getElementById('pager-next')?.addEventListener('click', ()=>{ state.page++; renderAlbumPage(); window.scrollTo({top:summaryEl.offsetTop-40, behavior:'smooth'}); });
  pagerEl.querySelectorAll('.pager-dot').forEach(dot=>{
    dot.addEventListener('click', ()=>{ state.page = Number(dot.dataset.page); renderAlbumPage(); });
  });
}

function escapeHtml(str=''){
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function truncate(str='', n){
  if(str.length <= n) return str;
  return str.slice(0, n-1).trimEnd() + '…';
}

/* -------------------------------------------------- wiring */

document.getElementById('start-quiz')?.addEventListener('click', startQuiz);
document.getElementById('start-quiz-2')?.addEventListener('click', startQuiz);
document.getElementById('retake')?.addEventListener('click', ()=>{
  resultsEl.classList.remove('active');
  heroEl.style.display = '';
  quizEl.classList.add('active');
  state.step = 0; state.answers = {};
  renderQuestion();
  window.scrollTo({top:0, behavior:'smooth'});
});
