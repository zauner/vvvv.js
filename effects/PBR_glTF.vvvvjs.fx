vertex_shader:
#define HAS_NORMALS
#define HAS_UV
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
#ifdef HAS_UV
attribute vec2 a_UV : TEXCOORD0;
#endif
#ifdef HAS_Animation
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
  #ifdef HAS_UV
  v_UV = (Texture_Transform * vec4(a_UV, 0, 1)).xy; 
  #else
  v_UV = vec2(0.,0.);
  #endif

  
  gl_Position = tWVP * a_Position; // needs w for proper perspective correction
}


fragment_shader:



#define HAS_NORMALS
#define HAS_UV
#define USE_IBL
#define HAS_BASECOLORMAP
//////////////////strangly when activating normalmap, textures disappear
//#define HAS_NORMALMAP
#define HAS_METALROUGHNESSMAP
#define HAS_OCCLUSIONMAP
#define HAS_EMISSIVEMAP
//#define MANUAL_SRGB
//#define HAS_METALNESS_SINGLECHANNEL
//#define NO_GAMMA_CORRECTION
//#define USE_DERIVATIVE_MAP
//#define HAS_TANGENTS
//#define USE_POM_SIHLOUETTE
#define SRGB_FAST_APPROXIMATION
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
#extension GL_EXT_shader_texture_lod: enable

precision highp float;

uniform vec3 u_LightDirection;
uniform vec3 u_LightColor;

#ifdef USE_IBL
uniform samplerCube u_DiffuseEnvSampler;
uniform samplerCube u_SpecularEnvSampler;
uniform sampler2D u_brdfLUT;
#endif

#ifdef USE_DERIVATIVE_MAP
uniform sampler2D u_HeightMap;
#endif

#ifdef HAS_BASECOLORMAP
uniform sampler2D u_BaseColorSampler;
#endif
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
#ifdef HAS_METALNESS_SINGLECHANNEL
uniform sampler2D u_Metallic;
#endif

#ifdef HAS_OCCLUSIONMAP
uniform sampler2D u_OcclusionSampler;
uniform float u_OcclusionStrength;
#endif

uniform vec2 u_MetallicRoughnessValues;
uniform vec4 u_BaseColorFactor;

uniform vec3 u_Camera;

// debugging flags used for shader output of intermediate PBR variables
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
    vec3 diffuseLight = SRGBtoLINEAR(textureCube(u_SpecularEnvSampler, n)).rgb;     
	/////////////////////////////////////////////////////////////////////////////////////////////

    vec3 specularLight = SRGBtoLINEAR(textureCube(u_SpecularEnvSampler, reflection)).rgb;


    vec3 diffuse = diffuseLight * diffuseColor;
    vec3 specular = specularLight * (specularColor * brdf.x + brdf.y);

    // For presentation, this allows us to disable IBL terms
    diffuse *= u_ScaleIBLAmbient.x;
    specular *= u_ScaleIBLAmbient.y;

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

//Derivative Mapping
float ApplyChainRule( float dhdu, float dhdv, float dud_, float dvd_ )
{
    return dhdu * dud_ + dhdv * dvd_;
}
 
vec3 SurfaceGradient( vec3 n, vec3 dpdx, vec3 dpdy, float dhdx, float dhdy )
{
    vec3 r1 = cross( dpdy, n );
    vec3 r2 = cross( n, dpdx );
    float det = dot( dpdx, r1 );
  
    return ( r1 * dhdx + r2 * dhdy ) / det;
}


vec3 ParallaxDirection( vec3 v, vec3 n, vec3 dpdx, vec3 dpdy, vec2 duvdx, vec2 duvdy )
{
    vec3 r1 = cross( dpdy, n );
    vec3 r2 = cross( n, dpdx );
    float det = dot( dpdx, r1 );
  
    vec2 vscr = vec2( dot( r1, v ), dot( r2, v ) ) / det;
    vec3 vtex;
    vtex.z  = dot( n, v ) / parallaxHeight;
    //vtex.z  = dot( n, v );
    vtex.xy = duvdx * vscr.x + duvdy * vscr.y;
     
    return vtex;
}

#ifdef USE_DERIVATIVE_MAP
vec3 ParallaxDerivative( vec3 wsViewDir, vec3 wsNormal, vec3 dpdx, vec3 dpdy, vec2 duvdx, vec2 duvdy, vec2 uv )
		{
			vec3 tsPDir = ParallaxDirection( wsViewDir, wsNormal, dpdx, dpdy, duvdx, duvdy );
			 
			// The length of this vector determines the furthest amount of displacement:
			float fLength = length( tsPDir );
			fLength = sqrt( fLength * fLength - tsPDir.z * tsPDir.z ) / tsPDir.z; 
			 
			// Compute the maximum reverse parallax displacement vector:
			vec2 maxParallaxOffset = normalize( tsPDir.xy ) * fLength;
			 
			// Scale the maximum amount of displacement by the artist-editable parameter: parallaxHeight
			maxParallaxOffset *= parallaxHeight;
			 
			int numSteps = int( mix( parallaxSampleCount * 8.0, parallaxSampleCount, clamp( dot( wsViewDir, wsNormal ), 0.0, 1.0 ) ) );
			float stepSize = 1.0 / float( numSteps );
			float currHeight = 0.0;
			float prevHeight = 1.0;
			float currBound  = 1.0;
			 
			vec2 offsetPerStep = stepSize * maxParallaxOffset;
			vec2 currOffset = uv;
			 
			vec2 pt1;
			vec2 pt2;
			 
			for ( int it = 0; it < 512; ++it )
			{
				if ( it >= numSteps )
					break;
		 
				currOffset -= offsetPerStep;
				 
				currHeight = texture2D( u_HeightMap, currOffset ).b;
				 
				currBound -= stepSize;
				 
				if ( currHeight > currBound ) 
				{
					pt1 = vec2( currBound, currHeight );
					pt2 = vec2( currBound + stepSize, prevHeight );
		 
					break;
				}
				 
				prevHeight = currHeight;
			}
			 
			// compute the parallaxAmount using line intersection
			float parallaxAmount = 0.0;
			 
			float delta2 = pt2.x - pt2.y;
			float delta1 = pt1.x - pt1.y;
		 
			float denominator = delta2 - delta1;
		 
			if ( denominator != 0.0 )
				parallaxAmount = ( pt1.x * delta2 - pt2.x * delta1 ) / denominator;
			 
			uv = uv - maxParallaxOffset * ( 1.0 - parallaxAmount );
			 
#ifdef USE_POM_SIHLOUETTE
				float tile = 1.0;
				float clipMax = tile;
				float clipMin = 0.0;
				 
				if ( uv.x >= clipMax || uv.y >= clipMax
				  || uv.x <= clipMin || uv.y <= clipMin )
				{
					discard;
				}
#endif
			 
			float ao = 1.0 - occlusion;
			ao = 1.0 - ao * ao;
			ao = mix( 1.0, max( 0.0, currBound ), ao );
			
			return vec3(uv.x,uv.y,ao);
		}
#endif		

void main()
{		

		vec2 uv = v_UV;
		vec3 v = normalize(u_Camera - v_Position);        // Vector from surface point to camera
		vec3 view_dir = normalize(vec3(0.0,0.0,0.0) - PosV);        // Vector from surface point to camera
#ifdef USE_DERIVATIVE_MAP
		//vec3 CamPos = vec3(0.0,0.0,0.0);
		//vec3 wsViewDir = normalize( CamPos - v_Position.xyz );
		vec3 wsNormal = normalize( NormView );
		 
		vec3 dpdx = dFdx( PosV.xyz );
		vec3 dpdy = dFdy( PosV.xyz );
	 
		
		vec2 duvdx = dFdx( uv );
		vec2 duvdy = dFdy( uv );
	 
		vec3 Parallax_UV_AO = ParallaxDerivative( view_dir, wsNormal, dpdx, dpdy, duvdx, duvdy, uv );
		uv = Parallax_UV_AO.xy;
		float ao_POM = Parallax_UV_AO.z;
		
		vec2 dhduv = texture2D( u_HeightMap, uv ).rg;
		dhduv = ( dhduv * 2.0 - 1.0 ) * u_NormalScale;
		 
		float dhdx = ApplyChainRule( dhduv.x, dhduv.y, duvdx.x, duvdx.y );
		float dhdy = ApplyChainRule( dhduv.x, dhduv.y, duvdy.x, duvdy.y );
		 
		vec3 derivative_normal = normalize( wsNormal - SurfaceGradient( wsNormal, dpdx, dpdy, dhdx, dhdy ) );
#endif		
	
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
    float perceptualRoughness = u_MetallicRoughnessValues.y;
    float metallic = u_MetallicRoughnessValues.x;
#ifdef HAS_METALROUGHNESSMAP
    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    vec4 mrSample = texture2D(u_MetallicRoughnessSampler, uv);
    perceptualRoughness = mrSample.g * perceptualRoughness;
#ifdef HAS_METALNESS_SINGLECHANNEL
    metallic = texture2D(u_Metallic, uv).g * metallic;
#else
	metallic = mrSample.b * metallic;
#endif	
#endif
    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);
    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    // The albedo may be defined from a base texture or a flat color
#ifdef HAS_BASECOLORMAP
    vec4 baseColor = SRGBtoLINEAR(texture2D(u_BaseColorSampler, uv)) * u_BaseColorFactor;
#else
    vec4 baseColor = u_BaseColorFactor;
#endif

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

#ifdef USE_DERIVATIVE_MAP
	vec3 n = derivative_normal ;
#else
    vec3 n = getNormal();                             // normal at surface point
#endif    
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

    // This section uses mix to override final color for reference app visualization
    // of various parameters in the lighting equation.
    color = mix(color, F, u_ScaleFGDSpec.x);
    color = mix(color, vec3(G), u_ScaleFGDSpec.y);
    color = mix(color, vec3(D), u_ScaleFGDSpec.z);
    color = mix(color, specContrib, u_ScaleFGDSpec.w);

    color = mix(color, diffuseContrib, u_ScaleDiffBaseMR.x);
    color = mix(color, baseColor.rgb, u_ScaleDiffBaseMR.y);
    color = mix(color, vec3(metallic), u_ScaleDiffBaseMR.z);
    color = mix(color, vec3(perceptualRoughness), u_ScaleDiffBaseMR.w);
	color *= pow(2.0, exposure);
#ifdef NO_GAMMA_CORRECTION
	gl_FragColor = vec4(color.rgb, baseColor.a*alpha);
#else
    gl_FragColor = vec4(pow(color,vec3(1.0/2.2)), baseColor.a*alpha);
#endif
}