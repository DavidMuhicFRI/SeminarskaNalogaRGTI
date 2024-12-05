import { vec3, vec4, mat3, mat4 } from '../glm.js';

import * as WebGPU from '../WebGPU.js';

import { Camera } from '../core.js';
import { BaseRenderer } from './BaseRenderer.js';

import {
    getLocalModelMatrix,
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    getModels,
    getGlobalRotation,
} from '../core/SceneUtils.js';
import { Light } from '../core/Light.js';

const vertexLayout = {
    arrayStride: 32,
    attributes: [
        {
            name: 'position',
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
        },
        {
            name: 'texcoords',
            shaderLocation: 1,
            offset: 12,
            format: 'float32x2',
        },
        {
            name: 'normal',
            shaderLocation: 2,
            offset: 20,
            format: 'float32x3',
        },
    ],
};

const materialLayout = {
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: {},
    },
    {
      binding: 1,
      visibility: GPUShaderStage.FRAGMENT,
      texture: {},
    },
    {
      binding: 2,
      visibility: GPUShaderStage.FRAGMENT,
      sampler: {},
    },
    {
      binding: 3,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      texture: {
        sampleType: 'depth',
      },
    },
    {
      binding: 4,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      sampler: {
        type: 'comparison',
      },
    },
  ],
};

const modelLayout = {
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: {},
    },
  ],
};


const cameraLayout = {
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {},
        },
    ],
};

const lightLayout = {
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {},
        },
    ],
};

export class Renderer extends BaseRenderer {
    constructor(canvas) {
        super(canvas);
    }

    async initialize() {
        await super.initialize();
        const shadowShader = await fetch(new URL('shadowShader.wgsl', import.meta.url)).then(response => response.text());

        this.shadowPipeline = await this.device.createRenderPipelineAsync({
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: [
                    this.device.createBindGroupLayout(lightLayout),
                    this.device.createBindGroupLayout(modelLayout),
                ],
            }),
            vertex: {
                module: this.device.createShaderModule({ code: shadowShader }),
                entryPoint: 'vertex',
                buffers: [ vertexLayout ],
            },
            depthStencil : {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            }
        });

        this.shadowTexture = this.device.createTexture({
            size: [4096, 4096],
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            format: 'depth24plus'
        });
        this.shadowTextureView = this.shadowTexture.createView();
        this.shadowSampler = this.device.createSampler({ compare: 'less' })

        //renderShader
        const renderShader = await fetch(new URL('renderShader.wgsl', import.meta.url)).then(response => response.text());

        this.renderPipeline = await this.device.createRenderPipelineAsync({
            layout: this.device.createPipelineLayout({
              bindGroupLayouts: [
                this.device.createBindGroupLayout(cameraLayout),
                this.device.createBindGroupLayout(lightLayout),
                this.device.createBindGroupLayout(modelLayout),
                this.device.createBindGroupLayout(materialLayout),
              ],
            }),
            vertex: {
                module: this.device.createShaderModule({ code: renderShader }),
                entryPoint: 'vertex',
                buffers: [ vertexLayout ],
            },
            fragment: {
                module: this.device.createShaderModule({ code: renderShader }),
                entryPoint: 'fragment',
                targets: [{ format: this.format }],
            },
            depthStencil: {
                format: 'depth24plus',
                depthWriteEnabled: true,
                depthCompare: 'less',
            },
        });

        this.recreateDepthTexture();
    }

    recreateDepthTexture() {
        this.depthTexture?.destroy();
        this.depthTexture = this.device.createTexture({
            format: 'depth24plus',
            size: [this.canvas.width, this.canvas.height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    prepareNode(node) {
        if (this.gpuObjects.has(node)) {
            return this.gpuObjects.get(node);
        }
        const modelUniformBuffer = this.device.createBuffer({
            size: 128,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const modelBindGroup = this.device.createBindGroup({
            layout: this.device.createBindGroupLayout(modelLayout),
            entries: [
                { binding: 0, resource: { buffer: modelUniformBuffer } },
            ],
        });

        const gpuObjects = { modelUniformBuffer, modelBindGroup };
        this.gpuObjects.set(node, gpuObjects);
        return gpuObjects;
    }

    prepareCamera(camera) {
        if (this.gpuObjects.has(camera)) {
            return this.gpuObjects.get(camera);
        }

        const cameraUniformBuffer = this.device.createBuffer({
            size: 128,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const cameraBindGroup = this.device.createBindGroup({
            layout: this.device.createBindGroupLayout(cameraLayout),
            entries: [
                { binding: 0, resource: { buffer: cameraUniformBuffer } },
            ],
        });

        const gpuObjects = { cameraUniformBuffer, cameraBindGroup };
        this.gpuObjects.set(camera, gpuObjects);
        return gpuObjects;
    }

    prepareLight(light) {
        if (this.gpuObjects.has(light)) {
            return this.gpuObjects.get(light);
        }

        const lightUniformBuffer = this.device.createBuffer({
            size: 208,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const lightBindGroup = this.device.createBindGroup({
            layout: this.device.createBindGroupLayout(lightLayout),
            entries: [
                { binding: 0, resource: { buffer: lightUniformBuffer } },
            ],
        });

        const gpuObjects = { lightUniformBuffer, lightBindGroup };
        this.gpuObjects.set(light, gpuObjects);
        return gpuObjects;
    }

    prepareMaterial(material) {
        if (this.gpuObjects.has(material)) {
            return this.gpuObjects.get(material);
        }

        const materialUniformBuffer = this.device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const materialBindGroup = this.device.createBindGroup({
            layout: this.device.createBindGroupLayout(materialLayout),
            entries: [
                { binding: 0, resource: { buffer: materialUniformBuffer } },
                { binding: 1, resource: this.prepareImage(material.baseTexture.image).gpuTexture.createView() },
                { binding: 2, resource: this.prepareSampler(material.baseTexture.sampler).gpuSampler },
                { binding: 3, resource: this.shadowTextureView },
                { binding: 4, resource: this.shadowSampler },
            ],
        });

        const gpuObjects = { materialUniformBuffer, materialBindGroup };
        this.gpuObjects.set(material, gpuObjects);
        return gpuObjects;
    }

    render(scene, camera, light) {
        if (this.depthTexture.width !== this.canvas.width || this.depthTexture.height !== this.canvas.height) {
            this.recreateDepthTexture();
        }

        const encoder = this.device.createCommandEncoder();
        this.shadowPass = encoder.beginRenderPass({
            colorAttachments: [],
            depthStencilAttachment: {
                view: this.shadowTextureView,
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            }
        });
        this.shadowPass.setPipeline(this.shadowPipeline);

        const { lightUniformBuffer, lightBindGroup } = this.prepareLight(light.getComponentOfType(Light));
        this.queueLight(light, lightUniformBuffer, true);
        this.shadowPass.setBindGroup(0, lightBindGroup);

        this.renderShadows(scene);
        this.shadowPass.end();


        this.renderPass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: [0.1, 0.1, 0.6, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                }
            ],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'discard',
            },
        });
        this.renderPass.setPipeline(this.renderPipeline);

        const cameraComponent = camera.getComponentOfType(Camera);
        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);
        const { cameraUniformBuffer, cameraBindGroup } = this.prepareCamera(cameraComponent);
        this.device.queue.writeBuffer(cameraUniformBuffer, 0, viewMatrix);
        this.device.queue.writeBuffer(cameraUniformBuffer, 64, projectionMatrix);
        this.renderPass.setBindGroup(0, cameraBindGroup);

        this.queueLight(light, lightUniformBuffer, false);
        this.renderPass.setBindGroup(1, lightBindGroup);

        this.renderNode(scene);
        this.renderPass.end();
        this.device.queue.submit([encoder.finish()]);
    }

    queueLight(light, lightUniformBuffer, shadow){
      const lightComp = light.getComponentOfType(Light);
      if(shadow){
        this.device.queue.writeBuffer(lightUniformBuffer, 0, getGlobalViewMatrix(light)); //viewMatrix
        this.device.queue.writeBuffer(lightUniformBuffer, 64, lightComp.perspectiveMatrix); //projectionMatrix
      }else{
        let direction = vec4.transformQuat(vec4.create(), vec4.set(vec4.create(),0,0,-1,1), getGlobalRotation(light));
        this.device.queue.writeBuffer(lightUniformBuffer, 0, getGlobalViewMatrix(light)); //viewMatrix
        this.device.queue.writeBuffer(lightUniformBuffer, 64, lightComp.perspectiveMatrix); //projectionMatrix
        this.device.queue.writeBuffer(lightUniformBuffer, 128, vec3.scale(vec3.create(), lightComp.color, 1 / 255)); //color
        this.device.queue.writeBuffer(lightUniformBuffer, 144, mat4.getTranslation(vec3.create(), getGlobalModelMatrix(light))); //position
        this.device.queue.writeBuffer(lightUniformBuffer, 160, vec3.clone(lightComp.attenuation)); //attenuation
        this.device.queue.writeBuffer(lightUniformBuffer, 176, vec3.fromValues(direction[0], direction[1], direction[2])); //direction
        this.device.queue.writeBuffer(lightUniformBuffer, 188, new Float32Array([lightComp.intensity, lightComp.ambient, lightComp.fi])); //intensity, ambient, fi
      }
    }

    renderNode(node, modelMatrix = mat4.create()) {
        const localMatrix = getLocalModelMatrix(node);
        modelMatrix = mat4.multiply(mat4.create(), modelMatrix, localMatrix);
        const { modelUniformBuffer, modelBindGroup } = this.prepareNode(node);
        const normalMatrix = mat4.normalFromMat4(mat4.create(), modelMatrix);
        this.device.queue.writeBuffer(modelUniformBuffer, 0, modelMatrix);
        this.device.queue.writeBuffer(modelUniformBuffer, 64, normalMatrix);
        this.renderPass.setBindGroup(2, modelBindGroup);

        for (const model of getModels(node)) {
          for (const primitive of model.primitives) {
            const { materialUniformBuffer, materialBindGroup } = this.prepareMaterial(primitive.material);
            this.device.queue.writeBuffer(materialUniformBuffer, 0, new Float32Array([primitive.material.baseFactor]));
            this.renderPass.setBindGroup(3, materialBindGroup);

            const { vertexBuffer, indexBuffer } = this.prepareMesh(primitive.mesh, vertexLayout);
            this.renderPass.setVertexBuffer(0, vertexBuffer);
            this.renderPass.setIndexBuffer(indexBuffer, 'uint32');
            this.renderPass.drawIndexed(primitive.mesh.indices.length);
          }
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }

  renderShadows(node, modelMatrix = mat4.create()) {
    modelMatrix = mat4.multiply(mat4.create(), modelMatrix, getLocalModelMatrix(node));
    const { modelUniformBuffer, modelBindGroup } = this.prepareNode(node);
    this.device.queue.writeBuffer(modelUniformBuffer, 0, modelMatrix);
    this.shadowPass.setBindGroup(1, modelBindGroup);

    for (const model of getModels(node)) {
      for (const primitive of model.primitives) {
        const { vertexBuffer, indexBuffer } = this.prepareMesh(primitive.mesh, vertexLayout);
        this.shadowPass.setVertexBuffer(0, vertexBuffer);
        this.shadowPass.setIndexBuffer(indexBuffer, 'uint32');
        this.shadowPass.drawIndexed(primitive.mesh.indices.length);
      }
    }

    for (const child of node.children) {
      this.renderShadows(child, modelMatrix);
    }
  }

}
