(function() {

  MMDGL.FragmentShaderSource = '\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec2 vTextureCoord;\nvarying vec3 vPosition;\nvarying vec3 vNormal;\nvarying vec4 vLightCoord;\n\nuniform vec3 uLightDirection; // light source direction in world space\nuniform vec3 uLightColor;\n\nuniform vec3 uAmbientColor;\nuniform vec3 uSpecularColor;\nuniform vec3 uDiffuseColor;\nuniform float uAlpha;\nuniform float uShininess;\n\nuniform bool uUseTexture;\nuniform bool uUseSphereMap;\nuniform bool uIsSphereMapAdditive;\n\nuniform sampler2D uToon;\nuniform sampler2D uTexture;\nuniform sampler2D uSphereMap;\n\nuniform bool uEdge;\nuniform float uEdgeThickness;\nuniform vec3 uEdgeColor;\n\nuniform bool uGenerateShadowMap;\nuniform bool uSelfShadow;\nuniform sampler2D uShadowMap;\n\nuniform bool uAxis;\nuniform vec3 uAxisColor;\nuniform bool uCenterPoint;\n\n// from http://spidergl.org/example.php?id=6\nvec4 pack_depth(const in float depth) {\n  const vec4 bit_shift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);\n  const vec4 bit_mask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);\n  vec4 res = fract(depth * bit_shift);\n  res -= res.xxyz * bit_mask;\n  return res;\n}\nfloat unpack_depth(const in vec4 rgba_depth)\n{\n  const vec4 bit_shift = vec4(1.0/(256.0*256.0*256.0), 1.0/(256.0*256.0), 1.0/256.0, 1.0);\n  float depth = dot(rgba_depth, bit_shift);\n  return depth;\n}\n\nvoid main() {\n  if (uGenerateShadowMap) {\n    //gl_FragData[0] = pack_depth(gl_FragCoord.z);\n    gl_FragColor = pack_depth(gl_FragCoord.z);\n    return;\n  }\n  if (uAxis) {\n    gl_FragColor = vec4(uAxisColor, 1.0);\n    return;\n  }\n  if (uCenterPoint) {\n    vec2 uv = gl_PointCoord * 2.0 - 1.0; // transform [0, 1] -> [-1, 1] coord systems\n    float w = dot(uv, uv);\n    if (w < 0.3 || (w > 0.5 && w < 1.0)) {\n      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n    } else {\n      discard;\n    }\n    return;\n  }\n\n  // vectors are in view space\n  vec3 norm = normalize(vNormal); // each point\'s normal vector in view space\n  vec3 cameraDirection = normalize(-vPosition); // camera located at origin in view space\n\n  vec3 color;\n  float alpha = uAlpha;\n\n  if (uEdge) {\n\n    color = uEdgeColor;\n\n  } else {\n\n    color = vec3(1.0, 1.0, 1.0);\n    if (uUseTexture) {\n      vec4 texColor = texture2D(uTexture, vTextureCoord);\n      color *= texColor.rgb;\n      alpha *= texColor.a;\n    }\n    if (uUseSphereMap) {\n      vec2 sphereCoord = 0.5 * (1.0 + vec2(1.0, -1.0) * norm.xy);\n      if (uIsSphereMapAdditive) {\n        color += texture2D(uSphereMap, sphereCoord).rgb;\n      } else {\n        color *= texture2D(uSphereMap, sphereCoord).rgb;\n      }\n    }\n\n    // specular component\n    vec3 halfAngle = normalize(uLightDirection + cameraDirection);\n    float specularWeight = pow( max(0.0, dot(halfAngle, norm)) , uShininess );\n    //float specularWeight = pow( max(0.0, dot(reflect(-uLightDirection, norm), cameraDirection)) , uShininess ); // another definition\n    vec3 specular = specularWeight * uSpecularColor;\n\n    vec2 toonCoord = vec2(0.0, 0.5 * (1.0 - dot( uLightDirection, norm )));\n\n    if (uSelfShadow) {\n      vec3 lightCoord = vLightCoord.xyz / vLightCoord.w; // projection to texture coordinate (in light space)\n      vec4 rgbaDepth = texture2D(uShadowMap, lightCoord.xy);\n      float depth = unpack_depth(rgbaDepth);\n      if (depth < lightCoord.z - 0.01) {\n        toonCoord = vec2(0.0, 1.0);\n      }\n    }\n\n    color *= uAmbientColor + uLightColor * (uDiffuseColor + specular);\n\n    color = clamp(color, 0.0, 1.0);\n    color *= texture2D(uToon, toonCoord).rgb;\n\n  }\n  gl_FragColor = vec4(color, alpha);\n\n}\n';

}).call(this);
