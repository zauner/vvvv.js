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
varying vec3 ViewVectorW;

void main(void) {

  gl_FragColor = textureCube(skybox, ViewVectorW);
}
