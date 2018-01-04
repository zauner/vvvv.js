vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec3 NormO : NORMAL;


uniform mat4 Texture_Transform;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;
uniform vec3 LightPos;
uniform vec3 cameraPosition;

varying vec2 texcoord;
varying vec3 wpos;
varying vec3 wview;
varying vec3 wnormal;
varying vec3 wtangent;
varying vec3 wbitangent;
varying vec3 light;

void main(void) {
	
	mat4 tWV = tV * tW;
    mat4 tWVP = tP * tWV;

	vec3 NormW = normalize(tW * vec4(NormO, 0)).xyz;
	
	vec4 PosV = tWV * vec4(PosO, 1);
	vec4 PosWVP = (tWVP * vec4(PosO, 1.0));
	
	 //vec4 o = offset;
	// vec4 o2 = offset2;
	// vec4 o3 = offset3;
	// vec4 o4 = offset4;
	// vec4 o5 = offset5;
	// vec4 o6 = offset6;
	// vec4 o7= offset7;
	// vec4 o8 = offset8;
	// vec4 o9 = offset9;
	// vec4 o10 = offset10;
	
    vec4 PosW = tW*vec4(PosO, 1);
    
    //tangents and binormals approximation
	vec3 n = NormO;
	vec3 tangent; 
	vec3 binormal; 
	vec3 c1 = cross(n, vec3(0.0, 0.0, 1.0)); 
	vec3 c2 = cross(n, vec3(0.0, 1.0, 0.0)); 
	if (length(c1) > length(c2))
	tangent = c1;	
	else
	tangent = c2;	
	tangent = normalize(tangent);
	binormal = normalize(cross(n, tangent)); 
  
    //fill varyings with data
	texcoord = (Texture_Transform * vec4(TexCd, 0, 1)).xy;
	//texcoord = (Texture_Transform * vec4(TexCd, 0, 1)).xy +vec2(mod(atlas_index, 4.0)/4.0,floor(atlas_index/4.0)/4.0);
	wpos = vec3(tW*vec4(PosO, 1)).xyz;
	wview = normalize( wpos.xyz - cameraPosition );//normalize(-PosV).xyz;
	wnormal = NormW;
	wtangent = tangent;
	wbitangent = binormal;
	light = PosW.xyz - LightPos;
	
	gl_Position = PosWVP;
}	

fragment_shader:


#extension GL_OES_standard_derivatives : enable


#ifdef GL_ES
precision highp float;
#endif

varying vec2 texcoord;
varying vec3 wpos;
varying vec3 wview;
varying vec3 wnormal;
varying vec3 wtangent;
varying vec3 wbitangent;
varying vec3 light;

uniform sampler2D Atlas1;
uniform sampler2D Atlas2;
uniform samplerCube EnvironmentMap;

uniform float roughness;

uniform float fresnel_factor = 0.27;

uniform float exposure;

uniform float TextureScale = 1.0;

uniform float NormalScale = 0.1;






// Helper functions
///////////////////
const float M_PI = 3.14159265359;

float saturate(float v) { return clamp(v, 0.0, 1.0); }
vec3  saturate(vec3 v)  { return vec3(saturate(v.x), saturate(v.y), saturate(v.z)); }
vec3 pow3(vec3 v, float p) { return vec3(pow(v.x, p), pow(v.y, p), pow(v.z, p)); }

const float gamma = 2.2;

vec3 ToLinear(vec3 v) { return pow3(v,     gamma); }
vec3 ToSRGB(vec3 v)   { return pow3(v, 1.0/gamma); }



vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm , vec3 normal_map) {
		vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );
		vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );
		vec2 st0 = dFdx( texcoord.st );
		vec2 st1 = dFdy( texcoord.st );
		vec3 S = normalize( q0 * st1.t - q1 * st0.t );
		vec3 T = normalize( -q0 * st1.s + q1 * st0.s );
		vec3 N = normalize( surf_norm );
		vec3 mapN = normal_map;//texture2D( normal_map, texcoord ).xyz * 2.0 - 1.0;
		mapN.xy = NormalScale * mapN.xy;
		mat3 tsn = mat3( S, T, N );
		return normalize( tsn * mapN );
	}

//PBR Functions 
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

 float diffuseEnergyRatio(float f0, vec3 n, vec3 l){
	 return 1.0 - fresnel(f0, n, l);
 }
 
vec3 PBR_Shading(vec3 normal, vec3 light_dir, vec3 view_dir, float fresnel_value, vec3 halfVec, float roughness, vec3 albedo )
{
	float PI = 3.14159265359;
	float NdotL= dot(normal, light_dir);
	float NdotV= dot(normal, view_dir);
	float NdotL_clamped= clamp(NdotL, 0.001, 1.0);
	float NdotV_clamped= clamp(NdotV, 0.001, 1.0);
	
	vec3 color_spec = vec3(0.0);
	//if (NdotL > 0.001 && NdotV > 0.001) {
	 float brdf_spec= fresnel(fresnel_value, halfVec, light_dir) * geometry(normal, halfVec, view_dir, light_dir, roughness) * distribution(normal, halfVec, roughness) / (4.0 * NdotL_clamped * NdotV_clamped);
	 color_spec= vec3(NdotL_clamped * brdf_spec) ; //* env_spec.rgb
	//};
	
	vec3 color_diff= albedo * vec3(NdotL_clamped * diffuseEnergyRatio(fresnel_value, normal, light_dir))  ; //*DifCol * LightCol * env_dif.rgb
	
	return max(color_diff + color_spec,0.0);
}






// Main shader
///////////////////

void main()
{
	

	

	vec4 xaxis = texture2D(Atlas2, index_uv_x, MIP).rgba ;
	
	
	
	xaxis = texture2D(Atlas1, index_uv_x, MIP).rgba;  //uvs.zy+index_uv
	yaxis = texture2D(Atlas1, index_uv_y, MIP).rgba;
    zaxis = texture2D(Atlas1, index_uv_z, MIP).rgba;
    vec4 Tri_Albedo = xaxis * triblend.x + yaxis * triblend.y + zaxis * triblend.z;
	Tri_Albedo.rgb = ToLinear(Tri_Albedo.rgb);
	
	float roughness_atlas = Tri_Normal.a;
	float height_atlas = Tri_Normal.r;
	float metalic_atlas = Tri_Albedo.a;
	
    // Compute the half-way vector 
    vec3 view = normalize(wview);
    vec3 hW   = normalize(view + light);

	vec3 normal = perturbNormal2Arb( wview, wnormal, Decoded_Tri_Normal );
	
	vec3 color =   PBR_Shading(normal, normalize(light), view, fresnel_factor, hW, roughness_atlas, Tri_Albedo.rgb );
	
	color *= pow(2.0, exposure);

    // Convert to sRGB for display
    color = ToSRGB(color);
	
    gl_FragColor = vec4(color , 1);
}