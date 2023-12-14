
const defSrc = {
vert: `#version 300 es
precision lowp float;
in vec2 position;
in vec2 texCoord;
uniform vec2 resolution;
out vec2 imageCoord;
void main() {
  vec2 zeroToOne = position / resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;
  gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
  imageCoord = texCoord;
}
`,
frag: `#version 300 es
precision lowp float;
#define PI 3.1415827
uniform vec2 resolution;
uniform float time;
uniform sampler2D sampler0;
in vec2 imageCoord;
out vec4 fragColor;
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec4 color = vec4(uv, (0.5 + sin(time - (PI * 0.5)) * 0.5), 1.0);
  fragColor = color;
}
`
};

class RenderTarget {
  constructor(gl, width, height) {
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    this.level = 0;
    const internalFormat = gl.RGBA32F;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.FLOAT;
    const data = null;
    gl.texImage2D(gl.TEXTURE_2D, this.level, internalFormat, width, height, border, format, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.buffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
  }
}

function loadShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
function initProgram(gl, vertSrc, fragSrc) {
  const vert = loadShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = loadShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getProgramInfoLog(program));
    return null;
  };
  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.log(gl.getProgramInfoLog(program));
    return null;
  };
  return program;
}
function initQuad(gl) {
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  const pos = [
    -1.0, 1.0,
    1.0, 1.0,
    -1.0, -1.0,
    1.0, -1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
  return posBuf;
}
async function fetchFrag(path) {
  const text = await fetch(path)
    .then(res => res.text()).catch((e) => console.error(e));
  //console.log(text);
  return text;
}
async function init(ss) {
  const gl = ss.context;
  const opts = ss.options;
  const defVert = defSrc.vert;
  const defFrag = defSrc.frag;
  ss.programs.push(initProgram(gl, defVert, defFrag));
  ss.targets.push(new RenderTarget(gl, ss.canvas.width, ss.canvas.height));
  if (opts.frags) {
    for (let i = 0; i < opts.frags.length; i++) {
     const fragSrc = await fetchFrag(opts.frags[i]);
     const program = initProgram(gl, defVert, fragSrc);
     const target = new RenderTarget(gl, ss.canvas.width, ss.canvas.height);
     ss.programs.push(program);
     ss.targets.push(target);
   }
  }
  ss.programs.forEach(program => {
    gl.useProgram(program);
    const quadPos = gl.getAttribLocation(program, "position");
    const quad = initQuad(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.vertexAttribPointer(quadPos, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(quadPos);
    gl.viewport(0, 0, ss.canvas.width, ss.canvas.height);
    const resolutionLoc = gl.getUniformLocation(program, "resolution");
    const samplerResLoc = gl.getUniformLocation(program, "samplerRes");
    const resos = [ss.canvas.width, ss.canvas.height, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    gl.uniform2f(resolutionLoc, ss.canvas.width, ss.canvas.height);
    gl.uniform3fv(samplerResLoc, new Float32Array(resos));
  });
  let frame = 0;
  let time = 0.0;
  let lastTime = 0.0;
  const render = () => {
    time = performance.now() * 0.001;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (let i = 0; i < ss.programs.length; i++) {
      const program = ss.programs[i];
      const target = ss.targets[i];
      const timeLoc = gl.getUniformLocation(program, "time");
      const deltaLoc = gl.getUniformLocation(program, "delta");
      const frameLoc = gl.getUniformLocation(program, "frame");
      const resolutionLoc = gl.getUniformLocation(program, "resolution");
      const samplerResLoc = gl.getUniformLocation(program, "samplerRes");
      const resos = [ss.canvas.width, ss.canvas.height, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
      gl.useProgram(program);
      gl.uniform1f(timeLoc, time);
      gl.uniform1i(frameLoc, frame++);
      gl.uniform1f(deltaLoc, time - lastTime);
      gl.uniform2f(resolutionLoc, ss.canvas.width, ss.canvas.height);
      gl.uniform3fv(samplerResLoc, new Float32Array(resos));
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.buffer);
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    lastTime = time;
    requestAnimationFrame(render);
  }
  lastTime = performance.now() * 0.001;
  render();
}

export class SimpleShader {
  programs = [];
  targets = [];
  constructor(canvasId, options) {
    this.options = options || {};
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error("Unable to get canvas with ID", canvasId);
      return null;
    }
    this.context = this.canvas.getContext("webgl2");
    if (!this.context) {
      console.error("Unable to get GL context from canvas with ID", canvasId);
      return null;
    }
    init(this);
  }
}
