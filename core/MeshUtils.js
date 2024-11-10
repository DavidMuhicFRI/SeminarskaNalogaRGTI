import { quat, vec3, vec4, mat3, mat4 } from '../glm.js';

export function transformVertex(vertex, matrix,
    normalMatrix = mat3.normalFromMat4(mat3.create(), matrix),
    tangentMatrix = mat3.fromMat4(mat3.create(), matrix),
) {
    vec3.transformMat4(vertex.position, vertex.position, matrix);
    vec3.transformMat3(vertex.normal, vertex.normal, normalMatrix);
    vec3.transformMat3(vertex.tangent, vertex.tangent, tangentMatrix);
}

export function transformMesh(mesh, matrix,
    normalMatrix = mat3.normalFromMat4(mat3.create(), matrix),
    tangentMatrix = mat3.fromMat4(mat3.create(), matrix),
) {
    for (const vertex of mesh.vertices) {
        transformVertex(vertex, matrix, normalMatrix, tangentMatrix);
    }
}

export function calculateAxisAlignedBoundingBox(mesh) {
    const initial = {
        min: vec3.clone(mesh.vertices[0].position),
        max: vec3.clone(mesh.vertices[0].position),
    };

    return {
        min: mesh.vertices.reduce((a, b) => vec3.min(a, a, b.position), initial.min),
        max: mesh.vertices.reduce((a, b) => vec3.max(a, a, b.position), initial.max),
    };
}

export function mergeAxisAlignedBoundingBoxes(boxes) {
  if (boxes.length === 0) {
    console.error("Error: 'boxes' array is empty in mergeAxisAlignedBoundingBoxes.");
    return null;
  }

  const initialBox = boxes.find(box => box && box.min && box.max);
  if (!initialBox) {
    console.error("Error: No valid bounding boxes in 'boxes' array.");
    return null;
  }

  const initial = {
    min: vec3.clone(initialBox.min),
    max: vec3.clone(initialBox.max),
  };

  return {
    min: boxes.reduce((accMin, box) => box && box.min ? vec3.min(accMin, accMin, box.min) : accMin, initial.min),
    max: boxes.reduce((accMax, box) => box && box.max ? vec3.max(accMax, accMax, box.max) : accMax, initial.max),
  };
}
