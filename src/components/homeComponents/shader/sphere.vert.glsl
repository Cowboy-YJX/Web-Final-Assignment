// 把法线与视线方向带到视图空间，供片元里的菲涅尔 / SSS 计算使用。
// ShaderMaterial 会自动注入 modelViewMatrix、normalMatrix、projectionMatrix。
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
