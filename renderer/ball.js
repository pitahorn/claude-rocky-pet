"use strict";

// Rocky's geodesic ball — the Eridian xenonite sphere he rolls around Earth in.
//
// A ball rolling sideways spins about the axis pointing INTO the screen, so the
// roll is a pure screen-plane rotation. The wireframe is therefore projected
// once at boot and rolled with a single transform — no per-frame 3D math, and
// the front/back edge split never changes (a z-rotation preserves z).

// Wrapped so the renderer's shared global scope only ever sees the export below.
(() => {
  const GOLDEN = (1 + Math.sqrt(5)) / 2;

  // Fixed tilt baked into the geometry so the cage reads as a sphere instead of a
  // flat spinning wheel. Applied before projection, never animated.
  const TILT_X_DEG = 24;
  const TILT_Y_DEG = -17;

  // Room around the sphere inside the SVG box, for the glow and the contact shadow.
  const GLOW_PAD_PX = 12;

  // How much of the glass tint and of the cage to keep. Rocky has to stay
  // readable through both — he is the point, the ball is the vehicle. They dial
  // separately because thinning the tint alone just leaves the struts shouting.
  const DEFAULT_GLASS_OPACITY = 0.2;
  const DEFAULT_STRUT_OPACITY = 0.2;
  // The joints carry the roll. Faint hairlines rotating give the eye nothing to
  // track, but bright dots at the strut corners read as motion at a fraction of
  // the visual weight — so they stay brighter than the struts on purpose.
  const DEFAULT_JOINT_OPACITY = 0.6;

  // [r, g, b, a] so the dials can scale the alpha; the rest are fixed.
  const EDGE_FRONT = [150, 255, 244, 0.92];
  const EDGE_BACK = [70, 190, 190, 0.34];
  const JOINT_FRONT = [215, 255, 251, 0.95];
  const RIM = [170, 255, 246, 0.6];

  const COLOR = {
    glint: "rgba(255, 255, 255, 0.8)",
    contactShadow: "rgba(0, 0, 0, 0.3)",
  };

  function rgba([r, g, b, a], multiplier = 1) {
    return `rgba(${r}, ${g}, ${b}, ${(a * multiplier).toFixed(3)})`;
  }

  const SVG_NS = "http://www.w3.org/2000/svg";

  // Each ball owns its gradient/filter ids. Two balls of different sizes in one
  // document would otherwise share whichever defs were parsed first — a bug that
  // only shows up as a subtly wrong blur, i.e. the worst kind.
  let ballInstances = 0;

  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    return el;
  }

  function gradient(tag, id, attrs, stops) {
    const node = svgEl(tag, { id, ...attrs });
    for (const [offset, color] of stops) {
      node.appendChild(svgEl("stop", { offset, "stop-color": color }));
    }
    return node;
  }

  // --- Geometry ----------------------------------------------------------------
  function normalize([x, y, z]) {
    const length = Math.hypot(x, y, z);
    return [x / length, y / length, z / length];
  }

  function icosahedron() {
    const t = GOLDEN;
    const vertices = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
    ].map(normalize);
    const faces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ];
    return { vertices, faces };
  }

  // One subdivision pass: split every triangle into four, push the new midpoints
  // back out onto the unit sphere.
  function subdivide({ vertices, faces }) {
    const next = vertices.slice();
    const midpoints = new Map();
    const midpoint = (a, b) => {
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      const cached = midpoints.get(key);
      if (cached !== undefined) return cached;
      const [ax, ay, az] = vertices[a];
      const [bx, by, bz] = vertices[b];
      const index = next.push(normalize([ax + bx, ay + by, az + bz])) - 1;
      midpoints.set(key, index);
      return index;
    };
    const nextFaces = [];
    for (const [a, b, c] of faces) {
      const ab = midpoint(a, b);
      const bc = midpoint(b, c);
      const ca = midpoint(c, a);
      nextFaces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    return { vertices: next, faces: nextFaces };
  }

  function uniqueEdges(faces) {
    const seen = new Set();
    const edges = [];
    for (const [a, b, c] of faces) {
      for (const [from, to] of [[a, b], [b, c], [c, a]]) {
        const key = from < to ? `${from},${to}` : `${to},${from}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push([from, to]);
      }
    }
    return edges;
  }

  function tilt([x, y, z]) {
    const ax = (TILT_X_DEG * Math.PI) / 180;
    const ay = (TILT_Y_DEG * Math.PI) / 180;
    const y1 = y * Math.cos(ax) - z * Math.sin(ax);
    const z1 = y * Math.sin(ax) + z * Math.cos(ax);
    return [x * Math.cos(ay) + z1 * Math.sin(ay), y1, -x * Math.sin(ay) + z1 * Math.cos(ay)];
  }

  // Project the tilted sphere orthographically into SVG coords (y flipped).
  function projectSphere(frequency, radius, center) {
    let mesh = icosahedron();
    for (let pass = 1; pass < frequency; pass++) mesh = subdivide(mesh);
    const screen = mesh.vertices.map(tilt).map(([x, y, z]) => ({
      x: center + x * radius,
      y: center - y * radius,
      z,
    }));
    const edges = uniqueEdges(mesh.faces).map(([a, b]) => ({
      a: screen[a],
      b: screen[b],
      depth: (screen[a].z + screen[b].z) / 2,
    }));
    return { vertices: screen, edges };
  }

  // --- Painting ----------------------------------------------------------------
  // All gradients/filters live in the back layer's <defs>; both halves reference
  // them by id, which resolves document-wide.
  function ballDefs(ids, radius, glassOpacity) {
    const defs = svgEl("defs");
    // Only the two tints that sit between Pita and Rocky scale with the dial —
    // the shine, glint and struts keep their full strength, since dimming those
    // costs the "glass" read without buying back any of his silhouette.
    const tint = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${(a * glassOpacity).toFixed(3)})`;

    // Body tint: near-clear in the middle so Rocky reads through it, denser at the
    // rim where a real sphere's glass turns edge-on.
    defs.appendChild(
      gradient("radialGradient", ids.glass, { cx: "38%", cy: "32%", r: "78%" }, [
        ["0%", tint(120, 250, 236, 0.05)],
        ["55%", tint(31, 201, 189, 0.09)],
        ["84%", tint(95, 243, 228, 0.2)],
        ["100%", tint(190, 255, 250, 0.42)],
      ]),
    );

    // The far wall of the sphere, seen behind Rocky — deeper and cooler.
    defs.appendChild(
      gradient("radialGradient", ids.behind, { cx: "50%", cy: "50%", r: "62%" }, [
        ["0%", tint(6, 62, 66, 0.3)],
        ["70%", tint(9, 92, 95, 0.22)],
        ["100%", tint(14, 140, 140, 0.06)],
      ]),
    );

    // Soft specular blob — fixed to the light, so it never rolls with the cage.
    defs.appendChild(
      gradient("radialGradient", ids.shine, { cx: "50%", cy: "50%", r: "50%" }, [
        ["0%", "rgba(255, 255, 255, 0.62)"],
        ["55%", "rgba(226, 255, 252, 0.22)"],
        ["100%", "rgba(255, 255, 255, 0)"],
      ]),
    );

    // Bounce light: the ground kicking a little turquoise back up the lower rim.
    defs.appendChild(
      gradient("linearGradient", ids.bounce, { x1: "0%", y1: "100%", x2: "100%", y2: "0%" }, [
        ["0%", "rgba(120, 255, 244, 0)"],
        ["45%", "rgba(140, 255, 246, 0.75)"],
        ["100%", "rgba(120, 255, 244, 0)"],
      ]),
    );

    // Struts glow: keep the sharp line, lay a bloom under it.
    const glow = svgEl("filter", {
      id: ids.edgeGlow,
      x: "-25%",
      y: "-25%",
      width: "150%",
      height: "150%",
    });
    glow.appendChild(svgEl("feGaussianBlur", { stdDeviation: "1.6", result: "soft" }));
    const merge = svgEl("feMerge");
    merge.appendChild(svgEl("feMergeNode", { in: "soft" }));
    merge.appendChild(svgEl("feMergeNode", { in: "SourceGraphic" }));
    glow.appendChild(merge);
    defs.appendChild(glow);

    const shadowBlur = svgEl("filter", {
      id: ids.shadowBlur,
      x: "-40%",
      y: "-200%",
      width: "180%",
      height: "500%",
    });
    shadowBlur.appendChild(svgEl("feGaussianBlur", { stdDeviation: `${(radius * 0.07).toFixed(2)}` }));
    defs.appendChild(shadowBlur);

    return defs;
  }

  function wireGroup(edges, vertices, { front, radius, glowId, strutOpacity, jointOpacity }) {
    const group = svgEl("g", {
      stroke: rgba(front ? EDGE_FRONT : EDGE_BACK, strutOpacity),
      "stroke-width": front ? 1.15 : 0.85,
      "stroke-linecap": "round",
      fill: "none",
    });
    if (front) group.setAttribute("filter", `url(#${glowId})`);

    group.appendChild(
      svgEl("path", {
        d: edges
          .map(({ a, b }) => `M${a.x.toFixed(2)} ${a.y.toFixed(2)}L${b.x.toFixed(2)} ${b.y.toFixed(2)}`)
          .join(""),
      }),
    );

    // Metal joints at the struts — only on the near side, where they'd catch light.
    if (front) {
      for (const vertex of vertices) {
        if (vertex.z <= 0.08) continue;
        group.appendChild(
          svgEl("circle", {
            cx: vertex.x.toFixed(2),
            cy: vertex.y.toFixed(2),
            r: Math.max(1, radius * 0.021).toFixed(2),
            fill: rgba(JOINT_FRONT, jointOpacity),
            stroke: "none",
          }),
        );
      }
    }
    return group;
  }

  function layer(size, className) {
    return svgEl("svg", {
      class: className,
      width: size,
      height: size,
      viewBox: `0 0 ${size} ${size}`,
    });
  }

  // --- Public API --------------------------------------------------------------
  // Returns the two halves of the ball plus a roll control. `back` goes behind
  // Rocky, `front` in front of him — that stacking is what makes him read as being
  // INSIDE the sphere rather than standing next to a circle.
  function createBall({
    diameter,
    frequency = 1,
    glassOpacity = DEFAULT_GLASS_OPACITY,
    strutOpacity = DEFAULT_STRUT_OPACITY,
    jointOpacity = DEFAULT_JOINT_OPACITY,
  }) {
    const radius = diameter / 2;
    const size = diameter + GLOW_PAD_PX * 2;
    const center = size / 2;
    const { vertices, edges } = projectSphere(frequency, radius, center);

    const prefix = `rockyBall${(ballInstances += 1)}`;
    const ids = {
      glass: `${prefix}Glass`,
      behind: `${prefix}Behind`,
      shine: `${prefix}Shine`,
      bounce: `${prefix}Bounce`,
      edgeGlow: `${prefix}EdgeGlow`,
      shadowBlur: `${prefix}ShadowBlur`,
    };

    const back = layer(size, "ball-layer ball-back");
    const front = layer(size, "ball-layer ball-front");

    // --- back half: defs, contact shadow, far glass wall, far struts ---
    back.appendChild(ballDefs(ids, radius, glassOpacity));
    back.appendChild(
      svgEl("ellipse", {
        cx: center,
        cy: center + radius - 1,
        rx: radius * 0.72,
        ry: radius * 0.12,
        fill: COLOR.contactShadow,
        filter: `url(#${ids.shadowBlur})`,
      }),
    );
    back.appendChild(
      svgEl("circle", { cx: center, cy: center, r: radius, fill: `url(#${ids.behind})` }),
    );
    const backWire = wireGroup(
      edges.filter((edge) => edge.depth <= 0),
      vertices,
      { front: false, radius, glowId: ids.edgeGlow, strutOpacity, jointOpacity },
    );
    back.appendChild(backWire);

    // --- front half: glass, shine, near struts, rim, glint ---
    front.appendChild(
      svgEl("circle", { cx: center, cy: center, r: radius, fill: `url(#${ids.glass})` }),
    );
    const shineX = center - radius * 0.34;
    const shineY = center - radius * 0.42;
    front.appendChild(
      svgEl("ellipse", {
        cx: shineX,
        cy: shineY,
        rx: radius * 0.46,
        ry: radius * 0.3,
        fill: `url(#${ids.shine})`,
        transform: `rotate(-32 ${shineX} ${shineY})`,
      }),
    );

    const frontWire = wireGroup(
      edges.filter((edge) => edge.depth > 0),
      vertices,
      { front: true, radius, glowId: ids.edgeGlow, strutOpacity, jointOpacity },
    );
    front.appendChild(frontWire);

    front.appendChild(
      svgEl("circle", {
        cx: center,
        cy: center,
        r: radius - 0.6,
        fill: "none",
        stroke: rgba(RIM, strutOpacity),
        "stroke-width": 1.2,
      }),
    );
    front.appendChild(
      svgEl("path", {
        d: `M${(center - radius * 0.62).toFixed(2)} ${(center + radius * 0.78).toFixed(2)}A${radius} ${radius} 0 0 0 ${(center + radius * 0.94).toFixed(2)} ${(center + radius * 0.34).toFixed(2)}`,
        fill: "none",
        stroke: `url(#${ids.bounce})`,
        "stroke-width": 1.6,
        "stroke-linecap": "round",
      }),
    );
    const glintX = center - radius * 0.42;
    const glintY = center - radius * 0.52;
    front.appendChild(
      svgEl("ellipse", {
        cx: glintX,
        cy: glintY,
        rx: radius * 0.11,
        ry: radius * 0.07,
        fill: COLOR.glint,
        transform: `rotate(-34 ${glintX} ${glintY})`,
      }),
    );

    let rollDeg = 0;
    function applyRoll() {
      const transform = `rotate(${rollDeg.toFixed(2)} ${center} ${center})`;
      frontWire.setAttribute("transform", transform);
      backWire.setAttribute("transform", transform);
    }

    return {
      back,
      front,
      size,
      radius,
      // Room the sphere needs past Rocky's baseline, so the layers can be pinned
      // with the sphere resting exactly on the ground.
      pad: GLOW_PAD_PX,
      // A rolling ball turns distance / radius radians. SVG's y axis points down,
      // so a POSITIVE angle is clockwise — which is what travelling right has to
      // be: the top of the cage goes forward and the leading face rolls down,
      // like a hamster ball. Negating it rolled the ball backwards.
      rollByPixels(px) {
        rollDeg += (px / radius) * (180 / Math.PI);
        applyRoll();
      },
      setRoll(deg) {
        rollDeg = deg;
        applyRoll();
      },
      getRoll() {
        return rollDeg;
      },
    };
  }

  window.RockyBall = { createBall };
})();
