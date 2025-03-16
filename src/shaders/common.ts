/**
 * Camera uniform structure for both vertex and fragment shaders
 */
export const cameraUniformStruct = `
struct Camera {
  viewMatrix: mat4x4f,
  projectionMatrix: mat4x4f,
};
`;

/**
 * Vertex shader input and output structures
 */
export const vertexStructs = `
struct VertexInput {
  @location(0) position: vec3f,
  @location(1) color: vec4f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};
`;

/**
 * Transformation uniform structure for model matrices
 */
export const transformUniformStruct = `
struct Transform {
  modelMatrix: mat4x4f,
};
`;
