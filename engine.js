/**
 * ═══════════════════════════════════════════════════════════════════════════
 * engine.js — 3D GRAPHICS LAYER (Presentation / Judge Guide)
 * ═══════════════════════════════════════════════════════════════════════════
 * WHAT IT DOES:
 *   Three.js WebGL renderer on #gameCanvas. Used for optional 3D backdrop.
 *   During trivia, UI mode hides the canvas so HTML screens are fully visible.
 * ═══════════════════════════════════════════════════════════════════════════
 */
/* Three.js — simple Lifeline Run */
window.AN = window.AN || {};
AN.Engine = {};

AN.Engine.mat = (col) => new THREE.MeshBasicMaterial({ color: col });

AN.Engine.init = () => {
    const E = AN.Engine;
    if (typeof THREE === 'undefined') { console.error('Three.js failed to load.'); return; }
    E.scene = new THREE.Scene();
    E.camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.1, 120);
    E.renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.getElementById('gameCanvas'),
        alpha: false,
        powerPreference: 'high-performance'
    });
    E.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    E.resize = () => {
        const w = window.innerWidth, h = window.innerHeight;
        if (w < 2 || h < 2) return;
        E.camera.aspect = w / h;
        E.camera.updateProjectionMatrix();
        E.renderer.setSize(w, h, false);
    };
    E.resize();
    E.meshes = [];
    E.plats = [];
    E.keys = {};
    E.t = 0;
    E.uiMode = true;
    AN.Engine.setUiMode(true);

    E.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(10, 30, 15);
    E.scene.add(sun);

    E.player = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.3, 0.9), E.mat(0x0a0a0a));
    body.position.y = 0.42;
    E.player.add(body);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.12, 0.92), E.mat(0xffffff));
    stripe.position.y = 0.75;
    E.player.add(stripe);
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.35), E.mat(0x00f5ff));
    eye.position.set(0, 1.02, 0.38);
    E.player.add(eye);
    E.scene.add(E.player);

    window.addEventListener('resize', () => E.resize());
};

AN.Engine.track = (m) => { AN.Engine.meshes.push(m); return m; };

AN.Engine.setUiMode = (on) => {
    const E = AN.Engine;
    E.uiMode = !!on;
    const layer = document.getElementById('gameLayer');
    if (layer) layer.classList.toggle('canvas-off', E.uiMode);
};

AN.Engine.clear = () => {
    const E = AN.Engine;
    E.meshes.forEach(m => E.scene.remove(m));
    E.meshes = [];
    E.plats = [];
    if (E.scene) {
        E.scene.background = new THREE.Color(0x05020c);
        E.scene.fog = null;
    }
    if (E.renderer) E.renderer.setClearColor(0x05020c);
    AN.Engine.setUiMode(true);
};

AN.Engine.plat = (x, y, z, w, d, col, _em, opt = {}) => {
    const E = AN.Engine;
    const color = opt.neon ? col : (col || AN.PLAT_COLOR);
    const m = E.track(new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), E.mat(color)));
    m.position.set(x, y, z);
    E.scene.add(m);
    const p = { x, y, z, w, d, mesh: m, ...opt };
    E.plats.push(p);
    if (opt.trim) {
        const trim = E.track(new THREE.Mesh(
            new THREE.BoxGeometry(w + 0.12, 0.1, d + 0.12),
            E.mat(opt.trim)
        ));
        trim.position.set(x, y + 0.55, z);
        E.scene.add(trim);
    }
    if (opt.finish) {
        const gate = E.track(new THREE.Mesh(
            new THREE.TorusGeometry(2.2, 0.12, 8, 20),
            E.mat(opt.trim || 0x39ff14)
        ));
        gate.rotation.x = Math.PI / 2;
        gate.position.set(x, y + 2.5, z);
        E.scene.add(gate);
    }
    return p;
};

AN.Engine.lava = (color) => {
    const E = AN.Engine;
    const l = E.track(new THREE.Mesh(
        new THREE.PlaneGeometry(40, 50),
        E.mat(color || AN.LAVA_COLOR)
    ));
    l.rotation.x = -Math.PI / 2;
    l.position.set(0, -2.5, 2);
    E.scene.add(l);
};

AN.Engine.walls = (accent) => {
    const E = AN.Engine;
    const mat = E.mat(AN.PLAT_DARK);
    [-16, 16].forEach(x => {
        const wall = E.track(new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 50), mat));
        wall.position.set(x, 5, 2);
        E.scene.add(wall);
        const stripe = E.track(new THREE.Mesh(new THREE.BoxGeometry(0.2, 10, 50), E.mat(accent || 0x444466)));
        stripe.position.set(x, 5, 2);
        E.scene.add(stripe);
    });
};

AN.Engine.loadLifeline = (timelineId) => {
    const E = AN.Engine;
    const tl = AN.TIMELINES[timelineId] || AN.TIMELINES[AN.JOURNEY_ID];
    E.clear();
    E.lava(tl.floor);
    E.walls(tl.accent);
    E.scene.background = new THREE.Color(tl.sky);
    E.scene.fog = new THREE.Fog(tl.fog, 35, 90);
    E.renderer.setClearColor(tl.sky);
    AN.Engine.setUiMode(false);

    AN.Worlds.buildLifeline(timelineId, E);

    const spawn = E.plats.find(p => p.spawn);
    E.state.pos.set(0, (spawn?.y || 1.5) + 1.05, AN.LIFELINE_SPAWN_Z + 1);
    E.state.respawn.copy(E.state.pos);
    E.state.vel.set(0, 0, 0);
    E.state.grounded = true;
    E.state.spawnGrace = 45;
    E._finishTriggered = false;

    E.camera.position.set(0, 6, AN.LIFELINE_SPAWN_Z - 10);
    E.camera.lookAt(0, 2, AN.LIFELINE_SPAWN_Z + 6);
    E.player.position.copy(E.state.pos);
};

AN.Engine.state = {
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    respawn: new THREE.Vector3(),
    grounded: false,
    spawnGrace: 0,
    hurtCd: 0
};

AN.Engine.getSpeedMult = () => {
    const sk = AN.run?.save?.upgrades?.speed || 0;
    return 1 + sk * 0.1;
};

AN.Engine.update = (dt) => {
    const E = AN.Engine;
    const S = E.state;
    const r = AN.run;
    if (!r || r.phase !== 'play' || r.playSub !== 'lifeline' || r.paused) {
        if (r?.phase === 'play') E.cam();
        return;
    }

    E.t += dt;
    if (S.spawnGrace > 0) S.spawnGrace--;
    if (S.hurtCd > 0) S.hurtCd--;

    S.vel.y -= 0.018;
    S.vel.x *= 0.88;
    S.vel.z *= 0.88;
    const mv = 0.06 * E.getSpeedMult();
    const K = E.keys;
    if (K['w'] || K['W'] || K['ArrowUp']) S.vel.z += mv;
    if (K['s'] || K['S'] || K['ArrowDown']) S.vel.z -= mv;
    if (K['a'] || K['A'] || K['ArrowLeft']) S.vel.x += mv;
    if (K['d'] || K['D'] || K['ArrowRight']) S.vel.x -= mv;

    S.pos.add(S.vel);
    S.grounded = false;

    let bestY = null, land = null;
    E.plats.forEach(p => {
        const top = p.y + 0.5;
        if (S.pos.x > p.x - p.w / 2 - 0.35 && S.pos.x < p.x + p.w / 2 + 0.35 &&
            S.pos.z > p.z - p.d / 2 - 0.35 && S.pos.z < p.z + p.d / 2 + 0.35 &&
            S.pos.y - 1.05 <= top + 0.4 && S.vel.y <= 0.15) {
            if (bestY === null || top > bestY) { bestY = top; land = p; }
        }
    });

    if (bestY !== null) {
        S.pos.y = bestY + 1.05;
        S.vel.y = 0;
        S.grounded = true;
        if (land.checkpoint) S.respawn.copy(S.pos);
        if (land.finish && !E._finishTriggered) {
            E._finishTriggered = true;
            AN.Main.lifelineComplete();
        }
    }

    if (S.pos.y < -2 && S.spawnGrace <= 0) E.fall();

    E.cam();
    AN.UI.updatePlayHud();
};

AN.Engine.fall = () => {
    const E = AN.Engine;
    const S = E.state;
    const r = AN.run;
    if (S.hurtCd > 0) return;
    S.hurtCd = 40;
    if (AN.Main.loseHeart()) {
        S.pos.copy(S.respawn);
        S.vel.set(0, 0, 0);
        AN.FX.wrong();
        AN.UI.toast(r.hearts > 0 ? 'Lost a heart! Be careful.' : 'No hearts left — keep trying!', false);
    }
};

AN.Engine.cam = () => {
    const E = AN.Engine;
    const S = E.state;
    E.player.position.copy(S.pos);
    const target = new THREE.Vector3(S.pos.x * 0.05, S.pos.y + 5, S.pos.z - 12);
    E.camera.position.lerp(target, 0.12);
    E.camera.lookAt(S.pos.x * 0.03, S.pos.y + 1.2, S.pos.z + 8);
};

AN.Engine.render = () => {
    const E = AN.Engine;
    if (!E.renderer || !E.scene || E.uiMode) return;
    E.renderer.render(E.scene, E.camera);
};

AN.Engine.jump = () => {
    const S = AN.Engine.state;
    if (S.grounded && AN.run?.playSub === 'lifeline') {
        S.vel.y = 0.44;
        AN.FX.jump();
    }
};
