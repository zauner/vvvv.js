
//author: David Gann | url: www.000.graphics | contact for support: davidgann@000.graphics
//Copyright 2017, 2018 David Gann
 // This program is free software: you can redistribute it and/or modify
    // it under the terms of the GNU General Public License as published by
    // the Free Software Foundation, either version 3 of the License, or
    // (at your option) any later version.

    // This program is distributed in the hope that it will be useful,
    // but WITHOUT ANY WARRANTY; without even the implied warranty of
    // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    // GNU General Public License for more details.

    // You should have received a copy of the GNU General Public License
    // along with this program.  If not, see <http://www.gnu.org/licenses/>.
	
	//sub licenses are marked accordingly and are excluded from this license 


vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec3 NormO : NORMAL;
attribute vec4 index : INDEX;
attribute vec4 vcol : VERTEXCOLOR;  //is used for submesh indices in case of batched instancing


uniform mat4 Texture_Transform;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;
uniform vec3 LightPos;
uniform vec3 cameraPosition;
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
varying vec4 PosWVP;

void main(void) {
	
	mat4 tWV = tV * tW;
    mat4 tWVP = tP * tWV;

	vec3 NormW = normalize(tW * vec4(NormO, 0)).xyz;
	
	float pos_index = index.x; //* floor(vcol.r*submesh_count + 0.001) for batching

	vec2 uv_worldpos = vec2(mod(pos_index, data_texture_resX)/data_texture_resX , floor(pos_index/data_texture_resX)/data_texture_resX);

	vec4 InstancePos = texture2D(InstanceWorldTex, uv_worldpos);
	InstancePos.xyz = InstancePos.xyz * 2.0 - vec3(1.0,0.0,1.0);
	vec3 Pos_Instance = PosO  + InstancePos.rgb ;
	
	vec4 PosV = tWV * vec4(Pos_Instance, 1);
	PosWVP = (tWVP * vec4(Pos_Instance, 1.0));
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
	texcoord = (Texture_Transform * vec4(TexCd, 0, 1)).xy +vec2(mod(index.y, 4.0)/4.0,floor(index.y/4.0)/4.0);
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
varying vec4 PosWVP;

uniform sampler2D Atlas1;
uniform sampler2D Atlas2;
uniform samplerCube EnvironmentMap;

uniform float roughness;

uniform float fresnel_factor = 0.27;

uniform float exposure;

uniform float TextureScale = 1.0;

uniform float NormalScale = 0.1;


uniform float TileCount = 4.0;
uniform float TilePixelSize = 256.0;
uniform float GutterPercent = 0.0;
uniform float MinLOD = 3.0;
uniform float Atlas_TexSize = 2048;
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
	
	// The MIT License

// Copyright (c) 2010-2013 three.js authors

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

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

float geometricOcclusion(float NdotL, float NdotV, float r)
{

    float attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
    float attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
    return attenuationL * attenuationV;
}

 float diffuseEnergyRatio(float f0, vec3 n, vec3 l){
	 return 1.0 - fresnel(f0, n, l);
 }
 
 vec3 rim(vec3 color, float start, float end, float coef, vec3 normal)
{
  
  vec3 eye = normalize(-PosWVP.xyz);
  float rim = smoothstep(start, end, 1.0 - dot(normal, eye));
  return clamp(rim, 0.0, 1.0) * coef * color;
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
	 float brdf_spec= fresnel(fresnel_value, halfVec, light_dir) * geometry(normal, halfVec, view_dir, light_dir, roughness) *  distribution(normal, halfVec, roughness) / (4.0 * NdotL_clamped * NdotV_clamped);   //geometry term produces artifacts
	 color_spec= vec3(NdotL_clamped * brdf_spec) * env_spec.rgb*fresnel_value; //
	//};
	
	//vec3 rim_light = rim(env_diffuse, 0.9, 0.5, 1.0, normal);
	
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


//decode normal map from Spheremap Transform compression https://aras-p.info/texts/CompactNormalStorage.html

vec3 decode (vec4 enc)
{
    vec4 nn = enc*vec4(2.0,2.0,0.0,0.0) + vec4(-1.0,-1.0,1.0,-1.0);
    float l = dot(nn.xyz,-nn.xyw);
    nn.z = l;
    nn.xy *= sqrt(l);
    return nn.xyz * 2.0 + vec3(0.0,0.0,-1.0);
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

	float atlasIndex = floor(material_index+0.1);
	//vec2 index_uv = vec2(mod(atlasIndex, 4.0)/4.0,floor(atlasIndex/4.0)/4.0)+0.125;
    vec2 index_uv_x = Atlas_texCoords(uvs.zy, atlasIndex);
	vec2 index_uv_y = Atlas_texCoords(uvs.xz, atlasIndex);
	vec2 index_uv_z = Atlas_texCoords(uvs.xy, atlasIndex);

	float MIP = 0.0;
	float uv_segment = 1.0 / 4.0;
	float uv_edge = 0.001;
	// if(index_uv_x.x > uv_segment - uv_edge || index_uv_x.x < uv_segment - (uv_segment - uv_edge) || index_uv_x.y > uv_segment - uv_edge || index_uv_x.y < uv_segment - (uv_segment - uv_edge) ){
		// MIP = -5.0;
	// }
	// if(index_uv_y.x > uv_segment - uv_edge || index_uv_y.x < uv_segment - (uv_segment - uv_edge) || index_uv_y.y > uv_segment - uv_edge || index_uv_y.y < uv_segment - (uv_segment - uv_edge) ){
		// MIP = -5.0;
	// }
	// if(index_uv_z.x > uv_segment - uv_edge || index_uv_z.x < uv_segment - (uv_segment - uv_edge) || index_uv_z.y > uv_segment - uv_edge || index_uv_z.y < uv_segment - (uv_segment - uv_edge) ){
		// MIP = -5.0;
	// }
	
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