---
date : '2026-03-17'
draft : false
title : '【CG】HDR & Tone Mapping'
tags:
  - graphics
  - opengl

categories:
  - blog

cover:
  image: "images/opengl/hdr2.png"
  alt: "cover"
math: true
---

# HDR
传统的显示设备使用的是 LDR 模式，即线性 Device-Independent-RGB 模式，它通常使用 8 位来代表一个每个颜色通道的值。
但是在 LDR 模式下所有的颜色都被限制到了 0 到 1 之间，这导致如果场景中存在一个颜色值超过 1 的物体，那么这个物体的颜色就会变成纯白。
HDR 模式则允许颜色的值超过 1，因此 HDR 模式下可以处理更丰富的场景。
如下图所示，LDR 模式下物体的纹理细节根本看不见

![图1](images/opengl/hdr0.png)

在 OpenGL 中默认的帧缓冲是使用的是 `GL_RGBA8` 即8 位的 RGBA 模式，因此在片段着色器运行之后无论你的颜色值是否超过了1，颜色都被限制在了 0 到 1 之间。
因此，HDR 模式下需要使用 `GL_RGBA16F` 即 16 位的 RGBA 模式，这样颜色值就可以超过 1 了。

```c++
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB16F, width, height, 0, GL_RGB, GL_FLOAT, NULL);  
```

虽然这么设置之后确实能够输出颜色值在 1 以上的颜色，但是在操作系统和显示设备之间进行颜色转换的时候，这些颜色值最终还是会被限制在了 0 到 1 之间，因此我们需要通过 Tone Mapping 来解决这个问题。

# Tone Mapping
Tone Mapping 是一种将 HDR 颜色值映射到 LDR 颜色值的方法。

## Reinhard tone mapping
最基础的 Reinhard 公式非常简洁：

$$L_{out} = \frac{L_{in}}{1 + L_{in}}$$

- $ L_{in} $ 表示输入的 HDR 颜色值
- $ L_{out} $ 输出的 LDR 颜色值
- 当 $L_{in}$ 很小的时候，$L_{out} \approx L_{in}$ 保持暗部细节
- 当 $L_{in} \to \infty$ 时，$L_{out} \to 1$ 高光永远不会超过最大亮度

这个算法是倾向明亮的区域的，暗的区域会不那么精细也不那么有区分度

![图2](images/opengl/hdr1.png)

---

## Exposure tone mapping
Exposure tone mapping 模仿的是真实摄像机的工作原理

$$L_{out} = 1 - \exp(-exposure * L_{in})$$

- $ L_{in} $ 表示输入的 HDR 颜色值
- $ L_{out} $ 输出的 LDR 颜色值
- $exposure$ 表示曝光度

![图3](images/opengl/hdr2.png)

他们的glsl实现如下：

```glsl

 vec4 final_color = vec4(ambient + (1.0 - shadow) * (diffuse + specular), 1.0);

    // HDR Tone Mapping
    if (u_EnableHDR == 1) {
        vec3 hdr_color = final_color.rgb;
        if (u_ToneMappingMode == 0) {
            // Reinhard tone mapping
            final_color.rgb = hdr_color / (hdr_color + vec3(1.0));
        } else {
            // Exposure tone mapping
            final_color.rgb = vec3(1.0) - exp(-hdr_color * u_Exposure);
        }
    }
```
