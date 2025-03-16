import { Camera, Vec3 } from "../types";
import { createProjectionMatrix, createViewMatrix } from "../utils/math";

export class CameraController {
  private camera: Camera;

  constructor(
    position: Vec3 = { x: 0, y: 0, z: 5 },
    private device: GPUDevice,
    private canvas: HTMLCanvasElement
  ) {
    this.camera = {
      position,
      viewMatrix: { data: new Float32Array(16) },
      projectionMatrix: { data: new Float32Array(16) },
    };

    this.updateViewMatrix();
    this.updateProjectionMatrix();
  }

  /**
   * Update the view matrix based on camera position
   */
  private updateViewMatrix(): void {
    this.camera.viewMatrix.data = createViewMatrix(
      this.camera.position,
      { x: 0, y: 0, z: 0 } // Always look at origin
    );
  }

  /**
   * Update the projection matrix
   */
  private updateProjectionMatrix(): void {
    const aspect = this.canvas.width / this.canvas.height;
    const fov = (45 * Math.PI) / 180; // 45 degrees in radians
    const near = 0.1;
    const far = 100.0;

    this.camera.projectionMatrix.data = createProjectionMatrix(
      fov,
      aspect,
      near,
      far
    );
  }

  /**
   * Create and return a buffer containing camera matrices
   */
  public createUniformBuffer(): GPUBuffer {
    const uniformBuffer = this.device.createBuffer({
      size: 128, // 2 matrices * 16 floats * 4 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.updateUniformBuffer(uniformBuffer);

    return uniformBuffer;
  }

  /**
   * Update a uniform buffer with current camera matrices
   */
  public updateUniformBuffer(buffer: GPUBuffer): void {
    this.device.queue.writeBuffer(
      buffer,
      0,
      this.camera.viewMatrix.data,
      0,
      16
    );

    this.device.queue.writeBuffer(
      buffer,
      64, // Offset to projection matrix (16 floats * 4 bytes)
      this.camera.projectionMatrix.data,
      0,
      16
    );
  }

  /**
   * Handle window resize
   */
  public handleResize(): void {
    this.updateProjectionMatrix();
  }

  /**
   * Orbit the camera around the origin
   */
  public orbitCamera(time: number): void {
    const radius = 5; // Distance from origin
    const speed = 0.2; // Angular speed in radians per second

    // Calculate new position in a circle around the y-axis
    this.camera.position = {
      x: Math.sin(time * speed) * radius,
      y: 1.5, // Slightly above the scene
      z: Math.cos(time * speed) * radius,
    };

    this.updateViewMatrix();
  }

  /**
   * Get the camera
   */
  public getCamera(): Camera {
    return this.camera;
  }
}
