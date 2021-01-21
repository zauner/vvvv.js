vertex_shader:

#ifdef GL_ES
precision highp float;
#endif


uniform mat4 Texture_Transform;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;




attribute vec4 a_Position : POSITION;

attribute vec4 a_Normal : NORMAL;

attribute vec4 a_Tangent : TANGENT;

attribute vec2 a_UV : TEXCOORD0;


varying vec3 v_Position;
varying vec2 v_UV;


varying mat3 v_TBN;

varying vec3 v_Normal;




varying vec3 NormView;
varying vec3 PosV;

void main()
{
  mat4 tWV = tV * tW;
  mat4 tWVP = tP * tWV;
  vec4 pos = tW * a_Position;
  v_Position = vec3(pos.xyz) / pos.w;


  vec3 normalW = normalize(vec3(tW * vec4(a_Normal.xyz, 0.0)));
  vec3 tangentW = normalize(vec3(tW * vec4(a_Tangent.xyz, 0.0)));
  vec3 bitangentW = cross(normalW, tangentW) * a_Tangent.w;
  v_TBN = mat3(tangentW, bitangentW, normalW);

  v_Normal = normalize(vec3(tW * vec4(a_Normal.xyz, 0.0)));
  

  PosV = vec3(tWV * vec4(a_Position.xyz, 1.0));
  NormView = normalize(vec3(tWV * vec4(a_Normal.xyz, 0.0))).xyz;

  v_UV = (Texture_Transform * vec4(a_UV, 0, 1)).xy; 

  v_UV = vec2(0.,0.);


  
  gl_Position = tWVP * a_Position;
}


fragment_shader:


#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform vec3 u_LightDirection;
uniform vec3 u_LightColor;


uniform samplerCube u_DiffuseEnvSampler;
uniform samplerCube u_SpecularEnvSampler;
uniform sampler2D u_brdfLUT;

uniform sampler2D u_BaseColorSampler;

uniform sampler2D u_NormalSampler;
uniform float u_NormalScale;

uniform sampler2D u_MetallicRoughnessSampler;

uniform sampler2D u_OcclusionSampler;
uniform float u_OcclusionStrength;


uniform vec2 u_MetallicRoughnessValues;
uniform vec4 u_BaseColorFactor;

uniform vec3 u_Camera;


uniform vec4 u_ScaleDiffBaseMR;
uniform vec4 u_ScaleFGDSpec;
uniform vec4 u_ScaleIBLAmbient;

uniform float parallaxHeight = 0.1;
uniform float parallaxSampleCount = 8.0;
uniform float occlusion = 0.3;

uniform float exposure = 0.0;

uniform float alpha = 1.0;

varying vec3 v_Position;

varying vec2 v_UV;


varying mat3 v_TBN;

varying vec3 v_Normal;


varying vec3 NormView;
varying vec3 PosV;




const float M_PI = 3.141592653589793;
const float c_MinRoughness = 0.04;

vec4 SRGBtoLINEAR(vec4 srgbIn)
{

    vec3 bLess = step(vec3(0.04045),srgbIn.xyz);
    vec3 linOut = mix( srgbIn.xyz/vec3(12.92), pow((srgbIn.xyz+vec3(0.055))/vec3(1.055),vec3(2.4)), bLess );

    return vec4(linOut,srgbIn.w);;

}


vec3 getNormal()
{

    mat3 tbn = v_TBN;

    vec3 n = texture2D(u_NormalSampler, v_UV).rgb;
    n = normalize(tbn * ((2.0 * n - 1.0) * vec3(u_NormalScale, u_NormalScale, 1.0)));


    return n;
}

struct PBRInfo
{
    float NdotL;                  
    float NdotV;                  
    float NdotH;                  
    float LdotH;                  
    float VdotH;                  
    float perceptualRoughness;    
    float metalness;              
    vec3 reflectance0;            
    vec3 reflectance90;           
    float alphaRoughness;         
    vec3 diffuseColor;            
    vec3 specularColor;          
};


vec3 getIBLContribution(vec3 diffuseColor,vec3 specularColor ,float perceptualRoughness, float NdotV, vec3 n, vec3 reflection)
{
    float mipCount = 9.0; 
    float lod = (perceptualRoughness * mipCount);

    vec3 brdf = SRGBtoLINEAR(texture2D(u_brdfLUT, vec2(NdotV, 1.0 - perceptualRoughness))).rgb;
    vec3 diffuseLight = SRGBtoLINEAR(textureCube(u_DiffuseEnvSampler, n)).rgb;


    vec3 specularLight = SRGBtoLINEAR(textureCube(u_SpecularEnvSampler, reflection)).rgb;


    vec3 diffuse = diffuseLight * diffuseColor;
    vec3 specular = specularLight * (specularColor * brdf.x + brdf.y);


    diffuse *= u_ScaleIBLAmbient.x;
    specular *= u_ScaleIBLAmbient.y;

    return diffuse + specular;
}


vec3 diffuse(PBRInfo pbrInputs)
{
    return pbrInputs.diffuseColor / M_PI;
}


vec3 specularReflection(PBRInfo pbrInputs)
{
    return pbrInputs.reflectance0 + (pbrInputs.reflectance90 - pbrInputs.reflectance0) * pow(clamp(1.0 - pbrInputs.VdotH, 0.0, 1.0), 5.0);
}

float geometricOcclusion(PBRInfo pbrInputs)
{
    float NdotL = pbrInputs.NdotL;
    float NdotV = pbrInputs.NdotV;
    float r = pbrInputs.alphaRoughness;

    float attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
    float attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
    return attenuationL * attenuationV;
}

float microfacetDistribution(PBRInfo pbrInputs)
{
    float roughnessSq = pbrInputs.alphaRoughness * pbrInputs.alphaRoughness;
    float f = (pbrInputs.NdotH * roughnessSq - pbrInputs.NdotH) * pbrInputs.NdotH + 1.0;
    return roughnessSq / (M_PI * f * f);
}



void main()
{		

		vec2 uv = v_UV;
		vec3 v = normalize(u_Camera - v_Position);        // Vector from surface point to camera
		vec3 view_dir = normalize(vec3(0.0,0.0,0.0) - PosV);        // Vector from surface point to camera

    float perceptualRoughness = u_MetallicRoughnessValues.y;
    float metallic = u_MetallicRoughnessValues.x;

    vec4 mrSample = texture2D(u_MetallicRoughnessSampler, uv);
    perceptualRoughness = mrSample.g * perceptualRoughness;
//#ifdef HAS_METALNESS_SINGLECHANNEL
   // metallic = texture2D(u_Metallic, uv).g * metallic;
//#else
	metallic = mrSample.b * metallic;
//#endif	
//#endif
    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);
    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    // The albedo may be defined from a base texture or a flat color
//#ifdef HAS_BASECOLORMAP
    vec4 baseColor = vec4(texture2D(u_BaseColorSampler, uv).xyz,1.0);//SRGBtoLINEAR(texture2D(u_BaseColorSampler, uv)) * u_BaseColorFactor;
//#else
    //vec4 baseColor = u_BaseColorFactor;
//#endif

    vec3 f0 = vec3(0.04);
    vec3 diffuseColor = baseColor.rgb; //* (vec3(1.0) - f0);
    //diffuseColor *= 1.0 - metallic;
    vec3 specularColor = baseColor.rgb;//mix(f0, baseColor.rgb, metallic);

    // Compute reflectance.
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
    float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    vec3 specularEnvironmentR0 = specularColor.rgb;
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

//#ifdef USE_DERIVATIVE_MAP
//	vec3 n = derivative_normal ;
//#else
    vec3 n = getNormal();                             // normal at surface point
//#endif    
    vec3 l = normalize(u_LightDirection);             // Vector from surface point to light
    vec3 h = normalize(l+v);                          // Half vector between both l and v
    vec3 reflection = -normalize(reflect(v, n));

    float NdotL = clamp(dot(n, l), 0.001, 1.0);
    float NdotV = abs(dot(n, v)) + 0.001;
    float NdotH = clamp(dot(n, h), 0.0, 1.0);
    float LdotH = clamp(dot(l, h), 0.0, 1.0);
    float VdotH = clamp(dot(v, h), 0.0, 1.0);

    PBRInfo pbrInputs = PBRInfo(
        NdotL,
        NdotV,
        NdotH,
        LdotH,
        VdotH,
        perceptualRoughness,
        metallic,
        specularEnvironmentR0,
        specularEnvironmentR90,
        alphaRoughness,
        diffuseColor,
        specularColor
    );

    // Calculate the shading terms for the microfacet specular shading model
    vec3 F = specularReflection(pbrInputs);
    float G = geometricOcclusion(pbrInputs);
    float D = microfacetDistribution(pbrInputs);

    // Calculation of analytical lighting contribution
    vec3 diffuseContrib = (1.0 - F) * diffuse(pbrInputs);
    vec3 specContrib = F * G * D / (4.0 * NdotL * NdotV);
    vec3 color = NdotL * u_LightColor * (diffuseContrib + specContrib);


    //color += getIBLContribution(diffuseColor,specularColor , perceptualRoughness, NdotV, n, reflection);

    

 


//#else
    gl_FragColor = baseColor ;//vec4(pow(color,vec3(1.0/2.2)), 1.0);
//#endif
}