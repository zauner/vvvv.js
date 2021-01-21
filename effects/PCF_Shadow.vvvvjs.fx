vertex_shader:


uniform mat4 tW : WORLD;
uniform mat4 tVP : VIEWPROJECTION;


attribute vec4 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;

varying vec4 Pos;
varying vec2 uv;


void main(void) {

    mat4 tWVP = tW*tVP;
    vec4 PosWVP  = PosO*tWVP;
    uv = TexCd.xy;
	Pos = PosWVP;
	gl_Position = PosWVP;
}

fragment_shader:


#ifdef GL_ES
precision highp float;
#endif

varying vec4 Pos;  
varying vec2 uv;

uniform sampler2D InputTexture;
uniform sampler2D DepthTexture;
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
uniform float debug_tex = 0.0;


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


void main(void)
{
    vec4 col = texture2D(InputTexture,uv);
    float depth = texture2D(DepthTexture, uv).r;

	//Get View Space Positions from Depth
	vec4 sPos = vec4(uv.x * 2.0 - 1.0, -1.0 * (uv.y * 2.0 - 1.0), depth * 2.0 - 1.0, 1.0);
	//Convert View Space Positions to World Space Positions
	sPos = InverseViewProjection * sPos;
	sPos.xyz /= sPos.w;
	
	// Convert World Space Positions to Light Space Positions

	vec4 lightSpacePos = LightViewProjection * vec4(sPos.xyz,1.0);
	
	
	
		//light cone
	float CosSpotAng = cos(SpotLightCone); //removed radians conversion, initial value was 60.0 degree. 
	float dl = normalize( lightSpacePos.xyz ).z;
    dl = max(0.0,((dl-CosSpotAng)/(1.0-CosSpotAng)));
		//shadow equation 
	float shadowed = clamp( shadow_calc( lightSpacePos , ShadowTexture ) + ShadowDensity , 0.0 ,1.0 );


	vec4 final_col = vec4(0.0,0.0,0.0,1.0);
	if(debug_tex < 0.5){
		
	//final_col = vec4(col.rgb *gain  *shadowed  ,1.0);	
  	final_col = vec4(col.rgb*shadowed*gain *pow(dl,ShadGamma),1.0);	
	} //preview shadow texture
	if(debug_tex >= 0.5){
	final_col = vec4(sPos.xyz,1.0);	
	}
	if(debug_tex >= 1.5){
	float shadmap = texture2D(ShadowTexture, uv).r; //get the depth from the light
	final_col = vec4(shadmap, shadmap, shadmap,1.0);	
	}

   gl_FragColor = final_col;	
  
}