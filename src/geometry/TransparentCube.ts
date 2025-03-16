import { Matrix4x4, ObjectGeometry } from "../types";
import { createRotationMatrix } from "../utils/math";
import { BoxGeometry } from "./BoxGeometry";

export interface CubeFace {
  geometry: ObjectGeometry;
  stencilValue: number;
  transform: Matrix4x4;
}

export class TransparentCube {
  private outerCube: ObjectGeometry;
  private faces: CubeFace[] = [];
  private rotationMatrix: Matrix4x4 = { data: new Float32Array(16) };
  private rotationTransformBuffer: GPUBuffer;

  constructor(private device: GPUDevice, private size: number = 2.0) {
    // Create the outer transparent cube
    this.outerCube = BoxGeometry.create(
      device,
      size,
      size,
      size,
      { x: 0.9, y: 0.9, z: 0.9, w: 0.05 }, // Mostly transparent white
      { x: 0, y: 0, z: 0 }
    );

    // Create face masks for stencil operations
    this.createFaces();

    // Create transform buffer for the rotation
    this.rotationTransformBuffer = device.createBuffer({
      size: 64, // 1 matrix * 16 floats * 4 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Initialize rotation matrix to identity (no rotation)
    this.updateRotation(0);
  }

  /**
   * Create the six faces of the cube for stencil operations
   */
  private createFaces(): void {
    const halfSize = this.size / 2;
    const faceFacePositions = [
      { x: 0, y: 0, z: halfSize }, // Front face  (positive Z)
      { x: 0, y: 0, z: -halfSize }, // Back face   (negative Z)
      { x: 0, y: halfSize, z: 0 }, // Top face    (positive Y)
      { x: 0, y: -halfSize, z: 0 }, // Bottom face (negative Y)
      { x: halfSize, y: 0, z: 0 }, // Right face  (positive X)
      { x: -halfSize, y: 0, z: 0 }, // Left face   (negative X)
    ];

    const faceRotations = [
      { x: 0, y: 0, z: 0 }, // Front face
      { x: 0, y: Math.PI, z: 0 }, // Back face
      { x: Math.PI / 2, y: 0, z: 0 }, // Top face
      { x: -Math.PI / 2, y: 0, z: 0 }, // Bottom face
      { x: 0, y: Math.PI / 2, z: 0 }, // Right face
      { x: 0, y: -Math.PI / 2, z: 0 }, // Left face
    ];

    // Size of the face quad (slightly smaller than the cube face)
    const faceSize = this.size * 0.95;

    // Create a stencil mask for each face
    for (let i = 0; i < 6; i++) {
      const stencilValue = i + 1; // Stencil values 1-6 for the six faces

      const faceGeometry = BoxGeometry.createQuad(
        this.device,
        faceSize,
        faceSize,
        { x: 1.0, y: 1.0, z: 1.0, w: 1.0 },
        faceFacePositions[i]
      );

      this.faces.push({
        geometry: faceGeometry,
        stencilValue,
        transform: {
          data: createRotationMatrix(
            faceRotations[i].x,
            faceRotations[i].y,
            faceRotations[i].z
          ),
        },
      });
    }
  }

  /**
   * Update the rotation matrix based on time
   */
  public updateRotation(time: number): void {
    // Create rotation matrix for the entire cube
    const rotationSpeed = 0.3; // Adjust speed as needed
    const angle = time * rotationSpeed;

    // Rotate around multiple axes for more interesting motion
    this.rotationMatrix.data = createRotationMatrix(
      angle * 0.5, // X axis rotation
      angle, // Y axis rotation
      angle * 0.25 // Z axis rotation
    );

    // Update the transform buffer
    this.device.queue.writeBuffer(
      this.rotationTransformBuffer,
      0,
      this.rotationMatrix.data,
      0,
      16
    );
  }

  /**
   * Get the outer transparent cube geometry
   */
  public getOuterCube(): ObjectGeometry {
    return this.outerCube;
  }

  /**
   * Get all cube faces for stencil operations
   */
  public getFaces(): CubeFace[] {
    return this.faces;
  }

  /**
   * Get the rotation transform buffer
   */
  public getRotationBuffer(): GPUBuffer {
    return this.rotationTransformBuffer;
  }
}
