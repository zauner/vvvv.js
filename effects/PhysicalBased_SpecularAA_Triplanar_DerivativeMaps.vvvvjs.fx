vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec3 NormO : NORMAL;

uniform mat4 Texture_Transform;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;
uniform vec3 LightPos;

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
	wpos = vec3(tW*vec4(PosO, 1)).xyz;
	wview = normalize(-PosV).xyz;
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

// Main shader
///////////////////

void main()
{
	
	
	//vec3 triblend = wnormal*wnormal;
	vec3 abs_normal = abs(wnormal.xyz);
	vec3 triblend = vec3(pow(abs_normal.x, 4.0), pow(abs_normal.y, 4.0), pow(abs_normal.z, 4.0) );
	triblend /= max(dot(triblend, vec3(1,1,1)), 0.0001);
	
	
   // triblend= triblend / (triblend.x + triblend.y + triblend.z);
	
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
	
	
	vec3 xaxis = texture2D(normal_map, uvs.zy).xyz;
	vec3 yaxis = texture2D(normal_map, uvs.xz).xyz ;
    vec3 zaxis = texture2D(normal_map, uvs.xy).xyz;
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

    // Do regular shading and output 
    vec3 color = doShading(h, n, light, roughness);

    gl_FragColor = vec4(color, 1);
}