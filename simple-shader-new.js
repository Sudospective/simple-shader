
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

let texCount = 0;
class RenderTarget {
  constructor(gl, width, height) {
    this.buffer = gl.createFramebuffer();
    this.texture = gl.createTexture();
    this.Id = texCount++;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    this.level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;
    gl.texImage2D(gl.TEXTURE_2D, this.level, internalFormat, width, height, border, format, type, data);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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
function initBuffers(gl) {
  const pos = new Float32Array([
    0.0, 0.0,
    gl.canvas.width, 0.0,
    0.0, gl.canvas.height,
    0.0, gl.canvas.height,
    gl.canvas.width, 0.0,
    gl.canvas.width, gl.canvas.height,
  ]);
  const tex = new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0,
  ]);
  const posBuf = gl.createBuffer();
  const texBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
  gl.bufferData(gl.ARRAY_BUFFER, tex, gl.DYNAMIC_DRAW);
  return { posBuf, texBuf };
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
  ss.buffers = initBuffers(gl);
  if (!opts.frags) {
    ss.programs.push(initProgram(gl, defVert, defFrag));
    ss.targets.push(new RenderTarget(gl, ss.canvas.width, ss.canvas.height));
  }
  else {
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
    gl.viewport(0.0, 0.0, ss.canvas.width, ss.canvas.height);
    const resolutionLoc = gl.getUniformLocation(program, "resolution");
    gl.uniform2f(resolutionLoc, ss.canvas.width, ss.canvas.height);
  });
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
    this.context = this.canvas.getContext("webgl2", { antialias: false });
    if (!this.context) {
      console.error("Unable to get GL context from canvas with ID", canvasId);
      return null;
    }
    init(this);
    let frame = 0;
    let time = 0.0;
    let lastTime = 0.0;
    const gl = this.context;
    const pos = new Float32Array([
      0.0, 0.0,
      gl.canvas.width, 0.0,
      0.0, gl.canvas.height,
      0.0, gl.canvas.height,
      gl.canvas.width, 0.0,
      gl.canvas.width, gl.canvas.height,
    ]);
    const tex = new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      1.0, 1.0,
    ]);
    const render = () => {
      time = performance.now() * 0.001;
      for (let i = 0; i < this.programs.length; i++) {
        const program = this.programs[i];
        const target = this.targets[i];
        const lastTarget = this.targets[i - 1];
        const posLoc = gl.getAttribLocation(program, "position");
        const texLoc = gl.getAttribLocation(program, "texCoord");
        const timeLoc = gl.getUniformLocation(program, "time");
        const deltaLoc = gl.getUniformLocation(program, "delta");
        const frameLoc = gl.getUniformLocation(program, "frame");
        const resolutionLoc = gl.getUniformLocation(program, "resolution");
        const framebufferLoc = gl.getUniformLocation(program, "framebuffer");
        gl.useProgram(program);
        gl.uniform1f(timeLoc, time);
        gl.uniform1i(frameLoc, frame++);
        gl.uniform1f(deltaLoc, time - lastTime);
        gl.uniform2f(resolutionLoc, this.canvas.width, this.canvas.height);
        if (lastTarget)
          gl.uniform1i(framebufferLoc, lastTarget.Id);
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.texBuf);
        gl.bufferData(gl.ARRAY_BUFFER, tex, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0.0, 0.0, this.canvas.width, this.canvas.height);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, target.buffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.activeTexture(gl.TEXTURE0 + target.Id);
        gl.bindTexture(gl.TEXTURE_2D, target.texture);
        gl.texImage2D(gl.TEXTURE_2D, target.level, gl.RGBA, this.canvas.width, this.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
      }
      lastTime = time;
      requestAnimationFrame(render);
    }
    lastTime = performance.now() * 0.001;
    render();
  }
}
