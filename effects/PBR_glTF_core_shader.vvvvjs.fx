precision lowp float;

uniform mat4 world_matrix : WORLD;
uniform mat4 view_matrix : VIEW;
uniform mat4 proj_matrix : PROJECTION;
uniform mat4 normal_matrix;

uniform vec4 Color : COLOR = {1.0, 1.0, 1.0, 1.0};
uniform sampler2D Texture;
uniform mat4 Texture_Transform;
uniform float Alpha = 1.0;


varying vec2 v_texcoord; // texture coords
varying vec3 v_normal;   // normal
varying vec3 v_binormal; // binormal (for TBN basis calc)
varying vec3 v_pos;      // pixel view space position
varying mat3 v_TBN;

vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec4 a_Normal : NORMAL;
attribute vec4 a_Tangent : TANGENT;


void main(void) {
  gl_Position = proj_matrix * view_matrix * world_matrix * vec4(PosO, 1.0);

  v_texcoord = (Texture_Transform * vec4(TexCd, 0, 1)).xy;
  
  vec3 normalW = normalize(vec3(world_matrix * vec4(a_Normal.xyz, 0.0)));
  vec3 tangentW = normalize(vec3(world_matrix * vec4(a_Tangent.xyz, 0.0)));
  vec3 bitangentW = cross(normalW, tangentW) * a_Tangent.w;
  v_TBN = mat3(tangentW, bitangentW, normalW);
  
  v_binormal = bitangentW;
}


fragment_shader:

void main(void) {
  gl_FragColor = Color * texture2D(Texture, v_texcoord) * vec4(1.0, 1.0, 1.0, Alpha);
}