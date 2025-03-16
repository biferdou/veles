import { ObjectGeometry, Vec4 } from "../types";

export class BoxGeometry {
  /**
   * Create a box/cube geometry
   */
  public static create(
    device: GPUDevice,
    width: number = 1.0,
    height: number = 1.0,
    depth: number = 1.0,
    color: Vec4 = { x: 1.0, y: 1.0, z: 1.0, w: 1.0 },
    position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
  ): ObjectGeometry {
    // Calculate corners of the box
    const x0 = position.x - width / 2;
    const x1 = position.x + width / 2;
    const y0 = position.y - height / 2;
    const y1 = position.y + height / 2;
    const z0 = position.z - depth / 2;
    const z1 = position.z + depth / 2;

    // Vertices (8 corners of the box)
    const vertices = new Float32Array([
      // Front face
      x0,
      y0,
      z1, // 0
      x1,
      y0,
      z1, // 1
      x1,
      y1,
      z1, // 2
      x0,
      y1,
      z1, // 3

      // Back face
      x0,
      y0,
      z0, // 4
      x1,
      y0,
      z0, // 5
      x1,
      y1,
      z0, // 6
      x0,
      y1,
      z0, // 7

      // Top face
      x0,
      y1,
      z0, // 8 (same as 7)
      x1,
      y1,
      z0, // 9 (same as 6)
      x1,
      y1,
      z1, // 10 (same as 2)
      x0,
      y1,
      z1, // 11 (same as 3)

      // Bottom face
      x0,
      y0,
      z0, // 12 (same as 4)
      x1,
      y0,
      z0, // 13 (same as 5)
      x1,
      y0,
      z1, // 14 (same as 1)
      x0,
      y0,
      z1, // 15 (same as 0)

      // Right face
      x1,
      y0,
      z0, // 16 (same as 5)
      x1,
      y1,
      z0, // 17 (same as 6)
      x1,
      y1,
      z1, // 18 (same as 2)
      x1,
      y0,
      z1, // 19 (same as 1)

      // Left face
      x0,
      y0,
      z0, // 20 (same as 4)
      x0,
      y1,
      z0, // 21 (same as 7)
      x0,
      y1,
      z1, // 22 (same as 3)
      x0,
      y0,
      z1, // 23 (same as 0)
    ]);

    // Colors - we'll vary colors by face for visual interest
    const colors = new Float32Array([
      // Front face - red
      color.x,
      color.y,
      color.z,
      color.w,
      color.x,
      color.y,
      color.z,
      color.w,
      color.x,
      color.y,
      color.z,
      color.w,
      color.x,
      color.y,
      color.z,
      color.w,

      // Back face - green
      color.y,
      color.x,
      color.z,
      color.w,
      color.y,
      color.x,
      color.z,
      color.w,
      color.y,
      color.x,
      color.z,
      color.w,
      color.y,
      color.x,
      color.z,
      color.w,

      // Top face - blue
      color.z,
      color.x,
      color.y,
      color.w,
      color.z,
      color.x,
      color.y,
      color.w,
      color.z,
      color.x,
      color.y,
      color.w,
      color.z,
      color.x,
      color.y,
      color.w,

      // Bottom face - yellow
      color.x,
      color.y,
      0.0,
      color.w,
      color.x,
      color.y,
      0.0,
      color.w,
      color.x,
      color.y,
      0.0,
      color.w,
      color.x,
      color.y,
      0.0,
      color.w,

      // Right face - cyan
      0.0,
      color.y,
      color.z,
      color.w,
      0.0,
      color.y,
      color.z,
      color.w,
      0.0,
      color.y,
      color.z,
      color.w,
      0.0,
      color.y,
      color.z,
      color.w,

      // Left face - magenta
      color.x,
      0.0,
      color.z,
      color.w,
      color.x,
      0.0,
      color.z,
      color.w,
      color.x,
      0.0,
      color.z,
      color.w,
      color.x,
      0.0,
      color.z,
      color.w,
    ]);

    // Indices (6 faces * 2 triangles per face * 3 vertices per triangle)
    const indices = new Uint16Array([
      // Front face
      0, 1, 2, 0, 2, 3,

      // Back face
      4, 6, 5, 4, 7, 6,

      // Top face
      8, 9, 10, 8, 10, 11,

      // Bottom face
      12, 14, 13, 12, 15, 14,

      // Right face
      16, 18, 17, 16, 19, 18,

      // Left face
      20, 21, 22, 20, 22, 23,
    ]);

    // Create buffers
    const vertexBuffer = device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    const colorBuffer = device.createBuffer({
      size: colors.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(colorBuffer, 0, colors);

    const indexBuffer = device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, indices);

    return {
      vertexBuffer,
      colorBuffer,
      indexBuffer,
      indexCount: indices.length,
    };
  }

  /**
   * Create a simple quad (for stencil masks)
   */
  public static createQuad(
    device: GPUDevice,
    width: number = 1.0,
    height: number = 1.0,
    color: Vec4 = { x: 1.0, y: 1.0, z: 1.0, w: 1.0 },
    position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
  ): ObjectGeometry {
    // Calculate corners based on center position
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const x0 = position.x - halfWidth;
    const x1 = position.x + halfWidth;
    const y0 = position.y - halfHeight;
    const y1 = position.y + halfHeight;
    const z = position.z;

    // Vertices
    const vertices = new Float32Array([
      // Position (XYZ)
      x0,
      y0,
      z, // Vertex 0
      x1,
      y0,
      z, // Vertex 1
      x1,
      y1,
      z, // Vertex 2
      x0,
      y1,
      z, // Vertex 3
    ]);

    // Colors
    const colors = new Float32Array([
      // Color (RGBA)
      color.x,
      color.y,
      color.z,
      color.w, // Vertex 0
      color.x,
      color.y,
      color.z,
      color.w, // Vertex 1
      color.x,
      color.y,
      color.z,
      color.w, // Vertex 2
      color.x,
      color.y,
      color.z,
      color.w, // Vertex 3
    ]);

    // Indices
    const indices = new Uint16Array([
      0,
      1,
      2, // Triangle 1
      0,
      2,
      3, // Triangle 2
    ]);

    // Create buffers
    const vertexBuffer = device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    const colorBuffer = device.createBuffer({
      size: colors.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(colorBuffer, 0, colors);

    const indexBuffer = device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, indices);

    return {
      vertexBuffer,
      colorBuffer,
      indexBuffer,
      indexCount: indices.length,
    };
  }
}
