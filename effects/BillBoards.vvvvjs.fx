#ifdef GL_ES
precision highp float;
#endif

uniform mat4 Texture_Transform;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;
uniform mat4 inverseView;

uniform float Power = 25.0;
uniform sampler2D Texture;
uniform float Alpha = 1.0;
uniform float textureRes = 1024.0;

varying vec2 vs2psTexCd;
varying vec3 NormV;
varying vec4 PosWVP;

vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec3 NormO : NORMAL;
attribute vec3 offset : OFFSET;
attribute vec3 leafes : LEAFES;
attribute float index : INDEX;
attribute float scale : SCALE;


void main(void) {

   mat4 m_offset = mat4(
        vec4( scale, 0.0, 0.0, offset.x + leafes.x),
        vec4( 0.0, scale, 0.0, offset.y + leafes.y),
		vec4( 0.0, 0.0, scale, offset.z + leafes.z),
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
  //gl_Position = tP * (PosO + vec4(tWV[3].xyz, 0)); billboard not working
  
  
  vs2psTexCd = (Texture_Transform * vec4(TexCd, 0, 1)).xy +vec2(mod(index, 8.0)/8.0,floor(index/8.0)/8.0);
}

fragment_shader:

#ifdef GL_ES
precision highp float;
#endif




void main(void) {

	vec4 ColorTex = texture2D(Texture, vs2psTexCd);
	
	
	gl_FragColor = vec4(  ColorTex.rgb , 1.0);

	

  
  gl_FragColor.a *= Alpha;
  if(ColorTex.a < 0.5 ){ discard; }
}