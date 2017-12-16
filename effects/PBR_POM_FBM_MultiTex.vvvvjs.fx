vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec3 NormO : NORMAL;

uniform mat4 Texture_Transform;
uniform mat4 Texture_Transform_col;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;
uniform vec3 CamPos;
uniform float refraction_etaRatio;
uniform mat4 normalMatrix;
uniform vec3 light_pos;
uniform vec3 TriplanarUV_Scale;

varying vec3 n;
varying vec3 NormV;
varying vec3 NormW;
varying vec4 PosWVP;
varying vec3 ViewDirV;
varying vec2 vs2psTexCd;
varying vec3 eyevector;
varying vec3 refraction_vector;

varying vec3 tangent;
varying vec3 binormal;


//Parallax Occlusion Mapping
varying vec3 fNormal;
varying vec3 fPosition;

varying vec2 frag_uv;
varying vec3 ts_light_pos; // Tangent space values
varying vec3 ts_view_pos;  //
varying vec3 ts_frag_pos;  //
//////////////////////////////

//Triplanar Mapping
varying vec2 TexCd_pos_tri_xz;
varying vec2 TexCd_pos_tri_xy;
varying vec2 TexCd_pos_tri_yz;
///////////////////////////////////

mat3 transpose(in mat3 inMatrix)
{
    vec3 i0 = inMatrix[0];
    vec3 i1 = inMatrix[1];
    vec3 i2 = inMatrix[2];

    mat3 outMatrix = mat3(
        vec3(i0.x, i1.x, i2.x),
        vec3(i0.y, i1.y, i2.y),
        vec3(i0.z, i1.z, i2.z)
    );

    return outMatrix;
}


void main(void) {


  mat4 tWV = tV * tW;
  mat4 tWVP = tP * tWV;

  vec3 n = NormO;
  fNormal = n;
  NormV = normalize(tWV * vec4(n, 0)).xyz;
  NormW = normalize(tW * vec4(n, 0)).xyz;
  
  vec4 PosV = tWV * vec4(PosO, 1);
  fPosition = PosV.xyz;
  
  n = NormW; //Previously NormO as basis
  //tangents and binormals approximation
  vec3 tangent; 
  vec3 binormal; 
  vec3 c1 = cross( n, vec3(0.0, 0.0, 1.0)); 
  vec3 c2 = cross(n, vec3(0.0, 1.0, 0.0)); 
  if (length(c1) > length(c2))
    tangent = c1;	
  else
    tangent = c2;	
  tangent = normalize(tangent);
  binormal = normalize(cross(n, tangent)); 
  
  vec3 t = normalize(mat3(normalMatrix) * tangent);
  vec3 b = normalize(mat3(normalMatrix) * binormal);
  n = normalize(mat3(normalMatrix) * n);
  mat3 tbn = transpose(mat3(t, b, n));
  
    //vec3 light_pos = vec3(1, 2, 0);
  ts_light_pos = tbn * light_pos;
  // Our camera is always at the origin
  ts_view_pos = tbn * vec3(0.0,0.0,0.0);
  ts_frag_pos = tbn * PosV.xyz;
  
  
  ViewDirV = normalize(-PosV).xyz;
  vec4 PosWVP = (tWVP * vec4(PosO, 1.0));
  vec4 PosW = tW*vec4(PosO, 1);
  
  //Triplanar Texture Coordinates
  TexCd_pos_tri_xz = TriplanarUV_Scale.y*PosW.xz;
  TexCd_pos_tri_xy = TriplanarUV_Scale.z*PosW.xy;
  TexCd_pos_tri_yz = TriplanarUV_Scale.x*PosW.yz;
  
  //eyevector  
  vec3 IncidentVector = PosW.xyz - CamPos;
  eyevector = reflect(IncidentVector, NormW);
  vec3 normalized_I = normalize(IncidentVector);
  refraction_vector = refract(normalized_I, NormW, refraction_etaRatio);
  gl_Position = PosWVP;
  vs2psTexCd = (Texture_Transform * vec4(TexCd, 0, 1)).xy;
}


fragment_shader:

#ifdef GL_ES
precision highp float;
#endif

/*******************************************************************************
METHODS 
*******************************************************************************/
    //#extension GL_OES_standard_derivatives:enable

///////////////////COOK TORRANCE////////////
float fresnel(float f0, vec3 n, vec3 l){
    return f0 + (1.0-f0) * pow(1.0- dot(n, l), 5.0);
}

///////////////////Distribution Term/////////////////
//Beckmann								
float distribution(vec3 n, vec3 h, float roughness){
	float m_Sq= roughness * roughness;
	float NdotH_Sq= max(dot(n, h), 0.0);
	NdotH_Sq= NdotH_Sq * NdotH_Sq;
	return exp( (NdotH_Sq - 1.0)/(m_Sq*NdotH_Sq) )/ (3.14159265 * m_Sq * NdotH_Sq * NdotH_Sq) ;
}
//Blinn-Phong
// float distribution(vec3 n, vec3 h, float roughness){
	// float m= 2.0/(roughness*roughness) - 2.0;
	// return (m+2.0) * pow( max(dot(n, h), 0.0), m) / (2.0 * 3.14159265);
// }

////////////////////Geometry Term/////////////////////////
//Cook Torrance
// float geometry(vec3 n, vec3 h, vec3 v, vec3 l, float roughness){
	// float NdotH= dot(n, h);
	// float NdotL= dot(n, l);
	// float NdotV= dot(n, v);
	// float VdotH= dot(v, h);
	// float NdotL_clamped= max(NdotL, 0.0);
	// float NdotV_clamped= max(NdotV, 0.0);
	// return min( min( 2.0 * NdotH * NdotV_clamped / VdotH, 2.0 * NdotH * NdotL_clamped / VdotH), 1.0);
// }

//Implicit
// float geometry(vec3 n, vec3 h, vec3 v, vec3 l, float roughness){
	// return max(dot(n, l), 0.0) * max(dot(n, v), 0.0);
// }

//Schlick 
// float geometry(vec3 n, vec3 h, vec3 v, vec3 l, float roughness){
	// float NdotL_clamped= max(dot(n, l), 0.0);
	// float NdotV_clamped= max(dot(n, v), 0.0);
	// float k= roughness * sqrt(2.0/3.14159265);
	// float one_minus_k= 1.0 -k;
	// return ( NdotL_clamped / (NdotL_clamped * one_minus_k + k) ) * ( NdotV_clamped / (NdotV_clamped * one_minus_k + k) );
// }

//Walter
float geometry(vec3 n, vec3 h, vec3 v, vec3 l, float roughness){
	float NdotV= dot(n, v);
	float NdotL= dot(n, l);
	float HdotV= dot(h, v);
	float HdotL= dot(h, l);
	float NdotV_clamped= max(NdotV, 0.0);
	float a= 1.0/ ( roughness * tan( acos(NdotV_clamped) ) );
	float a_Sq= a* a;
	float a_term;
	if (a<1.6)
		a_term= (3.535 * a + 2.181 * a_Sq)/(1.0 + 2.276 * a + 2.577 * a_Sq);
	else
		a_term= 1.0;
	return  ( step(0.0, HdotL/NdotL) * a_term  ) * 
			( step(0.0, HdotV/NdotV) * a_term  ) ;
}

/////////////EnergyConservation//////////////////////////
//FresnellDiff
 float diffuseEnergyRatio(float f0, vec3 n, vec3 l){
	 return 1.0 - fresnel(f0, n, l);
 }
//None
// float diffuseEnergyRatio(float f0, vec3 n, vec3 l){
	// return 1.0;
// }
//Fresnel0
//float diffuseEnergyRatio(float f0, vec3 n, vec3 l){
//	return 1.0 - f0;
//}

float specularCookTorrance( float roughnessValue, float fresnelReflectance, float IOR, vec3 surfacePosition, vec3 surfaceNormal, vec3 lightDirection, float lambertFactor ) {
    vec3 viewDirection = normalize( -surfacePosition );
    vec3 halfDirection = normalize( lightDirection + viewDirection );

    float NdotH = max(dot(surfaceNormal, halfDirection), 0.0); 
    float NdotV = max(dot(surfaceNormal, viewDirection), 0.0);
    float VdotH = max(dot(viewDirection, halfDirection), 0.0);
    
    float roughnessSquared = roughnessValue * roughnessValue;

    float NH2 = 2.0 * NdotH;
    float g1 = (NH2 * NdotV) / VdotH;
    float g2 = (NH2 * lambertFactor) / VdotH;
    float geoAtt = min(1.0, min(g1, g2));
    float r1 = 1.0 / ( 4.0 * roughnessSquared * pow(NdotH, 4.0));
    float r2 = (NdotH * NdotH - 1.0) / (roughnessSquared * NdotH * NdotH);
    float roughness = r1 * exp(r2);
    float fresnel = pow(1.0 - VdotH, 5.0);
    fresnel *= (1.0 - fresnelReflectance);
    fresnel += fresnelReflectance;

    float factor = (fresnel * geoAtt * roughness) / (NdotV * lambertFactor * IOR);
    return factor;
}



varying vec3 n;
varying vec3 NormV;
varying vec3 NormW;
varying vec3 ViewDirV;
varying vec3 tangent;
varying vec3 binormal;
varying vec2 vs2psTexCd;
varying vec3 eyevector;
varying vec3 refraction_vector;

//Parallax Occlusion Mapping
varying vec3 fNormal;
varying vec3 fPosition;

varying vec2 frag_uv;
varying vec3 ts_light_pos; // Tangent space values
varying vec3 ts_view_pos;  //
varying vec3 ts_frag_pos;  //
//////////////////////////////

//Triplanar Mapping
varying vec2 TexCd_pos_tri_xz;
varying vec2 TexCd_pos_tri_xy;
varying vec2 TexCd_pos_tri_yz;
///////////////////////////////////

uniform sampler2D tNormal1;
uniform sampler2D tCol1;
uniform sampler2D tex_depth;
uniform samplerCube EnvironmentMap;

uniform float u_fresnel0 = 0.1;
uniform float u_roughness = 0.34;
uniform vec4 Ambient_Color : COLOR = {0.15, 0.15, 0.15, 1.0};
uniform vec4 u_diffuseColor : COLOR = {0.85, 0.85, 0.85, 1.0};
uniform vec4 u_lightColor : COLOR = {0.15, 0.15, 0.15, 1.0};
uniform vec3 u_lightDir = {0.0, -5.0, 2.0};
uniform float NormalScale = 1.0;
uniform float BumpFactor = 0.5;
uniform float refract_amount = 0.0;
uniform float CubeMap_Sampler_Sign = -1.0;

uniform float depth_scale;
uniform float num_layers;

vec2 parallax_uv(vec2 uv, vec3 view_dir)
{
        float layer_depth = 1.0 / num_layers;
        float cur_layer_depth = 0.0;
        vec2 delta_uv = view_dir.xy * depth_scale / (view_dir.z * num_layers);
        vec2 cur_uv = uv;

        float depth_from_tex = texture2D(tex_depth, cur_uv).r;

        for (int i = 0; i < 32; i++) {
            cur_layer_depth += layer_depth;
            cur_uv -= delta_uv;
            depth_from_tex = texture2D(tex_depth, cur_uv).r;
            if (depth_from_tex < cur_layer_depth) {
                break;
            }
        }
		// Parallax occlusion mapping
		vec2 prev_uv = cur_uv + delta_uv;
		float next = depth_from_tex - cur_layer_depth;
		float prev = texture2D(tex_depth, prev_uv).r - cur_layer_depth
					 + layer_depth;
		float weight = next / (next - prev);
		return mix(cur_uv, prev_uv, weight);
       
}


void main(void) {
	
	vec3 light_dir = normalize(ts_light_pos - ts_frag_pos);
    vec3 view_dir = normalize(ts_view_pos - ts_frag_pos);
	
	vec3 normal_sign = sign(NormW);
	vec2 uv_x = parallax_uv( vec2(   normal_sign.x *TexCd_pos_tri_yz.y  ,  -TexCd_pos_tri_yz.x), view_dir);
	vec2 uv_y = parallax_uv( vec2(  normal_sign.y * TexCd_pos_tri_xz.x  , -TexCd_pos_tri_xz.y), view_dir);
	//branching for - or + normal needed?
	vec2 uv_z = parallax_uv(  vec2(  -normal_sign.z * TexCd_pos_tri_xy.x  , -TexCd_pos_tri_xy.y), view_dir);
	
	//sampleTextures
	
	//Triplanar Texture Mapping uv weights
	//vec3 tpweights = abs(NormW);
	//tpweights = (tpweights - 0.5) * 7.0;
	//tpweights = max(tpweights, vec3(0.0));
	//tpweights /= tpweights.x + tpweights.y+ tpweights.z;
	
	vec3 triblend = NormW*NormW;
    triblend= triblend / (triblend.x + triblend.y + triblend.z);
	
	vec3 tpweights = triblend;
	
	//Triplanar Albedo Texture
    vec3 xaxis = texture2D(tCol1, uv_x).xyz;
    vec3 yaxis = texture2D(tCol1, uv_y).xyz;
    vec3 zaxis = texture2D(tCol1, uv_z).xyz;
    vec3 ColorTex = xaxis * tpweights.x + yaxis * tpweights.y + zaxis * tpweights.z;
	
	//Triplanar Normal Texture
    xaxis = texture2D(tNormal1, uv_x).xyz;
    yaxis = texture2D(tNormal1, uv_y).xyz;
    zaxis = texture2D(tNormal1, uv_z).xyz;
    vec3 NormalTex = xaxis * tpweights.x + yaxis * tpweights.y + zaxis * tpweights.z;
	
	
	
	
	
	//vec3 NormalMap2 = texture2D(tNormal1, uv).xyz;
	//applyNormals
	vec3 nN = normalize(NormW + binormal + tangent);
	vec3 normal = normalize(NormalTex * nN); 
	//sample EnvironmentMap (Optimaly Prebacked Irradiance Map but works with any cubemap too)
	vec4 env_dif = textureCube(EnvironmentMap, CubeMap_Sampler_Sign * fNormal);
	
	vec4 env_spec = textureCube(EnvironmentMap, CubeMap_Sampler_Sign * eyevector);
	
    vec4 refract = textureCube(EnvironmentMap, CubeMap_Sampler_Sign * refraction_vector);
	//Cook Torrance Lighting 
	float PI = 3.14159265359;
	vec3 LightCol = u_lightColor.xyz/PI;
	vec3 DifCol = u_diffuseColor.xyz*PI;
	vec3 halfVec=  normalize(u_lightDir + ViewDirV);
	float NdotL= dot(normal, u_lightDir);
	float NdotV= dot(normal, ViewDirV);
	float NdotL_clamped= clamp(NdotL, 0.001, 1.0);
	float NdotV_clamped= clamp(NdotV, 0.001, 1.0);
	
	vec3 color_spec = vec3(0.0);
	if (NdotL > 0.001 && NdotV > 0.001) {
	 float brdf_spec= fresnel(u_fresnel0, halfVec, u_lightDir) * geometry(normal, halfVec, ViewDirV, u_lightDir, u_roughness) * distribution(normal, halfVec, u_roughness) / (4.0 * NdotL_clamped * NdotV_clamped);
	 color_spec= NdotL_clamped * brdf_spec * env_spec.rgb;
	};

	vec3 color_diff= NdotL_clamped * diffuseEnergyRatio(u_fresnel0, normal, u_lightDir) * DifCol * LightCol * env_dif.rgb;
	
	gl_FragColor = vec4(ColorTex.rgb,1.0);
    gl_FragColor.rgb *= Ambient_Color.rgb * env_dif.rgb + refract.rgb * refract_amount + color_diff + color_spec;
}