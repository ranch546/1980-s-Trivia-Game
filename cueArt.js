/**
 * ═══════════════════════════════════════════════════════════════════════════
 * cueArt.js — ANSWER CARD IMAGES (Presentation / Judge Guide)
 * ═══════════════════════════════════════════════════════════════════════════
 * WHAT IT DOES:
 *   Loads a picture for each answer choice on the trivia cards.
 *   1) Tries a built-in image map (Olympics, Reagan, Pac-Man, etc.)
 *   2) Falls back to Wikipedia API for the answer text
 *   3) Draws a styled placeholder if no image is found
 *
 * KEY FUNCTION: getThumb(question, answerIndex) → image URL for card
 * ═══════════════════════════════════════════════════════════════════════════
 */
/* Cue-card artwork — category icons + answer thumbnails */
window.AN = window.AN || {};
AN.CueArt = {};

AN.CueArt.CATEGORY_ICON = {
    'Sports': '🏟️',
    'Technology': '💾',
    'Historical Events': '📰'
};

AN.CueArt.CATEGORY_GRAD = {
    'Sports': ['#1a0a30', '#ff2bd6'],
    'Technology': ['#0a1038', '#00f5ff'],
    'Historical Events': ['#2a0a20', '#ffd54a']
};

AN.CueArt.LETTER_GRAD = {
    A: ['#3a1020', '#e63946'],
    B: ['#0a2840', '#00b4d8'],
    C: ['#3a3000', '#ffd60a'],
    D: ['#1a1030', '#8b5cf6']
};

AN.CueArt.IMAGE_MAP = {
    olympics: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Olympic_rings_without_rims.svg/200px-Olympic_rings_without_rims.svg.png',
    lakers: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Los_Angeles_Lakers_logo.svg/200px-Los_Angeles_Lakers_logo.svg.png',
    jordan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Michael_Jordan_Lipofsky.jpg/200px-Michael_Jordan_Lipofsky.jpg',
    apple: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Macintosh_128k_transparency.png',
    nintendo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nintendo.svg/200px-Nintendo.svg.png',
    reagan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Official_Portrait_of_President_Reagan_1981.jpg/200px-Official_Portrait_of_President_Reagan_1981.jpg',
    berlin: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Berlinermauer.jpg/200px-Berlinermauer.jpg',
    challenger: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Challenger_expansion.jpg/200px-Challenger_expansion.jpg',
    pacman: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Pacman.svg/200px-Pacman.svg.png',
    ibm: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/IBM_logo.svg/200px-IBM_logo.svg.png',
    gretzky: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Wayne_Gretzky_1997.jpg/200px-Wayne_Gretzky_1997.jpg',
    mtv: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/MTV_Logo.svg/200px-MTV_Logo.svg.png',
    microsoft: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/200px-Microsoft_logo.svg.png',
    mandela: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nelson_Mandela_1994.jpg/200px-Nelson_Mandela_1994.jpg',
    tyson: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Mike_Tyson_2019.jpg/200px-Mike_Tyson_2019.jpg'
};

AN.CueArt._cache = {};
AN.CueArt._imgCache = {};
AN.CueArt._wikiCache = {};
AN.CueArt._wikiPending = {};
AN.CueArt._faceTex = {};
AN.CueArt._phTex = {};
AN.CueArt._pending = {};

/** Wikimedia /thumb/… links work as-is — do not strip to full path (often 404) */
AN.CueArt.normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('data:')) return url;
    return url;
};

AN.CueArt._filePathFallback = (url) => {
    if (!url || !url.includes('wikimedia')) return null;
    const m = url.match(/\/([^/?#]+)(?:\?.*)?$/);
    if (!m) return null;
    return 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(decodeURIComponent(m[1]));
};

AN.CueArt.getImageUrlSync = (answerText) => {
    const url = AN.AnswerImages?.get?.(answerText) || AN.CueArt._lookupBuiltin((answerText || '').trim());
    return url || null;
};

AN.CueArt._setCardImg = (wrap, img, url, onFail) => {
    if (!wrap || !img || !url) return;
    wrap.classList.remove('loading');
    wrap.classList.add('has-img');
    wrap.style.removeProperty('--card-img');
    img.referrerPolicy = 'no-referrer';
    img.classList.remove('loaded', 'img-error');
    if (url.startsWith('data:')) {
        img.onload = () => {
            img.classList.add('loaded');
            img.classList.remove('img-error');
        };
        img.src = url;
        img.classList.add('loaded');
        return;
    }
    img.onload = () => {
        img.classList.add('loaded');
        img.classList.remove('img-error');
    };
    img.onerror = () => {
        img.classList.remove('loaded');
        img.classList.add('img-error');
        if (typeof onFail === 'function') {
            onFail();
            return;
        }
        wrap.classList.remove('has-img', 'loading');
    };
    img.src = url;
};

AN.CueArt._tryCardCandidates = (wrap, img, candidates, card, answerIndex, onExhausted) => {
    let i = 0;
    const tryNext = () => {
        if (card.dataset.idx !== String(answerIndex)) return;
        if (i >= candidates.length) {
            wrap.classList.remove('loading');
            if (typeof onExhausted === 'function') onExhausted();
            return;
        }
        const url = candidates[i++];
        wrap.classList.add('loading');
        AN.CueArt._setCardImg(wrap, img, url, tryNext);
    };
    tryNext();
};

/** Try URLs in order; returns first that loads in browser */
AN.CueArt._probeImageUrl = (candidates) => new Promise(resolve => {
    const list = [...new Set(candidates.filter(Boolean))];
    let i = 0;
    const tryNext = () => {
        if (i >= list.length) { resolve(null); return; }
        const url = list[i++];
        const probe = new Image();
        probe.referrerPolicy = 'no-referrer';
        probe.onload = () => resolve(url);
        probe.onerror = tryNext;
        probe.src = url;
    };
    tryNext();
});

AN.CueArt._candidatesForAnswer = (ans, cat, letter) => {
    const fallback = AN.CueArt._drawFallbackDataUrl(cat, letter, ans);
    const sync = AN.CueArt.getImageUrlSync(ans);
    const out = [];
    if (sync) {
        out.push(sync);
        const fp = AN.CueArt._filePathFallback(sync);
        if (fp && !out.includes(fp)) out.push(fp);
    }
    const slug = (ans || '').trim().replace(/ /g, '_');
    if (slug) {
        out.push(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(slug)}.jpg?width=640`);
        out.push(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(slug)}.png?width=640`);
    }
    out.push(fallback);
    return [...new Set(out.filter(Boolean))];
};

AN.CueArt._applyCardBg = (wrap, img, url) => {
    if (img) AN.CueArt._setCardImg(wrap, img, url);
};

/** Paint answer card — try mapped URLs in order, then Wikipedia, then canvas fallback */
AN.CueArt.paintCardImage = (card, question, answerIndex) => {
    const img = card?.querySelector('.tc-img');
    const wrap = card?.querySelector('.tc-img-wrap');
    if (!img || !wrap) return;

    const ans = question.answers[answerIndex] || '';
    const letter = AN.ANSWER_LABELS[answerIndex];
    const cat = question.category || 'Technology';
    const candidates = AN.CueArt._candidatesForAnswer(ans, cat, letter);
    const fallbackUrl = candidates[candidates.length - 1];
    if (fallbackUrl?.startsWith('data:')) {
        wrap.style.setProperty('--card-fallback', `url("${fallbackUrl}")`);
    } else {
        wrap.style.removeProperty('--card-fallback');
    }

    wrap.classList.remove('has-img');
    wrap.classList.add('loading');
    img.classList.remove('img-error', 'loaded');
    img.alt = ans || `Answer ${letter}`;
    img.removeAttribute('src');

    const tryWiki = () => {
        AN.CueArt._fetchWikiThumb(ans).then(url => {
            if (card.dataset.idx !== String(answerIndex)) return;
            if (!url) {
                AN.CueArt._finishCardWithFallback(wrap, img, fallbackUrl);
                return;
            }
            AN.CueArt._setCardImg(wrap, img, url, () => AN.CueArt._finishCardWithFallback(wrap, img, fallbackUrl));
            AN.CueArt._cache['url|' + ans.toLowerCase()] = url;
        });
    };

    const remote = candidates.slice(0, -1);
    if (!remote.length) {
        tryWiki();
        return;
    }

    AN.CueArt._tryCardCandidates(wrap, img, remote, card, answerIndex, () => {
        tryWiki();
    });
};

AN.CueArt._finishCardWithFallback = (wrap, img, fallbackUrl) => {
    if (!wrap || !img || !fallbackUrl) return;
    wrap.classList.remove('loading');
    wrap.classList.add('has-img');
    AN.CueArt._setCardImg(wrap, img, fallbackUrl);
};

/** Preload all four answer images for a question */
AN.CueArt.preloadQuestionImages = (question) => {
    if (!question) return Promise.resolve();
    const ready = AN._imagesReady || Promise.resolve();
    return ready.then(() => Promise.all(
        [0, 1, 2, 3].map(i => {
            const ans = question.answers[i];
            if (!ans) return Promise.resolve();
            return AN.CueArt._probeImageUrl(AN.CueArt._candidatesForAnswer(
                ans, question.category || 'Technology', AN.ANSWER_LABELS[i]
            ).slice(0, -1));
        })
    ));
};

AN.CueArt._hex = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0');

AN.CueArt._matchUrl = (answerText, questionText) => {
    const blob = (answerText + ' ' + questionText).toLowerCase();
    for (const [key, url] of Object.entries(AN.CueArt.IMAGE_MAP)) {
        if (blob.includes(key)) return AN.AnswerImages?.normalizeUrl?.(url) || url;
    }
    return null;
};

AN.CueArt._wikiTitle = (answerText) => {
    const map = {
        'soviet union': 'Soviet Union', 'united states': 'United States', 'south korea': 'South Korea',
        'ronald reagan': 'Ronald Reagan', 'margaret thatcher': 'Margaret Thatcher',
        'michael jordan': 'Michael Jordan', 'wayne gretzky': 'Wayne Gretzky',
        'nelson mandela': 'Nelson Mandela', 'mikhail gorbachev': 'Mikhail Gorbachev',
        'steve jobs': 'Steve Jobs', 'bill gates': 'Bill Gates', 'mike tyson': 'Mike Tyson',
        'carl lewis': 'Carl Lewis', 'diego maradona': 'Diego Maradona', 'ben johnson': 'Ben Johnson',
        'pete rose': 'Pete Rose', 'garry kasparov': 'Garry Kasparov', 'greg louganis': 'Greg Louganis',
        'berlin wall': 'Berlin Wall', 'chernobyl': 'Chernobyl disaster', 'pac-man': 'Pac-Man',
        'nintendo': 'Nintendo', 'microsoft': 'Microsoft', 'apple': 'Apple Inc.',
        'ibm': 'IBM', 'intel': 'Intel', 'motorola': 'Motorola', 'nato': 'NATO',
        'cabbage patch kids': 'Cabbage Patch Kids', 'care bears': 'Care Bears',
        'transformers': 'Transformers (toy line)', 'my little pony': 'My Little Pony',
        'walkman': 'Walkman', 'game boy': 'Game Boy',
        'space shuttle': 'Space Shuttle', 'columbia': 'Space Shuttle Columbia', 'challenger': 'Space Shuttle Challenger',
        'discovery': 'Space Shuttle Discovery', 'atlantis': 'Space Shuttle Atlantis',
        'voyager 2': 'Voyager 2', 'halley\'s comet': 'Halley\'s Comet', 'black monday': 'Black Monday (1987)',
        'inf treaty': 'Intermediate-Range Nuclear Forces Treaty', 'floppy disk': 'Floppy disk',
        'mount st. helens': 'Mount St. Helens', 'mount st. helens volcano': 'Mount St. Helens',
        'george h.w. bush': 'George H. W. Bush', 'john paul ii': 'Pope John Paul II',
        'chicago bears': 'Chicago Bears', 'argentina': 'Argentina', 'germany': 'Germany',
        'calgary': 'Calgary', 'moscow': 'Moscow', 'berlin': 'Berlin', 'commodore 64': 'Commodore 64',
        'atari': 'Atari', 'atari 2600': 'Atari 2600', 'windows 1.0': 'Microsoft Windows',
        'strategic defense initiative': 'Strategic Defense Initiative', 'iran-contra affair': 'Iran–Contra affair',
        'falklands war': 'Falklands War', 'european space agency': 'European Space Agency'
    };
    const low = (answerText || '').toLowerCase().trim();
    if (map[low]) return map[low];
    return answerText.trim();
};

AN.CueArt._fetchWikiThumb = (answerText) => {
    const title = AN.CueArt._wikiTitle(answerText);
    const key = 'wiki|' + title.toLowerCase();
    if (AN.CueArt._wikiCache[key]) return Promise.resolve(AN.CueArt._wikiCache[key]);
    if (AN.CueArt._wikiPending[key]) return AN.CueArt._wikiPending[key];

    AN.CueArt._wikiPending[key] = fetch(
        'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title)
    )
        .then(r => r.ok ? r.json() : null)
        .then(j => {
            const url = AN.CueArt.normalizeImageUrl(j?.thumbnail?.source || j?.originalimage?.source || null);
            if (url) AN.CueArt._wikiCache[key] = url;
            delete AN.CueArt._wikiPending[key];
            return url;
        })
        .catch(() => {
            delete AN.CueArt._wikiPending[key];
            return null;
        });

    return AN.CueArt._wikiPending[key];
};

AN.CueArt._loadImage = (src) => new Promise(resolve => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
});

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function wrapText(ctx, text, cx, startY, maxW, lh) {
    const words = text.split(' ');
    let line = '', y = startY;
    words.forEach(wd => {
        const t = line + wd + ' ';
        if (ctx.measureText(t).width > maxW && line) {
            ctx.fillText(line.trim(), cx, y);
            line = wd + ' ';
            y += lh;
        } else line = t;
    });
    if (line) ctx.fillText(line.trim(), cx, y);
}

/** Load best available image for the card picture area */
AN.CueArt._loadCardImage = async (question, answerIndex) => {
    const cacheKey = question.id + '|img|' + answerIndex;
    if (AN.CueArt._cache[cacheKey]) return AN.CueArt._cache[cacheKey];

    const url = await AN.CueArt.getImageUrl(question, answerIndex);
    const img = await AN.CueArt._loadImage(url);
    if (img) AN.CueArt._cache[cacheKey] = img;
    return img;
};

AN.CueArt._wikiSearchThumb = async (term) => {
    const u = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch='
        + encodeURIComponent(term) + '&format=json&origin=*&srlimit=4';
    try {
        const r = await fetch(u);
        if (!r.ok) return null;
        const j = await r.json();
        const hits = j.query?.search || [];
        for (const h of hits) {
            const img = await AN.CueArt._fetchWikiThumb(h.title);
            if (img) return img;
        }
    } catch (_) {}
    return null;
};

AN.CueArt._lookupBuiltin = (answerText) => {
    const ans = (answerText || '').trim();
    if (!ans) return null;
    const fromMap = AN.AnswerImages?.get?.(ans);
    if (fromMap) return fromMap;
    return AN.CueArt._matchUrl(ans, '') || null;
};

/** Resolve best image URL for an answer (always returns a URL) */
AN.CueArt.resolveImageUrl = async (answerText, questionText) => {
    const ans = (answerText || '').trim();
    const cacheKey = 'url|' + ans.toLowerCase();
    if (AN.CueArt._cache[cacheKey]) return AN.CueArt._cache[cacheKey];

    let url = AN.CueArt._lookupBuiltin(ans);
    if (!url) url = await AN.CueArt._fetchWikiThumb(ans);
    if (!url) url = await AN.CueArt._wikiSearchThumb(ans);
    if (!url && questionText) url = await AN.CueArt._wikiSearchThumb(ans + ' ' + questionText.slice(0, 40));
    if (!url) url = AN.CueArt._drawFallbackDataUrl('Technology', 'A', ans);
    url = AN.AnswerImages?.normalizeUrl?.(url) || AN.CueArt.normalizeImageUrl(url);

    AN.CueArt._cache[cacheKey] = url;
    return url;
};

/** Paint answer card image on wrap (background) + img — always visible */
/** @deprecated — use paintCardImage */
AN.CueArt.setCardImage = (img, url, fallbackFn) => {
    const wrap = img?.closest('.tc-img-wrap');
    const card = img?.closest('.trivia-card');
    if (card && wrap) {
        const idx = parseInt(card.dataset.idx, 10);
        const q = AN.run?.questions?.[AN.run?.stopIndex];
        if (q && !isNaN(idx)) { AN.CueArt.paintCardImage(card, q, idx); return; }
    }
    if (!img) return;
    img.referrerPolicy = 'no-referrer';
    img.src = AN.CueArt.normalizeImageUrl(url) || fallbackFn();
    img.classList.add('loaded');
};

/** For trivia cards — returns https URL (or data URL fallback) */
AN.CueArt.getImageUrl = (question, answerIndex) => {
    const ans = question.answers[answerIndex] || '';
    const cacheKey = question.id + '|' + answerIndex;
    if (AN.CueArt._cache[cacheKey]) return Promise.resolve(AN.CueArt._cache[cacheKey]);
    return AN.CueArt.resolveImageUrl(ans, question.question).then(url => {
        AN.CueArt._cache[cacheKey] = url;
        return url;
    });
};

/** @deprecated alias — use getImageUrl */
AN.CueArt.getThumb = (question, answerIndex) => AN.CueArt.getImageUrl(question, answerIndex);

AN.CueArt._drawFallbackDataUrl = (category, letter, answerText) => {
    const key = 'fb|' + category + '|' + letter + '|' + answerText;
    if (AN.CueArt._cache[key]) return AN.CueArt._cache[key];
    const c = document.createElement('canvas');
    c.width = 400;
    c.height = 280;
    const ctx = c.getContext('2d');
    const grad = AN.CueArt.LETTER_GRAD[letter] || AN.CueArt.CATEGORY_GRAD[category] || ['#1a1030', '#5533aa'];
    const g = ctx.createLinearGradient(0, 0, 400, 280);
    g.addColorStop(0, grad[0]);
    g.addColorStop(1, grad[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 400, 280);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, 24, 24, 352, 232, 16);
    ctx.fill();
    ctx.font = '64px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(AN.CueArt.CATEGORY_ICON[category] || '🎮', 200, 110);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Rajdhani, Arial, sans-serif';
    wrapText(ctx, answerText, 200, 175, 320, 26);
    const url = c.toDataURL('image/png');
    AN.CueArt._cache[key] = url;
    return url;
};

AN.CueArt._drawCueCard = (ctx, w, h, letter, text, hexColor, thumbImg, category) => {
    const pad = 12;
    const imgH = Math.floor(h * 0.55);
    const textTop = pad + imgH + 16;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, pad, pad, w - pad * 2, h - pad * 2, 14);
    ctx.fill();

    ctx.strokeStyle = hexColor;
    ctx.lineWidth = 10;
    roundRect(ctx, pad, pad, w - pad * 2, h - pad * 2, 14);
    ctx.stroke();

    const ix = pad + 10, iy = pad + 10, iw = w - pad * 2 - 20, ih = imgH - 10;
    const grad = AN.CueArt.CATEGORY_GRAD[category] || ['#1a1030', '#5533aa'];
    const g = ctx.createLinearGradient(ix, iy, ix + iw, iy + ih);
    g.addColorStop(0, grad[0]);
    g.addColorStop(1, grad[1]);
    ctx.fillStyle = g;
    roundRect(ctx, ix, iy, iw, ih, 10);
    ctx.fill();

    if (thumbImg && thumbImg.width > 0) {
        ctx.save();
        roundRect(ctx, ix, iy, iw, ih, 10);
        ctx.clip();
        const pad = 16;
        const aw = iw - pad * 2, ah = ih - pad * 2;
        const scale = Math.min(aw / thumbImg.width, ah / thumbImg.height);
        const dw = thumbImg.width * scale, dh = thumbImg.height * scale;
        ctx.drawImage(thumbImg, ix + (iw - dw) / 2, iy + (ih - dh) / 2, dw, dh);
        ctx.restore();
    } else {
        ctx.font = '80px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(AN.CueArt.CATEGORY_ICON[category] || '🎮', ix + iw / 2, iy + ih / 2);
    }

    ctx.fillStyle = hexColor;
    ctx.beginPath();
    ctx.arc(ix + 36, iy + 36, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, ix + 36, iy + 38);

    ctx.strokeStyle = hexColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ix, textTop - 8);
    ctx.lineTo(ix + iw, textTop - 8);
    ctx.stroke();

    ctx.fillStyle = '#f0f2f8';
    roundRect(ctx, ix, textTop, iw, h - textTop - pad - 10, 10);
    ctx.fill();

    ctx.fillStyle = '#101028';
    ctx.font = 'bold 36px Rajdhani, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    wrapText(ctx, letter + '. ' + text, w / 2, textTop + 14, iw - 8, 38);
};

AN.CueArt._makeTexFromCanvas = (c) => {
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.flipY = true;
    tex.needsUpdate = true;
    return tex;
};

AN.CueArt._buildCardCanvas = async (question, answerIndex) => {
    const letter = AN.ANSWER_LABELS[answerIndex];
    const text = question.answers[answerIndex] || '';
    const hex = AN.CueArt._hex(AN.ANSWER_COLORS[answerIndex]);
    const cat = question.category || 'Technology';
    const img = await AN.CueArt._loadCardImage(question, answerIndex);

    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 640;
    AN.CueArt._drawCueCard(c.getContext('2d'), 512, 640, letter, text, hex, img, cat);
    return c;
};

AN.CueArt.makeCueCardPlaceholder = (letter, text, hexColor, category) => {
    const key = 'ph|' + letter + '|' + text;
    if (AN.CueArt._phTex[key]) return AN.CueArt._phTex[key];
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 640;
    AN.CueArt._drawCueCard(c.getContext('2d'), 512, 640, letter, text, hexColor, null, category || 'Technology');
    AN.CueArt._phTex[key] = AN.CueArt._makeTexFromCanvas(c);
    return AN.CueArt._phTex[key];
};

AN.CueArt.makeCueCardFaceTex = async (question, answerIndex) => {
    const key = 'face|' + question.id + '|' + answerIndex;
    if (AN.CueArt._faceTex[key]) return AN.CueArt._faceTex[key];
    if (AN.CueArt._pending[key]) return AN.CueArt._pending[key];

    AN.CueArt._pending[key] = (async () => {
        const c = await AN.CueArt._buildCardCanvas(question, answerIndex);
        const tex = AN.CueArt._makeTexFromCanvas(c);
        AN.CueArt._faceTex[key] = tex;
        delete AN.CueArt._pending[key];
        return tex;
    })();

    return AN.CueArt._pending[key];
};

AN.CueArt.applyToSprite = (spriteMat, tex) => {
    if (!spriteMat || !tex) return;
    tex.needsUpdate = true;
    spriteMat.map = tex;
    spriteMat.color.setHex(0xffffff);
    spriteMat.needsUpdate = true;
};

AN.CueArt.preloadGateCards = (question) => {
    if (!question) return Promise.resolve();
    return Promise.all([0, 1, 2, 3].map(i => AN.CueArt.makeCueCardFaceTex(question, i)));
};
