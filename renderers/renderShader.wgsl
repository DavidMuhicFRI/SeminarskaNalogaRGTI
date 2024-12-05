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
    @location(3) shadowPos : vec4f,
}

struct FragmentInput {
    @location(0) position : vec3f,
    @location(1) texcoords : vec2f,
    @location(2) normal : vec3f,
    @location(3) shadowPos : vec4f,
}

struct FragmentOutput {
    @location(0) color : vec4f,
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

struct ModelUniforms {
    modelMatrix : mat4x4f,
    normalMatrix : mat3x3f,
}

struct MaterialUniforms {
    baseFactor : vec4f,
}


@group(0) @binding(0) var<uniform> camera : CameraUniforms;
@group(1) @binding(0) var<uniform> light : LightUniforms;
@group(2) @binding(0) var<uniform> model : ModelUniforms;
@group(3) @binding(0) var<uniform> material : MaterialUniforms;
@group(3) @binding(1) var uTexture : texture_2d<f32>;
@group(3) @binding(2) var uSampler : sampler;
@group(3) @binding(3) var shadowMap: texture_depth_2d;
@group(3) @binding(4) var shadowSampler: sampler_comparison;


@vertex
fn vertex(input : VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.clipPosition = camera.projectionMatrix * camera.viewMatrix * model.modelMatrix * vec4(input.position, 1.0);
    output.position = (model.modelMatrix * vec4(input.position, 1.0)).xyz;
    output.texcoords = input.texcoords;
    output.normal = model.normalMatrix * input.normal;
    output.shadowPos =  light.lightProjectionMatrix * light.lightViewMatrix * model.modelMatrix * vec4(input.position, 1.0);
    return output;
}


@fragment
fn fragment(input : FragmentInput) -> FragmentOutput {
    var output : FragmentOutput;

    let d = distance(input.position, light.position);
    let a = 1 / dot(light.attenuation, vec3(1.0, d, d * d));
    let N = normalize(input.normal);
    let L = normalize(light.position - input.position);
    let R = normalize(reflect(-L, N));
    let D = normalize(light.direction);
    let l = max(dot(N, L), 0) * 2;

    var c = vec3f(0.0, 0.0, 0.0);
    if(dot(-L,D) <= cos(light.fi)){
        c = vec3f(0.0, 0.0, 0.0);
    }else {
        c = light.color * exp(-pow( 1.25/light.fi * acos(dot(-L,D)), 8));
    }

    var v = 0.0;
    var s = vec2(input.shadowPos.x/input.shadowPos.w * 0.5 + 0.5, input.shadowPos.y/input.shadowPos.w * -0.5 + 0.5);
    for (var y = -1; y <= 1; y++) {
        for (var x = -1; x <= 1; x++) {
            v += textureSampleCompare(shadowMap, shadowSampler, s + vec2<f32>(vec2(x, y)) * (1.0 / 4096), (input.shadowPos.z - 0.01) / input.shadowPos.w);
        }
    }

    let sPosition = input.shadowPos / input.shadowPos.w;
    if(sPosition.x < -1.0 || sPosition.x > 1.0 || sPosition.y < -1.0 || sPosition.y > 1.0 || sPosition.z < 0.0 || sPosition.z > 1.0){
        v = 0.0;
    }else{
        v /= 3.0;
        v = min(v, 2.0);
    }

    output.color = vec4(textureSample(uTexture, uSampler, input.texcoords).rgb * (l * a * c * v * light.intensity + (light.ambient * light.color / d) * 1.3), 1.0);
    return output;
}
