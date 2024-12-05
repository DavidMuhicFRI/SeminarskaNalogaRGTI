struct VertexInput {
    @location(0) position : vec3f,
}

struct VertexOutput {
    @builtin(position) position : vec4f,
}

struct LightUniforms {
    lightViewMatrix : mat4x4f,
    lightProjectionMatrix : mat4x4f,
}

struct ModelUniforms {
    modelMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> light : LightUniforms;
@group(1) @binding(0) var<uniform> model : ModelUniforms;

@vertex
fn vertex(input : VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.position = light.lightProjectionMatrix * light.lightViewMatrix * model.modelMatrix * vec4f(input.position, 1.0);
    return output;
}
