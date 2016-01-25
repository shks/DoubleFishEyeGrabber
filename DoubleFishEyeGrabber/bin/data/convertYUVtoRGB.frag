#version 120    
#extension GL_ARB_texture_rectangle : enable

uniform sampler2DRect texture0;
uniform sampler2DRect texture1;
uniform float weight;


/*
function for converting ITU-R BT.601 YUV to RGB
*/

vec4 convert601(float y, float u, float v) {
    float yy, uu, vv, ug_plus_vg, ub, vr;
    yy = y * 256;
    vv = v - 128;
    uu = u - 128;
    ug_plus_vg = uu * 88 + vv * 183;
    ub = uu * 454;
    vr = vv * 359;
    return vec4(
        (yy + vr)/256/256,
        (yy - ug_plus_vg)/256/256,
        (yy + ub)/256/256,
        1.0 );
}


/*
function for converting YUV to RGB
*/
vec4 convertYUV_RGB(const in sampler2DRect tex, const in vec2 pos){
    vec4 uyvy = texture2DRect(tex, vec2(pos.x/2, pos.y));
    uyvy *= 256;

    // 1 for pixels in the right of the tuple, 0 otherwise
    float leftpixel = 1.0 - mod(gl_FragCoord.x, 2.0);
    float rightpixel = 1.0-leftpixel;

    // select correct y for output pixel
    float y = leftpixel*uyvy[1] + rightpixel*uyvy[3];
    return convert601(y, uyvy[0], uyvy[2]);
}



void main(void)
{
    vec2 src0 = gl_TexCoord[0].st;
    vec4 col = convertYUV_RGB(texture0, src0);
    gl_FragColor = col;
}
