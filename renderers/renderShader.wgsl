struct VertexInput {
    @location(0) position : vec3f,
    @location(1) texcoords : vec2f,
    @location(2) normal : vec3f,
}

struct VertexOutput {
    @builtin(position) clipPosition : vec4f,
    @location(0) position : vec3f,
    @location(1) texcoords : vec2f,
    @location(2) normal : vec3f,
    @location(3) shadowPosition : vec4f,
}

struct FragmentInput {
    @location(0) position : vec3f,
    @location(1) texcoords : vec2f,
    @location(2) normal : vec3f,
    @location(3) shadowPosition : vec4f,
}

struct FragmentOutput {
    @location(0) color : vec4f,
}

struct ModelUniforms {
    modelMatrix : mat4x4f,
    normalMatrix : mat3x3f,
}

struct MaterialUniforms {
    baseFactor : vec4f,
}

struct CameraUniforms {
    viewMatrix : mat4x4f,
    projectionMatrix : mat4x4f,
}

struct LightUniforms {
    lightViewMatrix : mat4x4f,
    lightProjectionMatrix : mat4x4f,
    color : vec3f,
    position : vec3f,
    attenuation : vec3f,
    direction : vec3f,
    intensity : f32,
    ambient : f32,
    fi : f32,
}


@group(0) @binding(0) var<uniform> camera : CameraUniforms;
@group(1) @binding(0) var<uniform> light : LightUniforms;
@group(2) @binding(0) var<uniform> model : ModelUniforms;
@group(3) @binding(0) var<uniform> material : MaterialUniforms;
@group(3) @binding(1) var texture : texture_2d<f32>;
@group(3) @binding(2) var nSampler : sampler;
@group(3) @binding(3) var shadowDepth: texture_depth_2d;
@group(3) @binding(4) var sSampler: sampler_comparison;


@vertex
fn vertex(input : VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.clipPosition = camera.projectionMatrix * camera.viewMatrix * model.modelMatrix * vec4(input.position, 1.0);
    output.position = (model.modelMatrix * vec4(input.position, 1.0)).xyz;
    output.texcoords = input.texcoords;
    output.normal = model.normalMatrix * input.normal;
    output.shadowPosition =  light.lightProjectionMatrix * light.lightViewMatrix * model.modelMatrix * vec4(input.position, 1.0);
    return output;
}


@fragment
fn fragment(input : FragmentInput) -> FragmentOutput {
    var output : FragmentOutput;

    let distance = distance(input.position, light.position);
    let attenuation = 1 / dot(light.attenuation, vec3(1.0, distance, distance * distance));
    let lambert = max(dot(normalize(input.normal), normalize(light.position - input.position) * 2), 0);
    var v = 0.0;
    var s = vec2(input.shadowPosition.x/input.shadowPosition.w * 0.5 + 0.5, input.shadowPosition.y/input.shadowPosition.w * -0.5 + 0.5);

    for (var y = -1; y <= 1; y++) {
        for (var x = -1; x <= 1; x++) {
            v += textureSampleCompare(shadowDepth, sSampler, s + vec2<f32>(vec2(x, y)) * (1.0 / 4096), (input.shadowPosition.z - 0.01) / input.shadowPosition.w);
        }
    }
    v /= 9.0;

    let modification = (v * light.intensity * lambert * attenuation) + (light.ambient * light.color / distance) * 1.5;
    output.color = vec4(textureSample(texture, nSampler, input.texcoords).rgb * modification, 1.0);
    return output;
}
