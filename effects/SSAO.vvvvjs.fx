vertex_shader:


uniform mat4 tW : WORLD;
uniform mat4 tVP : VIEWPROJECTION;
uniform vec4 cAmb : COLOR = {0.15, 0.15, 0.15, 1.0};


attribute vec4 PosO : POSITION;
attribute vec4 TexCd : TEXCOORD0;

//varying vec4 PosWVP;
varying vec4 TexCd_ps;


void main(void) {

    mat4 tWVP = tW*tVP;
    vec4 PosWVP  = PosO*tWVP;
    TexCd_ps = TexCd;
	gl_Position = PosWVP;
}

fragment_shader:

#ifdef GL_ES
precision highp float;
#endif

#define PI    3.14159265

uniform float width;
uniform float height;
  
	//------------------------------------------
	//general stuff
	
	//make sure that these two values are the same for your camera, otherwise distances will be wrong.
	
uniform float znear = 0.3; //Z-near
uniform float zfar = 40.0; //Z-far
	
	//user variables
//const float samples = 16.0; //ao sample count
	
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

varying vec4 PosWVP;
varying vec4 TexCd_ps;


uniform sampler2D bgl_RenderedTexture;

uniform sampler2D bgl_DepthTexture;




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
	float zdepth = texture2D(bgl_DepthTexture, texCoord.xy).x;
	float depth = -zfar * znear / (zdepth * (zfar - znear) - zfar);
	return clamp((depth-miststart)/mistend,0.0,1.0);
}

float readDepth(in vec2 coord) 
{
	//if (gl_TexCoord[0].x<0.0||gl_TexCoord[0].y<0.0) return 1.0;
	//if (coord.x<0.0||coord.y<0.0) return 1.0;
  float linearDeapth = (2.0 * znear) / (zfar + znear - texture2D(bgl_DepthTexture, coord).x * (zfar-znear));
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




void main(void) {
	
	vec2 noise = rand(TexCd_ps.xy, width, height); 
	float depth = readDepth(TexCd_ps.xy);
	
	float w = (1.0 / width)/clamp(depth,aoclamp,1.0)+(noise.x*(1.0-noise.x));
	float h = (1.0 / height)/clamp(depth,aoclamp,1.0)+(noise.y*(1.0-noise.y));
	
	float pw;
	float ph;
	
	float ao;
	
	float dl = PI*(3.0-sqrt(5.0));
	float dz = 1.0/float(16);
	float l = 0.0;
	float z = 1.0 - dz/2.0;
	
	for (int i = 0; i <= 16; i ++)
	{     
		float r = sqrt(1.0-z*z);
		
		pw = cos(l)*r;
		ph = sin(l)*r;
		ao += calAO(TexCd_ps.xy,depth,pw*w,ph*h);        
		z = z - dz;
		l = l + dl;
	}
	
	ao /= float(16);  //samples = 16 fixed
	ao = 1.0-ao;
	//ao *= AOfactor;	//hacky artist control
	ao = pow(clamp(ao,0.0,1.0),AOfactor);
	
	if (mist == 1.0)
	{
		ao = mix(ao, 1.0,doMist(TexCd_ps.xy));
	}
	
	vec3 color =  texture2D(bgl_RenderedTexture, TexCd_ps.xy).rgb;
	
	vec3 lumcoeff = vec3(0.299,0.587,0.114);
	float lum = dot(color.rgb, lumcoeff);
	vec3 luminance = vec3(lum, lum, lum);
	
	vec3 final = vec3(color*mix(vec3(ao, ao, ao),vec3(1.0, 1.0, 1.0),luminance*lumInfluence));//mix(color*ao, white, luminance)
	
	if (onlyAO == 1.0)
	{
		final = vec3(mix(vec3(ao, ao, ao),vec3(1.0, 1.0, 1.0),luminance*lumInfluence)); //ambient occlusion only
	}
	

    gl_FragColor = vec4(final,1.0); 
}

