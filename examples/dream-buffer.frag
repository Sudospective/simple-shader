#version 300 es

precision lowp float;

uniform vec2 resolution;
uniform float time;

out vec4 fragColor;

// sphere's
float map(vec3 p){
    p=mod(p,8.)-4.;
    return length(p) - 2.;
}
// rotation
mat2 rot(float deg){    
    return mat2(cos(deg),-sin(deg),
                sin(deg), cos(deg));
        
}
// raymarch
float trace(vec3 o, vec3 r, inout vec3 hitPos){
    float t = 0.0;
    for(int i = 0; i<20; i++){
        vec3 p = o+r * t;
        float d = map(p);
        t += d*0.5;
    }
    return t;
}
// main
void main()
{
    //screen coordinates
    vec2 uv = gl_FragCoord.xy / resolution;
    uv = uv * 2.0 - 1.0;
    uv.x *= resolution.x/resolution.y;
    
    //init to avoid errors
    fragColor = vec4(0.0);
    //cam origin
    vec3 o = vec3(0.0, 0.0,-9.0);
    o.xz*=rot(time*.2);
    o.yz*=rot(time*.575);
    //ray
    vec3 r = normalize(vec3(uv, 1.0 - dot(uv, uv)*.25));
    r.xy*=rot(time*.33); //.25
    r.xz*=rot(-time*.5); //.15
    //unused for now
    vec3 hitPos = vec3(0.0);
    //raymarch
    float t = trace(o, r, hitPos);
    
    float fog = 1.0 / (1.0 + t * t * 0.075);
    vec3 fc = vec3(fog);
    float d = map(o+r*t);
    
    if(abs(d)<.5)
        fragColor = vec4(fc,1.0);
    else{
        float lp = length(.5*uv+vec2(sin(time*.7)*.3,-cos(time*.2)*.3))-.5;
        fragColor = vec4(-lp*2.5)*vec4(.5,.69,1.,1.);      //vec4(.4,.8,.3,1.0);
    }
}
