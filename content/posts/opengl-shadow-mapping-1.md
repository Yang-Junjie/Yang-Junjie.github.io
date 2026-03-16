---
date : '2026-03-16'
draft : false
title : '【CG】Shadow Mapping 使用OpenGL实现'
tags:
  - graphics
  - opengl

categories:
  - blog

cover:
  image: "images/opengl/shadowmapping.png"
  alt: "cover"
math: true
---

如果你玩过现代 3D 游戏那么其中大多数的的动态物体阴影都是 **阴影映射（Shadow Mapping）**这个算法的变种。

所以为了研究其他的现代的实时动态阴影我们必须先学习一下 Shadow Mapping 的原理，以及如何使用OpenGL去实现。

## 原理

他的思想原理非常简单，如果一个点能被光源看到（直射）并且也能被摄像机看到，那么这个点就在光照下（不在阴影中），反之如果一个点只能被摄像机看到，而不能被光源看到，那么他就在阴影中。

详细的实现是：

- 对于 **平行光（Directional Light）**：由于平行光的位置我们假设是无限远的，但是我们需要从光源位置看向场景 $(0,0,0)$ 点，所以我们为了简便直接假设光源位置在 从 $(0,0,0)$ 点沿着光照方向的反方向位移一段距离得到一个新的点  $\mathbf P$ ，以这个 $\mathbf P$ 点作为我们的光源位置（事实上这个方案非常不严谨，因为如果位移的距离不够，但是摄像机的视锥体包含了更多的场景，就会导致某些场景区域计算不到阴影位置。一般可以根据视锥体动态计算，并且光源的` LookAt` 目标通常应该是 **“视锥体中心”** ）。
  - Pass one：有了 $\mathbf P$点，我们从该点使用正交投影并定义 `lookAt`，走一遍渲染管线，不需要计算着色，将深度信息保存到`TexImage2D`上
  - Pass two：再从摄像机走一遍正常的管线，在 Fragment Shader中结合保存的深度信息实现该点是否在阴影中的逻辑。
- 对于 **聚光灯（Spot Light）**:因为聚光灯都有一个明确的方向、张角和位置，所以我们不需要做那么多假设在平行光中的问题在这里都没有。
  - Pass one：我们只需要在聚光灯的位置看向它的**照射方向**，并且使用透视投影`FOV`应该与聚光灯的参数一致，并定义`lookAt`，走一遍渲染管线，不需要计算着色，将深度信息保存到`TexImage2D`上
  - Pass two：再从摄像机走一遍正常的管线，在 Fragment Shader中结合保存的深度信息实现该点是否在阴影中的逻辑就行了。
- 对于 **点光源（Point Light）**：点光源，有具体的位置，但是点光源四面八方都有光照，所以我们需要特殊处理。
  - Pass one：我们通过在点光源的位置向上下左右前后六个方向都计算一次深度信息，存入一张 **Cube Map**
  - Pass two：再从摄像机走一遍正常的管线，在 Fragment Shader中结合保存的Cube Map实现该点是否在阴影中的逻辑就行了。

## 实现

这里只实现平行光的Shadow Mapping。

首先我们定义 Pass one 中要使用的 FBO 和 TexImage2D，和Shader

```c++
std::unique_ptr<gl::Shader> depth_shader_;
GLuint depth_map_fbo_ = 0;
GLuint depth_map_texture_ = 0;

// TexImage2D的大小
const unsigned int shadow_width_ = 1'024;
const unsigned int shadow_height_ = 1'024;
```

并且初始化

```c++
depth_shader_ = std::make_unique<gl::Shader>();
depth_shader_->CompileFromFile("shaders/AdvanceLighting/shadow_mapping.vert",
                                   "shaders/AdvanceLighting/shadow_mapping.frag");

// Depth map texture for shadow mapping
glCreateTextures(GL_TEXTURE_2D, 1, &depth_map_texture_);
glTextureStorage2D(depth_map_texture_, 1, GL_DEPTH_COMPONENT24, shadow_width_, shadow_height_);
glTextureParameteri(depth_map_texture_, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
glTextureParameteri(depth_map_texture_, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
glTextureParameteri(depth_map_texture_, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER);
glTextureParameteri(depth_map_texture_, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);
float border_color[] = {1.0f, 1.0f, 1.0f, 1.0f};
glTextureParameterfv(depth_map_texture_, GL_TEXTURE_BORDER_COLOR, border_color);

    // Depth map framebuffer
glCreateFramebuffers(1, &depth_map_fbo_);
glNamedFramebufferTexture(depth_map_fbo_, GL_DEPTH_ATTACHMENT, depth_map_texture_, 0);
glNamedFramebufferDrawBuffer(depth_map_fbo_, GL_NONE);
glNamedFramebufferReadBuffer(depth_map_fbo_, GL_NONE);
```

再写一个Pass one使用的Shader

```glsl
// vertex shader
#version 460 core

layout(location = 0) in vec3 a_Position;

uniform mat4 u_model;
uniform mat4 u_LightSpaceMatrix;


void main()
{
    gl_Position = u_LightSpaceMatrix * u_model * vec4(a_Position, 1.0);
}

// fragment shader
#version 460 core
void main()
{
    
}

```

再执行pass one 

```c++
// ====== Pass 1: Render depth map from light's perspective ======
glEnable(GL_DEPTH_TEST);
glViewport(0, 0, shadow_width_, shadow_height_);
glBindFramebuffer(GL_FRAMEBUFFER, depth_map_fbo_);
glClear(GL_DEPTH_BUFFER_BIT);

depth_shader_->Bind();
glUniformMatrix4fv(depth_shader_->Uniform("u_LightSpaceMatrix"),
                       1,
                       GL_FALSE,
                       glm::value_ptr(light_space_matrix));
RenderScene(*depth_shader_);
depth_shader_->Unbind();

```

最后将`depth_map_texture_`和`u_LightSpaceMatrix`传入shader以实现“该点是否在阴影中的逻辑”

```c++
// ====== Pass 2: Render scene with shadow mapping ======
// Restore app's FBO and viewport
glBindFramebuffer(GL_FRAMEBUFFER, prev_fbo);
glViewport(prev_viewport[0], prev_viewport[1], prev_viewport[2], prev_viewport[3]);
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

if (selected_gamma_correction_ == 1) {
    glEnable(GL_FRAMEBUFFER_SRGB);
} else {
    glDisable(GL_FRAMEBUFFER_SRGB);
}

glm::mat4 view = camera_3d_->GetViewMatrix();
glm::mat4 projection = camera_3d_->GetProjectionMatrix();

shader_->Bind();
glUniformMatrix4fv(shader_->Uniform("u_view"), 1, GL_FALSE, glm::value_ptr(view));
glUniformMatrix4fv(shader_->Uniform("u_projection"), 1, GL_FALSE, glm::value_ptr(projection));
glUniformMatrix4fv(
shader_->Uniform("u_LightSpaceMatrix"), 1, GL_FALSE, glm::value_ptr(light_space_matrix));

glUniform3fv(shader_->Uniform("u_LightPos"), 1, glm::value_ptr(light_pos_));
glUniform3fv(shader_->Uniform("u_ViewPos"), 1, glm::value_ptr(camera_pos_));
glUniform3fv(shader_->Uniform("u_LightColor"), 1, glm::value_ptr(light_color_));
glUniform1f(shader_->Uniform("u_Shininess"), shininess_);
glUniform1f(shader_->Uniform("u_AmbientStrength"), ambient_strength_);
glUniform1f(shader_->Uniform("u_SpecularStrength"), specular_strength_);
glUniform1i(shader_->Uniform("u_BlinnPhong"), use_blinn_phong_ ? 1 : 0);
glUniform1i(shader_->Uniform("u_UseGammaCorrection"), selected_gamma_correction_ == 2 ? 1 : 0);
glUniform1i(shader_->Uniform("u_EnableShadows"), enable_shadows_ ? 1 : 0);

glBindTextureUnit(0, floor_texture_);
glUniform1i(shader_->Uniform("u_FloorTexture"), 0);

glBindTextureUnit(1, depth_map_texture_);
glUniform1i(shader_->Uniform("u_ShadowMap"), 1);

RenderScene(*shader_);
shader_->Unbind();
```

更新Pass two 的Shader

```glsl
#version 460 core

layout(location = 0) in vec3 a_Position;
layout(location = 1) in vec3 a_Normal;
layout(location = 2) in vec2 a_TexCoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat4 u_LightSpaceMatrix;

out vec3 v_FragPos;
out vec3 v_Normal;
out vec2 v_TexCoord;
out vec4 v_FragPosLightSpace;

void main()
{
    vec4 world_pos = u_model * vec4(a_Position, 1.0);
    v_FragPos = world_pos.xyz;
    v_Normal = mat3(transpose(inverse(u_model))) * a_Normal;
    v_TexCoord = a_TexCoord;

    // 将世界坐标系下的位置转换到光源空间
    v_FragPosLightSpace = u_LightSpaceMatrix * world_pos;

    gl_Position = u_projection * u_view * world_pos;
}

```

```glsl
#version 460 core

in vec3 v_FragPos;
in vec3 v_Normal;
in vec2 v_TexCoord;
in vec4 v_FragPosLightSpace;

out vec4 FragColor;

uniform sampler2D u_FloorTexture;
uniform sampler2D u_ShadowMap;
uniform vec3 u_LightPos;
uniform vec3 u_ViewPos;
uniform vec3 u_LightColor;
uniform float u_Shininess;
uniform float u_AmbientStrength;
uniform float u_SpecularStrength;
uniform int u_BlinnPhong; // 0 = Phong, 1 = Blinn-Phong
uniform int u_UseGammaCorrection;
uniform int u_EnableShadows;

float ShadowCalculation(vec4 fragPosLightSpace)
{
    // 将片段位置从齐次裁剪空间转换到纹理坐标空间
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;

    // 将范围从 [-1, 1] 转换到 [0, 1]
    projCoords = projCoords * 0.5 + 0.5;

    // 处理光锥体外的区域
    if (projCoords.z > 1.0)
        return 0.0;

    // 获取阴影贴图中存储的最近深度
    float closestDepth = texture(u_ShadowMap, projCoords.xy).r; 

    // 获取当前像素的深度
    float currentDepth = projCoords.z;

    // 如果当前深度大于贴图中的最近深度，则该点在阴影中 (1.0)，否则在光照下 (0.0)
    float shadow = currentDepth > closestDepth ? 1.0 : 0.0;

    return shadow;
}

void main()
{
    vec3 color = texture(u_FloorTexture, v_TexCoord).rgb;
    vec3 normal = normalize(v_Normal);
    vec3 light_dir = normalize(u_LightPos - v_FragPos);
    vec3 view_dir = normalize(u_ViewPos - v_FragPos);

    // ambient
    vec3 ambient = u_AmbientStrength * color;

    // diffuse
    float diff = max(dot(normal, light_dir), 0.0);
    vec3 diffuse = diff * u_LightColor * color;

    // specular
    float spec = 0.0;
    if (u_BlinnPhong == 1) {
        // Blinn-Phong: use halfway vector
        vec3 halfway_dir = normalize(light_dir + view_dir);
        spec = pow(max(dot(normal, halfway_dir), 0.0), u_Shininess);
    } else {
        // Phong: use reflect direction
        vec3 reflect_dir = reflect(-light_dir, normal);
        spec = pow(max(dot(view_dir, reflect_dir), 0.0), u_Shininess);
    }
    vec3 specular = u_SpecularStrength * spec * u_LightColor;

    // shadow
    float shadow = 0.0;
    if (u_EnableShadows == 1) {
        shadow = ShadowCalculation(v_FragPosLightSpace);
    }

    vec4 final_color = vec4(ambient + (1.0 - shadow) * (diffuse + specular), 1.0);
    if (u_UseGammaCorrection == 1) {
        final_color.rgb = pow(final_color.rgb, vec3(1.0 / 2.2));
    }
    FragColor = final_color;
}

```

## 阴影失真

运行后你会发现阴影有是有了但是出现了好多类似摩尔纹的条纹, 如图1

![图1](images/opengl/shadowmapping1.png)

这是一种叫做阴影失真的现象，这是由于 Shadow Mapping 的分辨率不足导致的，导致过远的片段使用同一个 Shadow Mapping 的深度值进行计算，如图2所示，片段2的深度大于Shadow mapping的深度所以是黑色，片段1和片段2采样同一个Shadow Mapping

![图2](images/opengl/shadowmapping3.png)

## 阴影偏移

为了解决这个问题，我们使用阴影偏移来解决这个问题。我们简单的对表面深度贴图应用一个偏移量，这样片段就不会被错误地认为在表面之下了。

![图3](https://learnopengl-cn.github.io/img/05/03/01/shadow_mapping_acne_bias.png)

```glsl
    float bias =  max(0.05 * (1.0 - dot(normalize(v_Normal), normalize(u_LightPos - v_FragPos))), 0.005);
    float shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;
```


![图4](images/opengl/shadowmapping.png)

此时阴影失真现象消失了



