// Main application logic
import { Renderer } from "./core/Renderer";
import { BoxGeometry } from "./geometry/BoxGeometry";
import { SphereGeometry } from "./geometry/SphereGeometry";
import { TransparentCube } from "./geometry/TransparentCube";
import { createIdentityMatrix } from "./utils/math";

export class VelesPortals {
  private renderer: Renderer;
  private canvas: HTMLCanvasElement;
  private transparentCube: TransparentCube;
  private innerCube: ReturnType<typeof BoxGeometry.create>;
  private innerSphere: ReturnType<typeof SphereGeometry.create>;
  private identityTransformBuffer: GPUBuffer;
  private identityBindGroup: GPUBindGroup;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
  }

  /**
   * Initialize the application
   */
  public async initialize(): Promise<void> {
    // Initialize WebGPU renderer
    await this.renderer.initialize();

    // Create geometries
    this.createGeometries();

    // Set up transform bind groups
    this.setupTransforms();

    // Set up window resize handler
    window.addEventListener("resize", this.handleResize.bind(this));

    // Start the render loop
    this.renderer.startAnimationLoop(this.render.bind(this));
  }

  /**
   * Create all geometries
   */
  private createGeometries(): void {
    const device = this.renderer.getDevice();

    // Create the transparent outer cube
    this.transparentCube = new TransparentCube(device, 2.0);

    // Create the inner cube and sphere
    this.innerCube = BoxGeometry.create(
      device,
      0.8,
      0.8,
      0.8, // Size
      { x: 1.0, y: 0.2, z: 0.2, w: 1.0 }, // Red color
      { x: 0, y: 0, z: 0 } // Position at center
    );

    this.innerSphere = SphereGeometry.create(
      device,
      0.6, // Radius
      24,
      18, // Segments
      { x: 0.2, y: 0.2, z: 1.0, w: 1.0 }, // Blue color
      { x: 0, y: 0, z: 0 } // Position at center
    );
  }

  /**
   * Set up transform bind groups
   */
  private setupTransforms(): void {
    const device = this.renderer.getDevice();

    // Create an identity transform buffer for objects that don't need rotation
    this.identityTransformBuffer = device.createBuffer({
      size: 64, // 1 matrix * 16 floats * 4 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Initialize with identity matrix
    const identityMatrix = createIdentityMatrix();
    device.queue.writeBuffer(
      this.identityTransformBuffer,
      0,
      identityMatrix,
      0,
      16
    );

    // Create bind group with identity transform
    this.identityBindGroup = this.renderer.createTransformBindGroup(
      this.identityTransformBuffer
    );
  }

  /**
   * Render function
   */
  private render(time: number): void {
    // Update cube rotation
    this.transparentCube.updateRotation(time);

    // Create transform bind group for the rotating cube
    const cubeTransformBindGroup = this.renderer.createTransformBindGroup(
      this.transparentCube.getRotationBuffer()
    );

    // Begin render pass
    const { commandEncoder, renderPass } = this.renderer.beginRenderPass();

    // 1. First, render stencil masks for each face
    const stencilManager = this.renderer.getStencilManager();
    const faces = this.transparentCube.getFaces();

    // Each face of the transparent cube gets a unique stencil value
    faces.forEach((face) => {
      stencilManager.renderStencilMask(
        renderPass,
        face.geometry,
        face.stencilValue,
        this.renderer.getCameraBindGroup(), // Use the existing camera bind group
        cubeTransformBindGroup // Apply cube rotation to the stencil masks
      );
    });

    // 2. Next, render the inner objects based on stencil values
    for (let i = 0; i < faces.length; i++) {
      const stencilValue = i + 1;

      // Even faces show cube, odd faces show sphere
      if (i % 2 === 0) {
        this.renderer.renderObject(
          renderPass,
          this.innerCube,
          stencilValue,
          this.identityBindGroup
        );
      } else {
        this.renderer.renderObject(
          renderPass,
          this.innerSphere,
          stencilValue,
          this.identityBindGroup
        );
      }
    }

    // 3. Finally, render the transparent outer cube
    this.renderer.renderTransparentObject(
      renderPass,
      this.transparentCube.getOuterCube(),
      cubeTransformBindGroup
    );

    // End render pass
    this.renderer.endRenderPass(commandEncoder, renderPass);
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    this.renderer.handleResize();
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.renderer.cleanup();
  }
}
