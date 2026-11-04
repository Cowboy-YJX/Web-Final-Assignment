/**
 * 首屏相机参数。
 *
 * 物理模拟用它们在「z = 0 平面」上摆放球簇，three 的 PerspectiveCamera
 * 用同一组 FOV / 距离，保证球的屏幕位置和旧版全屏 shader 一致。
 */
export const CAMERA_Z = 3.4

/** 垂直视场角（度） */
export const FOV_DEG = 40

/** 垂直视场角一半的正切 */
export const FOV_TAN = Math.tan((FOV_DEG * Math.PI) / 360)
