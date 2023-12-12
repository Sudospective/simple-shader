#version 300 es

precision lowp float;

uniform vec2 resolution;
uniform float time;
uniform vec4 date;
uniform vec4 mouse;

in vec2 imageCoord;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec3 color = vec3(uv.x, uv.y , mouse.x / resolution.x);
  fragColor = vec4(color, 1.0);
}
