
vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec3 NormO : NORMAL;

uniform mat4 Texture_Transform;
uniform mat4 Texture_Transform_col;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;

uniform vec3 Light_Direction_XYZ = {0.0, -5.0, 2.0};

uniform sampler2D Texture;
uniform float deformAmount;
uniform float vertexCount;


varying vec3 LightDirV;
varying vec3 NormV;
varying vec3 ViewDirV;
varying vec2 vs2psTexCd;
varying vec2 vs2psTexCd_col;

vec3 deform(vec3 p, float a) {
  vec3 res = p;
  res.z -= a;
  return res;
}

float clampp(float pv, float min, float max) {

  if(pv<min){
  pv = min;
  };

  if(pv>max){
  pv = max;
  };
  return pv;
}

void main(void) {

  
float p_min=-0.6;
float p_max=0.6;
float t_min=0.0;
float t_max=1.0;

  mat4 tWV = tV * tW;
  mat4 tWVP = tP * tWV;
  
  float delta = 1.0/vertexCount;
  
  vec2 TexCd2 = (Texture_Transform * vec4(TexCd-.5, 0, 1)).xy;
  TexCd2 += .5;

  vec2 TexCd3 = (Texture_Transform_col * vec4(TexCd-.5, 0, 1)).xy;
  TexCd3 += .5;
  
  vec4 texCol = texture2D(Texture, TexCd2);
  vec3 PosO2 = deform(PosO, texCol.r*deformAmount);

  float TexCd_right = TexCd2.x+delta;
  if (TexCd_right > 1.0) {
  TexCd_right = 1.0;
  };
  float TexCd_bottom = TexCd2.y+delta;
  if (TexCd_bottom > 1.0) {
  TexCd_bottom = 1.0;
  };
  float TexCd_left = TexCd2.x-delta;
  if (TexCd_left > 1.0) {
  TexCd_left = 1.0;
  };
  float TexCd_top = TexCd2.y-delta;
  if (TexCd_top > 1.0) {
  TexCd_top = 1.0;
  };
  
  vec4 texCol_right = texture2D(Texture, vec2(clampp(TexCd2.x+delta, t_min,t_max), TexCd2.y));
  vec3 p_right = deform(vec3(clampp(PosO.x+delta, -1.0,1.0), PosO.yz), texCol_right.r*deformAmount);
  
  vec4 texCol_bottom = texture2D(Texture, vec2(TexCd2.x, clampp(TexCd2.y+delta, t_min,t_max)));
  vec3 p_bottom = deform(vec3(PosO.x, clampp(PosO.y-delta, p_min,p_max), PosO.z), texCol_right.r*deformAmount);
  
  vec4 texCol_left = texture2D(Texture, vec2(clampp(TexCd2.x-delta, t_min,t_max), TexCd2.y));
  vec3 p_left = deform(vec3(clampp(PosO.x-delta, p_min,p_max), PosO.yz), texCol_left.r*deformAmount);
  
  vec4 texCol_top = texture2D(Texture, vec2(TexCd2.x, clampp(TexCd2.y-delta, t_min,t_max)));
  vec3 p_top = deform(vec3(PosO.x, clampp(PosO.y+delta, p_min,p_max), PosO.z), texCol_top.r*deformAmount);
  
  // calculate positions of neighbouring vertices, and get an average/smooth normal
  vec3 n1 = normalize(cross(p_right-PosO2, p_bottom-PosO2));
  vec3 n2 = normalize(cross(p_left-PosO2, p_top-PosO2));
  vec3 n3 = normalize(cross(p_bottom-PosO2, p_left-PosO2));
  vec3 n4 = normalize(cross(p_top-PosO2, p_right-PosO2));
  vec3 n = (n1+n2+n3+n4)/4.0;
  
  LightDirV = normalize(-1.0*(tV*vec4(Light_Direction_XYZ,1))).xyz;
  NormV = normalize(tWV * vec4(n, 0)).xyz;
  
  vec4 PosV = tWV * vec4(PosO2, 1);
  ViewDirV = normalize(-PosV).xyz;
  
  vs2psTexCd = TexCd2;
  vs2psTexCd_col = TexCd3;
  gl_Position = (tWVP * vec4(PosO2, 1.0));
}


fragment_shader:

#ifdef GL_ES
precision highp float;
#endif

varying vec3 LightDirV;
varying vec3 NormV;
varying vec3 ViewDirV;
varying vec2 vs2psTexCd;
varying vec2 vs2psTexCd_col;

uniform vec4 Ambient_Color : COLOR = {0.15, 0.15, 0.15, 1.0};
uniform vec4 Diffuse_Color : COLOR = {0.85, 0.85, 0.85, 1.0};
uniform vec4 Specular_Color : COLOR = {0.35, 0.35, 0.35, 1.0};
uniform float Power = 25.0;
uniform float Alpha = 1.0;
uniform sampler2D Texture_2;

void main(void) {
  vec3 H = normalize(ViewDirV + LightDirV);
  
  vec4 diff = Diffuse_Color * max(dot(NormV, LightDirV), 0.0);
  
  //reflection vector (view space)
  vec3 R = normalize(2.0 * dot(NormV, LightDirV) * NormV - LightDirV);
  vec3 V = normalize(ViewDirV);
  
  vec4 spec = Specular_Color * pow(max(dot(R, V),0.0), Power*.2);

  gl_FragColor = texture2D(Texture_2, vs2psTexCd_col);
  gl_FragColor.rgb *= Ambient_Color.rgb + diff.rgb + spec.rgb;
  gl_FragColor.a *= Alpha;
}