vertex_shader:
#ifdef GL_ES
precision highp float;
#endif


uniform mat4 tW : WORLD;
uniform mat4 tVP : VIEWPROJECTION;
uniform vec3 posCam;

attribute vec4 PosO : POSITION;
attribute vec4 TexCd : TEXCOORD0;


varying vec3 ViewVectorW;

void main(void) {
	
     //position in world space
    vec4 PosW = tW * PosO;
    
    //texture coordinates for skybox cubemap
    ViewVectorW = PosW.xyz - posCam;

    //position in projection space

    gl_Position = tVP * PosW;

}


fragment_shader:


#ifdef GL_ES
precision highp float;
#endif

uniform samplerCube skybox;

//Those Parameters are used to fix seams that appear with webgl 1.0 cube map lookup
uniform float cube_size = 256.0;
uniform float lod = 1.0;

varying vec3 ViewVectorW;


vec3 fix_cube_lookup(vec3 v) {
   float M = max(max(abs(v.x), abs(v.y)), abs(v.z));
   float scale = 1.0 - exp2(lod) / cube_size;
   if (abs(v.x) != M) v.x *= scale;
   if (abs(v.y) != M) v.y *= scale;
   if (abs(v.z) != M) v.z *= scale;
   return v;
}

void main(void) {
  vec3 Seamless_ViewVectorW = fix_cube_lookup(ViewVectorW);
  gl_FragColor = textureCube(skybox, Seamless_ViewVectorW);
}
