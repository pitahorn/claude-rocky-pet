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

  // bottomRatio — where the accessory sits above the ball's resting point, as a
  // fraction of the diameter.
  const ACCESSORIES = {
    tophat: { build: bowtie, aspect: 0.5, widthRatio: 0.3, bottomRatio: 0.26 },
    chupalla: { build: manta, aspect: 0.82, widthRatio: 0.58, bottomRatio: 0.17 },
    huaso: { build: manta, aspect: 0.82, widthRatio: 0.58, bottomRatio: 0.17 },
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
    chupalla: { build: chupalla, widthRatio: 0.64, brimRatio: 0.49, fiesta: true },
    huaso: { build: huasoHat, widthRatio: 0.64, brimRatio: 0.49, fiesta: true },
  };

  const HAT_NAMES = Object.keys(HATS);
  // Split out so the dieciocho calendar in pet.js can swap one pool for the other.
  const FIESTA_HAT_NAMES = HAT_NAMES.filter((name) => HATS[name].fiesta);
  const EVERYDAY_HAT_NAMES = HAT_NAMES.filter((name) => !HATS[name].fiesta);

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

  window.RockyHats = { HAT_NAMES, EVERYDAY_HAT_NAMES, FIESTA_HAT_NAMES, createHat, createAccessory };
})();
