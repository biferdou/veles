import {
  objectFragmentShader,
  objectVertexShader,
  transparentFragmentShader,
  transparentVertexShader,
} from "../shaders/object";
import { ObjectGeometry } from "../types";
import { CameraController } from "./Camera";
import { StencilManager } from "./StencilManager";

export class Renderer {
  // WebGPU objects
  private device: GPUDevice;
  private context: GPUCanvasContext;
  private presentationFormat: GPUTextureFormat;
  private depthStencilTexture: GPUTexture;
  private depthStencilView: GPUTextureView;

  // Bind group layouts
  private cameraBindGroupLayout: GPUBindGroupLayout;
  private transformBindGroupLayout: GPUBindGroupLayout;
  private pipelineLayout: GPUPipelineLayout;

  // Render pipelines
  private objectPipeline: GPURenderPipeline;
  private transparentPipeline: GPURenderPipeline;

  // Camera
  private cameraController: CameraController;
  private cameraBindGroup: GPUBindGroup;

  // Stencil manager
  private stencilManager: StencilManager;

  // Animation frame ID
  private animationFrameId: number = 0;

  constructor(private canvas: HTMLCanvasElement) {}

  /**
   * Initialize WebGPU
   */
  public async initialize(): Promise<void> {
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported on this browser.");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("Failed to get GPU adapter.");
    }

    this.device = await adapter.requestDevice();
    this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;

    // Configure canvas
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.presentationFormat,
      alphaMode: "premultiplied",
    });

    // Create depth-stencil texture
    await this.createDepthStencilTexture();

    // Create bind group layouts
    this.createBindGroupLayouts();

    // Create render pipelines
    this.createRenderPipelines();

    // Create camera
    this.cameraController = new CameraController(
      { x: 0, y: 0, z: 5 }, // Initial position
      this.device,
      this.canvas
    );

    // Create camera uniform buffer and bind group
    const cameraUniformBuffer = this.cameraController.createUniformBuffer();
    this.cameraBindGroup = this.device.createBindGroup({
      layout: this.cameraBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: cameraUniformBuffer,
          },
        },
      ],
    });

    // Create stencil manager
    this.stencilManager = new StencilManager(
      this.device,
      this.presentationFormat,
      this.pipelineLayout
    );
  }

  /**
   * Create a depth-stencil texture for the canvas
   */
  private async createDepthStencilTexture(): Promise<void> {
    this.depthStencilTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height, 1],
      format: "depth24plus-stencil8",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.depthStencilView = this.depthStencilTexture.createView();
  }

  /**
   * Create bind group layouts
   */
  private createBindGroupLayouts(): void {
    // Camera bind group layout
    this.cameraBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform",
          },
        },
      ],
    });

    // Transform bind group layout
    this.transformBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform",
          },
        },
      ],
    });

    // Create pipeline layout that combines both bind group layouts
    this.pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [
        this.cameraBindGroupLayout,
        this.transformBindGroupLayout,
      ],
    });
  }

  /**
   * Create render pipelines
   */
  private createRenderPipelines(): void {
    // Create pipeline for visible objects
    this.objectPipeline = this.device.createRenderPipeline({
      layout: this.pipelineLayout,
      vertex: {
        module: this.device.createShaderModule({
          code: objectVertexShader,
        }),
        entryPoint: "main",
        buffers: [
          {
            arrayStride: 12, // 3 floats * 4 bytes
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x3",
              },
            ],
          },
          {
            arrayStride: 16, // 4 floats * 4 bytes
            attributes: [
              {
                shaderLocation: 1,
                offset: 0,
                format: "float32x4",
              },
            ],
          },
        ],
      },
      fragment: {
        module: this.device.createShaderModule({
          code: objectFragmentShader,
        }),
        entryPoint: "main",
        targets: [
          {
            format: this.presentationFormat,
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "back",
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus-stencil8",
        stencilFront: {
          compare: "equal", // Only render where stencil equals reference value
          failOp: "keep",
          depthFailOp: "keep",
          passOp: "keep",
        },
        stencilBack: {
          compare: "equal", // Only render where stencil equals reference value
          failOp: "keep",
          depthFailOp: "keep",
          passOp: "keep",
        },
        stencilReadMask: 0xff,
        stencilWriteMask: 0x00, // Don't modify stencil while rendering objects
      },
    });

    // Create pipeline for transparent objects
    this.transparentPipeline = this.device.createRenderPipeline({
      layout: this.pipelineLayout,
      vertex: {
        module: this.device.createShaderModule({
          code: transparentVertexShader,
        }),
        entryPoint: "main",
        buffers: [
          {
            arrayStride: 12, // 3 floats * 4 bytes
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x3",
              },
            ],
          },
          {
            arrayStride: 16, // 4 floats * 4 bytes
            attributes: [
              {
                shaderLocation: 1,
                offset: 0,
                format: "float32x4",
              },
            ],
          },
        ],
      },
      fragment: {
        module: this.device.createShaderModule({
          code: transparentFragmentShader,
        }),
        entryPoint: "main",
        targets: [
          {
            format: this.presentationFormat,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "none", // Don't cull faces for transparent objects
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus-stencil8",
        // No stencil operations for transparent objects
        stencilFront: {
          compare: "always",
          failOp: "keep",
          depthFailOp: "keep",
          passOp: "keep",
        },
        stencilBack: {
          compare: "always",
          failOp: "keep",
          depthFailOp: "keep",
          passOp: "keep",
        },
        stencilReadMask: 0xff,
        stencilWriteMask: 0x00,
      },
    });
  }

  /**
   * Render a normal object
   */
  public renderObject(
    renderPass: GPURenderPassEncoder,
    geometry: ObjectGeometry,
    stencilValue: number,
    transformBindGroup: GPUBindGroup
  ): void {
    renderPass.setPipeline(this.objectPipeline);
    renderPass.setStencilReference(stencilValue);

    // Set bind groups
    renderPass.setBindGroup(0, this.cameraBindGroup);
    renderPass.setBindGroup(1, transformBindGroup);

    // Set vertex buffers and draw
    renderPass.setVertexBuffer(0, geometry.vertexBuffer);
    renderPass.setVertexBuffer(1, geometry.colorBuffer);
    renderPass.setIndexBuffer(geometry.indexBuffer, "uint16");
    renderPass.drawIndexed(geometry.indexCount);
  }

  /**
   * Render a transparent object
   */
  public renderTransparentObject(
    renderPass: GPURenderPassEncoder,
    geometry: ObjectGeometry,
    transformBindGroup: GPUBindGroup
  ): void {
    renderPass.setPipeline(this.transparentPipeline);

    // Set bind groups
    renderPass.setBindGroup(0, this.cameraBindGroup);
    renderPass.setBindGroup(1, transformBindGroup);

    // Set vertex buffers and draw
    renderPass.setVertexBuffer(0, geometry.vertexBuffer);
    renderPass.setVertexBuffer(1, geometry.colorBuffer);
    renderPass.setIndexBuffer(geometry.indexBuffer, "uint16");
    renderPass.drawIndexed(geometry.indexCount);
  }

  /**
   * Create a transform bind group
   */
  public createTransformBindGroup(buffer: GPUBuffer): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.transformBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer,
          },
        },
      ],
    });
  }

  /**
   * Get the stencil manager
   */
  public getStencilManager(): StencilManager {
    return this.stencilManager;
  }

  /**
   * Get the camera controller
   */
  public getCameraController(): CameraController {
    return this.cameraController;
  }

  /**
   * Get the camera bind group
   */
  public getCameraBindGroup(): GPUBindGroup {
    return this.cameraBindGroup;
  }

  /**
   * Handle window resize
   */
  public handleResize(): void {
    // Update canvas size
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Recreate depth-stencil texture
    this.depthStencilTexture.destroy();
    this.createDepthStencilTexture();

    // Update camera projection
    this.cameraController.handleResize();
  }

  /**
   * Get the WebGPU device
   */
  public getDevice(): GPUDevice {
    return this.device;
  }

  /**
   * Get depth stencil view
   */
  public getDepthStencilView(): GPUTextureView {
    return this.depthStencilView;
  }

  /**
   * Start the animation loop
   */
  public startAnimationLoop(renderFunction: (time: number) => void): void {
    const animate = (time: number) => {
      // Convert to seconds
      const timeInSeconds = time / 1000;

      // Update camera
      this.cameraController.orbitCamera(timeInSeconds);

      // Call the render function
      renderFunction(timeInSeconds);

      // Request next frame
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stop the animation loop
   */
  public stopAnimationLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stopAnimationLoop();
    this.depthStencilTexture.destroy();
  }

  /**
   * Begin a render pass
   */
  public beginRenderPass(): {
    commandEncoder: GPUCommandEncoder;
    renderPass: GPURenderPassEncoder;
  } {
    // Get the current texture to render to
    const colorTexture = this.context.getCurrentTexture();
    const colorView = colorTexture.createView();

    // Create a command encoder
    const commandEncoder = this.device.createCommandEncoder();

    // Begin render pass
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: colorView,
          clearValue: { r: 0.05, g: 0.05, b: 0.1, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthStencilView,
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
        stencilClearValue: 0,
        stencilLoadOp: "clear",
        stencilStoreOp: "store",
      },
    });

    return { commandEncoder, renderPass };
  }

  /**
   * End a render pass and submit the command buffer
   */
  public endRenderPass(
    commandEncoder: GPUCommandEncoder,
    renderPass: GPURenderPassEncoder
  ): void {
    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }
}
