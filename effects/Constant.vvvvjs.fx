precision lowp float;

uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 tP : PROJECTION;

uniform vec4 Color : COLOR = {1.0, 1.0, 1.0, 1.0};
uniform sampler2D Texture;
uniform mat4 Texture_Transform;
uniform float Alpha = 1.0;

varying vec2 vs2psTexCd;

vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;

void main(void) {
  gl_Position = tP * tV * tW * vec4(PosO, 1.0);
  vs2psTexCd = (Texture_Transform * vec4(TexCd, 0, 1)).xy;
}


fragment_shader:

void main(void) {
  gl_FragColor = Color * texture2D(Texture, vs2psTexCd) * vec4(1.0, 1.0, 1.0, Alpha);
}