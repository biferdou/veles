import { ObjectGeometry, Vec4 } from "../types";

export class SphereGeometry {
  /**
   * Create a sphere geometry
   */
  public static create(
    device: GPUDevice,
    radius: number = 0.5,
    widthSegments: number = 16,
    heightSegments: number = 12,
    color: Vec4 = { x: 1.0, y: 1.0, z: 1.0, w: 1.0 },
    position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
  ): ObjectGeometry {
    // Ensure segments are reasonable
    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));

    // Calculate vertices, indices and UVs
    const vertices: number[] = [];
    const indices: number[] = [];
    const grid: number[][] = [];

    // Generate vertices
    for (let iy = 0; iy <= heightSegments; iy++) {
      const v = iy / heightSegments;
      const row: number[] = [];

      for (let ix = 0; ix <= widthSegments; ix++) {
        const u = ix / widthSegments;

        // Calculate position on unit sphere
        const phi = u * Math.PI * 2;
        const theta = v * Math.PI;

        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        // Convert from spherical to Cartesian coordinates
        const nx = cosPhi * sinTheta;
        const ny = cosTheta;
        const nz = sinPhi * sinTheta;

        // Scale by radius and translate to position
        vertices.push(
          position.x + radius * nx,
          position.y + radius * ny,
          position.z + radius * nz
        );

        row.push(vertices.length / 3 - 1);
      }

      grid.push(row);
    }

    // Generate indices
    for (let iy = 0; iy < heightSegments; iy++) {
      for (let ix = 0; ix < widthSegments; ix++) {
        const a = grid[iy][ix + 1];
        const b = grid[iy][ix];
        const c = grid[iy + 1][ix];
        const d = grid[iy + 1][ix + 1];

        if (iy !== 0) indices.push(a, b, d);
        if (iy !== heightSegments - 1) indices.push(b, c, d);
      }
    }

    // Create color array - make it gradient based on vertical position
    const colors = new Float32Array((vertices.length / 3) * 4);
    for (let i = 0; i < vertices.length / 3; i++) {
      // Y position as percentage of height (normalized to 0-1 range)
      const normalizedY =
        (vertices[i * 3 + 1] - (position.y - radius)) / (2 * radius);

      // Create color gradient from top to bottom
      if (normalizedY < 0.2) {
        // Bottom 20% - blue shade
        colors[i * 4 + 0] = 0.0; // R
        colors[i * 4 + 1] = 0.0; // G
        colors[i * 4 + 2] = 0.8 + normalizedY; // B
      } else if (normalizedY < 0.5) {
        // Lower middle - green to cyan gradient
        colors[i * 4 + 0] = 0.0; // R
        colors[i * 4 + 1] = 0.5 + normalizedY; // G
        colors[i * 4 + 2] = 0.5 + normalizedY / 2; // B
      } else if (normalizedY < 0.8) {
        // Upper middle - yellow to green gradient
        colors[i * 4 + 0] = (normalizedY - 0.5) * 2; // R
        colors[i * 4 + 1] = 0.8; // G
        colors[i * 4 + 2] = (0.8 - normalizedY) * 2; // B
      } else {
        // Top 20% - orange to red gradient
        colors[i * 4 + 0] = 1.0; // R
        colors[i * 4 + 1] = (1.0 - normalizedY) * 5; // G
        colors[i * 4 + 2] = 0.0; // B
      }

      // Full opacity
      colors[i * 4 + 3] = color.w;
    }

    // Convert to typed arrays
    const verticesArray = new Float32Array(vertices);
    const indicesArray = new Uint16Array(indices);

    // Create buffers
    const vertexBuffer = device.createBuffer({
      size: verticesArray.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, verticesArray);

    const colorBuffer = device.createBuffer({
      size: colors.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(colorBuffer, 0, colors);

    const indexBuffer = device.createBuffer({
      size: indicesArray.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, indicesArray);

    return {
      vertexBuffer,
      colorBuffer,
      indexBuffer,
      indexCount: indicesArray.length,
    };
  }
}
