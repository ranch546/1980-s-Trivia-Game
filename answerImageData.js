/* Pre-mapped image URLs for trivia answer options (Wikimedia + flagcdn) */
window.AN = window.AN || {};
AN.AnswerImages = { loaded: {}, generic: null };

AN.AnswerImages.FLAGS = {
    'United States': 'us', 'USA': 'us', 'Canada': 'ca', 'Mexico': 'mx', 'Soviet Union': 'soviet',
    'USSR': 'soviet', 'China': 'cn', 'Cuba': 'cu', 'France': 'fr', 'Germany': 'de',
    'Argentina': 'ar', 'Brazil': 'br', 'Italy': 'it', 'Japan': 'jp', 'India': 'in',
    'South Korea': 'kr', 'Korea': 'kr', 'Australia': 'au', 'Norway': 'no', 'Peru': 'pe',
    'Chile': 'cl', 'Pakistan': 'pk', 'Belarus': 'by', 'Ukraine': 'ua', 'Kazakhstan': 'kz',
    'Russia': 'ru', 'Vietnam': 'vn', 'Yemen': 'ye'
};
AN.AnswerImages.flagUrl = (code) => code === 'soviet'
    ? 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_the_Soviet_Union.svg'
    : 'https://flagcdn.com/w320/' + code + '.png';

/** Keep upload/flag/thumb URLs as-is; only normalize broken Special:FilePath links */
AN.AnswerImages.normalizeUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('Special:FilePath/')) {
        const file = decodeURIComponent(url.split('Special:FilePath/')[1].split('?')[0]).replace(/ /g, '_');
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=640`;
    }
    return url;
};

AN.AnswerImages._fileTitle = (url) => {
    if (!url?.includes('Special:FilePath/')) return null;
    const file = decodeURIComponent(url.split('Special:FilePath/')[1].split('?')[0]).replace(/ /g, '_');
    return 'File:' + file;
};

AN.AnswerImages.resolveCommonsUrl = async (url) => {
    const title = AN.AnswerImages._fileTitle(url);
    if (!title) return url;
    const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*`;
    try {
        const r = await fetch(api);
        if (!r.ok) return AN.AnswerImages.normalizeUrl(url);
        const j = await r.json();
        const page = j.query?.pages && Object.values(j.query.pages)[0];
        const direct = page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url;
        return direct || AN.AnswerImages.normalizeUrl(url);
    } catch (_) {
        return AN.AnswerImages.normalizeUrl(url);
    }
};

AN.AnswerImages.resolveAllFilePathUrls = async (map) => {
    const keys = Object.keys(map).filter(k => map[k]?.includes('Special:FilePath/'));
    const BATCH = 40;
    for (let i = 0; i < keys.length; i += BATCH) {
        const batch = keys.slice(i, i + BATCH);
        const titles = batch.map(k => AN.AnswerImages._fileTitle(map[k])).filter(Boolean);
        if (!titles.length) continue;
        const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${titles.map(t => encodeURIComponent(t)).join('%7C')}&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*`;
        try {
            const r = await fetch(api);
            if (!r.ok) continue;
            const j = await r.json();
            const byTitle = {};
            for (const p of Object.values(j.query?.pages || {})) {
                if (p.title && p.imageinfo?.[0]) {
                    byTitle[p.title] = p.imageinfo[0].thumburl || p.imageinfo[0].url;
                }
            }
            batch.forEach((k, idx) => {
                const t = titles[idx];
                if (byTitle[t]) map[k] = byTitle[t];
            });
        } catch (_) {}
    }
    return map;
};

AN.AnswerImages.FORCE_STATIC = new Set(['Apple', 'iPod']);

AN.AnswerImages.STATIC = {
    'Ronald Reagan': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Official_Portrait_of_President_Reagan_1981.jpg',
    'Margaret Thatcher': 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Margaret_Thatcher_stock_portrait_%28cropped%29.jpg',
    'Michael Jordan': 'https://upload.wikimedia.org/wikipedia/commons/3/34/Michael_Jordan_Lipofsky.jpg',
    'Wayne Gretzky': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Wayne_Gretzky_1997.jpg',
    'Nelson Mandela': 'https://upload.wikimedia.org/wikipedia/commons/0/02/Nelson_Mandela_1994.jpg',
    'Steve Jobs': 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg',
    'Bill Gates': 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Bill_Gates_2017_%28cropped%29.jpg',
    'Mike Tyson': 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Mike_Tyson_2019.jpg',
    'Carl Lewis': 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Carl_Lewis_1996.jpg',
    'Diego Maradona': 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Maradona-Mundial_86_con_la_copa.JPG',
    'Mikhail Gorbachev': 'https://upload.wikimedia.org/wikipedia/commons/5/57/Riunione_G7_a_Venezia%2C_1991_%28Gorbaciov%29.jpg',
    'Gorbachev': 'https://upload.wikimedia.org/wikipedia/commons/5/57/Riunione_G7_a_Venezia%2C_1991_%28Gorbaciov%29.jpg',
    'John Paul II': 'https://upload.wikimedia.org/wikipedia/commons/9/9c/John_Paul_II_in_1993.jpg',
    'George H.W. Bush': 'https://upload.wikimedia.org/wikipedia/commons/e/ee/George_H._W._Bush_presidential_portrait_%28cropped%29.jpg',
    'Pete Rose': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Pete_Rose_1983.jpg',
    'Garry Kasparov': 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Kasparov-34_%28cropped%29.jpg',
    'Greg Louganis': 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Greg_Louganis_1984.jpg',
    'Ben Johnson': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Ben_Johnson_1988.jpg',
    'Larry Bird': 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Larry_Bird.jpg',
    'Magic Johnson': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Magic_Lipofsky.jpg',
    'Bird vs Magic': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Magic_Lipofsky.jpg',
    'Muhammad Ali': 'https://upload.wikimedia.org/wikipedia/commons/8/89/Muhammad_Ali_NYWTS.jpg',
    'Jimmy Carter': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/JimmyCarterPortrait2.jpg',
    'Gerald Ford': 'https://upload.wikimedia.org/wikipedia/commons/3/36/Gerald_Ford_presidential_portrait_%28cropped%29.jpg',
    'Bill Clinton': 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Bill_Clinton.jpg',
    'Leonid Brezhnev': 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Leonid_Brezhnev_1977.jpg',
    'Brezhnev': 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Leonid_Brezhnev_1977.jpg',
    'Yuri Andropov': 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Andropov1983.jpg',
    'Andropov': 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Andropov1983.jpg',
    'Boris Yeltsin': 'https://upload.wikimedia.org/wikipedia/commons/0/00/Boris_Yeltsin_1993.jpg',
    'Yeltsin': 'https://upload.wikimedia.org/wikipedia/commons/0/00/Boris_Yeltsin_1993.jpg',
    'Apple': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Macintosh_128k_transparency.png',
    'Microsoft': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    'IBM': 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg',
    'Intel': 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Intel_logo_%282020%2C_light_blue%29.svg',
    'Nintendo': 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Nintendo.svg',
    'Sony': 'https://upload.wikimedia.org/wikipedia/commons/1/14/Sony_logo.svg',
    'Sega': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Sega_logo.svg',
    'Atari': 'https://upload.wikimedia.org/wikipedia/commons/5/53/Atari_logo.svg',
    'Motorola': 'https://upload.wikimedia.org/wikipedia/commons/0/07/Motorola_logo.svg',
    'Commodore': 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Commodore_logo.svg',
    'Commodore 64': 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Commodore-64-Computer-FL.jpg',
    'NeXT': 'https://upload.wikimedia.org/wikipedia/commons/3/30/NeXT_logo.svg',
    'Pac-Man': 'https://upload.wikimedia.org/wikipedia/commons/5/59/Pacman.svg',
    'Donkey Kong': 'https://upload.wikimedia.org/wikipedia/commons/1/14/Donkey_Kong_arcade.jpg',
    'Space Invaders': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Space_Invaders_arcade.jpg',
    'Frogger': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Frogger_arcade.jpg',
    'Game Boy': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Game-Boy-FL.jpg',
    'Walkman': 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Sony_Walkman_WM-2.jpg',
    'Transformers': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/MP-10_Convoy_Optimus_Prime_Takara_Masterpiece_%2851927178025%29.jpg/960px-MP-10_Convoy_Optimus_Prime_Takara_Masterpiece_%2851927178025%29.jpg',
    'Floppy Disk': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Floppy_disk_2009_G1.jpg',
    'CD-ROM': 'https://upload.wikimedia.org/wikipedia/commons/0/0c/CD-ROM.png',
    'Atari 2600': 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Atari-2600-Wood-4Sw-Set.jpg',
    'Berlin Wall': 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Berlinermauer.jpg',
    'Iron Curtain': 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Berlinermauer.jpg',
    'Chernobyl': 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Chernobyl_Nuclear_Power_Plant.jpg',
    'Mount St. Helens': 'https://upload.wikimedia.org/wikipedia/commons/1/17/Mt_St_Helens_1980.jpg',
    'Mount St. Helens Volcano': 'https://upload.wikimedia.org/wikipedia/commons/1/17/Mt_St_Helens_1980.jpg',
    'Space Shuttle': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Space_Shuttle_Columbia_launching.jpg',
    'Challenger': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/STS007-32-1702.jpg/960px-STS007-32-1702.jpg',
    'Columbia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Space_Shuttle_Columbia_launching.jpg/960px-Space_Shuttle_Columbia_launching.jpg',
    'Discovery': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Space_Shuttle_Discovery_under_a_full_moon%2C_03-11-09.jpg/960px-Space_Shuttle_Discovery_under_a_full_moon%2C_03-11-09.jpg',
    'Atlantis': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/STS-129_Atlantis_Ready_to_Fly.jpg/960px-STS-129_Atlantis_Ready_to_Fly.jpg',
    'Voyager 2': 'https://upload.wikimedia.org/wikipedia/commons/8/82/Voyager_2.jpg',
    'Voyager 1': 'https://upload.wikimedia.org/wikipedia/commons/8/82/Voyager_2.jpg',
    "Halley's Comet": 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Lspn4584.jpg',
    'NATO': 'https://upload.wikimedia.org/wikipedia/commons/3/37/Flag_of_NATO.svg',
    'Warsaw Pact': 'https://upload.wikimedia.org/wikipedia/commons/1/13/Warsaw_Pact_Logo.svg',
    'Los Angeles': 'https://upload.wikimedia.org/wikipedia/commons/5/57/LA_Skyline_Mountains2.jpg',
    'Calgary': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Calgary_skyline_panorama.jpg',
    'Berlin': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Museumsinsel_Berlin_Juli_2021_1_%28cropped%29.jpg',
    'Moscow': 'https://upload.wikimedia.org/wikipedia/commons/8/85/Saint_Basil%27s_Cathedral_in_Moscow%2C_Russia.jpg',
    'Chicago Bears': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Chicago_Bears_logo.svg',
    'San Francisco 49ers': 'https://upload.wikimedia.org/wikipedia/commons/3/3a/San_Francisco_49ers_logo.svg',
    'Dallas Cowboys': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Dallas_Cowboys.svg',
    'Miami Dolphins': 'https://upload.wikimedia.org/wikipedia/commons/3/37/Miami_Dolphins_logo.svg',
    'Iran-Contra Affair': 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Oliver_North_testifying.jpg',
    'European Space Agency': 'https://upload.wikimedia.org/wikipedia/commons/8/80/ESA_logo.svg',
    'Black Monday': 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Wall_Street_sign.jpg',
    'INF Treaty': 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Reagan_and_Gorbachev_signing.jpg',
    'Openness': 'https://upload.wikimedia.org/wikipedia/commons/5/57/Riunione_G7_a_Venezia%2C_1991_%28Gorbaciov%29.jpg',
    'Restructuring': 'https://upload.wikimedia.org/wikipedia/commons/5/57/Riunione_G7_a_Venezia%2C_1991_%28Gorbaciov%29.jpg',
    'Glasnost': 'https://upload.wikimedia.org/wikipedia/commons/5/57/Riunione_G7_a_Venezia%2C_1991_%28Gorbaciov%29.jpg',
    'Perestroika': 'https://upload.wikimedia.org/wikipedia/commons/5/57/Riunione_G7_a_Venezia%2C_1991_%28Gorbaciov%29.jpg',
    '1960–1969': 'https://upload.wikimedia.org/wikipedia/commons/0/00/Apollo_11_launch.jpg',
    '1970–1979': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Vietnam_War.jpg',
    '1980–1989': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Official_Portrait_of_President_Reagan_1981.jpg',
    '1990–1999': 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Berlinermauer.jpg',
    '1987': 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Wall_Street_sign.jpg',
    '1988': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/1988_Summer_Olympics_opening_ceremony.jpg',
    '1989': 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Berlinermauer.jpg',
    '1990': 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Berlinermauer.jpg',
    'International Business Machines': 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg',
    'Apollo': 'https://upload.wikimedia.org/wikipedia/commons/0/00/Apollo_11_launch.jpg',
    'Gemini': 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Gemini_4_EVA.jpg',
    'Mercury': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Space_Shuttle_Columbia_launching.jpg',
    'Watergate': 'https://upload.wikimedia.org/wikipedia/commons/7/77/Nixon_resigns.jpg',
    'Pentagon Papers': 'https://upload.wikimedia.org/wikipedia/commons/7/77/Nixon_resigns.jpg',
    'Whitewater': 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Bill_Clinton.jpg',
    'Falklands War': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Flag_of_Argentina.svg',
    'Care Bears': 'https://upload.wikimedia.org/wikipedia/en/4/47/Care_Bears.png',
    'My Little Pony': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/My_little_pony_logo22.svg',
    'Cabbage Patch Kids': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Black_Cabbage_Patch_Doll_-_DPLA_-_f490dd32cfc6c574673ffa8fe31e9c85_%28page_1%29.jpg/960px-Black_Cabbage_Patch_Doll_-_DPLA_-_f490dd32cfc6c574673ffa8fe31e9c85_%28page_1%29.jpg',
    'iPod': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/IPod_1G.jpg',
    'Zune': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    'Discman': 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Sony_Walkman_WM-2.jpg',
    'Windows 1.0': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/500px-Microsoft_logo.svg.png',
    'MS-DOS 1.0': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/500px-Microsoft_logo.svg.png',
    'OS/2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/IBM_logo.svg/500px-IBM_logo.svg.png',
    'Macintosh System': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Macintosh_128k_transparency.png',
    'Nintendo Entertainment System': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nintendo.svg/420px-Nintendo.svg.png',
    'Ferdinand Marcos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Flag_of_the_Philippines.svg/500px-Flag_of_the_Philippines.svg.png',
    'Corazon Aquino': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Flag_of_the_Philippines.svg/500px-Flag_of_the_Philippines.svg.png',
    'Just Cause': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/500px-Flag_of_the_United_States.svg.png',
    'Urgent Fury': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/500px-Flag_of_the_United_States.svg.png',
    'Desert Storm': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/500px-Flag_of_the_United_States.svg.png',
    'Eagle Claw': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/500px-Flag_of_the_United_States.svg.png',
    'Solidarity': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Flag_of_Poland.svg/500px-Flag_of_Poland.svg.png',
    'Adobe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Adobe_Systems_logo_and_wordmark.svg/500px-Adobe_Systems_logo_and_wordmark.svg.png',
    'Chicago Bulls': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Chicago_Bulls_logo.svg/500px-Chicago_Bulls_logo.svg.png',
    'Björn Borg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Bj%C3%B6rn_Borg_%281981%29.jpg/420px-Bj%C3%B6rn_Borg_%281981%29.jpg',
    'John McEnroe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/John_McEnroe.jpg/420px-John_McEnroe.jpg',
    'C++': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/ISO_C%2B%2B_Logo.svg/500px-ISO_C%2B%2B_Logo.svg.png',
    'TCP/IP': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Internet1.svg/500px-Internet1.svg.png',
    'GPS': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Gps_handheld.jpg/420px-Gps_handheld.jpg',
    'West Germany': 'https://flagcdn.com/w320/de.png',
    'Argentina': 'https://flagcdn.com/w320/ar.png',
    'Japan': 'https://flagcdn.com/w320/jp.png',
    'China': 'https://flagcdn.com/w320/cn.png',
    'Poland': 'https://flagcdn.com/w320/pl.png',
    'Philippines': 'https://flagcdn.com/w320/ph.png',
    'Panama': 'https://flagcdn.com/w320/pa.png',
    'Grenada': 'https://flagcdn.com/w320/gd.png',
    'Fall of Berlin Wall': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Berlinermauer.jpg/420px-Berlinermauer.jpg',
    'Star Wars': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/SDI_Logo.svg/500px-SDI_Logo.svg.png',
    'Air Quality Agreement': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Flag_of_Canada_%28Pantone%29.svg/500px-Flag_of_Canada_%28Pantone%29.svg.png',
    'NAFTA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/500px-Flag_of_the_United_States.svg.png',
    'Clarence Thomas': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/500px-Flag_of_the_United_States.svg.png',
    'Robert Bork': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/500px-Flag_of_the_United_States.svg.png',
    'Marine barracks Beirut': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/500px-Flag_of_the_United_States.svg.png',
    'Carlos Lopes': 'https://flagcdn.com/w320/pt.png',
    'Sebastian Coe': 'https://flagcdn.com/w320/gb.png',
    'Edwin Moses': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/500px-Flag_of_the_United_States.svg.png',
    'Ivan Lendl': 'https://flagcdn.com/w320/cz.png',
    'Jimmy Connors': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/500px-Flag_of_the_United_States.svg.png',
    'Larry Holmes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/500px-Flag_of_the_United_States.svg.png',
    'New England Patriots': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/New_England_Patriots_logo.svg/500px-New_England_Patriots_logo.svg.png',
    'TRS-80': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/IBM_logo.svg/500px-IBM_logo.svg.png',
    'Apple II': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Macintosh_128k_transparency.png',
    'Hubble': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/HST-SM4.jpeg/420px-HST-SM4.jpeg',
    'Mir': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Mir_space_station_%28cropped%29.jpg/420px-Mir_space_station_%28cropped%29.jpg',
    'Skylab': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Apollo_11_launch.jpg/500px-Apollo_11_launch.jpg',
    '.com': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Internet1.svg/500px-Internet1.svg.png',
    '.org': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Internet1.svg/500px-Internet1.svg.png',
    '.net': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Internet1.svg/500px-Internet1.svg.png',
    '.edu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Internet1.svg/500px-Internet1.svg.png'
};

AN.AnswerImages.pickBestUrl = (...urls) => {
    const score = (u) => {
        if (!u) return -1;
        if (u.includes('/thumb/')) return 5;
        if (u.includes('flagcdn.com')) return 5;
        if (u.includes('/wikipedia/en/')) return 4;
        if (u.startsWith('data:')) return 4;
        if (u.includes('Special:FilePath') && u.includes('width=')) return 3;
        if (u.includes('Special:FilePath')) return 2;
        return 0;
    };
    return urls.filter(Boolean).sort((a, b) => score(b) - score(a))[0] || null;
};

AN.AnswerImages.init = () => {
    const norm = (obj) => {
        for (const k of Object.keys(obj)) obj[k] = AN.AnswerImages.normalizeUrl(obj[k]);
    };
    const applyLoaded = (jsonImages) => {
        AN.AnswerImages.loaded = { ...AN.AnswerImages.STATIC };
        if (jsonImages) {
            for (const [k, v] of Object.entries(jsonImages)) {
                if (AN.AnswerImages.FORCE_STATIC.has(k)) continue;
                AN.AnswerImages.loaded[k] = AN.AnswerImages.pickBestUrl(AN.AnswerImages.loaded[k], v);
            }
        }
        for (const k of AN.AnswerImages.FORCE_STATIC) {
            if (AN.AnswerImages.STATIC[k]) AN.AnswerImages.loaded[k] = AN.AnswerImages.STATIC[k];
        }
        norm(AN.AnswerImages.loaded);
    };
    applyLoaded(null);
    return fetch('content/answer-images.json')
        .then(r => r.ok ? r.json() : null)
        .then(d => {
            applyLoaded(d?.images);
            norm(AN.AnswerImages.loaded);
            AN.AnswerImages.resolveAllFilePathUrls({ ...AN.AnswerImages.loaded }).then(resolved => {
                Object.assign(AN.AnswerImages.loaded, resolved);
                norm(AN.AnswerImages.loaded);
            });
        })
        .catch(() => {
            applyLoaded(null);
            norm(AN.AnswerImages.loaded);
        });
};

/** Instant lookup — used before async wiki fallback */
AN.AnswerImages.get = (answerText) => {
    const ans = (answerText || '').trim();
    if (!ans) return null;
    if (AN.AnswerImages.loaded[ans]) return AN.AnswerImages.normalizeUrl(AN.AnswerImages.loaded[ans]);
    if (AN.AnswerImages.STATIC[ans]) return AN.AnswerImages.normalizeUrl(AN.AnswerImages.STATIC[ans]);
    const low = ans.toLowerCase();
    for (const [k, v] of Object.entries(AN.AnswerImages.loaded)) {
        if (k.toLowerCase() === low) return AN.AnswerImages.normalizeUrl(v);
    }
    for (const [k, v] of Object.entries(AN.AnswerImages.STATIC)) {
        if (k.toLowerCase() === low) return AN.AnswerImages.normalizeUrl(v);
    }
    const flag = AN.AnswerImages.FLAGS[ans];
    if (flag) return AN.AnswerImages.normalizeUrl(AN.AnswerImages.flagUrl(flag));
    for (const [k, code] of Object.entries(AN.AnswerImages.FLAGS)) {
        if (k.toLowerCase() === low) return AN.AnswerImages.normalizeUrl(AN.AnswerImages.flagUrl(code));
    }
    return null;
};
