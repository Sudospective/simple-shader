#version 300 es

precision lowp float;

uniform vec2 resolution;
uniform sampler2D sampler0;

out vec4 fragColor;

//https://www.shadertoy.com/view/dsVfDw

bool compare(float a, float b, float eta){
  return(a > (b-eta) && a < (b+eta));
}

bool boxTest(vec2 pos, vec2 size, vec2 uv){
  return (compare(uv.x,pos.x,size.x) && compare(uv.y,pos.y,size.y));
}

void main() {
  // Normalized pixel coordinates (from 0 to 1)
  vec2 uv = gl_FragCoord.xy/resolution.y;
  
  float gridSize = resolution.x*0.05;
  
  uv = fract(uv*gridSize);
  
  vec4 cam = texture(sampler0, floor((gl_FragCoord.xy/resolution.xy)*gridSize)*(1.0/gridSize));
  
  float camVal = (cam.x+cam.y+cam.z)/6.0;
  
  vec3 col;
  
  bool box = boxTest(vec2(0.5,0.5),vec2(camVal,1.0), uv);
  
  // Output to screen
  if(box){
    col = vec3(1.0);
  } else {
    col = vec3(0.0);
  }
  fragColor = vec4(col,1.0);
}
