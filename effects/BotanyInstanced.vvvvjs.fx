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
uniform sampler2D AnimationTex;
uniform float Alpha = 1.0;
uniform float textureRes = 1024.0;
uniform float stride = 40.0;
uniform float frame = 0.0;


varying vec2 vs2psTexCd;
varying vec3 LightDirV;
varying vec3 NormV;
varying vec3 ViewDirV;
varying vec3 instancedColor;

vertex_shader:

attribute vec3 PosO : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec3 NormO : NORMAL;
attribute vec3 offset : OFFSET;
attribute float scale : SCALE;
attribute vec3 color : COLOR;
attribute vec4 mm1 : MATRIX1;
attribute vec4 mm2 : MATRIX2;
attribute vec4 mm3 : MATRIX3;
attribute vec4 mm4 : MATRIX4;

//modified FBM functions from inigo quilez - iq/2013
const mat3 m = mat3( 0.80,  0.60, 0.5, -0.60,  0.80, -0.5, 0.60,  -0.80, 0.5);

float noise( in vec3 x )
{
	return sin(1.5*x.x)*sin(1.5*x.y)*sin(1.5*x.z);
}

float fbm4( in vec3 p )
{
    float f = 0.0;
    f += 0.5000*noise( p ); p = m * p * 2.02;
    f += 0.2500*noise( p ); p = m * p * 2.03;
    f += 0.1250*noise( p ); p = m * p * 2.01;
    f += 0.0625*noise( p );
    return f/0.9375;
}

float fbm6( in vec3 p )
{
    float f = 0.0;

	f += 0.500000*(0.5+0.5*noise( p )); p = m * p * 2.02;
    f += 0.250000*(0.5+0.5*noise( p )); p = m * p * 2.03;
    f += 0.125000*(0.5+0.5*noise( p )); p = m * p * 2.01;
    f += 0.062500*(0.5+0.5*noise( p )); p = m * p * 2.04;
    f += 0.031250*(0.5+0.5*noise( p )); p = m * p * 2.01;
    f += 0.015625*(0.5+0.5*noise( p ));
    return f/0.96875;
}

void main(void) {



  // the matrix is constructed from the components
  mat4 transform = mat4(
        mm1,
        mm2,
		mm3,
        mm4
   );
   
   mat4 m_offset = mat4(
        vec4( scale, 0.0, 0.0, offset.x),
        vec4( 0.0, scale, 0.0, offset.y),
		vec4( 0.0, 0.0, scale, offset.z),
        vec4( 0.0, 0.0, 0.0, 1.0)
   );

  
  mat4 tWV = tV * tW;
  mat4 tVP = tP * tV;
  mat4 tWVP = tP * tWV;
  
  LightDirV = normalize(-1.0*(tV*vec4(Light_Direction_XYZ,1))).xyz;
  NormV = normalize(tWV * vec4(NormO, 0)).xyz;
  instancedColor = color;
  vec4 PosV = tWV * vec4(PosO , 1);
  ViewDirV = normalize(-PosV).xyz;
  
  
  vec4 pP = vec4(PosO  * 4.0, 1.0) *transform* m_offset ;

  float dPx =  fbm6(pP.xyz);
  
  pP.xyz += dPx;
  
  gl_Position = tVP * pP;
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
  gl_FragColor.rgb *= instancedColor * Ambient_Color.rgb + diff.rgb + spec.rgb;
  gl_FragColor.a *= Alpha;
}