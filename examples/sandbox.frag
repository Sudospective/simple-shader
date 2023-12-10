#version 300 es

precision lowp float;

uniform vec2 resolution;
uniform float time;

uniform float blue;

out vec4 fragColor;

void main() {
	vec2 uv = gl_FragCoord.xy / resolution;
	vec3 color = vec3(uv.x, uv.y, blue);
	fragColor = vec4(color, 1.0);
}
