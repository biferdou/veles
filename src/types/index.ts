// Type definitions for the application
/// <reference types="@webgpu/types" />

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Vec4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Matrix4x4 {
  data: Float32Array;
}

export interface ObjectGeometry {
  vertexBuffer: GPUBuffer;
  colorBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  indexCount: number;
}

export interface Camera {
  position: Vec3;
  viewMatrix: Matrix4x4;
  projectionMatrix: Matrix4x4;
}

export interface StencilFace {
  stencilValue: number;
  geometry: ObjectGeometry;
  transform: Matrix4x4;
}

// Extend Window interface for WebGPU support
declare global {
  interface Navigator {
    readonly gpu?: GPU;
  }

  interface HTMLCanvasElement {
    getContext(contextId: "webgpu"): GPUCanvasContext | null;
  }
}
