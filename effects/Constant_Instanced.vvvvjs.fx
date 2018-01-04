precision lowp float;

uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;

uniform vec4 Color : COLOR = {1.0, 1.0, 1.0, 1.0};
uniform sampler2D Texture;
uniform mat4 Texture_Transform;
uniform float Alpha = 1.0;
uniform float data_texture_resX = 64.0;
uniform sampler2D InstanceWorldTex;

varying vec2 vs2psTexCd;

vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec3 NormO : NORMAL;
attribute vec4 index : INDEX;
attribute vec4 vcol : VERTEXCOLOR;

void main(void) {
	
	float pos_index = index.x ; //* floor(vcol.r*submesh_count + 0.001) for batching

	vec2 uv_worldpos = vec2(mod(pos_index, data_texture_resX)/data_texture_resX , floor(pos_index/data_texture_resX)/data_texture_resX);

	vec4 InstancePos = texture2D(InstanceWorldTex, uv_worldpos);
	InstancePos.xyz = InstancePos.xyz * 2.0 - vec3(1.0,0.0,1.0);
	vec3 Pos_Instance = PosO  + InstancePos.rgb ;	
	
  gl_Position = tP * tV * tW * vec4(PosO, 1.0);
  vs2psTexCd = (Texture_Transform * vec4(TexCd, 0, 1)).xy;
}


fragment_shader:

void main(void) {
  gl_FragColor = Color * texture2D(Texture, vs2psTexCd) * vec4(1.0, 1.0, 1.0, Alpha);
}