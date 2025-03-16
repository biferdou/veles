import { Vec3 } from "../types";

/**
 * Create an identity matrix
 */
export function createIdentityMatrix(): Float32Array {
  const matrix = new Float32Array(16);
  matrix[0] = 1;
  matrix[5] = 1;
  matrix[10] = 1;
  matrix[15] = 1;
  return matrix;
}

/**
 * Create a perspective projection matrix
 */
export function createProjectionMatrix(
  fov: number,
  aspect: number,
  near: number,
  far: number
): Float32Array {
  const f = 1.0 / Math.tan(fov / 2);
  const nf = 1 / (near - far);

  const matrix = new Float32Array(16);
  matrix[0] = f / aspect;
  matrix[5] = f;
  matrix[10] = (far + near) * nf;
  matrix[11] = -1;
  matrix[14] = 2 * far * near * nf;
  matrix[15] = 0;

  return matrix;
}

/**
 * Create a view matrix from position and target
 */
export function createViewMatrix(
  position: Vec3,
  target: Vec3 = { x: 0, y: 0, z: 0 },
  up: Vec3 = { x: 0, y: 1, z: 0 }
): Float32Array {
  // Calculate forward vector (z)
  const zAxis = normalizeVector({
    x: position.x - target.x,
    y: position.y - target.y,
    z: position.z - target.z,
  });

  // Calculate right vector (x) as cross product of up and forward
  const xAxis = normalizeVector(crossProduct(up, zAxis));

  // Calculate real up vector (y) as cross product of forward and right
  const yAxis = normalizeVector(crossProduct(zAxis, xAxis));

  // Create the view matrix
  const matrix = new Float32Array(16);

  // First row (right vector)
  matrix[0] = xAxis.x;
  matrix[1] = yAxis.x;
  matrix[2] = zAxis.x;
  matrix[3] = 0;

  // Second row (up vector)
  matrix[4] = xAxis.y;
  matrix[5] = yAxis.y;
  matrix[6] = zAxis.y;
  matrix[7] = 0;

  // Third row (forward vector)
  matrix[8] = xAxis.z;
  matrix[9] = yAxis.z;
  matrix[10] = zAxis.z;
  matrix[11] = 0;

  // Fourth row (translation)
  matrix[12] = -dotProduct(xAxis, position);
  matrix[13] = -dotProduct(yAxis, position);
  matrix[14] = -dotProduct(zAxis, position);
  matrix[15] = 1;

  return matrix;
}

/**
 * Create a rotation matrix around the Y axis
 */
export function createRotationYMatrix(angle: number): Float32Array {
  const matrix = createIdentityMatrix();
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  matrix[0] = c;
  matrix[2] = -s;
  matrix[8] = s;
  matrix[10] = c;

  return matrix;
}

/**
 * Create a rotation matrix around the X axis
 */
export function createRotationXMatrix(angle: number): Float32Array {
  const matrix = createIdentityMatrix();
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  matrix[5] = c;
  matrix[6] = s;
  matrix[9] = -s;
  matrix[10] = c;

  return matrix;
}

/**
 * Create a rotation matrix around the Z axis
 */
export function createRotationZMatrix(angle: number): Float32Array {
  const matrix = createIdentityMatrix();
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  matrix[0] = c;
  matrix[1] = s;
  matrix[4] = -s;
  matrix[5] = c;

  return matrix;
}

/**
 * Create a combined rotation matrix from Euler angles (XYZ order)
 */
export function createRotationMatrix(
  x: number,
  y: number,
  z: number
): Float32Array {
  // Use matrix multiplication to combine rotations
  const rx = createRotationXMatrix(x);
  const ry = createRotationYMatrix(y);
  const rz = createRotationZMatrix(z);

  // Apply Z, then Y, then X rotations
  const temp = multiplyMatrices(ry, rz);
  return multiplyMatrices(rx, temp);
}

/**
 * Create a translation matrix
 */
export function createTranslationMatrix(
  x: number,
  y: number,
  z: number
): Float32Array {
  const matrix = createIdentityMatrix();
  matrix[12] = x;
  matrix[13] = y;
  matrix[14] = z;
  return matrix;
}

/**
 * Create a scaling matrix
 */
export function createScalingMatrix(
  x: number,
  y: number,
  z: number
): Float32Array {
  const matrix = createIdentityMatrix();
  matrix[0] = x;
  matrix[5] = y;
  matrix[10] = z;
  return matrix;
}

/**
 * Multiply two matrices
 */
export function multiplyMatrices(
  a: Float32Array,
  b: Float32Array
): Float32Array {
  const result = new Float32Array(16);

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[i * 4 + k] * b[k * 4 + j];
      }
      result[i * 4 + j] = sum;
    }
  }

  return result;
}

/**
 * Calculate the cross product of two vectors
 */
export function crossProduct(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Calculate the dot product of two vectors
 */
export function dotProduct(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Normalize a vector
 */
export function normalizeVector(v: Vec3): Vec3 {
  const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  return {
    x: v.x / length,
    y: v.y / length,
    z: v.z / length,
  };
}

/**
 * Create a model matrix from position, rotation, and scale
 */
export function createModelMatrix(
  position: Vec3,
  rotation: Vec3 = { x: 0, y: 0, z: 0 },
  scale: Vec3 = { x: 1, y: 1, z: 1 }
): Float32Array {
  const translationMatrix = createTranslationMatrix(
    position.x,
    position.y,
    position.z
  );
  const rotationMatrix = createRotationMatrix(
    rotation.x,
    rotation.y,
    rotation.z
  );
  const scaleMatrix = createScalingMatrix(scale.x, scale.y, scale.z);

  // Apply scale, then rotation, then translation
  const temp = multiplyMatrices(rotationMatrix, scaleMatrix);
  return multiplyMatrices(translationMatrix, temp);
}
