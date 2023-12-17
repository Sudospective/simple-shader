#version 300 es

precision lowp float;

uniform vec2 resolution;
uniform float time;
uniform vec4 mouse;
uniform sampler2D framebuffer;

out vec4 fragColor;

const int NUM_SAMPLES = 55;

void main() {
    
    vec2 uv = gl_FragCoord.xy / resolution;
    //vec4 buffer = texture(framebuffer,uv);
    float decay=0.96815;
    float exposure=0.21;
    float density=0.926;
    float weight=0.58767;
    
    vec2 tc = uv;
    vec2 lightPos = vec2(0.0);
    vec2 deltaTexCoord = tc;
    
    deltaTexCoord =  uv+vec2(sin(time*.7)*.3,-cos(time*.2)*.3)-.5;
    deltaTexCoord *= 1.0 / float(NUM_SAMPLES)  * density;
    
    float illuminationDecay = 1.0;
    vec4 color =texture(framebuffer, tc.xy)*0.305104;
    
    tc += deltaTexCoord * fract( sin(dot(uv.xy+fract(time), 
                                         vec2(12.9898, 78.233)))* 43758.5453 );
    
    for(int i=0; i < NUM_SAMPLES; i++)
    {
        tc -= deltaTexCoord;
        vec4 sampleTex = texture(framebuffer, tc)*0.305104;
        sampleTex *= illuminationDecay * weight;
        color += sampleTex;
        illuminationDecay *= decay;
    }
    fragColor = color*exposure;
}
