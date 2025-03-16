import { stencilFragmentShader, stencilVertexShader } from "../shaders/stencil";
import { ObjectGeometry } from "../types";

export class StencilManager {
  private stencilPipeline: GPURenderPipeline;

  constructor(
    device: GPUDevice,
    presentationFormat: GPUTextureFormat,
    pipelineLayout: GPUPipelineLayout
  ) {
    // Create pipeline for stencil masks
    this.stencilPipeline = this.createStencilPipeline(
      device,
      presentationFormat,
      pipelineLayout
    );
  }

  /**
   * Create the stencil pipeline
   */
  private createStencilPipeline(
    device: GPUDevice,
    presentationFormat: GPUTextureFormat,
    pipelineLayout: GPUPipelineLayout
  ): GPURenderPipeline {
    return device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: device.createShaderModule({
          code: stencilVertexShader,
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
        ],
      },
      fragment: {
        module: device.createShaderModule({
          code: stencilFragmentShader,
        }),
        entryPoint: "main",
        targets: [
          {
            format: presentationFormat,
            blend: {
              color: {
                srcFactor: "zero",
                dstFactor: "one",
                operation: "add",
              },
              alpha: {
                srcFactor: "zero",
                dstFactor: "one",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "none",
      },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: "always",
        format: "depth24plus-stencil8",
        stencilFront: {
          compare: "always",
          failOp: "keep",
          depthFailOp: "keep",
          passOp: "replace",
        },
        stencilBack: {
          compare: "always",
          failOp: "keep",
          depthFailOp: "keep",
          passOp: "replace",
        },
        stencilReadMask: 0xff,
        stencilWriteMask: 0xff,
      },
    });
  }

  /**
   * Render a stencil mask with specified stencil value
   */
  public renderStencilMask(
    renderPass: GPURenderPassEncoder,
    geometry: ObjectGeometry,
    stencilValue: number,
    bindGroup: GPUBindGroup,
    transformBindGroup: GPUBindGroup
  ): void {
    renderPass.setPipeline(this.stencilPipeline);
    renderPass.setStencilReference(stencilValue);

    // Set bind groups
    renderPass.setBindGroup(0, bindGroup);
    renderPass.setBindGroup(1, transformBindGroup);

    // Set vertex buffer and draw
    renderPass.setVertexBuffer(0, geometry.vertexBuffer);
    renderPass.setIndexBuffer(geometry.indexBuffer, "uint16");
    renderPass.drawIndexed(geometry.indexCount);
  }
}
