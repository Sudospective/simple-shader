#version 300 es

precision lowp float;

#define SPEED 0.01
#define DIRECTION vec2(-.6, -0.3)
#define ATTENUATION 0.975
#define HUE_SCALE 0.75
#define SRC_SCALE 1.5

// You get to choose between JCVD and a quad

//#define USE_JCVD
#define USE_QUAD

uniform vec2 resolution;
uniform float time;
uniform sampler2D sampler0;
uniform sampler2D sampler1;

out vec4 fragColor;

vec3 hueShift(in vec3 color, in float shift)
{
    vec3 p = vec3(0.55735) * dot(vec3(0.55735), color);
    vec3 u = color - p;
    vec3 v = cross(vec3(0.55735), u);    

    color = u * cos(shift * 6.2832) + v * sin(shift * 6.2832) + p;
    
    return color;
}

#if defined(USE_QUAD)
vec2 rotate(vec2 pos, float angle)
{
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, s, -s, c) * pos;
}

float quad(vec2 pos)
{
    return (abs(pos.x) < 0.1 && abs(pos.y) < 0.1) ? 1.0 : 0.0;
}
#endif

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution;
    
    uv *= SRC_SCALE;
    
#if defined(USE_JCVD)
    // Orignial color
    vec4 color1 = texture(sampler0, uv);
    
    // Avoid clamp
    float v = 1.0;
    if (uv.y >= v || uv.x >= v || uv.y <= 0.0 || uv.x <= 0.0)
    {
        color1.rgb = vec3(0.0, 1.0, 0.0);
    }

    // Green screen
    float ref = max(color1.r, color1.b)*1.1;
    float amask = color1.g - ref;
    amask = 1.0 - smoothstep(0.1, 0.2, amask);

    color1.rgb = mix(vec3(0.0), color1.rgb, amask);
    color1.g = min(color1.g, (color1.r + color1.b) * 0.5);

#elif defined(USE_QUAD)
    vec2 quadPos = vec2(uv.x - 0.5, uv.y - (sin(time) * 0.3 + 0.5));
    float speed = sin(time*0.5) * 10.0;
    quadPos = rotate(quadPos, speed);
    float inQuad = quad(quadPos+0.1);
    vec4 color1 = vec4(inQuad, 0.0, inQuad, 1.0);
    float amask = inQuad;
#endif
    
    // Trail effect
    float sinEffect = sin(time * 10.0) * 0.25;
    uv = uv + normalize(DIRECTION * vec2(1.0, sinEffect)) * SPEED;
    vec4 color2 = texture(sampler1, uv * (1.0 / SRC_SCALE));
    // Color attenuation
    color2 *= ATTENUATION;
    
    // Rainbow
    color2.rgb = hueShift(color2.rgb, -0.05 * HUE_SCALE);
    
    color1.rgb = mix(color2.rgb, color1.rgb, amask);
    
	fragColor.rgb = color1.rgb;
}
