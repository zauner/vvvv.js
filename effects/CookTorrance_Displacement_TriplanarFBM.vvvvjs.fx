
vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec3 NormO : NORMAL;

uniform mat4 Texture_Transform;
uniform mat4 Texture_Transform_col;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;

uniform sampler2D Texture;
uniform float deformAmount;
uniform float vertexCount;

varying vec3 LightDirV;
varying vec3 NormV;
varying vec3 NormW;
varying vec4 PosWVP;
varying vec3 vPos;
varying vec3 vNorm;
varying vec3 ViewDirV;
varying vec2 vs2psTexCd;
varying vec2 vs2psTexCd_col;
varying vec2 TexCd_pos_tri_xz;
varying vec2 TexCd_pos_tri_xy;
varying vec2 TexCd_pos_tri_yz;

varying vec3 tangent;
varying vec3 binormal;

vec3 deform(vec3 p, float a) {
  vec3 res = p;
  res.z -= a;
  return res;
}


void main(void) {

  
float p_min=-0.6;
float p_max=0.6;
float t_min=0.0;
float t_max=1.0;

  mat4 tWV = tV * tW;
  mat4 tWVP = tP * tWV;
  
  float delta = 1.0/vertexCount;
  
  vec2 TexCd2 = (Texture_Transform * vec4(TexCd-.5, 0, 1)).xy;
  TexCd2 += .5;

  vec2 TexCd3 = (Texture_Transform_col * vec4(TexCd-.5, 0, 1)).xy;
  TexCd3 += .5;
  
  vec4 texCol = texture2D(Texture, TexCd2);
  vec3 PosDisplace = deform(PosO, texCol.r*deformAmount);

  float TexCd_right = TexCd2.x+delta;
  if (TexCd_right > 1.0) {
  TexCd_right = 1.0;
  };
  float TexCd_bottom = TexCd2.y+delta;
  if (TexCd_bottom > 1.0) {
  TexCd_bottom = 1.0;
  };
  float TexCd_left = TexCd2.x-delta;
  if (TexCd_left > 1.0) {
  TexCd_left = 1.0;
  };
  float TexCd_top = TexCd2.y-delta;
  if (TexCd_top > 1.0) {
  TexCd_top = 1.0;
  };
  
  vec4 texCol_right = texture2D(Texture, vec2(clamp(TexCd2.x+delta, t_min,t_max), TexCd2.y));
  vec3 p_right = deform(vec3(clamp(PosO.x+delta, -1.0,1.0), PosO.yz), texCol_right.r*deformAmount);
  
  vec4 texCol_bottom = texture2D(Texture, vec2(TexCd2.x, clamp(TexCd2.y+delta, t_min,t_max)));
  vec3 p_bottom = deform(vec3(PosO.x, clamp(PosO.y-delta, p_min,p_max), PosO.z), texCol_right.r*deformAmount);
  
  vec4 texCol_left = texture2D(Texture, vec2(clamp(TexCd2.x-delta, t_min,t_max), TexCd2.y));
  vec3 p_left = deform(vec3(clamp(PosO.x-delta, p_min,p_max), PosO.yz), texCol_left.r*deformAmount);
  
  vec4 texCol_top = texture2D(Texture, vec2(TexCd2.x, clamp(TexCd2.y-delta, t_min,t_max)));
  vec3 p_top = deform(vec3(PosO.x, clamp(PosO.y+delta, p_min,p_max), PosO.z), texCol_top.r*deformAmount);
  
  // calculate positions of neighbouring vertices, and get an average/smooth normal
  vec3 n1 = normalize(cross(p_right-PosDisplace, p_bottom-PosDisplace));
  vec3 n2 = normalize(cross(p_left-PosDisplace, p_top-PosDisplace));
  vec3 n3 = normalize(cross(p_bottom-PosDisplace, p_left-PosDisplace));
  vec3 n4 = normalize(cross(p_top-PosDisplace, p_right-PosDisplace));
  vec3 n = (n1+n2+n3+n4)/4.0;

  NormV = normalize(tWV * vec4(n, 0)).xyz;
  NormW = normalize(tW * vec4(n, 0)).xyz;
  
  //tangents and binormals approximation
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
  
  //Output
  vec3 vPos = PosDisplace.xyz;
  vec3 vNorm = n.xyz;
  vec4 PosV = tWV * vec4(PosDisplace, 1);
  ViewDirV = normalize(-PosV).xyz;
  vec4 PosWVP = (tWVP * vec4(PosDisplace, 1.0));
  vec4 PosW = tW*vec4(PosDisplace, 1);
  TexCd_pos_tri_xz = 0.01*PosW.xz;
  TexCd_pos_tri_xy = 0.01*PosW.xy;
  TexCd_pos_tri_yz = 0.01*PosW.yz;
  vs2psTexCd = TexCd2;
  vs2psTexCd_col = TexCd3;
  
  gl_Position = PosWVP;
  
}


fragment_shader:

#ifdef GL_ES
precision highp float;
#endif



/*******************************************************************************
METHODS 
*******************************************************************************/

    #extension GL_OES_standard_derivatives:enable

	float posx1;
	float posy1;
	float posx2;
	float posy2;
	
vec3 getTriPlanarBlend(vec3 _wNorm){
    // in wNorm is the world-space normal of the fragment
    vec3 blending = abs( _wNorm );
    blending = normalize(max(blending, 0.00001)); // Force weights to sum to 1.0
    float b = (blending.x + blending.y + blending.z);
    blending /= vec3(b, b, b);
    return blending;
}

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
    o.x = fbm4( vec2(on_in.x*q +vec2(posx1, posy1) ) );  //4
    o.y = fbm4( vec2(on_in.y*q) +vec2(posx2, posy2)  );  //2

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

vec3 FBMcol(vec2 p, float scale_in, vec2 on_in, vec2 n_in, vec2 m_in, vec4 c1,vec4 c2)
{
	vec2 q = p;

    vec4 on = vec4(0.0);
    //float f = func(q, on);
	float f = func(q, scale_in, on_in, n_in, m_in);

	vec3 col = vec3(0.0);
    col = mix( c1.rgb, c2.rgb, f );
    col = mix( col, vec3(0.9,0.9,0.9), dot(on.zw,on.zw) );
	col = mix( col, vec3(0.2,0.1,0.3), dot(on.zw,on.zw) );
    col = mix( col, vec3(0.4,0.3,0.3), 0.5*on.y*on.y );
    col = mix( col, vec3(0.0,0.2,0.4), 0.5*smoothstep(1.2,1.3,abs(on.z)+abs(on.w)) );
    col = clamp( col*f*2.0, 0.0, 1.0 );
    
	vec3 nor = normalize( vec3( dFdx(f), 6.0, dFdy(f) ) );

     //vec3 lig = normalize( vec3( 0.9, -0.2, -0.4 ) );
     //float dif = clamp( 0.3+0.7*dot( nor, lig ), 0.0, 1.0 );
    // vec3 bdrf;
    // bdrf  = vec3(0.15,0.10,0.05)*(nor.y*0.5+0.5);
    // bdrf += vec3(0.15,0.10,0.05)*dif;
    // col *= 0.5*bdrf;
	col = col;
	return  col; //1.1*col*col;
}
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
// float diffuseEnergyRatio(float f0, vec3 n, vec3 l){
	// return 1.0 - fresnel(f0, n, l);
// }
//None
// float diffuseEnergyRatio(float f0, vec3 n, vec3 l){
	// return 1.0;
// }
//Fresnel0
float diffuseEnergyRatio(float f0, vec3 n, vec3 l){
	return 1.0 - f0;
}

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


vec3 getNormal( vec3 vPosition, float depthIn, vec3 vNormal ) {
  // Differentiate the position vector
  vec3 dPositiondx = dFdx(vPosition);
  vec3 dPositiondy = dFdy(vPosition);
  //float depth = texture2D(uCarveTexture, vUv).a;
  float dDepthdx = dFdx(depthIn);
  float dDepthdy = dFdy(depthIn);
  dPositiondx -= 1.0 * dDepthdx ;
  dPositiondy -= 10.0 * dDepthdy ;

  // The normal is the cross product of the differentials
  return normalize(cross(dPositiondx, dPositiondy));
}

vec3 TriplanarNormalMapping(sampler2D tex1, sampler2D tex2, sampler2D tex3, vec3 NormalIn, vec2 TexCoordXY, vec2 TexCoordXZ, vec2 TexCoordZY, float scale, float bumpIntensity)
{
    float tighten = 0.3679;
 
    float mXY = clamp(abs(NormalIn.z) - tighten,0.0,1.0);
    float mXZ = clamp(abs(NormalIn.y) - tighten,0.0,1.0);
    float mYZ = clamp(abs(NormalIn.x) - tighten,0.0,1.0);
 
    float total = mXY + mXZ + mYZ;
    mXY /= total;
    mXZ /= total;
    mYZ /= total;
 
    vec3 cXY = texture2D(tex1, TexCoordXY.xy / scale).xyz;
    vec3 cXZ = texture2D(tex2, TexCoordXZ.xy / scale).xyz;
    vec3 cYZ = texture2D(tex3, TexCoordZY.xy / scale).xyz;
 
    // // Convert texture lookups to the [-1, 1] range
    cXY = 2.0 * cXY - 1.0;
    cYZ = 2.0 * cYZ - 1.0;
 
    vec3 normal = cXY * mXY + cXZ * mXZ + cYZ * mYZ;
    normal.xy *= bumpIntensity;
	//vec3 normal = vec3(0.0,0.0,0.0);
    return normal;
}

varying vec3 NormV;
varying vec3 NormW;
varying vec4 PosWVP;
varying vec3 ViewDirV;
varying vec2 vs2psTexCd_col;
varying vec2 TexCd_pos_tri_xz;
varying vec2 TexCd_pos_tri_xy;
varying vec2 TexCd_pos_tri_yz;
varying vec3 tangent;
varying vec3 binormal;
varying vec3 vPos;
varying vec3 vNorm;


uniform sampler2D tNormal1;
uniform sampler2D tNormal2;
uniform sampler2D tNormal3;

uniform float u_fresnel0 = 0.1;
uniform float u_roughness = 0.34;
uniform vec4 u_diffuseColor : COLOR = {0.85, 0.85, 0.85, 1.0};
uniform vec4 u_lightColor : COLOR = {0.15, 0.15, 0.15, 1.0};
uniform vec3 u_lightDir;
uniform float NormalScale = 0.2;
uniform float BumpFactor = 0.5;
uniform float scale_in; 
uniform vec2 on_in;
uniform vec2 n_in;
uniform vec2 m_in;
uniform vec4 col1 : COLOR = {0.90, 0.10, 0.10, 1.0};
uniform vec4 col2 : COLOR = {0.10, 0.90, 0.10, 1.0};

uniform float scale_in2; 
uniform vec2 on_in2;
uniform vec2 n_in2;
uniform vec2 m_in2;
uniform vec4 col1_2 : COLOR = {0.90, 0.10, 0.10, 1.0};
uniform vec4 col2_2 : COLOR = {0.10, 0.90, 0.10, 1.0};

//float scale_in, vec2 on_in, vec2 n_in, vec2 m_in, out vec4 ron


void main(void) {
	///FBM COLOR TEX Triplanar Mapping
	//vec2 p_up = TexCd_pos_tri_xz;

	
	vec3 fbm = FBMcol( TexCd_pos_tri_xz, scale_in, on_in, n_in, m_in, col1, col2 );
	vec3 fbm_left = FBMcol( TexCd_pos_tri_xy, scale_in2, on_in2, n_in2, m_in2, col1_2, col2_2 );
	vec3 fbm_right = FBMcol( TexCd_pos_tri_yz, scale_in2, on_in2, n_in2, m_in2, col1_2, col2_2 );
	
	vec3 tpweights = abs(NormW);
	tpweights = (tpweights - 0.5) * 7.0;
	tpweights = max(tpweights, vec3(0.0));
	tpweights /= tpweights.x + tpweights.y+ tpweights.z;
	
	//vec3 blending = getTriPlanarBlend(NormW);
    vec3 xaxis = fbm;
    vec3 yaxis = fbm_right;
    vec3 zaxis = fbm_left;
    vec3 ColorTex = xaxis * tpweights.x + xaxis * tpweights.y + zaxis * tpweights.z;

	
	vec3 NormalMap2 = TriplanarNormalMapping(tNormal1, tNormal2, tNormal3, NormW, TexCd_pos_tri_xy, TexCd_pos_tri_xz, TexCd_pos_tri_yz, NormalScale, BumpFactor);
	
	//generate normal map from FBM
	// float depth = normalTex.x+normalTex.y+normalTex.z;//func(TexCd_pos_tri_xz, scale_in, on_in, n_in, m_in);
	//vec3 normalMap = abs(getNormal(vec3(TexCd_pos_tri_xz,0.0), fbm.y, NormV.xyz));
	 // vec3 DepthNormal = vec3(0.0,0.0,0.0);
	 // DepthNormal.x = dFdx(depth);
	 // DepthNormal.y = dFdy(depth);
	 // DepthNormal.z = sqrt(1.0 - DepthNormal.x*DepthNormal.x - DepthNormal.y * DepthNormal.y); // Reconstruct z component to get a unit normal.


	// sample normal map, update normal vector
	
	//vec3 normalBlended = normalize(vec3(normalTexture.xy + DepthNormal.xy, normalTexture.z));
	vec3 nBinormalVector = binormal;
	vec3 nTangentVector = tangent;
	vec3 nN = normalize(NormV + nBinormalVector + nTangentVector);
	vec3 nNormalVector = normalize(NormalMap2 * nN);
	
	//Cook Torrance Lighting
    
	float PI = 3.14159265359;
	vec3 LightCol = u_lightColor.xyz/PI;
	vec3 DifCol = u_diffuseColor.xyz*PI;
	
	vec3 normal =  nNormalVector; //applyNormals
	vec3 viewC   = ViewDirV;
	vec3 halfVec=  normalize(u_lightDir + viewC);
	float NdotL= dot(normal, u_lightDir);
	float NdotV= dot(normal, viewC);
	float NdotL_clamped= clamp(NdotL, 0.001, 1.0);
	float NdotV_clamped= clamp(NdotV, 0.001, 1.0);
	
	vec3 color_spec = vec3(0.0);
	
	if (NdotL > 0.001 && NdotV > 0.001) {
	 float brdf_spec= fresnel(u_fresnel0, halfVec, u_lightDir) * geometry(normal, halfVec, viewC, u_lightDir, u_roughness) * distribution(normal, halfVec, u_roughness) / (4.0 * NdotL_clamped * NdotV_clamped);
	 color_spec= NdotL_clamped * brdf_spec * LightCol;
	};

	
	vec3 color_diff= NdotL_clamped * diffuseEnergyRatio(u_fresnel0, normal, u_lightDir) * DifCol * LightCol;
	gl_FragColor = vec4(  color_diff * ColorTex + color_spec , 1.0);
    
	//gl_FragColor = vec4(normalTex, 1.0) ;
	//gl_FragColor.a *= Alpha;
}