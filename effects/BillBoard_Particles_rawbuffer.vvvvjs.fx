#ifdef GL_ES
precision mediump float;
#endif

uniform mat4 Texture_Transform;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;
uniform mat4 inverseView;

uniform float Power = 25.0;
uniform sampler2D c1;
uniform sampler2D c2;
uniform sampler2D c3;
uniform sampler2D c4;

uniform float Alpha = 1.0;
uniform float Scale = 1.0;
//here we go
uniform float minTime = 1252571400.0000;
uniform float maxTime = 1529591520.0000;
uniform float y_scale = 70.7300;
uniform float radius = 8.0000;
uniform float winding_count = 0.8500;
uniform float random_spacing = 0.1200;
uniform float max_score = 500.0000;
uniform float scale_particles = 5.0000;
uniform float yoffset = 0.0000;
uniform float CurrentTime = 1466872907.4229;
uniform float segment_count_multiplier = 0.1800;
uniform float period = 300.0000;
uniform float anim = 1;
uniform float random_factor = 0.1430;
uniform float alpha_multiplier = 1.0;
uniform float scaleParticles = 0.01;
uniform float addSize = 0.1;
uniform float power = 1.0;

varying vec2 vs2psTexCd;
varying vec3 NormV;
varying vec4 PosWVP;
varying float indexOut;

float rand(vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec3 NormO : NORMAL;
attribute float PosI : POSITION1;
attribute float index : INDEX;
attribute float SegCount : COUNT;





void main(void) {


	float In_value = PosI; //timestamps
	float SegmentCount = SegCount;
	float score = min( max( index ,1.0 ),max_score)/max_score  ;
	
	float value = ((In_value -minTime) / (maxTime-minTime) -1.0) * y_scale + yoffset;

	
	
    vec3 pos = vec3(radius*cos(value*winding_count), value, radius*sin(value*winding_count));
	
	
	pos.x = pos.x +rand(vec2(value+34.1235,value+0.424))*random_factor;
	pos.y = pos.y +rand(vec2(value+39.6535,value+0.444))*random_factor;
	pos.z = pos.z +rand(vec2(value+36.1275,value+0.524))*random_factor;
	//pos = pos + vec3(rand(vec2(value+34.1235,value+0.424)),rand(vec2(value+64.394,value+10.34512)),rand(float2(value+94.124,value)))*random_factor;


	vec3 normal = normalize(vec3(0.0,pos.y,0.0) - pos.xyz );
	
	float factor = log(SegmentCount/50.0)*segment_count_multiplier;
	
	pos = pos + normal*factor*sin(value*period) + vec3(0.0,factor,0.0)* cos(value*period);
	
	vec3 posIn = pos;
	
	float indexIn = index;
	
	float scale = score * scaleParticles+addSize;

   mat4 m_offset = mat4(
        vec4( scale, 0.0, 0.0, posIn.x),
        vec4( 0.0, scale, 0.0, posIn.y),
		vec4( 0.0, 0.0, scale, posIn.z),
        vec4( 0.0, 0.0, 0.0, 1.0)
   );

  mat4 tWV = tV * tW;
  mat4 tVP = tP * tV;
  mat4 tWVP = tP * tWV;
  
  vec3 n = NormO;

  
  

  
  mat4 m_lookat4 = mat4(
		vec4( inverseView[0][0], inverseView[1][0], inverseView[2][0], 0.0),
        vec4( inverseView[0][1], inverseView[1][1], inverseView[2][1], 0.0),
		vec4( inverseView[0][2], inverseView[1][2], inverseView[2][1], 0.0),
        vec4( 0.0, 0.0, 0.0, 1.0)
  );
  
  vec4 pP = vec4(PosO, 1.0) * m_lookat4 * m_offset ;
 
  
  vec4 PosWVP = tVP * pP;
  gl_Position = PosWVP;
  indexOut = score;
  
  
  vs2psTexCd = (Texture_Transform * vec4(TexCd, 0, 1)).xy;
}

fragment_shader:

#ifdef GL_ES
precision highp float;
#endif




void main(void) {
	
	float score = indexOut;
	
	
	vec4 c1 = texture2D(c1, vs2psTexCd);
	c1.a = c1.a * alpha_multiplier;
	vec4 c2 = texture2D(c2, vs2psTexCd);
	c2.a = c2.a * alpha_multiplier;
	vec4 c3 = texture2D(c3, vs2psTexCd);
	c3.a = c3.a * alpha_multiplier;
	vec4 c4 = texture2D(c4, vs2psTexCd);
	c4.a = c4.a * alpha_multiplier;
	
	vec4 col = vec4(1.0,1.0,1.0,0.0);
	
	if(score<0.1){
		col= c1;
	}
	if(score<0.5 && score > 0.1){
		col= c2;
	}
	if( score > 0.5  ){
		col= c3;
	}
	if(score>=0.99){
		col= c4;
	}
	
	if(col.a < 0.5){
		discard;
	}
	
	
	
	
	//col.r = 0.8 - score*0.7;
	//col.g = 0.8 - score*0.7;
	//col.b = 1.0 - score*0.25;
	//col.a = 1.0 - score*0.25;
	
	float hue = 0.4+pow(score*0.33 , 0.5);
	float sat = pow(0.1 + score , 0.1);
	float val = 1.0+score;
	vec3 c = vec3(hue, sat, val);
	

	col.rgb = hsv2rgb(c);
	
	
	//col.x = pow(col.x,power);
	//col.y = pow(col.y,power);
	//col.z = pow(col.z,power);
	//col.a = pow(col.a,power);
	
	//col.a = col.a * alpha_multiplier;
	//col.rgb = col.rgb * col.a;  //premulitply
	
	
	gl_FragColor = col;

}