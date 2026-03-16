---
date : '2026-03-15T22:44:41+08:00'
draft : false
title : '【OpenGL】使用曲面细分着色器绘制Bezier曲线'
tags:
  - graphics
  - opengl

categories:
  - blog

cover:
  image: "images/opengl/beziercurve.png"
  alt: "cover"
math: true
---
# 【OpenGL】使用曲面细分着色器绘制Bezier曲线

这篇文章将直接介绍**使用曲面细分着色器绘制Bezier曲线，而不会介绍Bezier曲线**，但是会介绍 OpenGL 的曲面细分着色器的简单用法以及相关内容。

## 介绍

 **曲面细分着色器（Tessellation Shaders）** 是在 OpenGL4.0 版本引入的。在这之前，有一些私有扩展可以使用，但是直到 4.0 曲面细分才正式成为 OpenGL 的一部分。

---

在没有曲面细分之前，想在 OpenGL 里画 Bezier 曲线和曲面需要在 CPU 将所有的点计算出来再通过总线（带宽相对于现代GPU极小的 PCIE 接口）上传至 GPU ，而从 CPU 到 GPU 的数据交换及其耗时，所以曲面细分着色器的作用就是将细分任务直接交给 GPU 不仅减少了大量数据的传递也大大加快了计算速度。

除了绘制 Bezier 曲线和曲面，曲面细分着色器还能实现 **位移贴图（Displacement Mapping）** 和 **动态细节级别（Dynamic LOD）** 。

- **位移贴图**

  传统的发现贴图是只是通过关照来欺骗眼睛（实际上还是一个平面），而曲面细分可以让一个三角形面内部的顶点沿着你想要的法线方向位移到你想要的位置从而实现真的轮廓。

- **动态LOD**

  可以根据相机到物理的距离动态调整物体的三角形面，从而大幅提升性能。

---

这时有人可能就要问了：“主播主播，曲面细分着色器这么厉害，但是我记得 **几何着色器（Geometry Shader）** 和 **计算着色器（Compute Shader** 也能干相关的任务，为什么不直接使用几何着色器和计算着色器，非要整出个曲面细分着色器呢“？？

- 不使用 Geometry Shader 是因为它在执行细分任务的时候太慢了，GS 必须等到顶点着色器（Vertex Shader）把整个 **图元（Primitive）** 处理完成后了才能开始工作，而 TS 可以直接并行处理多个顶点，并且 TS 还有专门的硬件处理。
- 不使用 Compute Shader 是因它也太慢了，CS 是脱渲染离管线的，而 TS 是渲染管线的一部分，你需要将数据传入 CS 计算再将 CS 写入缓冲区，并且还需要使用 CPU 进行同步，并且 TS 还有专门的硬件处理。

---

上面提到了 TS 是渲染管线中的一部分，显然它是可编程的，并且位于 VS 的下一步，GS 的上一步。

**具体来分是：**

**Vertex Shader -> Tessellation Control Shader -> Tessellation Engine -> Tessellation Evaluation Shader -> Geometry Shader ->  ...**

可以看到 TS 不止一个，这就是为什么 曲面细分着色器 的英文是复数形式。

其中：

- **Tessellation Control Shader 决定了”细分多少份“**

  输出 **Tessellation Levels**（细分因子）。它告诉下一步：边缘要切几段，内部要切几份。

- **Tessellation Engine 根据TCS的定义执行切割操作生成新的顶点（固定的不可编程）**

- **Tessellation Evaluation Shader 根据 TE 生成出来的点计算出该点的位置** 

  输入 TE 生成的参数化坐标，结合 TCS 传来的原始顶点，通过插值算法确定新顶点的**真实世界位置**。

## **开始绘制Bezier曲线**

理解了曲面细分在渲染管线中的位置之后，我们就可以开始真正绘制一条 Bezier 曲线了。

整体流程其实很简单：

1. 在 CPU 端提供 **Bezier 曲线的控制点**
2. 让 GPU 通过 **Tessellation Shader 对参数空间进行细分**
3. 在 **TES 中根据 Bezier 公式计算曲线上的真实点**

换句话说：

> CPU 只负责提供控制点，GPU 负责计算整条曲线。

这也是 Tessellation Shader 最大的价值：
 **避免 CPU 预计算大量顶点并传输到 GPU。**

## 创建 Shader 程序

和普通的 OpenGL 程序一样，我们需要创建并编译 Shader，只不过这里多了两个阶段：

- Tessellation Control Shader (TCS)
- Tessellation Evaluation Shader (TES)

因此完整的程序包含四个阶段：

- Vertex Shader
- Tessellation Control Shader
- Tessellation Evaluation Shader
- Fragment Shader

代码如下：

```c++
bool Shader::Compile(const char* vert_src, const char* tcs_src, const char* tes_src, const char* frag_src)
{
    GLuint vs = CompileStage(GL_VERTEX_SHADER, vert_src);
    GLuint tc = CompileStage(GL_TESS_CONTROL_SHADER, tcs_src);
    GLuint te = CompileStage(GL_TESS_EVALUATION_SHADER, tes_src);
    GLuint fs = CompileStage(GL_FRAGMENT_SHADER, frag_src);
    if (!vs || !tc || !te || !fs) {
        glDeleteShader(vs);
        glDeleteShader(tc);
        glDeleteShader(te);
        glDeleteShader(fs);
        return false;
    }

    id_ = glCreateProgram();
    glAttachShader(id_, vs);
    glAttachShader(id_, tc);
    glAttachShader(id_, te);
    glAttachShader(id_, fs);
    glLinkProgram(id_);
    glDeleteShader(vs);
    glDeleteShader(tc);
    glDeleteShader(te);
    glDeleteShader(fs);

    GLint ok;
    glGetProgramiv(id_, GL_LINK_STATUS, &ok);
    if (!ok) {
        char log[512];
        glGetProgramInfoLog(id_, sizeof(log), nullptr, log);
        glDeleteProgram(id_);
        id_ = 0;
        return false;
    }
    return true;
}

GLuint Shader::CompileStage(GLenum type, const char* src)
{
    GLuint s = glCreateShader(type);
    glShaderSource(s, 1, &src, nullptr);
    glCompileShader(s);
    GLint ok;
    glGetShaderiv(s, GL_COMPILE_STATUS, &ok);
    if (!ok) {
        char log[512];
        glGetShaderInfoLog(s, sizeof(log), nullptr, log);
        glDeleteShader(s);
        return 0;
    }
    return s;
}
```

 接下来和原来的一样，定义4个控制点，创建vbo，vao。唯一不同的点就是在渲染循环中我们需要使用

```c++
glPatchParameteri(GL_PATCH_VERTICES, 4);
```

来设置图形中最小单元的顶点数。也就是 Primitive 

常规的Primitive有：

- 点 1个顶点
- 线 2个顶点
- 三角形 3个顶点
- 矩形4个顶点

而这里使用的是对Primitive的更抽象的形式是 `GL_PATCHES`，GL_PATCHES 不再预设这个单元长什么样，而是由你自己定义。**`glPatchParameteri(GL_PATCH_VERTICES, n)` 就是在填补这个定义的空白。** 它告诉OpenGL：“从现在起，每 n 个点打包成一个单元扔给我。”

我们这里是以4个控制点为一个Bezier曲线 Patch

然后使用

```c++
glDrawArrays(GL_PATCHES, 0, 4);
```

进行渲染

```c++
glBindVertexArray(vao_);
glPatchParameteri(GL_PATCH_VERTICES, 4);
glLineWidth(line_width_);

bezier_shader_.Bind();
glUniform1f(bezier_shader_.Uniform("u_TessLevel"), tess_level_);

glDrawArrays(GL_PATCHES, 0, 4);
bezier_shader_.Unbind();
```

接下来编写Shader

先介绍 TES

```glsl
#version 460 core

layout(isolines, equal_spacing) in;

uniform mat4 u_Projection;

void main()
{
    float t = gl_TessCoord.x;
    float t1 = 1.0 - t;

    // Cubic Bezier: B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
    vec4 p = t1 * t1 * t1 * gl_in[0].gl_Position
           + 3.0 * t1 * t1 * t * gl_in[1].gl_Position
           + 3.0 * t1 * t * t * gl_in[2].gl_Position
           + t * t * t * gl_in[3].gl_Position;

    gl_Position = u_Projection * p;
}

```

```glsl
layout(isolines, equal_spacing) in;
```

- `isolines`：告诉 GPU 我们正在绘制**线段**。

- `equal_spacing`：要求硬件在 $[0, 1]$ 的参数空间内进行**等间距**采样。

- `in`：表示这些设置是针对输入到此着色器的数据。

除了isolines布局还有

- triangles
- quads

不同的布局决定了使用什么样的坐标系去生成新的顶点。

### isolines布局

isolines布局 TE 会将顶点细分到一个[0,0]*[1,1]上的坐标系中

细分因子

- `gl_TessLevelOuter[0]`：决定“有多少条线”
- `gl_TessLevelOuter[1]`：决定“每条线切多少段”
- 没有`gl_TessLevelInner`，因为一条线不存在内部

当你设置了这两个 Outer 因子后，硬件会生成 `gl_TessCoord`

- `gl_TessCoord.x`：代表当前点在**该条线段**上的位置（0.0 到 1.0）。这就是你之前代码里用来算贝塞尔曲线的 $t$。
- `gl_TessCoord.y`：代表当前点属于**哪一条线**（0.0 到 1.0）。

- 如果 `gl_TessLevelOuter[0] = 1`，那么所有的 `gl_TessCoord.y` 永远是 0。
- 如果 `gl_TessLevelOuter[0] = 2`，你会得到 $y=0$ 的一组点和 $y=1.0$ 的一组点。

### triangles 布局

`triangles` 布局将 Patch 视为一个平面三角形，并向其内部进行填充。

**坐标系：重心坐标 (Barycentric Coordinates)**

硬件生成的 `gl_TessCoord` 是一个 `vec3(u, v, w)`。

- 这三个分量代表当前点距离三角形三条边的权重。
- 它们始终满足：$u + v + w = 1.0$。
- 三个顶点分别对应 $(1,0,0)$、$(0,1,0)$ 和 $(0,0,1)$。

**细分因子**

- `gl_TessLevelOuter[0, 1, 2]`：分别控制三角形的三条**外边**被切成多少段。
- `gl_TessLevelInner[0]`：控制三角形**内部**向中心点嵌套缩小的频率（内部只有 1 个因子）。

### quads 布局

`quads` 布局将 Patch 视为一个单位正方形，最适合做参数化曲面（如贝塞尔曲面）或地形。

**坐标系：二维笛卡尔坐标 $[0,1] \times [0,1]$**

硬件生成的 `gl_TessCoord` 是一个 `vec2(u, v)`（虽然也是 `vec3` 类型，但 $z$ 轴始终为 0）。

- `u` 是水平方向位置，`v` 是垂直方向位置。
- 这非常适合直接映射纹理坐标

细分因子

- `gl_TessLevelOuter[0, 1, 2, 3]`：
  - `Outer[0]` 和 `Outer[2]`：控制左右两条边（垂直边）的段数。
  - `Outer[1]` 和 `Outer[3]`：控制上下两条边（水平边）的段数。
- `gl_TessLevelInner[0, 1]`：
  - `Inner[0]`：控制内部水平方向（横向）切几刀。
  - `Inner[1]`：控制内部垂直方向（纵向）切几刀。

接下来是 TCS 

```glsl
#version 460 core

layout(vertices = 4) out;

uniform float u_TessLevel;

void main()
{
    gl_out[gl_InvocationID].gl_Position = gl_in[gl_InvocationID].gl_Position;

    if (gl_InvocationID == 0) {
        gl_TessLevelOuter[0] = 1.0;
        gl_TessLevelOuter[1] = u_TessLevel;
    }
}

```

这其中有很多要讲的

TCS 中一般分为两种任务

1. 逐顶点任务
2. 逐面片设置

其中`layout(vertices = 4) out;`是定义了输出 `Patch` 的顶点数。这里必须要与你在C++中设置的`glPatchParameteri`对应，当你设置了这个的时候GPU就会启动4个thread去一一处理4个顶点

```glsl
gl_out[gl_InvocationID].gl_Position = gl_in[gl_InvocationID].gl_Position;
```

这里是逐顶点任务，把从顶点着色器传来的坐标原封不动地交给输出，以便后续的 TES 使用。而 gl_InvocationID 就对应上述提到的 thread id 

```glsl
if (gl_InvocationID == 0) {
        gl_TessLevelOuter[0] = 1.0;
        gl_TessLevelOuter[1] = u_TessLevel;
}
```

这里是最重要，这里就是逐面片设置，这里的`gl_InvocationID == 0`是判断thread id 是不是 0 号thread 如果是则设置如何细分。为什么需要 `if (gl_InvocationID == 0) ` 因为如果不这么设置，那么所有的thread (这里是4个) 就会都去设置，导致性能浪费和数据竞争。并且这是一个全局设置，不需要所有的thread都去设置。由于上述以及介绍过了`gl_TessLevelOuter`所以这里你应该明白了这是什么意思。

具体的代码可以去https://github.com/Yang-Junjie/GraphicsLab中的`BezierCurveScene.cpp`查看以及`shaders\BezierSurfaceScene`

其中示例不仅有Bezier曲线，还有Bezier曲面

![beziercurve](images/opengl/beziercurve.png)
![beziersurface](images/opengl/beziersurface.png)

