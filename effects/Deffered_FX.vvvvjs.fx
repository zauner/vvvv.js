vertex_shader:


uniform mat4 tW : WORLD;
uniform mat4 tVP : VIEWPROJECTION;


attribute vec4 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;


varying vec2 uv;


void main(void) {

    mat4 tWVP = tW*tVP;
    vec4 PosWVP  = PosO*tWVP;
    uv = TexCd.xy;
	gl_Position = PosWVP;
}

fragment_shader:


#ifdef GL_ES
precision highp float;
#endif

 
varying vec2 uv;

//Shared Uniforms
uniform sampler2D InputTexture;
uniform sampler2D DepthTexture;

//PCF Shadow Uniforms
uniform sampler2D ShadowTexture;
//light properti
uniform float PCFSize = 0.01;
uniform float SpotLightCone = 0.2;
uniform float ShadGamma = 0.35;
uniform float ShadowDensity = 0.19;
uniform float gain = 1.46;
uniform float bias = 0.0001;
uniform vec2 camerarange;
uniform mat4 InverseViewProjection;
uniform mat4 LightViewProjection;
uniform float lightcone = 0.0;
uniform float shadow_clamp_distance = 50.0; 

//SSAO uniforms 
#define PI    3.14159265

uniform float width;
uniform float height;	
uniform float znear = 0.3; //Z-near
uniform float zfar = 40.0; //Z-far
uniform float radius = 3.0; //ao radius
uniform float aoclamp = 0.25; //depth clamp - reduces haloing at screen edges
uniform float noise = 1.0; //use noise instead of pattern for sample dithering
uniform float noiseamount = 0.0002; //dithering amount
uniform float diffarea = 0.4; //self-shadowing reduction
uniform float gdisplace = 0.4; //gauss bell center	
uniform float mist = 1.0; //use mist?
uniform float miststart = 0.0; //mist start
uniform float mistend = 16.0; //mist end	
uniform float onlyAO = 0.0; //use only ambient occlusion pass?
uniform float lumInfluence = 0.7; //how much luminance affects occlusion
uniform float AOfactor = 1.0; //multiply ao for artist control


//WebGL Shadow Function

float texture2DCompare(sampler2D ShadowTexture, vec2 uv, float compare){
    float depth = texture2D(ShadowTexture, uv).r;
    return step(compare, depth);
}

//Eliminated for loop to quickly workaround constant array limitation, poisson disk is hardcoded
float shadow_calc(vec4 LP,  sampler2D ShadowMapTex)
{
    float totalShad=0.0;
  
  float offSize = PCFSize / 8.0;
	//interation1
		vec2 offset = vec2(offSize*vec2( -0.94201624, -0.39906216 ));
		vec2 nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		float shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;
    	//interation2
		offset = vec2(offSize* vec2( 0.94558609, -0.76890725 ));
		nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;
		//interation3
		offset = vec2(offSize* vec2( -0.094184101, -0.92938870 ));
		nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;
	//interation4
		offset = vec2(offSize* vec2( 0.34495938, 0.29387760 ));
		nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;
		//interation5
		offset = vec2(offSize* vec2( -0.91588581, 0.45771432 ));
		nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;
    	//interation6
		offset = vec2(offSize* vec2 ( -0.81544232, -0.87912464 ));
		nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;
		//interation7
		offset = vec2(offSize*  vec2 ( -0.38277543, 0.27676845 ));
		nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		 shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;
	//interation8
		offset = vec2(offSize* vec2( 0.97484398, 0.75648379 ));
		nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;

	return totalShad/8.0;
}

//SSAO functions

vec2 rand(vec2 coord, float width, float height) //generating noise/pattern texture for dithering
{
	float noiseX = ((fract(1.0-coord.x*(width/2.0))*0.25)+(fract(coord.y*(height/2.0))*0.75))*2.0-1.0;
	float noiseY = ((fract(1.0-coord.x*(width/2.0))*0.75)+(fract(coord.y*(height/2.0))*0.25))*2.0-1.0;
	
	if (noise == 1.0)
	{
		noiseX = clamp(fract(sin(dot(coord ,vec2(12.9898,78.233))) * 43758.5453),0.0,1.0)*2.0-1.0;
		noiseY = clamp(fract(sin(dot(coord ,vec2(12.9898,78.233)*2.0)) * 43758.5453),0.0,1.0)*2.0-1.0;
	}
	return vec2(noiseX,noiseY)*noiseamount;
}

float doMist(vec2 texCoord)
{
	float zdepth = texture2D(DepthTexture, texCoord.xy).x;
	float depth = -zfar * znear / (zdepth * (zfar - znear) - zfar);
	return clamp((depth-miststart)/mistend,0.0,1.0);
}

float readDepth(in vec2 coord) 
{
	//if (gl_TexCoord[0].x<0.0||gl_TexCoord[0].y<0.0) return 1.0;
	//if (coord.x<0.0||coord.y<0.0) return 1.0;
  float linearDeapth = (2.0 * znear) / (zfar + znear - texture2D(DepthTexture, coord).x * (zfar-znear));
	return linearDeapth;
}

float compareDepths(float depth1, float depth2,float far)
{   
	float garea = 2.0; //gauss bell width    
	float diff = (depth1 - depth2)*100.0; //depth difference (0-100)
	//reduce left bell width to avoid self-shadowing 
	if (diff<gdisplace)
	{
		garea = diffarea;
	}else{
		far = 1.0;
	}
	
	float gauss = pow(2.7182,-2.0*(diff-gdisplace)*(diff-gdisplace)/(garea*garea));
	return gauss;
}   

float calAO(vec2 TexCoord,float depth,float dw, float dh)
{   
	float dd = (1.0-depth)*radius;
	
	float temp = 0.0;
	float temp2 = 0.0;
	float coordw = TexCoord.x + dw*dd;
	float coordh = TexCoord.y + dh*dd;
	float coordw2 = TexCoord.x - dw*dd;
	float coordh2 = TexCoord.y - dh*dd;
	
	vec2 coord = vec2(coordw , coordh);
	vec2 coord2 = vec2(coordw2, coordh2);
	
	float far = 0.0;
	temp = compareDepths(depth, readDepth(coord),far);
	//DEPTH EXTRAPOLATION:
	if (far > 0.0)
	{
		temp2 = compareDepths(readDepth(coord2),depth,far);
		temp += (1.0-temp)*temp2;
	}
	
	return temp;
} 


void main(void)
{
/////////////////SHADOW
    vec4 col = texture2D(InputTexture,uv);
    float depth = texture2D(DepthTexture, uv).r;

	//Get View Space Positions from Depth
	vec4 sPos = vec4(uv.x * 2.0 - 1.0, -1.0 * (uv.y * 2.0 - 1.0), depth * 2.0 - 1.0, 1.0);
	//Convert View Space Positions to World Space Positions
	sPos = InverseViewProjection * sPos;
	sPos.xyz /= sPos.w;
	
	// Convert World Space Positions to Light Space Positions

	vec4 lightSpacePos = LightViewProjection * vec4(sPos.xyz * vec3(1.0,1.0,1.0),1.0);
	
	
	
		//light cone
	float CosSpotAng = cos(SpotLightCone); //removed radians conversion, initial value was 60.0 degree. 
	float dl = normalize( lightSpacePos.xyz ).z;
    dl = max(0.0,((dl-CosSpotAng)/(1.0-CosSpotAng)));
		//shadow equation 
	float shadowed = clamp( shadow_calc( lightSpacePos , ShadowTexture ) + ShadowDensity , 0.0 ,1.0 );
    if(abs(sPos.x) > shadow_clamp_distance || abs(sPos.y) > shadow_clamp_distance || abs(sPos.z) > shadow_clamp_distance ){
		 shadowed = 1.0;
	}

	vec4 final_col = vec4(0.0,0.0,0.0,1.0);
	if(lightcone < 0.5){
  	final_col = vec4(col.rgb*shadowed*gain *pow(dl,ShadGamma),1.0);	
	} //preview shadow texture
	if(lightcone >= 0.5){
	final_col = vec4(col.rgb*shadowed*gain ,1.0);	
	}
	// if(debug_tex >= 1.5){
	// float shadmap = texture2D(ShadowTexture, uv).r; //get the depth from the light
	// final_col = vec4(shadmap, shadmap, shadmap,1.0);	
	// }

///////////////////SSAO
vec2 noise = rand(uv.xy, width, height); 
	float depth_linear = readDepth(uv.xy);
	
	float w = (1.0 / width)/clamp(depth_linear,aoclamp,1.0)+(noise.x*(1.0-noise.x));
	float h = (1.0 / height)/clamp(depth_linear,aoclamp,1.0)+(noise.y*(1.0-noise.y));
	
	float pw;
	float ph;
	
	float ao;
	
	float dl_ssao = PI*(3.0-sqrt(5.0));
	float dz = 1.0/float(16);
	float l = 0.0;
	float z = 1.0 - dz/2.0;
	
	for (int i = 0; i <= 16; i ++)
	{     
		float r = sqrt(1.0-z*z);
		
		pw = cos(l)*r;
		ph = sin(l)*r;
		ao += calAO(uv.xy,depth_linear,pw*w,ph*h);        
		z = z - dz;
		l = l + dl_ssao;
	}
	
	ao /= float(16);  //samples = 16 fixed
	ao = 1.0-ao;
	//ao *= AOfactor;	//hacky artist control
	ao = pow(clamp(ao,0.0,1.0),AOfactor);
	
	if (mist == 1.0)
	{
		ao = mix(ao, 1.0,doMist(uv.xy));
	}
	
	vec3 color =  col.rgb;
	
	vec3 lumcoeff = vec3(0.299,0.587,0.114);
	float lum = dot(color.rgb, lumcoeff);
	vec3 luminance = vec3(lum, lum, lum);
	
	vec3 final = vec3(final_col.rgb *mix(vec3(ao, ao, ao),vec3(1.0, 1.0, 1.0),luminance*lumInfluence));//mix(color*ao, white, luminance)
	
	if (onlyAO == 1.0)
	{
		final = vec3(mix(vec3(ao, ao, ao),vec3(1.0, 1.0, 1.0),luminance*lumInfluence)); //ambient occlusion only
	}	
	
	
	
   gl_FragColor = vec4(final.r,final.g,final.b,1.0);	
  
}