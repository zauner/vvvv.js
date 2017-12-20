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
uniform float index = 0.0;

varying vec2 texcoord;
varying vec3 wpos;
varying vec3 wview;
varying vec3 wnormal;
varying vec3 wtangent;
varying vec3 wbitangent;
varying vec3 atlas_index;

void main(void) {
	
	mat4 tWV = tV * tW;
    mat4 tWVP = tP * tWV;

	vec3 NormW = normalize(tW * vec4(NormO, 0)).xyz;
	
	vec4 PosV = tWV * vec4(PosO, 1);
	vec4 PosWVP = (tWVP * vec4(PosO, 1.0));
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
	//texcoord = (Texture_Transform * vec4(TexCd, 0, 1)).xy;
	texcoord = (Texture_Transform * vec4(TexCd, 0, 1)).xy +vec2(mod(atlas_index, 4.0)/4.0,floor(atlas_index/4.0)/4.0);
	wpos = vec3(tW*vec4(PosO, 1)).xyz;
	wview = normalize( wpos.xyz - cameraPosition );//normalize(-PosV).xyz;
	wnormal = NormW;
	wtangent = tangent;
	wbitangent = binormal;
	light = PosW.xyz - LightPos;
	
	gl_Position = PosWVP;
}	

fragment_shader:

//http://blog.selfshadow.com/sandbox/specaa.html

#extension GL_OES_standard_derivatives : enable
// bind do_saa      {label:"Specular AA",  default:false}
// bind do_ggx      {label:"GGX (Disabled: Beckmann)",  default:false}
// bind do_nm       {label:"Normal map",  default:false}
// bind do_deferred {label:"Deferred shading",  default:false}
// bind roughnessUI {label:"Roughness",  default:0.1, min:0, max:1, step:0.01}
// bind cdiff       {label:"Diffuse Colour",  r:0.80, g:0.03, b:0.00}
// bind cspec       {label:"Specular Colour", r:0.23, g:0.23, b:0.23}
// bind exposure    {label:"Exposure (EVs)", default:-5, min:-5, max:0}

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

uniform sampler2D normal_map;

uniform bool do_saa;
uniform bool do_ggx;
uniform bool do_nm;
uniform bool do_deferred;

uniform float roughnessUI;

uniform vec3 cdiff;
uniform vec3 cspec;

uniform float exposure;

uniform float TextureScale = 1.0;

uniform float NormalScale = 0.1;

uniform float fresnel_factor = 0.27;

// Helper functions
///////////////////
const float M_PI = 3.14159265359;

float saturate(float v) { return clamp(v, 0.0, 1.0); }
vec3  saturate(vec3 v)  { return vec3(saturate(v.x), saturate(v.y), saturate(v.z)); }
vec3 pow3(vec3 v, float p) { return vec3(pow(v.x, p), pow(v.y, p), pow(v.z, p)); }

const float gamma = 2.2;

vec3 ToLinear(vec3 v) { return pow3(v,     gamma); }
vec3 ToSRGB(vec3 v)   { return pow3(v, 1.0/gamma); }

// Shading functions
////////////////////

float GGX(vec3 h, vec2 rgns)
{
    rgns = max(vec2(1e-3), rgns);
    float NoH2 = h.z * h.z;
    vec2 Hproj = vec2(h);
    float exponent = dot(Hproj / (rgns*rgns), Hproj);
    float root = NoH2 + exponent;
    return 1.0 / (M_PI * rgns.x * rgns.y * root * root);
}

float Beckmann(vec3 h, vec2 rgns)
{
    rgns = max(vec2(1e-3), rgns);
    float NoH2 = h.z * h.z;
    vec2 Hproj = vec2(h);
    float exponent = dot(Hproj / (rgns*rgns), Hproj) / NoH2;
    return exp(-exponent) / (M_PI * rgns.x * rgns.y * NoH2 * NoH2);
}

vec3 doShading(vec3 h, vec3 n, vec3 l, vec2 roughness)
{
    // Linearise material properties
    vec3 cd = ToLinear(cdiff);
    vec3 cs = ToLinear(cspec);

    // Combine diffuse and specular lighting
    float diff = saturate(dot(n, l));
    float spec;
    if (do_ggx)
        spec = GGX(h, roughness);
    else
        spec = Beckmann(h, roughness);
    vec3 color = cd*diff + cs*spec;
    
    // Exposure to avoid clamping => aliasing
    color *= pow(2.0, exposure);

    // Convert to sRGB for display
    return ToSRGB(color);
}

// Specular antialiasing
////////////////////////

vec2 computeFilterRegion(vec3 h)
{
    // Compute half-vector derivatives
    vec2 hpp   = h.xy/h.z;
    vec2 hppDx = dFdx(hpp);
    vec2 hppDy = dFdy(hpp);

    // Compute filtering region
    vec2 rectFp = (abs(hppDx) + abs(hppDy)) * 0.5;

    // For grazing angles where the first-order footprint goes to very high values
    // Usually you don’t need such high values and the maximum value of 1.0 or even 0.1
    // is enough for filtering.
    return min(vec2(0.3), rectFp);
}

// Self-contained roughness filtering function, to be used in forward shading
void filterRoughness(vec3 h, inout vec2 roughness)
{
    vec2 rectFp = computeFilterRegion(h);

    // Covariance matrix of pixel filter's Gaussian (remapped in roughness units)
    // Need to x2 because roughness = sqrt(2) * pixel_sigma_hpp
    vec2 covMx = rectFp * rectFp * 2.0;

    roughness = sqrt(roughness*roughness + covMx); // Beckmann proxy convolution for GGX
}

// Self-contained roughness filtering function, to be used in the G-Buffer
// generation pass with deferred shading
void filterRoughnessDeferred(vec3 n, mat3 t2w, inout vec2 roughness)
{
    // Estimate the approximate half vector w/o knowing the light position
    vec3 approxHW = n;
    vec2 pixelPos = vec2(gl_FragCoord);
    approxHW -= dFdx(approxHW) * (mod(pixelPos.x, 2.0) - 0.5);
    approxHW -= dFdy(approxHW) * (mod(pixelPos.y, 2.0) - 0.5);

    // Transform to the local space
    vec3 approxH = normalize(approxHW*t2w);

    // Do the regular filtering
    filterRoughness(approxH, roughness);
}


// Project the surface gradient (dhdx, dhdy) onto the surface (n, dpdx, dpdy)
vec3 CalculateSurfaceGradient(vec3 n, vec3 dpdx, vec3 dpdy, float dhdx, float dhdy)
{
    vec3 r1 = cross(dpdy, n);
    vec3 r2 = cross(n, dpdx);
 
    return (r1 * dhdx + r2 * dhdy) / dot(dpdx, r1);
}
 
// Move the normal away from the surface normal in the opposite surface gradient direction
vec3 PerturbNormal(vec3 normal, vec3 dpdx, vec3 dpdy, float dhdx, float dhdy)
{
    return normalize(normal - CalculateSurfaceGradient(normal, dpdx, dpdy, dhdx, dhdy));
}

float ApplyChainRule(float dhdu, float dhdv, float dud_, float dvd_)
{
    return dhdu * dud_ + dhdv * dvd_;
}

// Calculate the surface normal using screen-space partial derivatives of the height field
vec3 CalculateSurfaceNormal(vec3 position, vec3 normal, float height)
{
    vec3 dpdx = dFdx(position);
    vec3 dpdy = dFdy(position);
 
    float dhdx = dFdx(height);
    float dhdy = dFdy(height);
 
    return PerturbNormal(normal, dpdx, dpdy, dhdx, dhdy);
}

//The PartialDerivative Normal Map Implementation from Three.JS 
vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( texcoord );
		vec2 dSTdy = dFdy( texcoord );
		float Hll = NormalScale * texture2D( normal_map, texcoord ).x;
		float dBx = NormalScale * texture2D( normal_map, texcoord + dSTdx ).x - Hll;
		float dBy = NormalScale * texture2D( normal_map, texcoord + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy ) {
		vec3 vSigmaX = vec3( dFdx( surf_pos.x ), dFdx( surf_pos.y ), dFdx( surf_pos.z ) );
		vec3 vSigmaY = vec3( dFdy( surf_pos.x ), dFdy( surf_pos.y ), dFdy( surf_pos.z ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 );
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}

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
 
vec3 PBR_Shading(vec3 normal, vec3 light_dir, vec3 view_dir, float fresnel_value, vec3 halfVec, float roughness )
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
	
	vec3 color_diff= vec3(NdotL_clamped * diffuseEnergyRatio(fresnel_value, normal, light_dir))  ; //*DifCol * LightCol * env_dif.rgb
	
	return color_diff + color_spec;
}

// Main shader
///////////////////

void main()
{
	
	//inverseTransformDirection( normal, viewMatrix );
	//vec3 triblend = wnormal*wnormal;
	vec3 abs_normal = abs(wnormal.xyz);
	vec3 triblend = vec3(pow(abs_normal.x, 4.0), pow(abs_normal.y, 4.0), pow(abs_normal.z, 4.0) );
	triblend /= max(dot(triblend, vec3(1,1,1)), 0.0001);
	
	
   //triblend= triblend / (triblend.x + triblend.y + triblend.z);
	
	 // calculate triplanar blend
                //vec3 triblend = pow(abs(wnormal), 4.0);
                //triblend /= max(dot(triblend, half3(1,1,1)), 0.0001);
	
	vec3 uvs = TextureScale * wpos;
	
		//This is an ugly way to do basically //wnormal < 0 ? -1 : 1; 
	vec3 axisSign = vec3(1.0,1.0,1.0);                      
	if (wnormal.x<0.0)
	{ 
	axisSign.x = -1.0; 
	} 
		if (wnormal.y<0.0)
	{ 
	axisSign.y = -1.0; 
	} 
		if (wnormal.z<0.0)
	{ 
	axisSign.z = -1.0; 
	} 
	
	
	vec3 xaxis = texture2D(normal_map, uvs.zy).xyz *2.0-1.0;
	vec3 yaxis = texture2D(normal_map, uvs.xz).xyz *2.0-1.0;
    vec3 zaxis = texture2D(normal_map, uvs.xy).xyz *2.0-1.0;
    vec3 ColorTex = xaxis * triblend.x + yaxis * triblend.y + zaxis * triblend.z;
	
	vec3 Derivative_Normal =CalculateSurfaceNormal(wnormal ,wpos , NormalScale*ColorTex.x );
	
    // Generate tangent frame
    vec3 n = normalize(Derivative_Normal);
    vec3 b = normalize(wbitangent - n*dot(wbitangent, n));
    vec3 t = normalize(cross(b, n));
    mat3 t2w = mat3(t, b, n);
    
    // Do normal mapping
    if (do_nm)
    {
        // Orthogonalise tangent frame
        n = normalize(t2w*Derivative_Normal);
        b = normalize(b - n*dot(b, n));
        t = normalize(cross(b, n));
        t2w = mat3(t, b, n);
    }

    // Compute the half-way vector 
    vec3 view = normalize(wview);
    vec3 hW   = normalize(view + light);
    vec3 h    = normalize(hW*t2w);

    // Convert roughness from the UI representation (^2)
    vec2 roughness = vec2(roughnessUI*roughnessUI);

    // Actual SAA: filter roughness
    if (do_saa)
    {
        if (do_deferred)
            filterRoughnessDeferred(n, t2w, roughness);
        else
            filterRoughness(h, roughness);
    }

	//vec3 normal = perturbNormalArb( view, wnormal, dHdxy_fwd() );
	vec3 normal = perturbNormal2Arb( wview, wnormal, ColorTex );
	
    // Do regular shading and output 
    //vec3 color = doShading(h, Derivative_Normal, light, roughness);	
	
	vec3 color = PBR_Shading(normal, normalize(light), view, fresnel_factor, hW, roughnessUI );
	

    gl_FragColor = vec4(color, 1);
}