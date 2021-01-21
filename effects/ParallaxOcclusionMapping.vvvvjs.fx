vertex_shader:

precision highp float;
attribute vec3 position : POSITION;
attribute vec2 TexCd : TEXCOORD0;
attribute vec3 normal : NORMAL;
uniform mat4 normalMatrix;
uniform mat4 tW : WORLD;
uniform mat4 tV : VIEW;
uniform mat4 projectionMatrix : PROJECTION;
uniform vec3 CamPos;
uniform vec3 light_pos;


varying vec3 fNormal;
varying vec3 fPosition;

varying vec2 frag_uv;
varying vec3 ts_light_pos; // Tangent space values
varying vec3 ts_view_pos;  //
varying vec3 ts_frag_pos;  //

mat3 transpose(in mat3 inMatrix)
{
    vec3 i0 = inMatrix[0];
    vec3 i1 = inMatrix[1];
    vec3 i2 = inMatrix[2];

    mat3 outMatrix = mat3(
        vec3(i0.x, i1.x, i2.x),
        vec3(i0.y, i1.y, i2.y),
        vec3(i0.z, i1.z, i2.z)
    );

    return outMatrix;
}
  
  vec3 ExtractCameraPos(mat4 a_modelView)
{
  mat3 rotMat =mat3(a_modelView[0].xyz,a_modelView[1].xyz,a_modelView[2].xyz);
  vec3 d =  a_modelView[3].xyz;
  vec3 retVec = -d * rotMat;
  return retVec;
}

void main()
{
	
  mat4 modelViewMatrix = tV * tW; //Is TWV the modelViewMatrix
  modelViewMatrix = projectionMatrix * modelViewMatrix;
  //mat4 normalMatrix = transpose(inverse(modelViewMatrix));
  fNormal = normalize(mat3(normalMatrix) * normal);
  vec4 pos = modelViewMatrix * vec4(position, 1.0);
  fPosition = pos.xyz;

  //tangents and binormals approximation
  vec3 tangent; 
  vec3 binormal; 
  vec3 c1 = cross(normal, vec3(0.0, 0.0, 1.0)); 
  vec3 c2 = cross(normal, vec3(0.0, 1.0, 0.0)); 
  if (length(c1) > length(c2))
    tangent = c1;  
  else
    tangent = c2;	
  tangent = normalize(tangent);
  binormal = normalize(cross(normal, tangent)); 
  
  vec3 t = normalize(mat3(normalMatrix) * tangent);
  vec3 b = normalize(mat3(normalMatrix) * binormal);
  vec3 n = normalize(mat3(normalMatrix) * normal);
  mat3 tbn = transpose(mat3(t, b, n));
  
  //vec3 light_pos = vec3(1, 2, 0);
  ts_light_pos = tbn * light_pos;
  // Our camera is always at the origin
  ts_view_pos = tbn * vec3(0.0,0.0,0.0);
  ts_frag_pos = tbn * pos.xyz;
    
  frag_uv = TexCd;  
  
  gl_Position = projectionMatrix * pos;
  
  
  
  
}

fragment_shader:

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D tex_norm;
uniform sampler2D tex_diffuse;
uniform sampler2D tex_depth;
/*
    The type is controlled by the radio buttons below the canvas.
    0 = No bump mapping
    1 = Normal mapping
    2 = Parallax mapping
    3 = Steep parallax mapping
    4 = Parallax occlusion mapping
*/
uniform int type;
uniform int show_tex;
uniform float depth_scale;
uniform float num_layers;

varying vec2 frag_uv;
varying vec3 ts_light_pos;
varying vec3 ts_view_pos;
varying vec3 ts_frag_pos;

vec2 parallax_uv(vec2 uv, vec3 view_dir)
{
    if (type == 2) {
        // Parallax mapping
        float depth = texture2D(tex_depth, uv).r;    
        vec2 p = view_dir.xy * (depth * depth_scale) / view_dir.z;
        return uv - p;  
    } else {
        float layer_depth = 1.0 / num_layers;
        float cur_layer_depth = 0.0;
        vec2 delta_uv = view_dir.xy * depth_scale / (view_dir.z * num_layers);
        vec2 cur_uv = uv;

        float depth_from_tex = texture2D(tex_depth, cur_uv).r;

        for (int i = 0; i < 32; i++) {
            cur_layer_depth += layer_depth;
            cur_uv -= delta_uv;
            depth_from_tex = texture2D(tex_depth, cur_uv).r;
            if (depth_from_tex < cur_layer_depth) {
                break;
            }
        }

        if (type == 3) {
            // Steep parallax mapping
            return cur_uv;
        } else {
            // Parallax occlusion mapping
            vec2 prev_uv = cur_uv + delta_uv;
            float next = depth_from_tex - cur_layer_depth;
            float prev = texture2D(tex_depth, prev_uv).r - cur_layer_depth
                         + layer_depth;
            float weight = next / (next - prev);
            return mix(cur_uv, prev_uv, weight);
        }
    }
}

void main(void)
{
    vec3 light_dir = normalize(ts_light_pos - ts_frag_pos);
    vec3 view_dir = normalize(ts_view_pos - ts_frag_pos);

    // Only perturb the texture coordinates if a parallax technique is selected
    vec2 uv = (type < 2) ? frag_uv : parallax_uv(frag_uv, view_dir);

    vec3 albedo = texture2D(tex_diffuse, uv).rgb;
    if (show_tex == 0) { albedo = vec3(1,1,1); }
    vec3 ambient = 0.3 * albedo;

    if (type == 0) {
        // No bump mapping
        vec3 norm = vec3(0,0,1);
        float diffuse = max(dot(light_dir, norm), 0.0);
        gl_FragColor = vec4(diffuse * albedo + ambient, 1.0);

    } else {
        // Normal mapping
        vec3 norm = normalize(texture2D(tex_norm, uv).rgb * 2.0 - 1.0);
        float diffuse = max(dot(light_dir, norm), 0.0);
        gl_FragColor = vec4(diffuse * albedo + ambient, 1.0);
    }
}