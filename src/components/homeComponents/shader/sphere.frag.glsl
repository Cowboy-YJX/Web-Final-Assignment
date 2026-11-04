// 软糖质感的透明球体。
//
// 不画高光、不画硬阴影，只做两件事：
// 1. 球心到边缘的颜色渐变：中心奶油色，边缘是更饱和的蓝 / 绿；
// 2. 边缘 alpha 归零，让球和球叠在一起时没有硬轮廓。
//
// 颜色由 CPU 按「离簇心的距离」逐球设定（内圈偏奶油，外圈偏饱和），
// 这个 shader 只负责单个球内部的那层渐变。
uniform vec3 uCoreColor;
uniform vec3 uEdgeColor;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  // 用投影半径做渐变，而不是 1-dot(N,V)：
  // 后者在球面上是非线性的，颜色会全挤在轮廓最后一圈，球看起来发白。
  float radial = sqrt(max(0.0, 1.0 - ndv * ndv));

  // 中心奶油色 -> 边缘饱和色，最外圈再压一点表现厚度
  float t = smoothstep(0.12, 0.95, radial);
  vec3 color = mix(uCoreColor, uEdgeColor, t);
  color = mix(color, uEdgeColor * 0.84, smoothstep(0.9, 1.0, radial));

  // 软边：外圈 12% 渐隐，球叠起来才不会有硬边
  float alpha = (1.0 - smoothstep(0.88, 1.0, radial)) * uOpacity;

  gl_FragColor = vec4(color, alpha);
}
