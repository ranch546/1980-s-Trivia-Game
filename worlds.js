/**
 * ═══════════════════════════════════════════════════════════════════════════
 * worlds.js — 3D LEVEL GEOMETRY (Presentation / Judge Guide)
 * ═══════════════════════════════════════════════════════════════════════════
 * WHAT IT DOES:
 *   Builds the 3D platform path for optional Lifeline Run mode (engine.js).
 *   Not used during main trivia quiz — trivia is HTML-based.
 * ═══════════════════════════════════════════════════════════════════════════
 */
/* Simple Lifeline Run — short straight path, easy for everyone */
window.AN = window.AN || {};
AN.Worlds = {};

AN.Worlds._p = (eng, x, y, z, w, d, opt) => eng.plat(x, y, z, w, d, null, null, opt);

AN.Worlds.buildLifeline = (timeline, eng) => {
    const tl = AN.TIMELINES[timeline] || AN.TIMELINES[AN.JOURNEY_ID];
    const accent = tl.accent;

    AN.Worlds._p(eng, 0, 1.5, AN.LIFELINE_SPAWN_Z, 18, 10, { spawn: true, checkpoint: true, trim: accent });
    AN.Worlds._p(eng, 0, 2, -4, 14, 8, { checkpoint: true });
    AN.Worlds._p(eng, 0, 2, 4, 14, 8, { checkpoint: true });
    AN.Worlds._p(eng, 0, 2.2, 10, 16, 8, { finish: true, trim: accent });
};
