vertex_shader:
//#define HAS_NORMALS
//#define HAS_UV0
//#define HAS_TANGENTS
//#define HAS_Animation
#ifdef GL_ES
precision highp float;
#endif


uniform mat4 Texture_Transform;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;




attribute vec4 a_Position : POSITION;
#ifdef HAS_NORMALS
attribute vec4 a_Normal : NORMAL;
#endif
#ifdef HAS_TANGENTS
attribute vec4 a_Tangent : TANGENT;
#endif
#ifdef HAS_UV0
attribute vec2 a_UV : TEXCOORD0;
#endif
#ifdef HAS_ANIMATION
attribute vec4 a_Joints : JOINTS_0;
attribute vec4 a_Weights : WEIGHTS_0;
#endif

varying vec3 v_Position;
varying vec2 v_UV;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
varying mat3 v_TBN;
#else
varying vec3 v_Normal;
#endif
#endif



varying vec3 NormView;
varying vec3 PosV;

void main()
{
  mat4 tWV = tV * tW;
  mat4 tWVP = tP * tWV;
  vec4 pos = tW * a_Position;
  v_Position = vec3(pos.xyz) / pos.w;

  #ifdef HAS_NORMALS
  #ifdef HAS_TANGENTS
  vec3 normalW = normalize(vec3(tW * vec4(a_Normal.xyz, 0.0)));
  vec3 tangentW = normalize(vec3(tW * vec4(a_Tangent.xyz, 0.0)));
  vec3 bitangentW = cross(normalW, tangentW) * a_Tangent.w;
  v_TBN = mat3(tangentW, bitangentW, normalW);
  #else // HAS_TANGENTS != 1
  v_Normal = normalize(vec3(tW * vec4(a_Normal.xyz, 0.0)));
  
  #endif
  #endif
  PosV = vec3(tWV * vec4(a_Position.xyz, 1.0));
  NormView = normalize(vec3(tWV * vec4(a_Normal.xyz, 0.0))).xyz;
  #ifdef HAS_UV0
  v_UV = (Texture_Transform * vec4(a_UV, 0, 1)).xy; 
  #else
  v_UV = vec2(0.,0.);
  #endif

  
  gl_Position = tWVP * a_Position; // needs w for proper perspective correction
}


fragment_shader:



//#define HAS_NORMALS
//#define HAS_UV0
//#define USE_IBL
//#define HAS_BASECOLORMAP
//////////////////strangly when activating normalmap, textures disappear
//#define HAS_NORMALMAP
//#define HAS_METALROUGHNESSMAP
//#define HAS_OCCLUSIONMAP
//#define HAS_EMISSIVEMAP
//#define MANUAL_SRGB

//#define NO_GAMMA_CORRECTION

//#define HAS_TANGENTS
//#define USE_POM_SIHLOUETTE
//#define SRGB_FAST_APPROXIMATION
//#define USE_TEX_LOD

//
// This fragment shader defines a reference implementation for Physically Based Shading of
// a microfacet surface material defined by a glTF model.
//
// References:
// [1] Real Shading in Unreal Engine 4
//     http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf
// [2] Physically Based Shading at Disney
//     http://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf
// [3] README.md - Environment Maps
//     https://github.com/KhronosGroup/glTF-WebGL-PBR/#environment-maps
// [4] "An Inexpensive BRDF Model for Physically based Rendering" by Christophe Schlick
//     https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf
//#extension GL_EXT_shader_texture_lod: enable
#extension GL_OES_standard_derivatives : enable
//#extension GL_EXT_shader_texture_lod: enable

precision highp float;

uniform vec3 u_LightDirection;
uniform vec3 u_LightColor;

#ifdef USE_IBL
uniform samplerCube u_DiffuseEnvSampler;
uniform samplerCube u_SpecularEnvSampler;
uniform sampler2D u_brdfLUT;
#endif

#ifdef HAS_BASECOLORMAP
uniform sampler2D u_BaseColorSampler;
#endif
// #ifdef HAS_DIFFUSEMAP
// uniform sampler2D u_BaseColorSampler;
// #endif


#ifdef HAS_NORMALMAP
uniform sampler2D u_NormalSampler;
uniform float u_NormalScale;
#endif
#ifdef HAS_EMISSIVEMAP
uniform sampler2D u_EmissiveSampler;
uniform vec3 u_EmissiveFactor;
#endif
#ifdef HAS_METALROUGHNESSMAP
uniform sampler2D u_MetallicRoughnessSampler;
#endif

#ifdef USE_SPEC_GLOSS

uniform vec4 spec_gloss_specularFactor;

#endif

#ifdef HAS_OCCLUSIONMAP
uniform sampler2D u_OcclusionSampler;
uniform float u_OcclusionStrength;
#endif

uniform vec2 u_MetallicRoughnessValues;
uniform vec4 u_BaseColorFactor;
//uniform vec2 u_ScaleIBLAmbient;
uniform vec3 u_Camera;

uniform float exposure = 0.0;

uniform float alpha = 1.0;

varying vec3 v_Position;

varying vec2 v_UV;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
varying mat3 v_TBN;
#else
varying vec3 v_Normal;
#endif
#endif

varying vec3 NormView;
varying vec3 PosV;

// Encapsulate the various inputs used by the various functions in the shading equation
// We store values in this struct to simplify the integration of alternative implementations
// of the shading terms, outlined in the Readme.MD Appendix.


const float M_PI = 3.141592653589793;
const float c_MinRoughness = 0.04;

vec4 SRGBtoLINEAR(vec4 srgbIn)
{
    #ifdef MANUAL_SRGB
    #ifdef SRGB_FAST_APPROXIMATION
    vec3 linOut = pow(srgbIn.xyz,vec3(2.2));
    #else //SRGB_FAST_APPROXIMATION
    vec3 bLess = step(vec3(0.04045),srgbIn.xyz);
    vec3 linOut = mix( srgbIn.xyz/vec3(12.92), pow((srgbIn.xyz+vec3(0.055))/vec3(1.055),vec3(2.4)), bLess );
    #endif //SRGB_FAST_APPROXIMATION
    return vec4(linOut,srgbIn.w);;
    #else //MANUAL_SRGB
    return srgbIn;
    #endif //MANUAL_SRGB
}

// Find the normal for this fragment, pulling either from a predefined normal map
// or from the interpolated mesh normal and tangent attributes.
vec3 getNormal()
{
    // Retrieve the tangent space matrix
#ifndef HAS_TANGENTS
    vec3 pos_dx = dFdx(v_Position);
    vec3 pos_dy = dFdy(v_Position);
    vec3 tex_dx = dFdx(vec3(v_UV, 0.0));
    vec3 tex_dy = dFdy(vec3(v_UV, 0.0));
    vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);

#ifdef HAS_NORMALS
    vec3 ng = v_Normal;
#else
    vec3 ng = cross(pos_dx, pos_dy);
#endif

    t = normalize(t - ng * dot(ng, t));
    vec3 b = normalize(cross(ng, t));
    mat3 tbn = mat3(t, b, ng);
#else // HAS_TANGENTS
    mat3 tbn = v_TBN;
#endif

#ifdef HAS_NORMALMAP
    vec3 n = texture2D(u_NormalSampler, v_UV).rgb;
    n = normalize(tbn * ((2.0 * n - 1.0) * vec3(u_NormalScale, u_NormalScale, 1.0)));
#else
    vec3 n = tbn[2].xyz;
#endif

    return n;
}

struct PBRInfo
{
    float NdotL;                  // cos angle between normal and light direction
    float NdotV;                  // cos angle between normal and view direction
    float NdotH;                  // cos angle between normal and half vector
    float LdotH;                  // cos angle between light direction and half vector
    float VdotH;                  // cos angle between view direction and half vector
    float perceptualRoughness;    // roughness value, as authored by the model creator (input to shader)
    float metalness;              // metallic value at the surface
    vec3 reflectance0;            // full reflectance color (normal incidence angle)
    vec3 reflectance90;           // reflectance color at grazing angle
    float alphaRoughness;         // roughness mapped to a more linear change in the roughness (proposed by [2])
    vec3 diffuseColor;            // color contribution from diffuse lighting
    vec3 specularColor;           // color contribution from specular lighting
};


vec3 getIBLContribution(vec3 diffuseColor,vec3 specularColor ,float perceptualRoughness, float NdotV, vec3 n, vec3 reflection)
{
    float mipCount = 9.0; // resolution of 512x512
    float lod = (perceptualRoughness * mipCount);
    // retrieve a scale and bias to F0. See [1], Figure 3
    vec3 brdf = SRGBtoLINEAR(texture2D(u_brdfLUT, vec2(NdotV, 1.0 - perceptualRoughness))).rgb;
	
	 //////////////here should be u_SpecularEnvSampler, but it causes the bug where textures are rejected
    vec3 diffuseLight = SRGBtoLINEAR(textureCube(u_DiffuseEnvSampler, n)).rgb;     
	/////////////////////////////////////////////////////////////////////////////////////////////

    vec3 specularLight = SRGBtoLINEAR(textureCube(u_SpecularEnvSampler, reflection)).rgb;


    vec3 diffuse = diffuseLight * diffuseColor;
    vec3 specular = specularLight * (specularColor * brdf.x + brdf.y);

    // For presentation, this allows us to disable IBL terms
    //diffuse *= u_ScaleIBLAmbient.x;
    //specular *= u_ScaleIBLAmbient.y;

    return diffuse + specular;
}


vec3 diffuse(PBRInfo pbrInputs)
{
    return pbrInputs.diffuseColor / M_PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
vec3 specularReflection(PBRInfo pbrInputs)
{
    return pbrInputs.reflectance0 + (pbrInputs.reflectance90 - pbrInputs.reflectance0) * pow(clamp(1.0 - pbrInputs.VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
// This implementation is based on [1] Equation 4, and we adopt their modifications to
// alphaRoughness as input as originally proposed in [2].
float geometricOcclusion(PBRInfo pbrInputs)
{
    float NdotL = pbrInputs.NdotL;
    float NdotV = pbrInputs.NdotV;
    float r = pbrInputs.alphaRoughness;

    float attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
    float attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
    return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes from EPIC Games [1], Equation 3.
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

	
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
#ifdef USE_SPEC_GLOSS
	float perceptualRoughness = spec_gloss_specularFactor.a;
	vec3 specular_Factor = spec_gloss_specularFactor.rgb;
#else
    float perceptualRoughness = u_MetallicRoughnessValues.y;
#endif
    float metallic = u_MetallicRoughnessValues.x;
#ifdef HAS_METALROUGHNESSMAP
    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    vec4 mrSample = texture2D(u_MetallicRoughnessSampler, uv);
    perceptualRoughness = mrSample.g * perceptualRoughness;
	

	metallic = mrSample.b * metallic;
#endif
#ifdef HAS_SPEC_GLOSS_MAP
    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    vec4 spec_gloss_Sample = texture2D(u_MetallicRoughnessSampler, uv);
    perceptualRoughness = spec_gloss_Sample.a * perceptualRoughness;

	specular_Factor = SRGBtoLINEAR(spec_gloss_Sample).rgb * specular_Factor;
	
	metallic = mrSample.b * metallic;
#endif
#ifdef USE_SPEC_GLOSS
	perceptualRoughness = 1.0 - perceptualRoughness;
#endif
	
    
    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);
    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    // The albedo may be defined from a base texture or a flat color
#ifdef HAS_BASECOLORMAP
	vec4 baseColor_Samp =  texture2D(u_BaseColorSampler, uv);
    vec4 baseColor = SRGBtoLINEAR(baseColor_Samp) * u_BaseColorFactor;
	float discard_alpha = baseColor_Samp.a * u_BaseColorFactor.a;
#else
    vec4 baseColor = u_BaseColorFactor;
	float discard_alpha = u_BaseColorFactor.a;
#endif
	if(discard_alpha < 0.9){
			//discard;
	}
#ifdef USE_SPEC_GLOSS

	vec3 specularColor = specular_Factor;	
	vec3 diffuseColor = baseColor.rgb ;  
#else
    vec3 f0 = vec3(0.04);
    vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0);
    diffuseColor *= 1.0 - metallic;
    vec3 specularColor = mix(f0, baseColor.rgb, metallic);
#endif
    // Compute reflectance.
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
    float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    vec3 specularEnvironmentR0 = specularColor.rgb;
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;


    vec3 n = getNormal();                             // normal at surface point
 
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

    // Calculate lighting contribution from image based lighting source (IBL)
#ifdef USE_IBL
    color += getIBLContribution(diffuseColor,specularColor , perceptualRoughness, NdotV, n, reflection);
	
#endif

    // Apply optional PBR terms for additional (optional) shading
    
#ifdef HAS_OCCLUSIONMAP
	float ao = texture2D(u_OcclusionSampler, uv).r;
    color = mix(color, color * ao, u_OcclusionStrength);
#endif

#ifdef HAS_EMISSIVEMAP
    vec3 emissive = SRGBtoLINEAR(texture2D(u_EmissiveSampler, uv)).rgb * u_EmissiveFactor;
    color += emissive;
#endif

	color *= pow(2.0, exposure);
#ifdef NO_GAMMA_CORRECTION
	gl_FragColor = vec4(color.rgb, baseColor.a*alpha);
#else
    gl_FragColor = vec4(pow(color,vec3(1.0/2.2)), baseColor.a*alpha);
#endif
}