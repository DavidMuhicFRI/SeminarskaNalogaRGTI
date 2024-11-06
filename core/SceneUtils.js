import { mat4, vec4, quat } from '../glm.js';

import { Camera } from './Camera.js';
import { Model } from './Model.js';
import { Transform } from './Transform.js';

export function getLocalModelMatrix(node) {
    const matrix = mat4.create();
    for (const transform of node.getComponentsOfType(Transform)) {
        matrix.multiply(transform.matrix);
    }
    return matrix;
}

export function getGlobalModelMatrix(node) {
    if (node.parent) {
        const parentMatrix = getGlobalModelMatrix(node.parent);
        const modelMatrix = getLocalModelMatrix(node);
        return parentMatrix.multiply(modelMatrix);
    } else {
        return getLocalModelMatrix(node);
    }
}

export function getLocalViewMatrix(node) {
    return getLocalModelMatrix(node).invert();
}

export function getGlobalViewMatrix(node) {
    return getGlobalModelMatrix(node).invert();
}

export function getProjectionMatrix(node) {
    return node.getComponentOfType(Camera)?.projectionMatrix ?? mat4.create();
}

export function getModels(node) {
    return node.getComponentsOfType(Model);
}

export function getGlobalRotation(node) {
  if (node.parent) {
    const parentRotation = getGlobalRotation(node.parent);
    const localRotation = node.getComponentOfType(Transform).rotation;
    return quat.multiply(quat.create(), parentRotation, localRotation);
  } else {
    const transform = node.getComponentOfType(Transform);
    if (transform) {
      return transform.rotation;
    }
    return quat.create();
  }
}
