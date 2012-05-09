#ifdef GL_ES
precision highp float;
#endif

uniform mat4 Texture_Transform;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;

uniform vec3 Light_Direction_XYZ = {0.0, -5.0, 2.0};

uniform vec4 Ambient_Color : COLOR = {0.15, 0.15, 0.15, 1.0};
uniform vec4 Diffuse_Color : COLOR = {0.85, 0.85, 0.85, 1.0};
uniform vec4 Specular_Color : COLOR = {0.35, 0.35, 0.35, 1.0};
uniform float Power = 25.0;
uniform sampler2D Texture;
uniform float Alpha = 1.0;

varying vec2 vs2psTexCd;
varying vec3 LightDirV;
varying vec3 NormV;
varying vec3 ViewDirV;

vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec3 NormO : NORMAL;

void main(void) {

  mat4 tWV = tV * tW;
  mat4 tWVP = tP * tWV;
  
  LightDirV = normalize(-1.0*(tV*vec4(Light_Direction_XYZ,1))).xyz;
  NormV = normalize(tWV * vec4(NormO, 0)).xyz;
  
  vec4 PosV = tWV * vec4(PosO, 1);
  ViewDirV = normalize(-PosV).xyz;

  gl_Position = (tWVP * vec4(PosO, 1.0));
  vs2psTexCd = (Texture_Transform * vec4(TexCd, 0, 1)).xy;
}

fragment_shader:

void main(void) {
  vec3 H = normalize(ViewDirV + LightDirV);
  
  vec4 diff = Diffuse_Color * max(dot(NormV, LightDirV), 0.0);
  
  //reflection vector (view space)
  vec3 R = normalize(2.0 * dot(NormV, LightDirV) * NormV - LightDirV);
  vec3 V = normalize(ViewDirV);
  
  vec4 spec = Specular_Color * pow(max(dot(R, V),0.0), Power*.2);

  gl_FragColor = texture2D(Texture, vs2psTexCd);
  gl_FragColor.rgb *= Ambient_Color.rgb + diff.rgb + spec.rgb;
  gl_FragColor.a *= Alpha;
}