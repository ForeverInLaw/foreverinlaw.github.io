(function () {
  const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uTimeSpeed;
uniform float uColorBalance;
uniform float uWarpStrength;
uniform float uWarpFrequency;
uniform float uWarpSpeed;
uniform float uWarpAmplitude;
uniform float uBlendAngle;
uniform float uBlendSoftness;
uniform float uRotationAmount;
uniform float uNoiseScale;
uniform float uGrainAmount;
uniform float uGrainScale;
uniform float uGrainAnimated;
uniform float uContrast;
uniform float uGamma;
uniform float uSaturation;
uniform float uCenterDarkness;
uniform vec2 uCenterOffset;
uniform float uZoom;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;
#define S(a,b,t) smoothstep(a,b,t)
mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),dot(-1.0+2.0*hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(-1.0+2.0*hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);return 0.5+0.5*n;}
void mainImage(out vec4 o, vec2 C){
  float t=iTime*uTimeSpeed;
  vec2 uv=C/iResolution.xy;
  float ratio=iResolution.x/iResolution.y;
  vec2 tuv=uv-0.5+uCenterOffset;
  tuv/=max(uZoom,0.001);
  float degree=noise(vec2(t*0.1,tuv.x*tuv.y)*uNoiseScale);
  tuv.y*=1.0/ratio;
  tuv*=Rot(radians((degree-0.5)*uRotationAmount+180.0));
  tuv.y*=ratio;
  float frequency=uWarpFrequency;
  float ws=max(uWarpStrength,0.001);
  float amplitude=uWarpAmplitude/ws;
  float warpTime=t*uWarpSpeed;
  tuv.x+=sin(tuv.y*frequency+warpTime)/amplitude;
  tuv.y+=sin(tuv.x*(frequency*1.5)+warpTime)/(amplitude*0.5);
  vec3 colLav=uColor1;
  vec3 colOrg=uColor2;
  vec3 colDark=uColor3;
  float b=uColorBalance;
  float s=max(uBlendSoftness,0.0);
  mat2 blendRot=Rot(radians(uBlendAngle));
  float blendX=(tuv*blendRot).x;
  float edge0=-0.3-b-s;
  float edge1=0.2-b+s;
  float v0=0.5-b+s;
  float v1=-0.3-b-s;
  vec3 layer1=mix(colDark,colOrg,S(edge0,edge1,blendX));
  vec3 layer2=mix(colOrg,colLav,S(edge0,edge1,blendX));
  vec3 col=mix(layer1,layer2,S(v0,v1,tuv.y));

  float centerDistance=length((uv-0.5+uCenterOffset)*vec2(ratio,1.0));
  float centerMask=1.0-smoothstep(0.0,0.82,centerDistance);
  col*=1.0-(centerMask*uCenterDarkness);

  vec2 grainUv=uv*max(uGrainScale,0.001);
  if(uGrainAnimated>0.5){grainUv+=vec2(iTime*0.05);}
  float grain=fract(sin(dot(grainUv,vec2(12.9898,78.233)))*43758.5453);
  col+=(grain-0.5)*uGrainAmount;
  col=(col-0.5)*uContrast+0.5;
  float luma=dot(col,vec3(0.2126,0.7152,0.0722));
  col=mix(vec3(luma),col,uSaturation);
  col=pow(max(col,0.0),vec3(1.0/max(uGamma,0.001)));
  col=clamp(col,0.0,1.0);
  o=vec4(col,1.0);
}
void main(){
  vec4 o=vec4(0.0);
  mainImage(o,gl_FragCoord.xy);
  fragColor=o;
}
`;

  const DEFAULTS = {
    timeSpeed: 0.25,
    colorBalance: 0.0,
    warpStrength: 1.0,
    warpFrequency: 5.0,
    warpSpeed: 2.0,
    warpAmplitude: 50.0,
    blendAngle: 0.0,
    blendSoftness: 0.05,
    rotationAmount: 500.0,
    noiseScale: 2.0,
    grainAmount: 0.1,
    grainScale: 2.0,
    grainAnimated: false,
    contrast: 1.15,
    gamma: 1.0,
    saturation: 0.82,
    centerDarkness: 0.28,
    centerX: 0.0,
    centerY: 0.0,
    zoom: 0.9
  };

  const THEMES = {
    dark: {
      color1: "#7A3EA4",
      color2: "#2A1A66",
      color3: "#0C081A",
      contrast: 1.08,
      centerDarkness: 0.4,
      saturation: 0.82,
      gamma: 1.0,
      grainAmount: 0.1
    },
    light: {
      color1: "#E7C9FA",
      color2: "#8E74D6",
      color3: "#D7C9F0",
      contrast: 1.08,
      centerDarkness: 0.2,
      saturation: 0.82,
      gamma: 0.96,
      grainAmount: 0.085
    }
  };

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [1, 1, 1];
    return [
      Number.parseInt(result[1], 16) / 255,
      Number.parseInt(result[2], 16) / 255,
      Number.parseInt(result[3], 16) / 255
    ];
  }

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("Grainient shader compile failed:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vsSource, fsSource) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      return null;
    }

    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("Grainient program link failed:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  class GrainientBackground {
    constructor(container, options) {
      this.container = container;
      this.options = { ...DEFAULTS, ...options };
      this.canvas = null;
      this.gl = null;
      this.program = null;
      this.locations = {};
      this.vao = null;
      this.raf = 0;
      this.startTime = 0;
      this.pixelWidth = 1;
      this.pixelHeight = 1;
      this.onResize = this.resize.bind(this);
    }

    init() {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance"
      });

      if (!gl) return false;

      const program = createProgram(gl, vertex, fragment);
      if (!program) return false;

      this.canvas = canvas;
      this.gl = gl;
      this.program = program;

      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      this.container.appendChild(canvas);

      const vertices = new Float32Array([-1, -1, 3, -1, -1, 3]);
      const buffer = gl.createBuffer();
      this.vao = gl.createVertexArray();
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const position = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);

      const uniformNames = [
        "iResolution",
        "iTime",
        "uTimeSpeed",
        "uColorBalance",
        "uWarpStrength",
        "uWarpFrequency",
        "uWarpSpeed",
        "uWarpAmplitude",
        "uBlendAngle",
        "uBlendSoftness",
        "uRotationAmount",
        "uNoiseScale",
        "uGrainAmount",
        "uGrainScale",
        "uGrainAnimated",
        "uContrast",
        "uGamma",
        "uSaturation",
        "uCenterDarkness",
        "uCenterOffset",
        "uZoom",
        "uColor1",
        "uColor2",
        "uColor3"
      ];
      uniformNames.forEach((name) => {
        this.locations[name] = gl.getUniformLocation(program, name);
      });

      this.resize();
      window.addEventListener("resize", this.onResize, { passive: true });

      gl.useProgram(program);
      this.setBaseUniforms();
      this.startTime = performance.now();
      this.raf = requestAnimationFrame(this.render.bind(this));

      return true;
    }

    setUniform1f(name, value) {
      const location = this.locations[name];
      if (location !== null) this.gl.uniform1f(location, value);
    }

    setUniform2f(name, x, y) {
      const location = this.locations[name];
      if (location !== null) this.gl.uniform2f(location, x, y);
    }

    setUniform3fv(name, value) {
      const location = this.locations[name];
      if (location !== null) this.gl.uniform3fv(location, value);
    }

    setBaseUniforms() {
      const opts = this.options;
      this.setUniform1f("uTimeSpeed", opts.timeSpeed);
      this.setUniform1f("uColorBalance", opts.colorBalance);
      this.setUniform1f("uWarpStrength", opts.warpStrength);
      this.setUniform1f("uWarpFrequency", opts.warpFrequency);
      this.setUniform1f("uWarpSpeed", opts.warpSpeed);
      this.setUniform1f("uWarpAmplitude", opts.warpAmplitude);
      this.setUniform1f("uBlendAngle", opts.blendAngle);
      this.setUniform1f("uBlendSoftness", opts.blendSoftness);
      this.setUniform1f("uRotationAmount", opts.rotationAmount);
      this.setUniform1f("uNoiseScale", opts.noiseScale);
      this.setUniform1f("uGrainAmount", opts.grainAmount);
      this.setUniform1f("uGrainScale", opts.grainScale);
      this.setUniform1f("uGrainAnimated", opts.grainAnimated ? 1.0 : 0.0);
      this.setUniform1f("uContrast", opts.contrast);
      this.setUniform1f("uGamma", opts.gamma);
      this.setUniform1f("uSaturation", opts.saturation);
      this.setUniform1f("uCenterDarkness", opts.centerDarkness);
      this.setUniform2f("uCenterOffset", opts.centerX, opts.centerY);
      this.setUniform1f("uZoom", opts.zoom);
    }

    setTheme(themeName) {
      const theme = THEMES[themeName] || THEMES.dark;
      this.gl.useProgram(this.program);
      this.setUniform3fv("uColor1", hexToRgb(theme.color1));
      this.setUniform3fv("uColor2", hexToRgb(theme.color2));
      this.setUniform3fv("uColor3", hexToRgb(theme.color3));
      this.setUniform1f("uContrast", theme.contrast ?? this.options.contrast);
      this.setUniform1f("uCenterDarkness", theme.centerDarkness ?? this.options.centerDarkness);
      this.setUniform1f("uSaturation", theme.saturation ?? this.options.saturation);
      this.setUniform1f("uGamma", theme.gamma ?? this.options.gamma);
      this.setUniform1f("uGrainAmount", theme.grainAmount ?? this.options.grainAmount);
    }

    resize() {
      if (!this.gl || !this.canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(window.innerWidth));
      const height = Math.max(1, Math.floor(window.innerHeight));
      const pixelWidth = Math.floor(width * dpr);
      const pixelHeight = Math.floor(height * dpr);

      if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
        this.canvas.width = pixelWidth;
        this.canvas.height = pixelHeight;
      }

      this.pixelWidth = pixelWidth;
      this.pixelHeight = pixelHeight;
      this.gl.viewport(0, 0, pixelWidth, pixelHeight);
    }

    render(now) {
      if (!this.gl || !this.program || !this.vao) return;

      this.gl.useProgram(this.program);
      this.setUniform1f("iTime", (now - this.startTime) * 0.001);
      this.setUniform2f("iResolution", this.pixelWidth, this.pixelHeight);
      this.gl.bindVertexArray(this.vao);
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);

      this.raf = requestAnimationFrame(this.render.bind(this));
    }

    destroy() {
      if (this.raf) cancelAnimationFrame(this.raf);
      window.removeEventListener("resize", this.onResize);
      if (this.canvas && this.canvas.parentNode === this.container) {
        this.container.removeChild(this.canvas);
      }
    }
  }

  function initBackground() {
    const root = document.getElementById("grainient-bg");
    if (!root) return;

    const grainient = new GrainientBackground(root, {
      timeSpeed: 0.25,
      warpSpeed: 2.0,
      grainAnimated: false
    });

    if (!grainient.init()) return;

    const applyTheme = () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      grainient.setTheme(currentTheme === "light" ? "light" : "dark");
    };

    applyTheme();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
          applyTheme();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });

    window.addEventListener(
      "beforeunload",
      () => {
        observer.disconnect();
        grainient.destroy();
      },
      { once: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBackground, { once: true });
  } else {
    initBackground();
  }
})();
