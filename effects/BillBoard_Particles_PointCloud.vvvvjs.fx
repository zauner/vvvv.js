#ifdef GL_ES
precision mediump float;
#endif

uniform mat4 Texture_Transform;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;
uniform mat4 inverseView;

uniform float Alpha = 1.0;
uniform float scale = 1.0;


varying vec2 vs2psTexCd;




vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec3 NormO : NORMAL;
attribute vec3 PosI : POSITION1;




void main(void) {
	
	vec3 posIn = PosI;
	float scale = scale;

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

  
  
  vs2psTexCd = (Texture_Transform * vec4(TexCd, 0, 1)).xy;
}

fragment_shader:

#ifdef GL_ES
precision highp float;
#endif




void main(void) {
	
	
	
	vec4 col = vec4(1.0,1.0,1.0,1.0);
	
	
	gl_FragColor = col;

}