import {
  cameraUniformStruct,
  transformUniformStruct,
  vertexStructs,
} from "./common";

/**
 * Vertex shader for objects (cube, sphere)
 */
export const objectVertexShader = `
${cameraUniformStruct}
${transformUniformStruct}
${vertexStructs}

@binding(0) @group(0) var<uniform> camera: Camera;
@binding(0) @group(1) var<uniform> transform: Transform;

@vertex
fn main(
  @location(0) position: vec3f,
  @location(1) color: vec4f,
) -> VertexOutput {
  var output: VertexOutput;
  var worldPosition = transform.modelMatrix * vec4f(position, 1.0);
  output.position = camera.projectionMatrix * camera.viewMatrix * worldPosition;
  output.color = color;
  return output;
}
`;

/**
 * Fragment shader for objects
 */
export const objectFragmentShader = `
${vertexStructs}

@fragment
fn main(@location(0) color: vec4f) -> @location(0) vec4f {
  return color;
}
`;

/**
 * Vertex shader for transparent objects
 */
export const transparentVertexShader = `
${cameraUniformStruct}
${transformUniformStruct}
${vertexStructs}

@binding(0) @group(0) var<uniform> camera: Camera;
@binding(0) @group(1) var<uniform> transform: Transform;

@vertex
fn main(
  @location(0) position: vec3f,
  @location(1) color: vec4f,
) -> VertexOutput {
  var output: VertexOutput;
  var worldPosition = transform.modelMatrix * vec4f(position, 1.0);
  output.position = camera.projectionMatrix * camera.viewMatrix * worldPosition;
  
  // Make the color transparent but keep hue
  output.color = vec4f(color.rgb, 0.15);
  return output;
}
`;

/**
 * Fragment shader for transparent objects with wireframe effect
 */
export const transparentFragmentShader = `
${vertexStructs}

@fragment
fn main(@location(0) color: vec4f) -> @location(0) vec4f {
  return color;
}
`;
