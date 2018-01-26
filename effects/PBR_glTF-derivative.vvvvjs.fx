vertex_shader:

attribute vec4 a_Position : POSITION;
attribute vec4 a_Normal : NORMAL;
//attribute vec4 a_Tangent;
attribute vec2 a_UV : TEXCOORD0;


uniform mat4 u_MVPMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;

varying vec3 v_Position;
varying vec2 v_UV;


//#ifdef HAS_TANGENTS
//varying mat3 v_TBN;

varying vec3 v_Normal;



void main()
{
  vec4 pos = u_ModelMatrix * a_Position;
  v_Position = vec3(pos.xyz) / pos.w;


  //#ifdef HAS_TANGENTS
  //vec3 normalW = normalize(vec3(u_ModelMatrix * vec4(a_Normal.xyz, 0.0)));
  //vec3 tangentW = normalize(vec3(u_ModelMatrix * vec4(a_Tangent.xyz, 0.0)));
  //vec3 bitangentW = cross(normalW, tangentW) * a_Tangent.w;
  //v_TBN = mat3(tangentW, bitangentW, normalW);

  v_Normal = normalize(vec3(u_ModelMatrix * vec4(a_Normal.xyz, 0.0)));
  


  v_UV = a_UV;
  

  gl_Position = u_MVPMatrix * a_Position; // needs w for proper perspective correction
}

fragment_shader:



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

precision highp float;

uniform vec3 u_LightDirection;
uniform vec3 u_LightColor;


uniform samplerCube u_DiffuseEnvSampler;
uniform samplerCube u_SpecularEnvSampler;
uniform sampler2D u_brdfLUT;



uniform sampler2D u_BaseColorSampler;
uniform sampler2D u_NormalSampler;
uniform float u_NormalScale;
uniform sampler2D u_EmissiveSampler;
uniform vec3 u_EmissiveFactor;
uniform sampler2D u_MetallicRoughnessSampler;
uniform sampler2D u_OcclusionSampler;
uniform float u_OcclusionStrength;


uniform vec2 u_MetallicRoughnessValues;
uniform vec4 u_BaseColorFactor;

uniform vec3 u_Camera;

// debugging flags used for shader output of intermediate PBR variables
uniform vec4 u_ScaleDiffBaseMR;
uniform vec4 u_ScaleFGDSpec;
uniform vec4 u_ScaleIBLAmbient;

varying vec3 v_Position;

varying vec2 v_UV;

//#ifdef HAS_NORMALS
//#ifdef HAS_TANGENTS
//varying mat3 v_TBN;
//#else
varying vec3 v_Normal;



const float M_PI = 3.141592653589793;
const float c_MinRoughness = 0.04;

vec4 SRGBtoLINEAR(vec4 srgbIn)
{
  
   //SRGB_FAST_APPROXIMATION
    vec3 bLess = step(vec3(0.04045),srgbIn.xyz);
    vec3 linOut = mix( srgbIn.xyz/vec3(12.92), pow((srgbIn.xyz+vec3(0.055))/vec3(1.055),vec3(2.4)), bLess );
    return vec4(linOut,srgbIn.w);;

}

// Find the normal for this fragment, pulling either from a predefined normal map
// or from the interpolated mesh normal and tangent attributes.
vec3 getNormal()
{
    // Retrieve the tangent space matrix

    vec3 pos_dx = dFdx(v_Position);
    vec3 pos_dy = dFdy(v_Position);
    vec3 tex_dx = dFdx(vec3(v_UV, 0.0));
    vec3 tex_dy = dFdy(vec3(v_UV, 0.0));
    vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);


    vec3 ng = normalize(v_Normal);


    t = normalize(t - ng * dot(ng, t));
    vec3 b = normalize(cross(ng, t));
    mat3 tbn = mat3(t, b, ng);
//#else // HAS_TANGENTS
   // mat3 tbn = v_TBN;
//#en//dif


    vec3 n = texture2D(u_NormalSampler, v_UV).rgb;
    n = normalize(tbn * ((2.0 * n - 1.0) * vec3(u_NormalScale, u_NormalScale, 1.0)));
//#else
//    vec3 n = tbn[2].xyz;
//#endif

    return n;
}

// Calculation of the lighting contribution from an optional Image Based Light source.
// Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].
// See our README.md on Environment Maps [3] for additional discussion.
vec3 getIBLContribution(float perceptualRoughness, float NdotV, vec3 n, vec3 reflection, vec3 diffuseColor, vec3 specularColor)
{
    //float mipCount = 9.0; // resolution of 512x512
    //float lod = (perceptualRoughness * mipCount);
    // retrieve a scale and bias to F0. See [1], Figure 3
    vec3 brdf = SRGBtoLINEAR(texture2D(u_brdfLUT, vec2(NdotV, 1.0 - perceptualRoughness))).rgb;
    vec3 diffuseLight = SRGBtoLINEAR(textureCube(u_DiffuseEnvSampler, n)).rgb;


    vec3 specularLight = SRGBtoLINEAR(textureCube(u_SpecularEnvSampler, reflection)).rgb;


    vec3 diffuse = diffuseLight * diffuseColor;
    vec3 specular = specularLight * (specularColor * brdf.x + brdf.y);

    // For presentation, this allows us to disable IBL terms

    return diffuse + specular;
}

// Basic Lambertian diffuse
// Implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog
// See also [1], Equation 1
vec3 diffuse(vec3 diffuseColor)
{
    return diffuseColor / M_PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
vec3 specularReflection(float reflectance0, float reflectance90, float VdotH)
{
    return reflectance0 + (reflectance90 - reflectance0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
// This implementation is based on [1] Equation 4, and we adopt their modifications to
// alphaRoughness as input as originally proposed in [2].
float geometricOcclusion(float NdotL, float NdotV, float alphaRoughness )
{
    float NdotL = NdotL;
    float NdotV = NdotV;
    float r = alphaRoughness;

    float attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
    float attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
    return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes from EPIC Games [1], Equation 3.
float microfacetDistribution(float alphaRoughness, float NdotH)
{
    float roughnessSq = alphaRoughness * alphaRoughness;
    float f = (NdotH * roughnessSq - NdotH) * NdotH + 1.0;
    return roughnessSq / (M_PI * f * f);
}

void main()
{
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
    float perceptualRoughness = u_MetallicRoughnessValues.y;
    float metallic = u_MetallicRoughnessValues.x;
    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    vec4 mrSample = texture2D(u_MetallicRoughnessSampler, v_UV);
    perceptualRoughness = mrSample.g * perceptualRoughness;
    metallic = mrSample.b * metallic;
    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);
    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    // The albedo may be defined from a base texture or a flat color

    vec4 baseColor = SRGBtoLINEAR(texture2D(u_BaseColorSampler, v_UV)) * u_BaseColorFactor;

    vec4 baseColor = u_BaseColorFactor;


    vec3 f0 = vec3(0.04);
    vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0);
    diffuseColor *= 1.0 - metallic;
    vec3 specularColor = mix(f0, baseColor.rgb, metallic);

    // Compute reflectance.
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
    float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    vec3 specularEnvironmentR0 = specularColor.rgb;
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

    vec3 n = getNormal();                             // normal at surface point
    vec3 v = normalize(u_Camera - v_Position);        // Vector from surface point to camera
    vec3 l = normalize(u_LightDirection);             // Vector from surface point to light
    vec3 h = normalize(l+v);                          // Half vector between both l and v
    vec3 reflection = -normalize(reflect(v, n));

    float NdotL = clamp(dot(n, l), 0.001, 1.0);
    float NdotV = abs(dot(n, v)) + 0.001;
    float NdotH = clamp(dot(n, h), 0.0, 1.0);
    float LdotH = clamp(dot(l, h), 0.0, 1.0);
    float VdotH = clamp(dot(v, h), 0.0, 1.0);



    // Calculate the shading terms for the microfacet specular shading model
    vec3 F = specularReflection(reflectance0, reflectance90, VdotH); 
    float G = geometricOcclusion(NdotL, NdotV, alphaRoughness);
    float D = microfacetDistribution(alphaRoughness, NdotH);  

    // Calculation of analytical lighting contribution
    vec3 diffuseContrib = (1.0 - F) * diffuse(diffuseColor);
    vec3 specContrib = F * G * D / (4.0 * NdotL * NdotV);
    vec3 color = NdotL * u_LightColor * (diffuseContrib + specContrib);

    // Calculate lighting contribution from image based lighting source (IBL)

    color += getIBLContribution(perceptualRoughness, NdotV, n, reflection, diffuseColor, specularColor);  


    // Apply optional PBR terms for additional (optional) shading

    //float ao = texture2D(u_OcclusionSampler, v_UV).r;
    // color = mix(color, color * ao, u_OcclusionStrength);



    //vec3 emissive = SRGBtoLINEAR(texture2D(u_EmissiveSampler, v_UV)).rgb * u_EmissiveFactor;
    //color += emissive;


    // This section uses mix to override final color for reference app visualization
    // of various parameters in the lighting equation.
    

    gl_FragColor = vec4(pow(color,vec3(1.0/2.2)), baseColor.a);
}