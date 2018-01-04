vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec3 NormO : NORMAL;
attribute vec4 index : INDEX;
attribute vec4 vcol : VERTEXCOLOR;


uniform mat4 Texture_Transform;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;
uniform vec3 LightPos;
uniform vec3 cameraPosition;
uniform float atlas_index;
uniform sampler2D InstanceWorldTex;
uniform float submesh_count = 10.0;
uniform float instance_count = 100.0;
uniform float data_texture_resX = 64.0;


varying vec2 texcoord;
varying vec3 wpos;
varying vec3 wview;
varying vec3 wnormal;
varying vec3 wtangent;
varying vec3 wbitangent;
varying vec3 light;
varying float material_index;
varying vec3 eyevector;

void main(void) {
	
	mat4 tWV = tV * tW;
    mat4 tWVP = tP * tWV;

	vec3 NormW = normalize(tW * vec4(NormO, 0)).xyz;
	
	float pos_index = index.x ; //* floor(vcol.r*submesh_count + 0.001) for batching

	vec2 uv_worldpos = vec2(mod(pos_index, data_texture_resX)/data_texture_resX , floor(pos_index/data_texture_resX)/data_texture_resX);

	vec4 InstancePos = texture2D(InstanceWorldTex, uv_worldpos);
	InstancePos.xyz = InstancePos.xyz * 2.0 - vec3(1.0,0.0,1.0);
	vec3 Pos_Instance = PosO  + InstancePos.rgb ;
	
	vec4 PosV = tWV * vec4(Pos_Instance, 1);
	vec4 PosWVP = (tWVP * vec4(Pos_Instance, 1.0));
    vec4 PosW = tW*vec4(Pos_Instance, 1);
    
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
	//texcoord = (Texture_Transform * vec4(TexCd, 0, 1)).xy;
	texcoord = (Texture_Transform * vec4(TexCd, 0, 1)).xy +vec2(mod(atlas_index, 4.0)/4.0,floor(atlas_index/4.0)/4.0);
	wpos = PosW.xyz ;
	wview = normalize( wpos.xyz - cameraPosition );//normalize(-PosV).xyz;
	wnormal = NormW;
	wtangent = tangent;
	wbitangent = binormal;
	light = PosW.xyz - LightPos;
	material_index = index.y;
	eyevector = reflect(wview, NormW);
	
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
varying float material_index;
varying vec3 eyevector;

uniform sampler2D Atlas1;
uniform sampler2D Atlas2;
uniform samplerCube EnvironmentMap;

uniform float roughness;

uniform float fresnel_factor = 0.27;

uniform float exposure;

uniform float TextureScale = 1.0;

uniform float NormalScale = 0.1;

uniform float atlasIndex;

uniform float TileCount = 4.0;
uniform float TilePixelSize = 256.0;
uniform float GutterPercent = 0.0;
uniform float MinLOD = 3.0;
uniform float Atlas_TexSize = 2048;

//FBM Uniforms
uniform float scale_in;
uniform vec4 FBM_Pos;
uniform vec2 on_in;
uniform vec2 n_in;
uniform vec2 m_in;

uniform vec3 noise_pos1;
uniform vec3 noise_pos2;
uniform vec3 noise_pos3;

uniform vec3 noise_scale1;
uniform vec3 noise_scale2;
uniform vec3 noise_scale3;

uniform float triplanar_texcd = 1.0;




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
 
vec3 PBR_Shading(vec3 normal, vec3 light_dir, vec3 view_dir, float fresnel_value, vec3 halfVec, float roughness, vec3 albedo, vec3 env_diffuse, vec3 env_spec )
{
	float PI = 3.14159265359;
	float NdotL= dot(normal, light_dir);
	float NdotV= dot(normal, view_dir);
	float NdotL_clamped= clamp(NdotL, 0.001, 1.0);
	float NdotV_clamped= clamp(NdotV, 0.001, 1.0);
	
	roughness = roughness*roughness;
	
	vec3 color_spec = vec3(0.0);
	//if (NdotL > 0.001 && NdotV > 0.001) {
	 float brdf_spec= fresnel(fresnel_value, halfVec, light_dir) * geometry(normal, halfVec, view_dir, light_dir, roughness) * distribution(normal, halfVec, roughness) / (4.0 * NdotL_clamped * NdotV_clamped);
	 color_spec= vec3(NdotL_clamped * brdf_spec) * env_spec.rgb*fresnel_value; //
	//};
	
	vec3 color_diff= albedo * vec3(NdotL_clamped * diffuseEnergyRatio(fresnel_value, normal, light_dir))  * env_diffuse; //*DifCol * LightCol * env_dif.rgb
	
	return max(color_diff + color_spec,0.0);
}

float GetMipLevel(vec2 iUV, vec2 iTextureSize, float Max_Mip)
{
	vec2 dx = dFdx(iUV * iTextureSize.x);
	vec2 dy = dFdy(iUV * iTextureSize.y);
	float d = max(dot(dx, dx), dot(dy,dy));
	
	 //Clamp the value to the max mip level counts
	float rangeClamp = pow(2.0, (Max_Mip - 1.0) * 2.0);
	d = clamp(d, 1.0, rangeClamp);
	float miplevel = 0.5 * log2(d);
	miplevel = floor(miplevel);
	if(miplevel > 1.0){
		miplevel = -10.0;
	}
  
	return miplevel;
}

vec2 Atlas_texCoords(vec2 texCoords, float tileIndexA)
{
	float tilePercentWidth = 1.0 / TileCount;
	float atlasTileWidth = (1.0 - 2.0 * GutterPercent) * tilePercentWidth; // The width of this tile in the atlas.
	float gutterSize = GutterPercent * tilePercentWidth;

    vec2 texCoord = texCoords;
	texCoord.x = mod(texCoord.x, 1.0);
	texCoord.x *= atlasTileWidth;
	texCoord.y = mod(texCoord.y, 1.0);
	texCoord.y *= atlasTileWidth;

	vec2 tileTexCoords = texCoord;
	tileTexCoords.x += tilePercentWidth * (mod(tileIndexA,TileCount) + gutterSize) ;
	tileTexCoords.y += tilePercentWidth * (floor(tileIndexA/TileCount) + gutterSize) ;

	return tileTexCoords;
}

//FBM Distortion

const mat2 m = mat2( 0.80,  0.60, -0.60,  0.80 );

float noise( in vec2 x )
{
	return sin(1.5*x.x)*sin(1.5*x.y);
}


float fbm4( vec2 p )
{
    float f = 0.0;
    f += 0.5000*noise( p ); p = m*p*2.02;
    f += 0.2500*noise( p ); p = m*p*2.03;
    f += 0.1250*noise( p ); p = m*p*2.01;
    f += 0.0625*noise( p );
    return f/0.9375;
}


float fbm6( vec2 p )
{
    float f = 0.0;
    f += 0.500000*(0.5+0.5*noise( p )); p = m*p*2.02;
    f += 0.250000*(0.5+0.5*noise( p )); p = m*p*2.03;
    f += 0.125000*(0.5+0.5*noise( p )); p = m*p*2.01;
    f += 0.062500*(0.5+0.5*noise( p )); p = m*p*2.04;
    f += 0.031250*(0.5+0.5*noise( p )); p = m*p*2.01;
    f += 0.015625*(0.5+0.5*noise( p ));
    return f/0.96875;
}


float func( vec2 q, float scale_in, vec2 on_in, vec2 n_in, vec2 m_in)
{
    float ql = length( q );
    q.x += 0.05;
    q.y += 0.05;
    q *= scale_in;

	vec2 o = vec2(0.0);
    o.x = fbm4( vec2(on_in.x*q +FBM_Pos.xy ) );  //4
    o.y = fbm4( vec2(on_in.y*q) +FBM_Pos.zw  );  //2

	float ol = length( o );
    o.x += 0.02*sin(0.12+ol)/ol;
    o.y += 0.02*sin(0.14+ol)/ol;

    vec2 n;
    n.x = fbm6( vec2(n_in.x*o+vec2(9.2, 9.2))  ); //2
    n.y = fbm6( vec2(n_in.y*o+vec2(5.7, 5.7))  ); //2
	
	vec2 m;
    m.x = fbm4( vec2(m_in.x*n+vec2(4, 5.6))  );  //4
    m.y = fbm4( vec2(m_in.y*n+vec2(8, 5.6))  );  //4

    vec2 p = 4.0*q + 4.0*m;  //n replaced with o from 1st iteration

    float f = 0.5 + 0.5*fbm4( m );
    f = mix( f, f*f*f*3.5, f*abs(n.x) );
    float g = 0.5 + 0.5*sin(4.0*p.x)*sin(4.0*p.y);
    f *= 1.0-0.5*pow( g, 8.0 );
	//ron = vec4( o, n );
	
    return f;
}

//decode normal map from Spheremap Transform compression https://aras-p.info/texts/CompactNormalStorage.html

vec3 decode (vec4 enc)
{
    vec4 nn = enc*vec4(2.0,2.0,0.0,0.0) + vec4(-1.0,-1.0,1.0,-1.0);
    float l = dot(nn.xyz,-nn.xyw);
    nn.z = l;
    nn.xy *= sqrt(l);
    return nn.xyz * 2.0 + vec3(0.0,0.0,-1.0);
}

//	Classic Perlin 3D Noise 
//	by Stefan Gustavson
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

//	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
//


float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

// Main shader
///////////////////

void main()
{

	vec3 albedo = vec3(0.0);
	vec3 normals =  vec3(0.0);
	float roughness_atlas = 0.0;
	float height_atlas = 0.0;
	float metalic_atlas = 0.0;
	
if(triplanar_texcd==1.0){  //use triplanar mapping with worldpositions as texture coordinates
	vec3 abs_normal = abs(wnormal.xyz);
	vec3 triblend = vec3(pow(abs_normal.x, 4.0), pow(abs_normal.y, 4.0), pow(abs_normal.z, 4.0) );
	triblend /= max(dot(triblend, vec3(1,1,1)), 0.0001);
	
	vec3 uvs = fract(TextureScale * wpos) ;
	vec3 uvs_fbm = wpos ;
	
	// vec3 fbm_x = vec3(func( uvs_fbm.zy, scale_in, on_in,  n_in, m_in));
	// vec3 fbm_y = vec3(func( uvs_fbm.xz, scale_in, on_in,  n_in, m_in));
	// vec3 fbm_z = vec3(func( uvs_fbm.xy, scale_in, on_in,  n_in, m_in));
	// vec3 Tri_FBM = fbm_x * triblend.x + fbm_y * triblend.y + fbm_z  * triblend.z;	
	float Perlin3D = cnoise((wpos.xyz+noise_pos1)*noise_scale1);

	
	
	float atlasIndex_fbm = floor(Perlin3D * 15.0)+2.0;
	//WOW wired
	float atlasIndex = floor(material_index+0.1);
	//vec2 index_uv = vec2(mod(atlasIndex, 4.0)/4.0,floor(atlasIndex/4.0)/4.0)+0.125;
    vec2 index_uv_x = Atlas_texCoords(uvs.zy, atlasIndex);
	vec2 index_uv_y = Atlas_texCoords(uvs.xz, atlasIndex);
	vec2 index_uv_z = Atlas_texCoords(uvs.xy, atlasIndex);

	float MIP = 0.0;
	float uv_segment = 1.0 / 4.0;
	float uv_edge = 0.001;
	if(index_uv_x.x > uv_segment - uv_edge || index_uv_x.x < uv_segment - (uv_segment - uv_edge) || index_uv_x.y > uv_segment - uv_edge || index_uv_x.y < uv_segment - (uv_segment - uv_edge) ){
		MIP = -5.0;
	}
	if(index_uv_y.x > uv_segment - uv_edge || index_uv_y.x < uv_segment - (uv_segment - uv_edge) || index_uv_y.y > uv_segment - uv_edge || index_uv_y.y < uv_segment - (uv_segment - uv_edge) ){
		MIP = -5.0;
	}
	if(index_uv_z.x > uv_segment - uv_edge || index_uv_z.x < uv_segment - (uv_segment - uv_edge) || index_uv_z.y > uv_segment - uv_edge || index_uv_z.y < uv_segment - (uv_segment - uv_edge) ){
		MIP = -5.0;
	}
	
	//float MIP = GetMipLevel(index_uv_x, vec2(512.0), 5.0 );
	vec4 xaxis = texture2D(Atlas2, index_uv_x, MIP).rgba ;
	vec4 yaxis = texture2D(Atlas2, index_uv_y, MIP).rgba ;
    vec4 zaxis = texture2D(Atlas2, index_uv_z, MIP).rgba ;
    vec4 Tri_Normal = xaxis * triblend.x + yaxis * triblend.y + zaxis * triblend.z;
	vec3 Decoded_Tri_Normal = decode(vec4(Tri_Normal.gb,1.0,1.0));


	xaxis = texture2D(Atlas1, index_uv_x, MIP).rgba;  
	yaxis = texture2D(Atlas1, index_uv_y, MIP).rgba;
    zaxis = texture2D(Atlas1, index_uv_z, MIP).rgba;
    vec4 Tri_Albedo = xaxis * triblend.x + yaxis * triblend.y + zaxis * triblend.z;
	Tri_Albedo.rgb = ToLinear(Tri_Albedo.rgb);
	
	albedo = Tri_Albedo.rgb;
	normals = decode(vec4(Tri_Normal.gb,1.0,1.0));
	roughness_atlas = Tri_Normal.a;
	height_atlas = Tri_Normal.r;
	metalic_atlas = Tri_Albedo.a;
}
else{	//use the texture coordinates of the mesh
	vec4 atlastex2 = texture2D(Atlas2, texcoord).rgba ;
	vec4 atlastex1 = texture2D(Atlas1, texcoord).rgba ;
	albedo = ToLinear(atlastex1.rgb);
	normals = decode(vec4(atlastex2.gb,1.0,1.0));
	roughness_atlas = atlastex2.a;
	height_atlas = atlastex2.r;
	metalic_atlas = atlastex1.a;
}	

	metalic_atlas = max(fresnel_factor, metalic_atlas);

    // Compute the half-way vector 
    vec3 view = normalize(wview);
    vec3 hW   = normalize(view + light);

	vec3 normal = perturbNormal2Arb( wview, wnormal, normals.rgb );
	
	vec3 env_dif = textureCube(EnvironmentMap, normal).rgb;
	vec3 env_spec = textureCube(EnvironmentMap, eyevector).rgb;
	
	vec3 color =   PBR_Shading(normal, normalize(light), view, metalic_atlas, hW, roughness_atlas, albedo.rgb, env_dif, env_spec );
	
	color *= pow(2.0, exposure);

    // Convert to sRGB for display
    color = ToSRGB(color);
	
    gl_FragColor = vec4(color , 1);
}