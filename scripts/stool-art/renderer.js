// Development-only renderer. Generated PNGs are the game's dependency-free assets.
const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl2", {
  alpha: true,
  antialias: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: true,
});
if (!gl) throw new Error("WebGL 2 is required to generate collectible assets.");
const vertex = `#version 300 es
in vec2 position;
out vec2 uv;
void main(){uv=position;gl_Position=vec4(position,0.,1.);}`;
const fragment = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 pixel;
uniform vec4 starts[128];
uniform vec4 ends[128];
uniform int count;
uniform float blending;
uniform float vertical;
uniform int material;
uniform int pattern;
uniform int pass;
uniform int signature;
uniform int stoolType;
uniform vec3 tint;
uniform float seed;
const vec3 KEY=vec3(-.54,.78,.52);
float smin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
float primitive(vec3 p,vec4 a,vec4 b){
 if(a.w>0.){vec3 ba=b.xyz-a.xyz;float h=clamp(dot(p-a.xyz,ba)/max(dot(ba,ba),.00001),0.,1.);return length(p-a.xyz-ba*h)-mix(a.w,b.w,h);}
 vec3 q=(p-a.xyz)/b.xyz;return (length(q)-1.)*min(b.x,min(b.y,b.z));
}
float scene(vec3 p){
 p.y/=vertical;
 float d=10.;for(int i=0;i<128;i++){if(i>=count)break;d=smin(d,primitive(p,starts[i],ends[i]),blending);}
 if(pattern==8){
   vec3 hole=vec3(.31,.34,.18);d=max(d,-(length(p-hole)-.105));
   hole=vec3(-.34,.29,.32);d=max(d,-(length(p-hole)-.085));
   hole=vec3(.03,.39,-.23);d=max(d,-(length(p-hole)-.08));
 }
 return d*min(vertical,1.);
}
vec3 normalAt(vec3 p){vec2 e=vec2(.0012,0.);return normalize(vec3(scene(p+e.xyy)-scene(p-e.xyy),scene(p+e.yxy)-scene(p-e.yxy),scene(p+e.yyx)-scene(p-e.yyx)));}
float occlusion(vec3 p,vec3 n){float o=0.;float weight=1.;for(int i=1;i<=4;i++){float h=.045*float(i);o+=(h-scene(p+n*h))*weight;weight*=.6;}return clamp(1.-o*2.7,.42,1.);}
float shadowAt(vec3 p){float shade=1.;float t=.035;for(int i=0;i<13;i++){float d=scene(p+KEY*t);shade=min(shade,8.*d/t);t+=clamp(d,.025,.15);}return clamp(shade,.35,1.);}
float hash(vec3 p){return fract(sin(dot(p,vec3(13.17,75.36,41.91))+seed*2.)*43758.5453);}
float circlePattern(vec3 p,float size){vec3 cell=floor(p/size);vec3 q=fract(p/size)-.5;return 1.-smoothstep(.16,.24,length(q));}
vec3 rainbow(float t){
 t=clamp(t,0.,.999)*6.;
 vec3 a=vec3(.88,.43,.52),b=vec3(.92,.65,.37),c=vec3(.9,.83,.42),d=vec3(.43,.71,.56),e=vec3(.40,.65,.79),f=vec3(.67,.48,.78),g=vec3(.83,.55,.72);
 if(t<1.)return mix(a,b,fract(t));if(t<2.)return mix(b,c,fract(t));if(t<3.)return mix(c,d,fract(t));if(t<4.)return mix(d,e,fract(t));if(t<5.)return mix(e,f,fract(t));return mix(f,g,fract(t));
}
void main(){
 vec3 ro=vec3(2.9,2.5,3.6),target=vec3(0.,.43,0.);
 vec3 forward=normalize(target-ro),right=normalize(cross(forward,vec3(0.,1.,0.))),up=cross(right,forward);
 vec3 rd=normalize(forward*4.1+right*uv.x*1.04+up*uv.y*1.04);
 float t=2.7,d=1.;bool hit=false;
 for(int i=0;i<100;i++){vec3 p=ro+rd*t;d=scene(p);if(d<.0012){hit=true;break;}t+=d*.82;if(t>7.)break;}
 if(!hit){
  if(pass==1){pixel=vec4(0.);return;}
  float ground=-ro.y/rd.y;vec3 p=ro+rd*ground;
  float a=exp(-pow(p.x/.88,2.)-pow(p.z/.65,2.))*.18;
  pixel=vec4(vec3(.26,.29,.24),a);return;
 }
 vec3 p=ro+rd*t,n=normalAt(p);float ao=occlusion(p,n),shade=shadowAt(p+n*.008);
 vec3 view=-rd,halfway=normalize(KEY+view);
 float diffuse=.34+.45*max(dot(n,KEY),0.)*shade+.12*max(dot(n,normalize(vec3(.6,.35,-.4))),0.)+.07*max(n.y,0.);
 float spec=pow(max(dot(n,halfway),0.),38.)*.14+pow(max(dot(n,halfway),0.),9.)*.035;
 float lum=clamp(diffuse*ao+spec,.12,1.);
 vec3 color=vec3(lum);float alpha=1.;
 if(material==1){
   vec3 e=reflect(rd,n);float broad=pow(max(dot(e,normalize(vec3(-.3,.7,1.))),0.),5.);float line=exp(-pow((e.y-.24)*7.,2.));
   color=mix(vec3(.48,.25,.055),vec3(1.,.78,.29),clamp(.44+e.y*.25+broad*.4,0.,1.));
   color=mix(color,vec3(1.,.95,.69),line*.72+broad*.25);color*=mix(.66,1.,ao)*mix(.72,1.,shade);
 }else if(material==2||material==5){
   vec3 facetNormal=normalize(floor(n*3.5+.5)/3.5+vec3(.0001));
   float faceLight=max(dot(facetNormal,KEY),0.);float edge=pow(1.-max(dot(n,view),0.),2.);
   vec3 base=material==2?vec3(.52,.77,.86):vec3(.68,.85,.89);
   color=base*(.49+lum*.25+faceLight*.28)+edge*vec3(.22,.27,.29);
   color+=vec3(.7,.91,.96)*pow(max(dot(facetNormal,halfway),0.),35.)*.36;
   float plane=pow(max(dot(facetNormal,normalize(vec3(-.6,.4,.7))),0.),18.);color+=plane*vec3(.13,.17,.17);
 }else if(material==3){
   color=rainbow(clamp(stoolType==4?(p.y-.02)/1.22:(p.x+.9)/1.8,0.,1.))*(.38+lum*.76)+spec*.3;
 }else if(material==4){
   float edge=pow(1.-max(dot(n,view),0.),2.);
   color=mix(vec3(.74,.43,.70),vec3(.95,.66,.77),clamp(p.y+.2,0.,1.))*(.65+lum*.45);
   color+=edge*vec3(.17,.19,.25)+pow(max(dot(n,halfway),0.),65.)*.38;
   color=mix(color,vec3(.96,.83,.92),exp(-pow((p.y-.11)*10.,2.))*.14);
   alpha=.84+edge*.13;
 }else if(material==6){
   color=mix(vec3(.34,.23,.51),vec3(.62,.40,.70),p.y*.6+.2)*(.5+lum*.6);
   float edge=pow(1.-max(dot(n,view),0.),3.);color+=edge*mix(vec3(.22,.68,.64),vec3(.74,.28,.56),smoothstep(-.3,.3,p.x))*.6;
 }else if(material==7){
   color=vec3(.30,.34,.47)*(.4+lum*.85);float stars=circlePattern(p+.04,.21)*step(.62,hash(floor((p+.04)/.21)));color+=stars*vec3(.50,.55,.69);
 }else if(material==8){
   float edge=pow(1.-max(dot(n,view),0.),2.);color=mix(vec3(.65,.31,.075),vec3(.96,.66,.24),lum)*(.85+edge*.3);
   color+=pow(max(dot(n,halfway),0.),52.)*.3;
 }
 if(pattern==11||stoolType==3){float groove=pow(max(0.,cos(p.x*23.+sin(p.z*15.)*.7)),28.)*smoothstep(.08,.22,p.y);color*=1.-groove*.27;}
 if(pattern==6&&material==0){float wave=sin(p.x*25.+p.z*5.+sin(p.y*5.)*2.);color*=1.-smoothstep(.88,.97,wave)*.14;}
 if(pattern==7&&material==0){float groove=pow(max(0.,cos(p.x*17.+p.z*4.)),36.);color*=1.-groove*.30;}
 if(pattern==12&&material==0){float groove=exp(-pow((p.z+.02)*28.,2.))*smoothstep(.14,.24,p.y);color*=1.-groove*.22;}
 if(pass==1){
   alpha=0.;vec3 decor=vec3(1.);float a=0.;vec3 q=p;
   if(pattern==1||pattern==2||pattern==3||pattern==4||pattern==9||pattern==10){
    float size=pattern==1?.22:pattern==2?.115:pattern==3?.17:pattern==4?.19:pattern==9?.19:.16;
    vec3 cell=floor((q+vec3(.04,.02,.03))/size);vec3 f=fract((q+vec3(.04,.02,.03))/size)-.5;
    float radius=pattern==2?.12:.20;a=(1.-smoothstep(radius,radius+.04,length(f)))*step(.36,hash(cell));
    decor=pattern==1?vec3(.94,.78,.37):pattern==2?vec3(.98,.91,.66):pattern==3?vec3(.91,.70,.22):pattern==4?vec3(.91,.94,.96):pattern==9?vec3(.88,.54,.63):vec3(.45,.51,.43);
    decor*=.65+lum*.55;
   }
   if(pattern==5){
    vec3 f=fract((p+vec3(.07,.04,.03))/.32)-.5;float leaf=pow(f.x/.30,2.)+pow(f.y/.12,2.)+pow(f.z/.24,2.);a=(1.-smoothstep(.65,1.,leaf))*step(.55,hash(floor((p+vec3(.07,.04,.03))/.32)));decor=vec3(.76,.43,.56)*(.6+lum*.5);
   }
   if(pattern==13||material==8){
    float leaf=pow((p.x+.1)/.22,2.)+pow((p.y-.29)/.15,2.)+pow((p.z-.11)/.18,2.);a=(1.-smoothstep(.7,1.,leaf))*.8;decor=vec3(.39,.52,.27)*(.6+lum*.4);
   }
   if(pattern==14){float stripe=1.-smoothstep(.025,.045,abs(sin(p.x*14.+p.z*8.+p.y*3.)));a=stripe*.65;decor=vec3(.87,.77,.55)*(.6+lum*.5);}
   if(signature==1){
    // Rounded ivory stems and tiny caps are embossed toy motifs, clipped by
    // the same ray-marched body as the underlying collectible.
    vec2 f=mod(vec2(p.x+p.z*.18,p.y+p.z*.75)+vec2(.225,.25),vec2(.45,.5))-vec2(.225,.25);
    a=0.;
    for(int i=0;i<3;i++){
     float x=(float(i)-1.)*.065;
     float top=.06+float(i%2)*.045;
     vec2 stem=vec2(f.x-x,f.y-clamp(f.y,-.14,top));
     float stalk=1.-smoothstep(.009,.016,length(stem));
     float cap=1.-smoothstep(.85,1.1,length(vec2((f.x-x)/.037,(f.y-top)/.023)));
     a=max(a,max(stalk,cap));
    }
    decor=vec3(.98,.91,.72)*(.65+lum*.35);
   }
   alpha=a; color=decor;
 }
 pixel=vec4(clamp(color,0.,1.),alpha);
}`;
function shader(type, source) {
  const result = gl.createShader(type);
  gl.shaderSource(result, source);
  gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(result));
  }
  return result;
}
const program = gl.createProgram();
gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS))
  throw new Error(gl.getProgramInfoLog(program));
gl.useProgram(program);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
  gl.STATIC_DRAW,
);
const position = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(position);
gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
const uniforms = Object.fromEntries(
  [
    "starts",
    "ends",
    "count",
    "blending",
    "vertical",
    "material",
    "pattern",
    "pass",
    "signature",
    "stoolType",
    "tint",
    "seed",
  ].map((name) => [name, gl.getUniformLocation(program, name)]),
);
const materialIds = {
  metal: 1,
  crystal: 2,
  rainbow: 3,
  jelly: 4,
  frost: 5,
  glow: 6,
  meteor: 7,
  amber: 8,
};
const patternIds = {
  corn: 1,
  glitter: 2,
  "gold-flake": 3,
  silver: 4,
  petals: 5,
  wood: 6,
  cuts: 7,
  bubbles: 8,
  popping: 9,
  charcoal: 10,
  cracks: 11,
  coffee: 12,
  leaf: 13,
  threads: 14,
  bran: 6,
  grain: 10,
  oats: 1,
  cocoa: 10,
};
function geometry(art, type, variant = 0) {
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
    const points = [
      [-0.52, -0.3],
      [0.25, -0.39],
      [-0.25, 0.34],
      [0.53, 0.27],
    ];
    points.forEach(([x, z], i) => {
      const rx = 0.27 + (i % 2) * 0.035;
      ball(
        x,
        0.17,
        z,
        rx,
        art === "pillows" ? 0.16 : 0.18,
        art === "ribbon" ? 0.17 : 0.245,
      );
      if (art === "foam") ball(x + 0.08, 0.25, z - 0.05, 0.17, 0.16, 0.16);
    });
    blend = 0.04;
  } else if (type === 6) {
    const points = [
      [-0.44, -0.18],
      [0.38, -0.18],
      [-0.03, 0.35],
    ];
    points.forEach(([x, z], i) => {
      ball(x, 0.14, z, 0.35, 0.17, 0.29);
      ball(x - 0.1, 0.21, z - 0.05, 0.24, 0.19, 0.23);
      ball(x + 0.15, 0.14, z + 0.09, 0.26, 0.13, 0.22);
    });
    blend = art === "mash" ? 0.2 : 0.11;
    if (art === "flat" || art === "jet") vertical = 0.62;
  } else {
    ball(0, 0.055, 0, 0.78, 0.065, 0.5);
    [
      [-0.56, 0.24, 0.32],
      [0.51, 0.31, 0.31],
      [-0.39, -0.31, 0.3],
      [0.43, -0.33, 0.3],
      [0.04, 0.43, 0.29],
    ].forEach(([x, z, r]) => ball(x, 0.044, z, r, 0.047, r * 0.78));
    blend = 0.12;
    if (art === "jet") {
      ball(-0.63, 0.035, -0.27, 0.35, 0.04, 0.16);
      ball(0.68, 0.035, 0.1, 0.32, 0.04, 0.18);
    }
  }
  return { a, b, blend, vertical };
}
window.renderCollectible = async ({
  art = "plain",
  type = 4,
  variant = 0,
  pass = 0,
  signature = null,
  size = 320,
}) => {
  if (canvas.width !== size) {
    canvas.width = size;
    canvas.height = size;
    gl.viewport(0, 0, size, size);
  }
  const shape = geometry(art, type, variant);
  const a = new Float32Array(128 * 4),
    b = new Float32Array(128 * 4);
  a.set(shape.a);
  b.set(shape.b);
  gl.uniform4fv(uniforms.starts, a);
  gl.uniform4fv(uniforms.ends, b);
  gl.uniform1i(uniforms.count, shape.a.length / 4);
  gl.uniform1f(uniforms.blending, shape.blend);
  gl.uniform1f(uniforms.vertical, shape.vertical);
  gl.uniform1i(uniforms.material, materialIds[art] || 0);
  gl.uniform1i(uniforms.pattern, patternIds[art] || 0);
  gl.uniform1i(uniforms.pass, pass);
  gl.uniform1i(uniforms.signature, signature === "enoki" ? 1 : 0);
  gl.uniform1i(uniforms.stoolType, type);
  gl.uniform1f(uniforms.seed, variant);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.finish();
  return canvas.toDataURL("image/png");
};
window.rendererReady = true;
