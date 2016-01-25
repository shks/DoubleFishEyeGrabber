#version 120
#extension GL_ARB_texture_rectangle : enable

uniform sampler2DRect texture0; ///Primary camera
uniform sampler2DRect texture1; ///Secondary camera
uniform sampler2DRect texture2; ///For Masking

uniform vec3 angles0;
uniform vec3 angles1;

uniform float srcX;//width of camera image
uniform float srcY;//height of camera image

uniform float destX;//width of generated image
uniform float destY;//height of generated image

uniform int sourceType;   //0 = RGB, 1 = YUV
const int sourceTypeRGB = 0;
const int sourceTypeYUV = 1;

const float PI = 3.14159265358979311;

// - - - - - FIsh Eye Parameters  - - - - - //

uniform vec3 cameraParam_angle0;
uniform vec3 cameraParam_angle1;

uniform mat4 cameraParam_angleMatrix0;
uniform mat4 cameraParam_angleMatrix1;

uniform float fishEye_Radius0;
uniform float fishEye_Radius1;

uniform float fishEye_FOV0;
uniform float fishEye_FOV1;

uniform vec2  fishEye_Center0;
uniform vec2  fishEye_Center1;

uniform int   enableTexture0;
uniform int   enableTexture1;

uniform float distK1;
uniform float distK2;
uniform float distK3;

/*
function for undistortion camera Lens
 */
vec2 undistortion(vec2 pos, vec2 cen, float K1, float K2, float K3, float P1, float P2)
{
    float R = sqrt((pos.x - cen.x) * (pos.x - cen.x) + (pos.y - cen.y) * (pos.y - cen.y));
    vec2 correct;
    
    correct.x = pos.x * (1 + K1 * pow(R, 2) + K2 * pow(R, 4) + K3 * pow(R,6) );// + P1*(pow(R,2) + 2 * pow() )
    correct.y = pos.y * (1 + K1 * pow(R, 2) + K2 * pow(R, 4) + K3 * pow(R,6) );// + P1*(pow(R,2) + 2 * pow() )

    return correct;
}

/*
 x' = x + x*(K1*r^2 + K2*r^4 + K3*r^6) + P1*(r^2 + 2*x^2) + 2*P2*x*y
 y' = y + y*(K1*r^2 + K2*r^4 + K3*r^6) + P2*(r^2 + 2*y^2) + 2*P1*x*y
 */


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

vec4 colorSampling(sampler2DRect refTex, vec2 pos, int _sourceType)
{
    vec4 col;
    
    if(_sourceType == sourceTypeYUV)
    {
        //convertYUV_RGB
        col = convertYUV_RGB(refTex, pos);
    }else{
        //RGB texture
        col = texture2DRect(refTex, pos);
    }
    return col;
}

/*
 checking inside of the FishEyeImage
 */
bool isRectInside(vec4 rect, vec2 point)
{
    //rect [x,y,w,h];
    bool res= false;
    if(rect.x < point.x && point.x < (rect.x + rect.z))
    {
        if(rect.y < point.y && point.y < (rect.y + rect.w))
        {
            res = true;
        }		
    }
    return  res;
}



vec2 getRefPositionInFishEye(
                       vec2 posInEqrect,
                       float fishEye_Radius,
                       mat4 cameraParam_angleMatrix,
                       float fishEye_FOV,
                       vec2 fishEye_Center){
    
    //uniform mat4 cameraParam_angleMatrix0
    vec4 col;
    float R = 2.0 * fishEye_Radius;
    float PHI = (posInEqrect.y / destY - 0.5 ) * PI;
    float THETA = (posInEqrect.x / destX - 0.5) * 2.0 * PI;
    
    vec4 psph;
    psph.x = cos(PHI) * sin(THETA);
    psph.y = cos(PHI) * cos(THETA);
    psph.z = sin(PHI);
    psph.w = 1.0;
    
    //rotation processing here test
    
    psph = psph * cameraParam_angleMatrix;
    
    //get rotational coordinate in Fish EYE
    float fishTheta = atan(psph.z,psph.x);
    float fishphi = atan(sqrt(psph.x*psph.x+psph.z*psph.z),psph.y);
    float r = R * fishphi / ( fishEye_FOV  / 180.0 * PI);
    
    
    vec2 ref;
    ref.x = fishEye_Center.x + r * cos(fishTheta);
    ref.y = fishEye_Center.y + r * sin(fishTheta);
    
    vec4 fishEyeImageRect;
    fishEyeImageRect = vec4(0.0, 0.0 , srcX, srcY);
    
    //undistortion
    vec2 normalizedRef;
    normalizedRef.x = ref.x/srcX;
    normalizedRef.y = ref.y/srcY;
    
    vec2 undistortion_ref;
    undistortion_ref = undistortion(normalizedRef, vec2(1.0/2.0, 1.0/2.0), distK1, distK2, distK3, 0.0, 0.0);
    
    undistortion_ref.x = undistortion_ref.x * srcX;
    undistortion_ref.y = undistortion_ref.y * srcY;
    
    return undistortion_ref;
    
}


vec4 getColorInFishEye(vec2 refpos,
                       sampler2DRect refTex,
                       vec4 nullColor,
                       int COLOR_MODE){
    
    vec4 col;
    
    vec4 fishEyeImageRect;
    fishEyeImageRect = vec4(0.0, 0.0 , srcX, srcY);

    if(isRectInside(fishEyeImageRect, refpos))
    {
        //true
        col = colorSampling(refTex, refpos, COLOR_MODE);
    }else{
        //false
        col = nullColor;
    }
    
    return col;
    
}


void main(void)
{
    vec2 src0 = gl_TexCoord[0].st;
    vec4 outCol;
    outCol = vec4(0,0,0,0);
    vec4 col0, col1, maskTest;
    
    {
        vec2 ref0;
        ref0 = getRefPositionInFishEye(src0,fishEye_Radius0,cameraParam_angleMatrix0, fishEye_FOV0,fishEye_Center0);
        col0 = getColorInFishEye(ref0,texture0,vec4(1.0,0.0,0.0,0.5),sourceType);
        
        maskTest = getColorInFishEye(ref0,texture2,vec4(0.0,0.0,0.0,0.0),sourceTypeRGB);
        
        vec2 ref1;
        ref1 = getRefPositionInFishEye(src0,fishEye_Radius1,cameraParam_angleMatrix1, fishEye_FOV1,fishEye_Center1);
        col1 = getColorInFishEye(ref1,texture1,vec4(0.0,0.0,0.0,0.5),sourceType);
        
        
        if(enableTexture0 != 0)
        {
            outCol += col0 * maskTest;
        }
        
        if(enableTexture1 != 0)
        {
            outCol += col1 * (1.0 - maskTest);
        }
    }
    
    gl_FragColor = outCol;
}
