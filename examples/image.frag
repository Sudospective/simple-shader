#version 300 es

precision lowp float;

uniform vec2 resolution;
uniform sampler2D sampler0;

out vec4 fragColor;

void main() {
	vec2 uv = gl_FragCoord.xy / resolution;
	vec4 color = texture(sampler0, uv);
	fragColor = color;
}
