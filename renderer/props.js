"use strict";

// Seasonal props. Rocky's ball has no hands, so a prop is either mounted on the
// sphere (flag, volantín), floats beside it (ghost, bat) or sits on the ground.

// Wrapped so the renderer's shared global scope only ever sees the export below.
(() => {
  const PROP_SVG_NS = "http://www.w3.org/2000/svg";

  // The volantín clips its bands, so every instance needs its own clip id.
  let propInstances = 0;

  // Flag of Chile, by the book: 2:3, canton one third of the width and half the
  // height, star drawn on a circle half the canton's side.
  const FLAG_BLUE = "#0039a6";
  const FLAG_RED = "#d52b1e";
  const FLAG_WHITE = "#f7f7f2";

  const POLE = "#a9825a";
  const POLE_DARK = "#7d5c3c";

  const KITE = "M50 8 L88 44 L50 80 L12 44 Z";

  // The repulgue, an empanada's folded seal: a run of arcs along its flat edge.
  const CRIMPS = 7;
  const CRIMP_SPAN = 78;

  function propEl(tag, attrs = {}) {
    const el = document.createElementNS(PROP_SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    return el;
  }

  function appendAll(group, children) {
    for (const child of children) group.appendChild(child);
    return group;
  }

  // Five-pointed star inscribed in a circle, first point up. Computed rather than
  // written out, so the flag's proportions stay readable as proportions.
  function starPath(cx, cy, outer) {
    const inner = outer * 0.382;
    const points = [];
    for (let step = 0; step < 10; step++) {
      const angle = ((-90 + step * 36) * Math.PI) / 180;
      const radius = step % 2 === 0 ? outer : inner;
      points.push(
        `${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`,
      );
    }
    return `M${points.join("L")}Z`;
  }

  // --- The props ---------------------------------------------------------------
  function bandera() {
    const cloth = propEl("g", { class: "prop-flutter", style: "transform-origin: left center" });
    appendAll(cloth, [
      propEl("rect", { x: 16, y: 10, width: 60, height: 40, fill: FLAG_RED }),
      propEl("rect", { x: 16, y: 10, width: 60, height: 20, fill: FLAG_WHITE }),
      propEl("rect", { x: 16, y: 10, width: 20, height: 20, fill: FLAG_BLUE }),
      propEl("path", { d: starPath(26, 20, 5), fill: FLAG_WHITE }),
      propEl("path", { d: "M58 10 L66 50 L76 50 L76 10 Z", fill: "rgba(0,0,0,0.13)" }),
    ]);
    return appendAll(propEl("g"), [
      propEl("rect", { x: 11, y: 5, width: 6, height: 110, rx: 3, fill: POLE }),
      propEl("rect", { x: 11, y: 5, width: 2.2, height: 110, rx: 1.1, fill: "rgba(255,255,255,0.3)" }),
      propEl("circle", { cx: 14, cy: 5, r: 5, fill: POLE_DARK }),
      cloth,
    ]);
  }

  // Potrillo glass: pipeño, a scoop of piña riding the rim, granadina over it.
  function terremoto() {
    return appendAll(propEl("g"), [
      propEl("ellipse", { cx: 50, cy: 124, rx: 22, ry: 5.5, fill: "rgba(226,244,255,0.5)" }),
      propEl("rect", { x: 45, y: 96, width: 10, height: 26, fill: "rgba(226,244,255,0.45)" }),
      propEl("path", { d: "M20 40 L36 98 Q50 104 64 98 L80 40 Z", fill: "rgba(226,244,255,0.3)" }),
      propEl("path", { d: "M25 56 L36 98 Q50 104 64 98 L75 56 Z", fill: "#e7d489" }),
      propEl("circle", { cx: 50, cy: 46, r: 19, fill: "#fbf0c4" }),
      propEl("circle", { cx: 43, cy: 40, r: 6.5, fill: "rgba(255,255,255,0.6)" }),
      propEl("path", {
        d: "M34 40 Q42 30 50 38 Q58 46 66 34",
        stroke: "#c8102e",
        "stroke-width": 4.5,
        "stroke-linecap": "round",
        fill: "none",
      }),
      propEl("path", {
        d: "M27 46 L38 95",
        stroke: "rgba(255,255,255,0.5)",
        "stroke-width": 3,
        "stroke-linecap": "round",
        fill: "none",
      }),
      propEl("path", {
        d: "M20 40 L36 98 Q50 104 64 98 L80 40",
        fill: "none",
        stroke: "rgba(232,250,255,0.78)",
        "stroke-width": 3,
        "stroke-linejoin": "round",
      }),
      propEl("ellipse", {
        cx: 50,
        cy: 40,
        rx: 30,
        ry: 7,
        fill: "none",
        stroke: "rgba(232,250,255,0.8)",
        "stroke-width": 3,
      }),
    ]);
  }

  function empanadaPath() {
    const step = CRIMP_SPAN / CRIMPS;
    let d = "M11 54 A40 33 0 0 1 89 54";
    for (let crimp = 0; crimp < CRIMPS; crimp++) {
      d += `q${(-step / 2).toFixed(2)} 9 ${(-step).toFixed(2)} 0`;
    }
    return `${d}Z`;
  }

  function empanada() {
    return appendAll(propEl("g", { transform: "rotate(-7 50 36)" }), [
      propEl("path", {
        d: empanadaPath(),
        fill: "#d99a3f",
        stroke: "#b1762a",
        "stroke-width": 2.4,
        "stroke-linejoin": "round",
      }),
      propEl("path", {
        d: "M21 41 A34 27 0 0 1 73 25",
        fill: "none",
        stroke: "rgba(255,232,180,0.55)",
        "stroke-width": 7,
        "stroke-linecap": "round",
      }),
      propEl("circle", { cx: 40, cy: 34, r: 2.4, fill: "rgba(150,95,30,0.45)" }),
      propEl("circle", { cx: 57, cy: 40, r: 2, fill: "rgba(150,95,30,0.4)" }),
      propEl("circle", { cx: 49, cy: 27, r: 1.7, fill: "rgba(150,95,30,0.35)" }),
    ]);
  }

  function volantin() {
    const clipId = `rockyPropKite${(propInstances += 1)}`;
    const clip = propEl("clipPath", { id: clipId });
    clip.appendChild(propEl("path", { d: KITE }));

    const bands = propEl("g", { "clip-path": `url(#${clipId})` });
    appendAll(bands, [
      propEl("rect", { x: 10, y: 4, width: 80, height: 28, fill: FLAG_BLUE }),
      propEl("rect", { x: 10, y: 32, width: 80, height: 26, fill: FLAG_WHITE }),
      propEl("rect", { x: 10, y: 58, width: 80, height: 30, fill: FLAG_RED }),
    ]);

    const spars = propEl("g", { stroke: "rgba(0,0,0,0.22)", "stroke-width": 2, fill: "none" });
    appendAll(spars, [
      propEl("path", { d: "M50 10 L50 78" }),
      propEl("path", { d: "M16 44 L84 44" }),
    ]);

    const kite = propEl("g", { class: "prop-flutter", style: "transform-origin: center bottom" });
    appendAll(kite, [
      bands,
      spars,
      propEl("path", {
        d: KITE,
        fill: "none",
        stroke: "rgba(70,48,24,0.55)",
        "stroke-width": 2.4,
        "stroke-linejoin": "round",
      }),
    ]);

    return appendAll(propEl("g"), [
      clip,
      kite,
      propEl("path", {
        d: "M50 80 Q40 96 20 104 Q8 110 4 120",
        fill: "none",
        stroke: "rgba(90,70,45,0.7)",
        "stroke-width": 2,
      }),
      propEl("path", { d: "M36 94 l6 -4 0 8 -6 -4 -6 4 0 -8 Z", fill: FLAG_RED }),
      propEl("path", { d: "M18 105 l6 -4 0 8 -6 -4 -6 4 0 -8 Z", fill: FLAG_BLUE }),
    ]);
  }

  function sopaipilla(cx, cy, rx) {
    return [
      propEl("ellipse", { cx, cy, rx, ry: rx * 0.42, fill: "#d99a4b" }),
      propEl("ellipse", { cx, cy: cy - rx * 0.12, rx: rx * 0.86, ry: rx * 0.3, fill: "#eebc72" }),
      propEl("circle", { cx: cx - rx * 0.3, cy: cy - rx * 0.06, r: 1.6, fill: "rgba(140,88,26,0.45)" }),
      propEl("circle", { cx: cx + rx * 0.28, cy: cy - rx * 0.14, r: 1.6, fill: "rgba(140,88,26,0.4)" }),
    ];
  }

  function sopaipillas() {
    return appendAll(propEl("g"), [
      ...sopaipilla(50, 48, 33),
      ...sopaipilla(44, 33, 31),
      ...sopaipilla(53, 19, 29),
    ]);
  }

  // Pañuelo de cueca, held by a knotted corner. The stitched hem is what stops a
  // white shape from reading as a blank blob on a pale wallpaper.
  const PANUELO_CLOTH = "M13 13 C40 3 68 12 88 34 C70 60 44 76 20 68 C6 52 4 26 13 13 Z";
  const PANUELO_HEM = "M20 20 C42 12 64 20 80 36 C66 54 44 67 25 60 C14 47 13 30 20 20 Z";
  const PANUELO_INK = "rgba(104,104,118,";

  function panuelo() {
    const cloth = propEl("g", { class: "prop-flutter", style: "transform-origin: left top" });
    const creases = propEl("g", {
      fill: "none",
      stroke: `${PANUELO_INK}0.28)`,
      "stroke-width": 1.8,
      "stroke-linecap": "round",
    });
    appendAll(creases, [
      propEl("path", { d: "M16 17 C37 31 55 47 64 66" }),
      propEl("path", { d: "M16 17 C41 23 63 34 80 41" }),
      propEl("path", { d: "M35 8 C41 29 51 45 69 55" }),
    ]);
    appendAll(cloth, [
      propEl("path", {
        d: PANUELO_CLOTH,
        fill: "#fcfcf8",
        stroke: `${PANUELO_INK}0.5)`,
        "stroke-width": 2.2,
      }),
      creases,
      propEl("path", {
        d: PANUELO_HEM,
        fill: "none",
        stroke: `${PANUELO_INK}0.45)`,
        "stroke-width": 1.6,
        "stroke-dasharray": "4 3",
      }),
    ]);
    return appendAll(propEl("g"), [
      cloth,
      propEl("circle", {
        cx: 13,
        cy: 13,
        r: 6.5,
        fill: "#e4e2d6",
        stroke: `${PANUELO_INK}0.45)`,
        "stroke-width": 1.6,
      }),
    ]);
  }

  // --- The spooky kit ----------------------------------------------------------
  const PUMPKIN = "#f28a1d";
  const PUMPKIN_DARK = "#c9640c";
  const CARVED_GLOW = "#ffd23f";
  const BAT_WING = "#2a2233";

  function jackOLantern() {
    const ribs = propEl("g", { fill: "none", stroke: PUMPKIN_DARK, "stroke-width": 2.4 });
    for (const d of ["M50 22 Q36 46 40 76", "M50 22 Q64 46 60 76", "M50 22 Q18 40 22 70", "M50 22 Q82 40 78 70"]) {
      ribs.appendChild(propEl("path", { d }));
    }
    const face = appendAll(propEl("g", { class: "spooky-flicker", fill: CARVED_GLOW }), [
      propEl("path", { d: "M28 46 L37 34 L42 48 Z" }),
      propEl("path", { d: "M72 46 L63 34 L58 48 Z" }),
      propEl("path", { d: "M26 56 Q50 74 74 56 L69 64 L62 60 L56 68 L50 62 L44 68 L38 60 L31 64 Z" }),
    ]);
    return appendAll(propEl("g"), [
      propEl("path", { d: "M8 50 Q8 22 50 22 Q92 22 92 50 Q92 78 50 78 Q8 78 8 50 Z", fill: PUMPKIN }),
      ribs,
      propEl("path", { d: "M16 40 Q22 28 36 25 Q24 36 22 56 Z", fill: "rgba(255,255,255,0.22)" }),
      face,
      propEl("path", { d: "M46 24 Q45 12 52 6 L57 10 Q51 15 54 24 Z", fill: "#6b8e3a" }),
    ]);
  }

  // Grey outline for the same reason the pañuelo has a hem: white on pale wallpaper.
  function ghostie() {
    return appendAll(propEl("g", { class: "spooky-bob" }), [
      propEl("path", {
        d: "M18 92 L18 44 Q18 10 50 10 Q82 10 82 44 L82 92 q-8 -9 -16 0 q-8 9 -16 0 q-8 -9 -16 0 q-8 9 -16 0 Z",
        fill: "#fbfbf8",
        stroke: "rgba(104,104,118,0.55)",
        "stroke-width": 2.4,
        "stroke-linejoin": "round",
      }),
      propEl("ellipse", { cx: 39, cy: 42, rx: 5.5, ry: 8, fill: "#1b1b22" }),
      propEl("ellipse", { cx: 61, cy: 42, rx: 5.5, ry: 8, fill: "#1b1b22" }),
      propEl("ellipse", { cx: 50, cy: 62, rx: 6, ry: 7.5, fill: "#1b1b22" }),
    ]);
  }

  function batWing(flip) {
    const wing = propEl("path", {
      class: "spooky-flap",
      style: "transform-origin: right center",
      d: "M44 30 Q30 12 4 18 Q12 26 10 36 Q18 32 24 40 Q30 34 38 42 Z",
      fill: BAT_WING,
    });
    if (!flip) return wing;
    return appendAll(propEl("g", { transform: "translate(100 0) scale(-1 1)" }), [wing]);
  }

  function bat() {
    return appendAll(propEl("g", { class: "spooky-bob" }), [
      batWing(false),
      batWing(true),
      propEl("ellipse", { cx: 50, cy: 34, rx: 8, ry: 11, fill: BAT_WING }),
      propEl("path", { d: "M43 25 L44 15 L48 22 Z M57 25 L56 15 L52 22 Z", fill: BAT_WING }),
      propEl("circle", { cx: 46.5, cy: 30, r: 1.8, fill: CARVED_GLOW }),
      propEl("circle", { cx: 53.5, cy: 30, r: 1.8, fill: CARVED_GLOW }),
    ]);
  }

  function candyBucket() {
    return appendAll(propEl("g"), [
      propEl("path", { d: "M18 40 Q50 -6 82 40", fill: "none", stroke: "#3a3a42", "stroke-width": 3 }),
      // Candy first, so the pail's rim covers where it sinks in.
      propEl("rect", { x: 30, y: 26, width: 14, height: 10, rx: 3, fill: "#e8497b", transform: "rotate(-24 37 31)" }),
      propEl("rect", { x: 52, y: 22, width: 16, height: 9, rx: 3, fill: "#4a90d9", transform: "rotate(18 60 26)" }),
      propEl("circle", { cx: 48, cy: 30, r: 6, fill: "#ffd166" }),
      propEl("path", { d: "M14 40 L86 40 L80 88 Q50 96 20 88 Z", fill: PUMPKIN }),
      propEl("ellipse", { cx: 50, cy: 40, rx: 36, ry: 6, fill: PUMPKIN_DARK }),
      propEl("path", { d: "M20 46 L26 46 L28 84 L23 82 Z", fill: "rgba(255,255,255,0.2)" }),
      appendAll(propEl("g", { fill: "#2a1a10" }), [
        propEl("path", { d: "M34 58 L41 50 L44 60 Z" }),
        propEl("path", { d: "M66 58 L59 50 L56 60 Z" }),
        propEl("path", { d: "M32 68 Q50 82 68 68 L64 74 L57 71 L50 77 L43 71 L36 74 Z" }),
      ]),
    ]);
  }

  // --- The christmas kit -------------------------------------------------------
  const XMAS_RED = "#d42a2a";
  const XMAS_GOLD = "#f2c94c";

  function gift() {
    return appendAll(propEl("g"), [
      propEl("rect", { x: 12, y: 36, width: 76, height: 56, rx: 3, fill: XMAS_RED }),
      propEl("rect", { x: 8, y: 26, width: 84, height: 16, rx: 3, fill: "#b81f1f" }),
      propEl("rect", { x: 44, y: 26, width: 12, height: 66, fill: XMAS_GOLD }),
      propEl("rect", { x: 8, y: 30, width: 84, height: 5, fill: "rgba(255,255,255,0.18)" }),
      propEl("path", { d: "M50 26 Q30 2 22 14 Q18 26 50 26 Q82 26 78 14 Q70 2 50 26 Z", fill: XMAS_GOLD, stroke: "#b8902a", "stroke-width": 2 }),
      propEl("circle", { cx: 50, cy: 25, r: 5, fill: "#b8902a" }),
    ]);
  }

  // The stripes are a dashed red stroke laid over the white one, so they follow the hook.
  const CANE = "M62 194 L62 52 Q62 16 40 16 Q18 16 18 42";

  function candyCane() {
    const stroke = { d: CANE, fill: "none", "stroke-linecap": "round" };
    return appendAll(propEl("g", { transform: "rotate(8 50 100)" }), [
      propEl("path", { ...stroke, stroke: "rgba(104,104,118,0.5)", "stroke-width": 21 }),
      propEl("path", { ...stroke, stroke: "#fbfbf8", "stroke-width": 18 }),
      propEl("path", { ...stroke, stroke: "#e0262f", "stroke-width": 18, "stroke-linecap": "butt", "stroke-dasharray": "9 11" }),
    ]);
  }

  function cocoa() {
    const steam = propEl("g", { fill: "none", stroke: "rgba(230,230,240,0.75)", "stroke-width": 3, "stroke-linecap": "round" });
    [["M36 30 q-6 -9 0 -18 q6 -9 0 -18", "0s"], ["M54 30 q6 -9 0 -18 q-6 -9 0 -18", "-0.8s"]].forEach(([d, delay]) => {
      steam.appendChild(propEl("path", { d, class: "xmas-steam", style: `animation-delay: ${delay}` }));
    });
    return appendAll(propEl("g"), [
      steam,
      propEl("path", { d: "M76 46 Q96 46 94 64 Q92 80 72 78", fill: "none", stroke: "#2f9e44", "stroke-width": 7 }),
      propEl("path", { d: "M14 36 L80 36 L76 100 Q47 108 18 100 Z", fill: "#3fb556" }),
      propEl("ellipse", { cx: 47, cy: 36, rx: 33, ry: 7, fill: "#6b3a1f" }),
      propEl("rect", { x: 30, y: 30, width: 10, height: 8, rx: 2, fill: "#fbfbf8", transform: "rotate(-12 35 34)" }),
      propEl("rect", { x: 48, y: 31, width: 10, height: 8, rx: 2, fill: "#fbfbf8", transform: "rotate(14 53 35)" }),
      propEl("path", { d: "M22 44 L27 44 L26 96 L21 94 Z", fill: "rgba(255,255,255,0.22)" }),
      propEl("path", { d: "M20 64 Q47 72 78 64", fill: "none", stroke: "#fbfbf8", "stroke-width": 4, "stroke-dasharray": "2 6", "stroke-linecap": "round" }),
    ]);
  }

  // --- Aura ----------------------------------------------------------------------
  // A season can light up the air around the ball. Two layers: a warm glow behind
  // everything, and falling snow + sparkles in front. Box is 150x125 for a 100 ball.
  const SNOWFLAKES = [
    [14, 0, 7.2, 3],
    [32, -3.1, 9.4, 2.4],
    [58, -5.6, 8.1, 2.8],
    [86, -1.4, 10.3, 2.2],
    [112, -4.2, 7.8, 3.2],
    [134, -6.5, 9, 2.6],
    [74, -7.7, 11, 2],
  ];
  const SPARKLES = [
    [18, 70, 0],
    [130, 56, -0.7],
    [104, 18, -1.3],
    [40, 30, -1.9],
    [140, 104, -0.4],
  ];

  function snowflake(x, delay, seconds, size) {
    const arms = propEl("g", { stroke: "#ffffff", "stroke-width": 0.8, "stroke-linecap": "round" });
    for (const angle of [0, 60, 120]) {
      arms.appendChild(propEl("path", { d: `M0 ${-size} L0 ${size}`, transform: `rotate(${angle})` }));
    }
    arms.setAttribute("transform", `translate(${x} 0)`);
    return appendAll(propEl("g", { style: `animation: rocky-snowfall ${seconds}s linear ${delay}s infinite` }), [arms]);
  }

  function sparkle(x, y, delay) {
    return propEl("path", {
      class: "xmas-twinkle",
      style: `transform-origin: ${x}px ${y}px; animation-delay: ${delay}s`,
      d: `M${x} ${y - 5} Q${x} ${y} ${x + 5} ${y} Q${x} ${y} ${x} ${y + 5} Q${x} ${y} ${x - 5} ${y} Q${x} ${y} ${x} ${y - 5} Z`,
      fill: "#fff6c8",
    });
  }

  function createAura(season, { diameter }) {
    if (season !== "christmas") return [];
    const size = diameter * 1.5;
    const glow = propEl("svg", { class: "ball-layer ball-aura-glow", width: size, height: size, viewBox: "0 0 100 100" });
    const gradientId = `rockyAura${(propInstances += 1)}`;
    const gradient = propEl("radialGradient", { id: gradientId });
    appendAll(gradient, [
      propEl("stop", { offset: "0.45", "stop-color": "#ffe9a8", "stop-opacity": "0.45" }),
      propEl("stop", { offset: "0.7", "stop-color": "#ffd166", "stop-opacity": "0.22" }),
      propEl("stop", { offset: "1", "stop-color": "#ffd166", "stop-opacity": "0" }),
    ]);
    appendAll(glow, [gradient, propEl("circle", { class: "xmas-pulse", cx: 50, cy: 50, r: 50, fill: `url(#${gradientId})` })]);
    glow.style.bottom = `${(-(size - diameter) / 2).toFixed(2)}px`;
    glow.style.marginLeft = `${(-size / 2).toFixed(2)}px`;

    const air = propEl("svg", { class: "ball-prop", width: size, height: diameter * 1.25, viewBox: "0 0 150 125" });
    for (const flake of SNOWFLAKES) air.appendChild(snowflake(...flake));
    for (const spot of SPARKLES) air.appendChild(sparkle(...spot));
    air.style.bottom = "0px";
    air.style.marginLeft = `${(-size / 2).toFixed(2)}px`;
    return [glow, air];
  }

  // widthRatio  — prop width as a fraction of the ball's diameter.
  // aspect      — prop height as a fraction of its own width.
  // sideRatio   — how far right of the ball's centre the prop is centred.
  // bottomRatio — where its bottom edge sits above the ground Rocky stands on.
  // Mounted props reach back into the sphere; the edibles just sit on the floor.
  const PROPS = {
    bandera: { build: bandera, aspect: 1.15, widthRatio: 0.46, sideRatio: 0.58, bottomRatio: 0.3, season: "dieciocho" },
    terremoto: { build: terremoto, aspect: 1.3, widthRatio: 0.38, sideRatio: 0.55, bottomRatio: 0.02, season: "dieciocho" },
    empanada: { build: empanada, aspect: 0.66, widthRatio: 0.42, sideRatio: 0.56, bottomRatio: 0.02, season: "dieciocho" },
    volantin: { build: volantin, aspect: 1.2, widthRatio: 0.4, sideRatio: 0.52, bottomRatio: 0.55, season: "dieciocho" },
    sopaipillas: { build: sopaipillas, aspect: 0.62, widthRatio: 0.42, sideRatio: 0.55, bottomRatio: 0.01, season: "dieciocho" },
    panuelo: { build: panuelo, aspect: 1, widthRatio: 0.4, sideRatio: 0.5, bottomRatio: 0.42, season: "dieciocho" },
    lantern: { build: jackOLantern, aspect: 0.8, widthRatio: 0.4, sideRatio: 0.56, bottomRatio: 0.02, season: "spooky" },
    ghost: { build: ghostie, aspect: 1, widthRatio: 0.32, sideRatio: 0.58, bottomRatio: 0.5, season: "spooky" },
    bat: { build: bat, aspect: 0.5, widthRatio: 0.44, sideRatio: 0.52, bottomRatio: 0.72, season: "spooky" },
    bucket: { build: candyBucket, aspect: 0.95, widthRatio: 0.36, sideRatio: 0.56, bottomRatio: 0.01, season: "spooky" },
    gift: { build: gift, aspect: 0.95, widthRatio: 0.36, sideRatio: 0.56, bottomRatio: 0.01, season: "christmas" },
    candycane: { build: candyCane, aspect: 2, widthRatio: 0.22, sideRatio: 0.54, bottomRatio: 0.01, season: "christmas" },
    cocoa: { build: cocoa, aspect: 1.1, widthRatio: 0.34, sideRatio: 0.56, bottomRatio: 0.01, season: "christmas" },
  };

  const PROP_NAMES = Object.keys(PROPS);

  function propsFor(season) {
    return PROP_NAMES.filter((name) => PROPS[name].season === season);
  }

  // Returns null for a missing name so the caller can append unconditionally —
  // out of season there is no prop at all.
  function createProp(name, { diameter }) {
    const prop = PROPS[name];
    if (!prop) return null;
    const width = diameter * prop.widthRatio;
    const height = width * prop.aspect;
    const svg = propEl("svg", {
      class: "ball-prop",
      width,
      height,
      viewBox: `0 0 100 ${100 * prop.aspect}`,
    });
    svg.appendChild(prop.build());
    svg.style.bottom = `${(diameter * prop.bottomRatio).toFixed(2)}px`;
    svg.style.marginLeft = `${(diameter * prop.sideRatio - width / 2).toFixed(2)}px`;
    return svg;
  }

  window.RockyProps = { PROP_NAMES, propsFor, createProp, createAura };
})();
