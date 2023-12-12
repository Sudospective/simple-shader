#version 300 es

precision lowp float;

uniform vec2 resolution;
uniform float time;

uniform sampler2D sampler0;

out vec4 fragColor;

//https://www.shadertoy.com/view/wljyRz

#define MAX_OFFSET 80.

float rand(float co) { return fract(sin(co*(91.3458)) * 47453.5453); }

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 texel = 1. / resolution.xy;
  
  vec4 img = texture(sampler0, uv);
  
  // you can try and comment / uncomment these three lines
  float step_y = texel.y*(rand(uv.x)*MAX_OFFSET) * (sin(sin(time*0.5))*2.0+1.3); // modulate offset
  //float step_y = texel.y*(rand(uv.x)*100.);                     // offset without modulation
  step_y += rand(uv.x*uv.y*time)*0.025*sin(time);               // shake offset and modulate it
  step_y = mix(step_y, step_y*rand(uv.x*time)*0.5, sin(time));  // more noisy spikes
  
  if ( dot(img, vec4(0.299, 0.587, 0.114, 0.) ) > 1.2*(sin(time)*0.325+0.50))
    uv.y+=step_y;
  else
    uv.y-=step_y;
  
  img = texture(sampler0, uv);
  fragColor = img;
  return;
}
