vertex_shader:

#ifdef GL_ES
precision highp float;
#endif


attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0; 
uniform mat4 tW : WORLD; 
uniform mat4 tV : VIEW; 
uniform mat4 tP : PROJECTION; 
uniform mat4 tTex; 
varying vec2 vs2psTexCd; 

void main(void) { 
gl_Position = tP * tV * tW * vec4(PosO, 1.0); 
vs2psTexCd = (tTex * vec4(TexCd.xy-.5, 0.0, 1.0)).xy+.5; 
}

fragment_shader:


precision highp float;

uniform vec4 col : COLOR = {1.0, 1.0, 1.0, 1.0};
 varying vec2 vs2psTexCd;
 uniform sampler2D Samp0;
 
void main(void) { 
vec4 color = vec4(1.0,1.0,1.0,1.0);
#ifdef IS_BLUE
color = vec4(0.0,0.0,1.0,1.0);
#endif  
#ifdef IS_GREEN
color = vec4(0.0,1.0,0.0,1.0);
#endif  
gl_FragColor = color;
 }