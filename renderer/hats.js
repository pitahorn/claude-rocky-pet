"use strict";

// Hats for Rocky's ball. In the film they perch them on top of the sphere, so
// each hat is drawn in a 100x100 box with its seat line at y=100, then scaled and
// sunk into the sphere's curve by the caller.

// Wrapped so the renderer's shared global scope only ever sees the export below.
(() => {
  const HAT_SVG_NS = "http://www.w3.org/2000/svg";

  // The party hat clips its stripes, so every instance needs its own clip id.
  let hatInstances = 0;

  // Extra drawing room below the seat line, in the hats' 100-unit coordinate box.
  const SEAT_BLEED = 6;

  function hatEl(tag, attrs = {}) {
    const el = document.createElementNS(HAT_SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    return el;
  }

  function appendAll(group, children) {
    for (const child of children) group.appendChild(child);
    return group;
  }

  // --- The hats ----------------------------------------------------------------
  function topHat() {
    return appendAll(hatEl("g"), [
      hatEl("ellipse", { cx: 50, cy: 95, rx: 48, ry: 8, fill: "#191920" }),
      hatEl("ellipse", { cx: 50, cy: 92, rx: 48, ry: 8, fill: "#26262f" }),
      hatEl("path", { d: "M20 93 L24 26 Q50 19 76 26 L80 93 Q50 101 20 93 Z", fill: "#191920" }),
      hatEl("path", { d: "M28 91 L31 28 Q38 25 44 24 L40 92 Z", fill: "rgba(255,255,255,0.09)" }),
      hatEl("path", { d: "M21 82 Q50 90 79 82 L80 93 Q50 101 20 93 Z", fill: "#2ee6d6" }),
      hatEl("ellipse", { cx: 50, cy: 24, rx: 26, ry: 6, fill: "#2f2f3a" }),
    ]);
  }

  function partyHat() {
    const clipId = `rockyHatCone${(hatInstances += 1)}`;
    const cone = hatEl("clipPath", { id: clipId });
    cone.appendChild(hatEl("path", { d: "M50 10 L82 94 Q50 102 18 94 Z" }));
    const stripes = hatEl("g", { "clip-path": `url(#${clipId})` });
    for (const y of [24, 46, 68]) {
      stripes.appendChild(
        hatEl("path", {
          d: `M8 ${y + 12} L92 ${y - 6} L92 ${y + 6} L8 ${y + 24} Z`,
          fill: "#ffd166",
        }),
      );
    }
    return appendAll(hatEl("g"), [
      cone,
      hatEl("path", { d: "M50 10 L82 94 Q50 102 18 94 Z", fill: "#ff5f8f" }),
      stripes,
      hatEl("path", { d: "M50 10 L60 92 Q50 95 43 93 Z", fill: "rgba(255,255,255,0.16)" }),
      hatEl("ellipse", { cx: 50, cy: 95, rx: 32, ry: 7, fill: "#e8497b" }),
      hatEl("circle", { cx: 50, cy: 10, r: 10, fill: "#fff3b0" }),
      hatEl("circle", { cx: 46, cy: 7, r: 3.4, fill: "rgba(255,255,255,0.75)" }),
    ]);
  }

  // Low and wide — a beanie is a shallow cap with a thick rolled brim, not a dome.
  function beanie() {
    const knit = hatEl("g", { stroke: "rgba(0,0,0,0.13)", "stroke-width": 2.2, fill: "none" });
    for (const x of [28, 40, 52, 64, 74]) {
      knit.appendChild(hatEl("path", { d: `M${x} 56 Q${x + 3} 70 ${x + 1} 84` }));
    }
    return appendAll(hatEl("g"), [
      hatEl("path", { d: "M8 88 Q8 50 50 50 Q92 50 92 88 Z", fill: "#d8543f" }),
      knit,
      hatEl("path", { d: "M15 60 Q26 50 42 50 Q28 58 23 84 Z", fill: "rgba(255,255,255,0.14)" }),
      hatEl("rect", { x: 4, y: 80, width: 92, height: 20, rx: 10, fill: "#f6e2d5" }),
      hatEl("rect", { x: 4, y: 80, width: 92, height: 7, rx: 3.5, fill: "rgba(255,255,255,0.5)" }),
      hatEl("circle", { cx: 50, cy: 45, r: 9, fill: "#f6e2d5" }),
      hatEl("circle", { cx: 46, cy: 42, r: 3.2, fill: "rgba(255,255,255,0.7)" }),
    ]);
  }

  function hardHat() {
    return appendAll(hatEl("g"), [
      hatEl("ellipse", { cx: 50, cy: 90, rx: 48, ry: 10, fill: "#f0a71f" }),
      hatEl("path", { d: "M14 90 Q14 26 50 26 Q86 26 86 90 Z", fill: "#ffc93c" }),
      hatEl("path", { d: "M44 27 Q50 26 56 27 L56 90 L44 90 Z", fill: "#ffd968" }),
      hatEl("path", { d: "M20 42 Q28 28 42 26 Q28 38 24 66 Z", fill: "rgba(255,255,255,0.28)" }),
      hatEl("rect", { x: 14, y: 78, width: 72, height: 9, rx: 4, fill: "rgba(0,0,0,0.14)" }),
      hatEl("ellipse", { cx: 50, cy: 90, rx: 40, ry: 7, fill: "rgba(0,0,0,0.12)" }),
    ]);
  }

  // Folded-newspaper hat, three-quarter view: triangular peak seated on a wide
  // band whose ends taper to points, with the hat's dark inside showing beneath.
  const PAPER_PEAK = "M56 22 L21 53 L86 48 Z";
  const PAPER_BAND = "M3 70 L21 53 L86 48 L98 62 L90 85 L11 91 Z";

  function paperHat() {
    const clipId = `rockyHatPaper${(hatInstances += 1)}`;
    const clip = hatEl("clipPath", { id: clipId });
    clip.appendChild(hatEl("path", { d: PAPER_PEAK }));
    clip.appendChild(hatEl("path", { d: PAPER_BAND }));

    // Newsprint: grey rules that read as columns of type at hat size.
    const print = hatEl("g", { "clip-path": `url(#${clipId})`, fill: "#8d887c" });
    for (let row = 0; row < 4; row++) {
      const y = 30 + row * 6;
      print.appendChild(hatEl("rect", { x: 30, y, width: 34, height: 1.8, rx: 0.9 }));
    }
    for (let row = 0; row < 4; row++) {
      const y = 58 + row * 7;
      print.appendChild(hatEl("rect", { x: 10, y: y + 4, width: 28, height: 2, rx: 1 }));
      print.appendChild(hatEl("rect", { x: 46, y, width: 40, height: 2, rx: 1 }));
    }

    const paper = { fill: "#f7f5ee", stroke: "#cdc7b8", "stroke-width": 1.1 };
    return appendAll(hatEl("g"), [
      clip,
      // Inside of the hat, seen under the band's lower edge.
      hatEl("path", { d: "M11 91 L90 85 L84 97 L17 100 Z", fill: "#2c2b28" }),
      hatEl("path", { d: PAPER_BAND, ...paper }),
      hatEl("path", { d: PAPER_PEAK, ...paper }),
      print,
      // The centre fold, and the shading on the face turned away from the light.
      hatEl("path", { d: "M56 22 L64 50", stroke: "#cdc7b8", "stroke-width": 1.1, fill: "none" }),
      hatEl("path", { d: "M56 22 L86 48 L64 50 Z", fill: "rgba(0,0,0,0.06)" }),
      hatEl("path", { d: "M86 48 L98 62 L90 85 L79 86 Z", fill: "rgba(0,0,0,0.08)" }),
    ]);
  }

  // Jockey cap, three-quarter view: shallow panelled crown, bill sweeping out
  // low to the left, outlined in the cap's own deep blue.
  const CAP_CROWN = "M26 96 C26 60 40 46 60 46 C82 46 92 64 92 96 Z";

  function cap() {
    const clipId = `rockyHatCap${(hatInstances += 1)}`;
    const clip = hatEl("clipPath", { id: clipId });
    clip.appendChild(hatEl("path", { d: CAP_CROWN }));

    // Deep blue rather than black: a black outline reads far heavier than Rocky
    // and than the other hats, none of which are outlined at all.
    const outline = { stroke: "#1e4a86", "stroke-width": 3.6, "stroke-linejoin": "round" };
    const panels = hatEl("g", { "clip-path": `url(#${clipId})` });
    appendAll(panels, [
      hatEl("path", { d: "M21 100 C21 68 32 51 52 47 C41 58 37 76 37 100 Z", fill: "#a9cfee" }),
      hatEl("path", { d: "M72 47 C79 60 80 78 80 100 L97 100 C97 70 89 52 72 47 Z", fill: "#3576b8" }),
      hatEl("path", { d: "M52 47 C44 62 40 80 40 100", ...outline, "stroke-width": 2.8, fill: "none" }),
      hatEl("path", { d: "M72 47 C78 63 79 80 79 100", ...outline, "stroke-width": 2.8, fill: "none" }),
    ]);

    return appendAll(hatEl("g"), [
      clip,
      // Bill first, so the crown covers where it tucks in.
      hatEl("path", {
        d: "M34 84 C19 78 7 80 5 88 C4 96 14 99 26 97 C39 95 51 91 58 86 Z",
        fill: "#2f7cc4",
        ...outline,
      }),
      hatEl("path", { d: CAP_CROWN, fill: "#4a90d9", ...outline }),
      panels,
      // Restore the crisp silhouette the panels painted over.
      hatEl("path", { d: CAP_CROWN, fill: "none", ...outline }),
      hatEl("path", { d: "M28 92 C48 86 72 87 91 92", fill: "none", ...outline, "stroke-width": 2.8 }),
      hatEl("circle", { cx: 60, cy: 48, r: 4.5, fill: "#2f7cc4", ...outline, "stroke-width": 2.8 }),
    ]);
  }

  // --- The dieciocho kit -------------------------------------------------------
  // Chupalla and sombrero de huaso are one silhouette in two materials — straw
  // and black felt — so both are cut from the same body.
  const HUASO_CROWN = "M27 88 L27 56 Q50 50 73 56 L73 88 Q50 95 27 88 Z";
  const HUASO_SHEEN = "M31 60 Q35 53 45 51 Q37 60 35 87 Z";
  const HUASO_BAND_Y = [79.5, 83, 86.5];
  const FLAG_BLUE = "#0039a6";
  const FLAG_RED = "#d52b1e";
  const BAND_WHITE = "#f4f2ea";

  function huasoBrim(brim, brimShade) {
    return [
      hatEl("ellipse", { cx: 50, cy: 95, rx: 49, ry: 12.5, fill: brimShade }),
      hatEl("ellipse", { cx: 50, cy: 91, rx: 49, ry: 12.5, fill: brim }),
    ];
  }

  function huasoCrown(crown, crownTop, crease) {
    return [
      hatEl("path", { d: HUASO_CROWN, fill: crown }),
      hatEl("ellipse", { cx: 50, cy: 56, rx: 23, ry: 6.5, fill: crownTop }),
      hatEl("ellipse", { cx: 50, cy: 57.6, rx: 14, ry: 3.8, fill: crease }),
    ];
  }

  function huasoBand() {
    const band = hatEl("g", { fill: "none", "stroke-width": 3.6 });
    const colors = [FLAG_BLUE, BAND_WHITE, FLAG_RED];
    HUASO_BAND_Y.forEach((y, index) => {
      band.appendChild(hatEl("path", { d: `M27 ${y} Q50 ${y + 7} 73 ${y}`, stroke: colors[index] }));
    });
    return band;
  }

  function chupalla() {
    const brimWeave = hatEl("g", { fill: "none", stroke: "rgba(146,110,44,0.4)", "stroke-width": 1.5 });
    for (const [rx, ry] of [[41, 10.4], [31, 7.8], [21, 5.2]]) {
      brimWeave.appendChild(hatEl("ellipse", { cx: 50, cy: 91, rx, ry }));
    }
    const crownWeave = hatEl("g", { fill: "none", stroke: "rgba(146,110,44,0.34)", "stroke-width": 1.5 });
    for (const y of [62, 68, 74]) {
      crownWeave.appendChild(hatEl("path", { d: `M27.5 ${y} Q50 ${y + 6.5} 72.5 ${y}` }));
    }
    return appendAll(hatEl("g"), [
      ...huasoBrim("#e6c877", "#b3903f"),
      brimWeave,
      ...huasoCrown("#dcbc69", "#efd694", "#d3b25e"),
      crownWeave,
      hatEl("path", { d: HUASO_SHEEN, fill: "rgba(255,255,255,0.2)" }),
      huasoBand(),
    ]);
  }

  function huasoHat() {
    return appendAll(hatEl("g"), [
      ...huasoBrim("#26262c", "#141419"),
      // Felt takes a soft sheen where straw takes a weave.
      hatEl("ellipse", { cx: 50, cy: 89, rx: 40, ry: 9.5, fill: "rgba(255,255,255,0.06)" }),
      ...huasoCrown("#26262c", "#34343d", "#1c1c22"),
      hatEl("path", { d: HUASO_SHEEN, fill: "rgba(255,255,255,0.1)" }),
      huasoBand(),
    ]);
  }

  // --- The spooky kit ----------------------------------------------------------
  // Every spooky hat that hugs the sphere follows this arc: the seat line at
  // y=100 meets the surface at the edges, and the dome stands ~11 units proud.
  const SPHERE_ARC = "M6 100 Q50 79 94 100";
  const BANDAGE = "#efe8d6";
  const BANDAGE_INK = "rgba(110,98,78,0.55)";
  const ALIEN_GREEN = "#7be36b";

  function witchHat() {
    return appendAll(hatEl("g"), [
      hatEl("ellipse", { cx: 50, cy: 94, rx: 49, ry: 9, fill: "#1d1426" }),
      hatEl("ellipse", { cx: 50, cy: 91, rx: 49, ry: 9, fill: "#2c1f3a" }),
      // Cone with the tip folded over to the right, the way a worn one sags.
      hatEl("path", { d: "M28 90 L44 34 Q50 14 66 10 Q80 8 84 18 Q72 16 64 26 L72 90 Q50 96 28 90 Z", fill: "#2c1f3a" }),
      hatEl("path", { d: "M33 88 L46 36 Q49 26 55 20 L44 88 Z", fill: "rgba(255,255,255,0.08)" }),
      hatEl("path", { d: "M30 80 Q50 86 70 80 L72 90 Q50 96 28 90 Z", fill: "#8e44c9" }),
      hatEl("rect", { x: 44, y: 79, width: 12, height: 11, rx: 1.5, fill: "none", stroke: "#f2c94c", "stroke-width": 2.4 }),
    ]);
  }

  function pumpkinHead() {
    const ribs = hatEl("g", { fill: "none", stroke: "#c9640c", "stroke-width": 2.2 });
    for (const d of ["M50 44 Q38 70 40 98", "M50 44 Q62 70 60 98", "M50 44 Q24 64 22 96", "M50 44 Q76 64 78 96"]) {
      ribs.appendChild(hatEl("path", { d }));
    }
    // The carved face glows from inside, so it gets the flicker the lantern prop has.
    const face = appendAll(hatEl("g", { class: "spooky-flicker", fill: "#ffd23f" }), [
      hatEl("path", { d: "M31 72 L39 62 L43 74 Z" }),
      hatEl("path", { d: "M69 72 L61 62 L57 74 Z" }),
      hatEl("path", { d: "M30 82 Q50 94 70 82 L66 88 L60 85 L55 91 L50 87 L45 91 L40 85 L34 88 Z" }),
    ]);
    return appendAll(hatEl("g"), [
      hatEl("path", { d: "M8 100 Q4 46 50 44 Q96 46 92 100 Q50 106 8 100 Z", fill: "#f28a1d" }),
      ribs,
      hatEl("path", { d: "M16 66 Q24 50 40 46 Q26 58 22 84 Z", fill: "rgba(255,255,255,0.22)" }),
      face,
      hatEl("path", { d: "M47 46 Q46 36 52 30 L56 33 Q51 38 53 46 Z", fill: "#6b8e3a" }),
      hatEl("path", { d: "M54 36 Q64 28 72 34 Q62 40 54 36 Z", fill: "#8db84a" }),
    ]);
  }

  function horn(flip) {
    return hatEl("path", {
      d: "M30 92 Q22 70 30 52 Q34 70 42 90 Z",
      fill: "#d7263d",
      stroke: "#8f1123",
      "stroke-width": 2,
      "stroke-linejoin": "round",
      transform: flip ? "translate(100 0) scale(-1 1)" : "",
    });
  }

  function devilHorns() {
    return appendAll(hatEl("g"), [
      hatEl("path", { d: SPHERE_ARC, fill: "none", stroke: "#2a1a1f", "stroke-width": 4.5, "stroke-linecap": "round" }),
      horn(false),
      horn(true),
      hatEl("path", { d: "M29 60 Q28 70 33 82", fill: "none", stroke: "rgba(255,255,255,0.35)", "stroke-width": 2, "stroke-linecap": "round" }),
      hatEl("path", { d: "M71 60 Q72 70 67 82", fill: "none", stroke: "rgba(255,255,255,0.35)", "stroke-width": 2, "stroke-linecap": "round" }),
    ]);
  }

  const MUMMY_DOME = "M8 100 Q8 54 50 54 Q92 54 92 100 Q50 106 8 100 Z";

  function mummyWrap() {
    const clipId = `rockyHatMummy${(hatInstances += 1)}`;
    const clip = hatEl("clipPath", { id: clipId });
    clip.appendChild(hatEl("path", { d: MUMMY_DOME }));
    const strips = hatEl("g", { "clip-path": `url(#${clipId})`, fill: "none", stroke: BANDAGE_INK, "stroke-width": 1.8 });
    for (const [y, tilt] of [[62, 8], [72, -6], [82, 7], [92, -5]]) {
      strips.appendChild(hatEl("path", { d: `M0 ${y + tilt} Q50 ${y - 6} 100 ${y - tilt}` }));
    }
    // The loose end is cloth, so it swings on the same wind as the flag.
    const tail = hatEl("path", {
      class: "prop-flutter",
      style: "transform-origin: left top",
      d: "M84 70 Q98 74 100 90 L93 92 Q91 80 82 78 Z",
      fill: BANDAGE,
      stroke: BANDAGE_INK,
      "stroke-width": 1.6,
    });
    return appendAll(hatEl("g"), [
      clip,
      tail,
      hatEl("path", { d: MUMMY_DOME, fill: BANDAGE, stroke: BANDAGE_INK, "stroke-width": 2 }),
      strips,
    ]);
  }

  // A sheet thrown over the top of the ball. The grey hem keeps the white from
  // reading as a blank blob on pale wallpaper.
  function ghostSheet() {
    const d = `M4 100 C4 46 22 38 50 38 C78 38 96 46 96 100${" q-7.667 6 -15.333 0".repeat(6)}`;
    return appendAll(hatEl("g"), [
      hatEl("path", {
        d: `${d} Z`,
        fill: "#fbfbf8",
        stroke: "rgba(104,104,118,0.55)",
        "stroke-width": 2.2,
        "stroke-linejoin": "round",
      }),
      hatEl("path", { d: "M16 70 Q22 48 40 42 Q26 56 24 88 Z", fill: "rgba(0,0,0,0.05)" }),
      hatEl("ellipse", { cx: 39, cy: 70, rx: 6, ry: 9, fill: "#1b1b22" }),
      hatEl("ellipse", { cx: 61, cy: 70, rx: 6, ry: 9, fill: "#1b1b22" }),
    ]);
  }

  function frankensteinTop() {
    return appendAll(hatEl("g"), [
      hatEl("path", { d: "M20 100 L22 58 L78 58 L80 100 Q50 106 20 100 Z", fill: "#86b86a" }),
      hatEl("path", { d: "M24 98 L26 60 L36 60 L32 99 Z", fill: "rgba(255,255,255,0.14)" }),
      // The flat-top: a slab of hair with a ragged fringe over the brow.
      hatEl("path", {
        d: "M17 40 L83 40 L83 66 L76 72 L70 66 L62 73 L55 66 L47 73 L40 66 L32 72 L25 66 L17 70 Z",
        fill: "#1e1e22",
      }),
      hatEl("rect", { x: 17, y: 40, width: 66, height: 5, fill: "rgba(255,255,255,0.12)" }),
      hatEl("path", { d: "M30 86 L70 84", fill: "none", stroke: "#2f4a24", "stroke-width": 2.2 }),
      appendAll(hatEl("g", { stroke: "#2f4a24", "stroke-width": 2, "stroke-linecap": "round" }), [
        hatEl("path", { d: "M36 81 L37 89" }),
        hatEl("path", { d: "M46 80 L47 89" }),
        hatEl("path", { d: "M56 80 L57 88" }),
        hatEl("path", { d: "M66 79 L67 88" }),
      ]),
    ]);
  }

  // Not an Eridian costume. What Earth movies think an alien looks like.
  function antenna(x, lean) {
    const tipX = x + lean;
    return appendAll(hatEl("g", { class: "spooky-wobble", style: `transform-origin: ${x}px 92px` }), [
      hatEl("path", { d: `M${x} 92 Q${x + lean / 3} 70 ${tipX} 52`, fill: "none", stroke: "#2c7a2c", "stroke-width": 3.2, "stroke-linecap": "round" }),
      hatEl("circle", { cx: tipX, cy: 48, r: 7, fill: ALIEN_GREEN, stroke: "#2c7a2c", "stroke-width": 2 }),
      hatEl("circle", { cx: tipX - 2.4, cy: 45.6, r: 2.4, fill: "rgba(255,255,255,0.75)" }),
    ]);
  }

  function alienBand() {
    return appendAll(hatEl("g"), [
      antenna(36, -12),
      antenna(64, 12),
      hatEl("path", { d: SPHERE_ARC, fill: "none", stroke: ALIEN_GREEN, "stroke-width": 6, "stroke-linecap": "round" }),
      hatEl("path", { d: SPHERE_ARC, fill: "none", stroke: "#2c7a2c", "stroke-width": 1.4, transform: "translate(0 2.6)" }),
    ]);
  }

  // --- Accessories -------------------------------------------------------------
  // Worn on the ball itself rather than on top of it. Drawn in a 100x50 box.
  function bowtie() {
    return appendAll(hatEl("g"), [
      hatEl("path", { d: "M50 25 L7 3 Q0 25 7 47 Z", fill: "#191920" }),
      hatEl("path", { d: "M50 25 L93 3 Q100 25 93 47 Z", fill: "#191920" }),
      hatEl("path", { d: "M50 25 L10 6 Q6 15 6 22 Z", fill: "rgba(255,255,255,0.1)" }),
      hatEl("rect", { x: 41, y: 12, width: 18, height: 26, rx: 5, fill: "#2ee6d6" }),
      hatEl("rect", { x: 44, y: 15, width: 5, height: 20, rx: 2.5, fill: "rgba(255,255,255,0.3)" }),
    ]);
  }

  // Manta de huaso: a square blanket in plain stripes. The one with woven designs
  // is a chamanto — finer, reversible, a different garment.
  const MANTA_SHAPE = "M12 4 L88 4 L97 62 Q50 72 3 62 Z";
  const MANTA_STRIPES = [
    [16, 3, "#efe9dc"],
    [19, 10, "#c62828"],
    [29, 3, "#efe9dc"],
    [42, 3, "#efe9dc"],
    [45, 10, "#c62828"],
    [55, 3, "#efe9dc"],
  ];

  function manta() {
    const clipId = `rockyMantaCloth${(hatInstances += 1)}`;
    const clip = hatEl("clipPath", { id: clipId });
    clip.appendChild(hatEl("path", { d: MANTA_SHAPE }));

    const stripes = hatEl("g", { "clip-path": `url(#${clipId})` });
    for (const [y, height, fill] of MANTA_STRIPES) {
      stripes.appendChild(hatEl("rect", { x: 0, y, width: 100, height, fill }));
    }

    // The hem dips in the middle, so each strand has to start on the curve.
    const fringe = hatEl("g", { stroke: "#efe9dc", "stroke-width": 1.8, "stroke-linecap": "round" });
    for (let strand = 0; strand < 11; strand++) {
      const x = 8 + strand * 8.4;
      const hem = 62 + 10 * (1 - ((x - 50) / 47) ** 2);
      fringe.appendChild(
        hatEl("path", { d: `M${x.toFixed(1)} ${hem.toFixed(1)} L${(x + 0.8).toFixed(1)} ${(hem + 8).toFixed(1)}` }),
      );
    }

    return appendAll(hatEl("g"), [
      clip,
      fringe,
      hatEl("path", { d: MANTA_SHAPE, fill: "#1c1c22" }),
      stripes,
      hatEl("path", { d: "M74 4 L88 4 L97 62 Q86 66 76 67 Z", fill: "rgba(0,0,0,0.22)" }),
    ]);
  }

  // Bolts poke out past both sides of the sphere, so this box is wider than it.
  function bolt(flip) {
    return appendAll(hatEl("g", { transform: flip ? "translate(100 0) scale(-1 1)" : "" }), [
      hatEl("rect", { x: 4, y: 10, width: 12, height: 10, fill: "#8d939b", stroke: "#4c5157", "stroke-width": 1.6 }),
      hatEl("rect", { x: 0, y: 6, width: 6, height: 18, rx: 1.5, fill: "#b3b9c0", stroke: "#4c5157", "stroke-width": 1.6 }),
    ]);
  }

  function neckBolts() {
    return appendAll(hatEl("g"), [bolt(false), bolt(true)]);
  }

  // The big black almond eyes from the movies — worn by an alien who has none.
  function alienEyes() {
    const eye = (flip) =>
      appendAll(hatEl("g", { transform: flip ? "translate(100 0) scale(-1 1)" : "" }), [
        hatEl("path", { d: "M47 12 Q30 2 10 8 Q8 22 22 30 Q40 32 47 12 Z", fill: "#111116", stroke: "#2c7a2c", "stroke-width": 2.2 }),
        hatEl("ellipse", { cx: 22, cy: 13, rx: 5, ry: 3, fill: "rgba(255,255,255,0.7)", transform: "rotate(-15 22 13)" }),
      ]);
    return appendAll(hatEl("g"), [
      hatEl("path", { d: "M8 12 Q50 22 92 12", fill: "none", stroke: ALIEN_GREEN, "stroke-width": 3 }),
      eye(false),
      eye(true),
    ]);
  }

  // bottomRatio — where the accessory sits above the ball's resting point, as a
  // fraction of the diameter.
  const ACCESSORIES = {
    tophat: { build: bowtie, aspect: 0.5, widthRatio: 0.3, bottomRatio: 0.26 },
    chupalla: { build: manta, aspect: 0.82, widthRatio: 0.58, bottomRatio: 0.17 },
    huaso: { build: manta, aspect: 0.82, widthRatio: 0.58, bottomRatio: 0.17 },
    frankenstein: { build: neckBolts, aspect: 0.3, widthRatio: 1.1, bottomRatio: 0.24 },
    alien: { build: alienEyes, aspect: 0.34, widthRatio: 0.56, bottomRatio: 0.44 },
  };

  // widthRatio  — hat width as a fraction of the ball's diameter.
  // brimRatio   — the hat's seat half-width as a fraction of its own width; drives
  //               how far it sinks into the sphere's curve so it never looks stuck
  //               on as a flat sticker.
  const HATS = {
    tophat: { build: topHat, widthRatio: 0.5, brimRatio: 0.48 },
    party: { build: partyHat, widthRatio: 0.42, brimRatio: 0.32 },
    beanie: { build: beanie, widthRatio: 0.56, brimRatio: 0.46 },
    hardhat: { build: hardHat, widthRatio: 0.5, brimRatio: 0.48 },
    paper: { build: paperHat, widthRatio: 0.62, brimRatio: 0.4 },
    // The bill is cantilevered out past the crown, so the seat is the crown only.
    cap: { build: cap, widthRatio: 0.58, brimRatio: 0.33 },
    // Both dieciocho hats are mostly brim, and the brim is what rests on the sphere.
    chupalla: { build: chupalla, widthRatio: 0.64, brimRatio: 0.49, season: "dieciocho" },
    huaso: { build: huasoHat, widthRatio: 0.64, brimRatio: 0.49, season: "dieciocho" },
    witch: { build: witchHat, widthRatio: 0.62, brimRatio: 0.49, season: "spooky" },
    pumpkin: { build: pumpkinHead, widthRatio: 0.56, brimRatio: 0.44, season: "spooky" },
    horns: { build: devilHorns, widthRatio: 0.5, brimRatio: 0.44, season: "spooky" },
    mummy: { build: mummyWrap, widthRatio: 0.58, brimRatio: 0.42, season: "spooky" },
    ghost: { build: ghostSheet, widthRatio: 0.66, brimRatio: 0.46, season: "spooky" },
    frankenstein: { build: frankensteinTop, widthRatio: 0.5, brimRatio: 0.3, season: "spooky" },
    alien: { build: alienBand, widthRatio: 0.5, brimRatio: 0.44, season: "spooky" },
  };

  const HAT_NAMES = Object.keys(HATS);

  // Pass no season for the everyday hats. Lets the calendar in pet.js swap pools.
  function hatsFor(season) {
    return HAT_NAMES.filter((name) => HATS[name].season === season);
  }

  // Build a hat sized for a ball of `diameter`, as its own layer. It gets a layer
  // rather than a slot inside the ball SVG because it stands a half-diameter above
  // the sphere's top — inside the ball's box it would simply be clipped away.
  // Positioned from the same baseline Rocky's feet and the ball rest on.
  function createHat(name, { diameter }) {
    const hat = HATS[name];
    if (!hat) return null;
    const width = diameter * hat.widthRatio;
    const radius = diameter / 2;
    const seatHalf = width * hat.brimRatio;
    // How deep the sphere's surface sits at the seat's outer edge — the hat drops
    // by that much so its brim follows the curve instead of floating on the point.
    const sink = radius - Math.sqrt(Math.max(0, radius * radius - seatHalf * seatHalf));

    // Drawn in a 100-wide box with the seat at y=100. The box runs a little past
    // the seat so a brim that bulges below it (the top hat's does) isn't clipped.
    const scale = width / 100;
    const height = width + SEAT_BLEED * scale;
    const svg = hatEl("svg", {
      class: "ball-hat",
      width,
      height,
      viewBox: `0 0 100 ${100 + SEAT_BLEED}`,
    });
    svg.appendChild(hat.build());
    svg.style.bottom = `${(diameter - sink - SEAT_BLEED * scale).toFixed(2)}px`;
    svg.style.marginLeft = `${(-width / 2).toFixed(2)}px`;
    return svg;
  }

  // Some hats bring a matching extra worn on the sphere. Returns null for the
  // hats that don't, so callers can append it unconditionally.
  function createAccessory(hatName, { diameter }) {
    const accessory = ACCESSORIES[hatName];
    if (!accessory) return null;
    const width = diameter * accessory.widthRatio;
    const height = width * accessory.aspect;
    const svg = hatEl("svg", {
      class: "ball-accessory",
      width,
      height,
      viewBox: `0 0 100 ${100 * accessory.aspect}`,
    });
    svg.appendChild(accessory.build());
    svg.style.bottom = `${(diameter * accessory.bottomRatio).toFixed(2)}px`;
    svg.style.marginLeft = `${(-width / 2).toFixed(2)}px`;
    return svg;
  }

  window.RockyHats = { HAT_NAMES, hatsFor, createHat, createAccessory };
})();
