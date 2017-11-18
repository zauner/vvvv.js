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
	Pos = PosO;
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
//light properti
uniform vec3 SpotLightPos : POSITION = {1.0, 1.0, 0.0};
uniform float PCFSize = 0.01;
uniform float SpotLightCone = 0.2;
uniform float ShadGamma = 0.35;
uniform float ShadowDensity = 0.19;
uniform float gain = 1.46;
uniform float bias = 0.0001;
////////////////////////////////////////////////////////////////////////////////
uniform mat4 LampViewXf;
uniform mat4 LampProjXf;
///////////////////////////////////////////////////////////////////////
uniform mat4 ViewInverse;
uniform mat4 ProjectionInverse;
uniform sampler2D ShadowTexture;

///////////////////////////////////////////////////////////////////////
// Utility function for pixel shaders to use this shadow map
//WebGL Shadow Function


// vec3 ShadowPos(vec4 shadowpos)
// {
  // vec3 ligthspace  = shadowpos.xyz / shadowpos.w;
    // vec2 shadowtex = 0.5 * ligthspace.xy + vec2( 0.5, 0.5 );
    // shadowtex.y = 1.0 - shadowtex.y;
    // return vec3( shadowtex, ligthspace.z - 0.005 );
// }


float texture2DCompare(sampler2D ShadowTexture, vec2 uv, float compare){
    float depth = texture2D(ShadowTexture, uv).r;
    return step(compare, depth);
}



//Eliminated for loop to quickly workaround constant array limitation, poisson disk is hardcoded
float shadow_calc(vec4 LP,  sampler2D ShadowMapTex)
{
    float totalShad=0.0;
  
  float offSize = PCFSize / 16.0;
	//interation1
		vec2 offset = vec2(offSize*vec2( 0.0, 0.0 ));
		vec2 nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		float shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;
    	//interation2
		offset = vec2(offSize* vec2( 0.0, 0.0 ));
		nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;
		//interation3
		offset = vec2(offSize* vec2( 0.0, 0.0 ));
		nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;
	//interation4
		offset = vec2(offSize* vec2( 0.0, 0.0 ));
		nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;
		//interation5
		offset = vec2(offSize* vec2( 0.0, 0.0 ));
		nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;
    	//interation6
		offset = vec2(offSize* vec2 ( 0.0, 0.0 ));
		nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;
		//interation7
		offset = vec2(offSize*  vec2 ( 0.0, 0.0 ));
		nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		 shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;
	//interation8
		offset = vec2(offSize* vec2( 0.0, 0.0 ));
		nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   
		totalShad +=shadMapDepth;

	return totalShad/16.0;
}

//original shadow code
// float shadow_calc(vec4 LP,  sampler2D ShadowMapTex)
// {
    // float totalShad=0.0;
	// int i;
	// float offSize = PCFSize / 16.0;
	// for (int i = 0; i <= 8; i++) 
	// {
		// vec2 offset = vec2(offSize*poissonDisk[i]);
		// vec2 nuv = vec2(0.5,-0.5)*(LP.xy+offset)/LP.w + vec2(0.5,0.5);
		// float shadMapDepth = texture2DCompare(ShadowMapTex, nuv, LP.z/LP.w-bias);   //ShadowMapTex.SampleCmpLevelZero(PCF_Sampler,nuv,LP.z/LP.w-bias).x;
		
		//float shad = 1.0-(shadMapDepth<LP.z);
		//totalShad += shad;
		// totalShad +=shadMapDepth;
	// }
	// return totalShad/16.0;
// }


/////////////////////////////////////////////////////////////////
vec4 PosV(sampler2D tex, vec2 uv)
{
	vec4 p = vec4(0.0,0.0,0.0,1.0);

		p = vec4(-1.0+2.0*uv.x,-1.0+2.0*uv.y,-1.0+2.0*texture2D(tex,uv).x,1.0);
		p.y *= -1.0;
		p = p * ProjectionInverse;
		p = vec4(p.xyz*2.0/p.w,1.0);
	return p;
}
//vec4 PosW(sampler2D tex,vec2 uv)
//{
//	return PosV(DepthTexture,uv) * ViewInverse;
//}
////////////////////////////////////////////////////////////////////

void main(void)
{
  vec4 col = texture2D(InputTexture,uv);
 float depth = texture2D(DepthTexture, uv).r;
	float shadmap = texture2D(ShadowTexture, uv).r; //get the depth from the light
	vec4 d= PosV(DepthTexture,uv) * ViewInverse; //Get the scene depth
	mat4 ShadowViewProjXf = LampViewXf * LampProjXf;    // light viewprojection
    vec4 LP = d * ShadowViewProjXf;	
	float CosSpotAng = cos(SpotLightCone); //removed radians conversion, initial value was 60.0 degree. 
	
	float dl = clamp(LP.xyz,0.0,1.0).z;
    dl = max(0.0,((dl-CosSpotAng)/(1.0-CosSpotAng)));
	float shadowed = clamp(shadow_calc(LP,ShadowTexture)+ShadowDensity,0.0,1.0);
	
  	

  gl_FragColor = vec4(col.rgb*shadowed*gain *pow(dl,ShadGamma),1.0);	
  
}