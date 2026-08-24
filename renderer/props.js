"use strict";

// Fiesta-patrias props. Rocky's ball has no hands, so a prop is either mounted on
// the sphere (flag, volantín, pañuelo) or set on the ground beside it (the food).

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

  // widthRatio  — prop width as a fraction of the ball's diameter.
  // aspect      — prop height as a fraction of its own width.
  // sideRatio   — how far right of the ball's centre the prop is centred.
  // bottomRatio — where its bottom edge sits above the ground Rocky stands on.
  // Mounted props reach back into the sphere; the edibles just sit on the floor.
  const PROPS = {
    bandera: { build: bandera, aspect: 1.15, widthRatio: 0.46, sideRatio: 0.58, bottomRatio: 0.3 },
    terremoto: { build: terremoto, aspect: 1.3, widthRatio: 0.38, sideRatio: 0.55, bottomRatio: 0.02 },
    empanada: { build: empanada, aspect: 0.66, widthRatio: 0.42, sideRatio: 0.56, bottomRatio: 0.02 },
    volantin: { build: volantin, aspect: 1.2, widthRatio: 0.4, sideRatio: 0.52, bottomRatio: 0.55 },
    sopaipillas: { build: sopaipillas, aspect: 0.62, widthRatio: 0.42, sideRatio: 0.55, bottomRatio: 0.01 },
    panuelo: { build: panuelo, aspect: 1, widthRatio: 0.4, sideRatio: 0.5, bottomRatio: 0.42 },
  };

  const PROP_NAMES = Object.keys(PROPS);

  // Returns null for a missing name so the caller can append unconditionally —
  // outside the dieciocho there is no prop at all.
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

  window.RockyProps = { PROP_NAMES, createProp };
})();
