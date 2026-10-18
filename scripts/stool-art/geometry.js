// Development-only, deterministic shape construction shared by the renderer and checks.
export function geometry(art, type, variant = 0) {
  const a = [],
    b = [];
  let blend = 0.05,
    vertical = 1;
  const ball = (x, y, z, rx, ry = rx, rz = rx) => {
    a.push(x, y, z, 0);
    b.push(rx, ry, rz, 0);
  };
  const line = (p, q, r, s = r) => {
    a.push(...p, r);
    b.push(...q, s);
  };
  const tube = (points, radius) => {
    for (let i = 1; i < points.length; i++)
      line(
        points[i - 1],
        points[i],
        typeof radius === "function"
          ? radius((i - 1) / (points.length - 1))
          : radius,
        typeof radius === "function" ? radius(i / (points.length - 1)) : radius,
      );
  };
  const curve = (fn, n = 30) =>
    Array.from({ length: n + 1 }, (_, i) => fn(i / n));
  const seed = variant * 0.037;
  if (type === 1) {
    const points = [
      [-0.54, -0.37],
      [0.03, -0.47],
      [0.56, -0.2],
      [-0.63, 0.25],
      [-0.08, 0.35],
      [0.5, 0.39],
    ];
    points.forEach(([x, z], i) => {
      const r = art === "marbles" ? 0.205 : 0.18 + (i % 3) * 0.016;
      ball(
        x,
        r * 0.85,
        z,
        r,
        r * (art === "marbles" ? 1 : 0.86),
        r * (1 + (i % 2) * 0.1),
      );
    });
  } else if (type === 2) {
    if (art === "tower") {
      [
        [0, 0.19, 0, 0.56, 0.19, 0.39],
        [0.02, 0.47, -0.02, 0.43, 0.17, 0.32],
        [-0.04, 0.73, 0, 0.32, 0.15, 0.25],
        [0.03, 0.96, -0.01, 0.22, 0.12, 0.18],
      ].forEach((p) => ball(...p));
    } else {
      const total = art === "beads" ? 5 : art === "cuts" ? 5 : 7;
      for (let i = 0; i < total; i++) {
        const t = i / (total - 1),
          x = (t - 0.5) * 1.48,
          z = Math.sin(t * 3.5 + seed) * 0.24;
        const r = art === "beads" ? 0.225 : 0.205 + Math.sin(t * 8) * 0.018;
        ball(x, r * 0.95, z, r, r * 0.94, r * (art === "cuts" ? 1.08 : 0.98));
      }
      blend = art === "beads" ? 0.025 : 0.075;
    }
  } else if (type === 3) {
    tube(
      curve((t) => [(t - 0.5) * 1.5, 0.235, Math.sin(t * 5 + seed) * 0.19]),
      (t) => 0.22 + Math.sin(t * Math.PI) * 0.025,
    );
    if (art === "crystal") {
      ball(-0.18, 0.43, -0.03, 0.15, 0.22, 0.15);
      ball(0.17, 0.39, -0.1, 0.14, 0.19, 0.13);
      blend = 0.025;
    }
  } else if (type === 4) {
    if (["spiral", "warm", "metal", "rainbow"].includes(art)) {
      const turns = art === "warm" ? 2.35 : 2.8;
      tube(
        curve((t) => {
          const angle = t * Math.PI * 2 * turns + 2.1,
            r = 0.62 * (1 - t) + 0.035;
          return [Math.cos(angle) * r, 0.19 + t * 0.93, Math.sin(angle) * r];
        }, 120),
        (t) => 0.19 - t * 0.07,
      );
      blend = 0.035;
    } else if (art === "spring") {
      tube(
        curve((t) => {
          const angle = t * Math.PI * 5.7;
          const r = 0.55 - t * 0.16;
          return [Math.cos(angle) * r, 0.17 + t * 0.61, Math.sin(angle) * r];
        }, 120),
        0.14,
      );
      blend = 0.025;
    } else if (art === "rope") {
      tube(
        curve(
          (t) => [(t - 0.5) * 1.55, 0.17, Math.sin(t * Math.PI * 3.7) * 0.4],
          48,
        ),
        0.145,
      );
      blend = 0.025;
    } else if (art === "ribbon") {
      tube(
        curve(
          (t) => [(t - 0.5) * 1.5, 0.25, Math.sin(t * Math.PI * 2.3) * 0.37],
          40,
        ),
        0.22,
      );
      vertical = 0.52;
      blend = 0.025;
    } else if (art === "curve") {
      tube(
        curve((t) => {
          const angle = t * Math.PI * 1.45 - 0.1;
          return [Math.cos(angle) * 0.66, 0.22, Math.sin(angle) * 0.51];
        }, 40),
        (t) => 0.19 + Math.sin(t * Math.PI) * 0.04,
      );
    } else {
      tube(
        curve(
          (t) => [
            (t - 0.5) * 1.5,
            0.23 + Math.sin(t * Math.PI) * 0.025,
            Math.sin(t * 5.9 + seed) * 0.3,
          ],
          36,
        ),
        (t) => 0.19 + Math.sin(t * Math.PI) * 0.055,
      );
    }
  } else if (type === 5) {
    // Every soft piece has a closed, smooth edge and a visible gap around it.
    const layouts = {
      pillows: [[-.48,-.32,.31,.17,.21],[.30,-.34,.32,.16,.22],[-.30,.34,.29,.18,.23],[.49,.33,.27,.16,.20]],
      coffee: [[-.48,-.26,.30,.20,.20],[.30,-.34,.27,.18,.21],[-.20,.36,.32,.19,.21],[.53,.31,.22,.17,.18]],
      foam: [[-.44,-.30,.29,.22,.24],[.35,-.27,.30,.23,.25],[-.05,.40,.33,.22,.22]],
      corn: [[-.48,-.28,.30,.16,.22],[.32,-.35,.28,.18,.20],[-.25,.36,.27,.17,.22],[.50,.33,.25,.15,.20]],
      jelly: [[-.45,-.24,.31,.28,.25],[.34,-.25,.32,.25,.25],[-.05,.42,.33,.26,.23]],
    };
    const points = layouts[art] || (variant % 2
      ? [[-.46,-.27,.32,.20,.23],[.35,-.29,.30,.18,.24],[-.03,.40,.35,.19,.22]]
      : [[-.47,-.28,.31,.18,.23],[.33,-.31,.28,.20,.22],[-.25,.36,.27,.17,.21],[.49,.35,.24,.16,.19]]);
    points.forEach(([x,z,rx,ry,rz]) => ball(x, ry, z, rx, ry, rz));
    blend = 0.015;
  } else if (type === 6) {
    // Paste collapses into a connected mass, with low torn lobes and smears.
    blend = 0.065;
    if (art === "mash" || art === "plain") {
      ball(-.10,.12,.02,.66,.13,.43);
      ball(-.20,.23,-.07,.43,.20,.31);
      ball(-.32,.36,-.12,.27,.16,.24);
      [[-.62,.04,.17,.12],[.40,.02,.29,.09],[.30,.30,.24,.08],[-.23,.43,.19,.07],[-.57,-.30,.20,.10]].forEach(
        ([x,z,r,h]) => ball(x,h,z,r,h,r*.65));
      for (let i=0;i<9;i++) {
        const x=-.66+i*.15, z=.22+Math.sin(i*2.4)*.12;
        ball(x,.055,z,.12,.06,.11);
      }
    } else if (art === "heat") {
      // A dragged wedge: thick at one end, smeared and frayed at the other.
      for (let i=0;i<8;i++) {
        const t=i/7;
        ball(-.53+t*1.15,.07+(1-t)*.10,Math.sin(t*3)*.13,
          .24-t*.08,.075+(1-t)*.10,.32-t*.17);
      }
      for (let i=0;i<10;i++) {
        const x=-.55+i*.12, z=(i%2?1:-1)*(.22+(i%3)*.035);
        ball(x,.035,z,.13,.04,.08);
      }
    } else if (art === "popping") {
      // Flattened fragments, with ragged connected edges rather than pillows.
      [[-.44,-.20,.32],[.30,-.22,.36],[-.04,.31,.37]].forEach(([x,z,r]) => {
        ball(x,.085,z,r,.09,r*.68);
        for(let i=0;i<7;i++) {
          const angle=i*6.283/7;
          ball(x+Math.cos(angle)*r*.77,.045,z+Math.sin(angle)*r*.62,
            .11+(i%2)*.03,.05,.08);
        }
      });
    } else {
      // A broad collapsed island with a shallow saddle, never separate lumps.
      ball(-.32,.12,-.09,.47,.14,.37);
      ball(.30,.085,.12,.48,.10,.35);
      ball(-.04,.06,.04,.55,.065,.40);
      for(let i=0;i<11;i++) {
        const angle=i*6.283/11, r=.58+(i%3)*.045;
        ball(Math.cos(angle)*r,.045,Math.sin(angle)*r*.68,.15,.05,.12);
      }
    }
  } else {
    // Coordinates aligned to the camera: u = screen right, v = screen away.
    // Squashed tubes create sheets and tapered liquid fingers, not solid logs.
    vertical = .22;
    blend = .012;
    const position = (u,v,h=.18) => [u*.779-v*.627,h,-u*.627-v*.779];
    const pool = (u,v,ru,rv,h=.15) => {
      // Chain small overlapping discs for an elongated puddle in screen space.
      const steps=Math.max(1,Math.ceil(Math.max(ru,rv)/.12));
      for(let i=0;i<=steps;i++) {
        const t=(i/steps-.5)*2;
        const radius=Math.min(ru,rv)*Math.sqrt(Math.max(.15,1-t*t*.65));
        const [x,y,z]=position(u+(ru>rv?t*(ru-rv):0),v+(rv>ru?t*(rv-ru):0),h);
        ball(x,y,z,radius,h,radius);
      }
    };
    const drop = (u,v,r,h=.12) => {
      const [x,y,z]=position(u,v,h);
      ball(x,y,z,r,h>.6?r*1.3/vertical:.10,r*.78);
    };
    if (art === "jet") {
      // Pressure has one origin and a wide forward fan, ending in broken drops.
      blend = .003;
      pool(-.36,-.26,.23,.21,.19);
      // The centre is a thin expanding liquid sheet; only its rim breaks into fingers.
      for(let i=0;i<7;i++) {
        const t=i/6;
        pool(-.36+t*.34,-.26+t*.53,.13+t*.30,.13,.16);
      }
      const fingers=[[-.83,.35],[-.61,.66],[-.24,.80],[.17,.72],[.54,.52],[.76,.19]];
      fingers.forEach(([u,v],i) => {
        tube(curve(t=>position(-.36+(u+.36)*t,-.26+(v+.26)*t,
          .19+Math.sin(t*Math.PI)*(.30+i%2*.28)),9),t=>.125*(1-t)+.018);
        drop(u+.025,v+.10,.040+i%2*.014,1.05+i%3*.50);
      });
      // Lifted thin sheets and suspended, stretched droplets at the front.
      tube(curve(t=>position(-.31+t*.48,-.18+t*.65,.23+Math.sin(t*2.1)*2.0),12),.025);
      tube(curve(t=>position(-.26+t*.73,-.17+t*.42,.23+Math.sin(t*2.4)*1.35),10),.020);
      drop(.30,.43,.064,3.55);
      drop(-.69,.28,.047,2.90);
      drop(.79,-.01,.050,1.55);
      drop(.56,-.30,.044,.12);
    } else if (art === "ink") {
      // Runoff: a large head pool narrows into a winding, flattened tail.
      pool(-.36,.14,.40,.32,.13);
      tube(curve(t=>position(-.40+t*1.08,.10-Math.sin(t*2.6)*.48,.13),28),t=>.24*(1-t)+.035);
      pool(.53,-.16,.15,.11,.10);
      drop(.76,-.24,.055);
      drop(-.77,.34,.045);
      drop(.03,-.60,.035);
    } else if (art === "bubbles") {
      // A landing splash: low radial skirt plus a hollow ripple, no solid chunks.
      pool(0,0,.54,.42,.11);
      for(let i=0;i<9;i++) {
        const angle=i*6.283/9, r=.60+(i%3)*.09;
        tube(curve(t=>position(Math.cos(angle)*r*t,Math.sin(angle)*r*.72*t,.13),6),t=>.12*(1-t)+.015);
      }
      tube(curve(t=>position(-.05+Math.cos(t*6.283)*.27,.02+Math.sin(t*6.283)*.23,
        .48+Math.sin(t*6.283*5)*.07),40),.036);
      drop(-.04,.02,.052,2.15);
      [[-.75,.17],[.72,.38],[.34,-.57],[-.48,-.50]].forEach(([u,v])=>drop(u,v,.045));
    } else {
      // Quiet water: a paper-thin asymmetric pool, scalloped rim, satellite drops.
      pool(-.06,.02,.62,.43,.12);
      pool(-.42,-.19,.29,.20,.11);
      pool(.44,.09,.30,.22,.10);
      pool(.18,-.31,.26,.20,.09);
      [[-.82,.13,.048],[-.64,.47,.063],[.69,-.29,.051],[.84,.16,.039],[-.15,-.59,.045],[.36,.48,.038]].forEach(
        ([u,v,r])=>drop(u,v,r));
    }
  }
  return { a, b, blend, vertical };
}
