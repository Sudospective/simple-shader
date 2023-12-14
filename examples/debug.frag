#version 300 es

precision lowp float;

uniform vec2 resolution;
uniform float time;

uniform sampler2D sampler1;

out vec4 fragColor;

void main() {
	vec2 p = gl_FragCoord.xy / resolution;
	fragColor = texture(sampler1, p);
}
