uniform int version;
#if version==2

#version 300 es
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

#else

precision lowp float;
#define PI 3.1415827
uniform vec2 resolution;
uniform float time;
uniform sampler2D sampler0;
varying vec2 imageCoord;
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec4 color = vec4(uv, (0.5 + sin(time - (PI * 0.5)) * 0.5), 1.0);
  gl_FragColor = color;
}

#endif
