import { cameraUniformStruct, transformUniformStruct } from "./common";

/**
 * Vertex shader for stencil masks
 */
export const stencilVertexShader = `
${cameraUniformStruct}
${transformUniformStruct}

@binding(0) @group(0) var<uniform> camera: Camera;
@binding(1) @group(0) var<uniform> transform: Transform;

struct VertexOutput {
  @builtin(position) position: vec4f,
};

@vertex
fn main(@location(0) position: vec3f) -> VertexOutput {
  var output: VertexOutput;
  var worldPosition = transform.modelMatrix * vec4f(position, 1.0);
  output.position = camera.projectionMatrix * camera.viewMatrix * worldPosition;
  return output;
}
`;

/**
 * Fragment shader for stencil masks
 */
export const stencilFragmentShader = `
@fragment
fn main() -> @location(0) vec4f {
  // Return transparent color (will be discarded by blend state)
  return vec4f(0.0, 0.0, 0.0, 0.0);
}
`;
