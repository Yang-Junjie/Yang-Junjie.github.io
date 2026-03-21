---
date : '2026-03-21T14:13:19+08:00'
draft : false
title : '【OpenGL】计算着色器入门'
tags:
  - graphics
  - opengl

categories:
  - blog

math: true
---
## 摘要
OpenGL4.3 引入了 **计算着色器（Compute Shader）** 这使得我们可以在 GPU 上直接利用 GPU 的并行计算能力来处理非图形任务，标志着 OpenGL正式具备了 GPGPU（通用图形处理器计算）的能力
这篇文章将会以例子的角度来介绍如何使用 Compute Shader 

## 第一个Compute Shader 
在这个例子中，我们将使用 Compute Shader 来将大小为1024的数组中所有的元素乘以2
### 1. 编写 compute shader
```glsl
#version 460 core

// 定义本地工作组大小 (Local Work Group Size)
// 这里我们让每个小组处理 64 个元素
layout (local_size_x = 64, local_size_y = 1, local_size_z = 1) in;

// 定义SSBO
layout (std430, binding = 0) buffer DataBuffer {
    float data[]; 
};

void main() {
    // 获取当前线程在全局任务中的索引
    uint index = gl_GlobalInvocationID.x;

    // 简单地将数组中的每个值乘以 2
    data[index] = data[index] * 2.0;
}
```
这涉及了非常多的概念，我们先从第二行代码开始：
```glsl
layout (local_size_x = 64, local_size_y = 1, local_size_z = 1) in;
```
先介绍两个概念：
- **全局工作组(Global Work Groups)**：它直接对应了 NVIDA GPU 中的 SM （Streaming Multiprocessor）,一个 SM 中可以有多个 Warp。而 Warp 是什么请看本地工作组，而 SM 是什么呢？我们后续再介绍。
- **本地工作组(Local Work Groups)**：它直接对应了 GPU 中的线程，在 NVIDIA 架构中通常将 32 个线程组成一个线程块称为 Warp ,在同一个 Warp 中，所有的线程会执行相同的指令，这种运行模式叫做 SIMT(Single Instruction, Multiple Threads),例如当执行 加法指令的时候，一个 warp 中的指令解码器会调度该 warp 中的所有线程执行加法指令。

这行代码定义了 **本地工作组** 的大小，它指定了在一个 SM 中使用多少线程来处理数据，这里将使用 64 个线程也就是 2 个 Warp 来处理一批数据，我们计划使用16个全局工作组，每个全局工作组中使用64个本地工作组进行计算，也就是使用 $16\times64=1024$ 个线程来处理数据, 这样我们每个数据都会被映射到一个线程上去。
而 `local_size_x = 64, local_size_y = 1, local_size_z = 1`指定了如何映射数据，这是纯软件上的概念，GPU 本身都是一堆并行执行的线程，这样做的好处是方便你处理不同维度的数据，让你省去复杂的下标转换计算。
- 1D (x=64, y=1, z=1): 适合处理线性数据。比如数组运算、顶点缓冲区修改、简单的粒子列表。
- 2D (x=16, y=16, z=1): 适合处理平面数据。比如图像处理、高斯模糊、地形高度图。
- 3D (x=8, y=8, z=4): 适合处理空间数据。比如 3D 纹理、体素（Voxel）计算、流体模拟。
内线程的总数是 $x \times y \times z$ ，这里是 $$64 \times 1 \times 1 = 64$$个线程

```glsl
layout (std430, binding = 0) buffer DataBuffer {
    float data[]; 
};
```
这里我们定义了一个 SSBO 用于与 CPU 进行数据交换，这不是 compute shader 中的概念这里不做过多介绍。

```glsl
uint index = gl_GlobalInvocationID.x;
```
这里我们获取线程在整个任务中的唯一绝对的索引，`gl_GlobalInvocationID`是 opengl4.3 中新增的一个内建变量, 还有其他的内建变量
- `gl_LocalInvocationID `: 线程在当前“本地组”内的坐标。(sm中的哪个线程)
- `gl_WorkGroupID`:当前“本地组”在“全局范围”内的索引。(哪个sm)
- `gl_WorkGroupSize`: 当前“本地组”的大小。(sm中的线程数)
- `gl_GlobalInvocationID`:当前线程在“全局范围”内的索引。(全局中的哪个线程)
他们之间有如下关系
$$GlobalID = WorkGroupID \times WorkGroupSize + LocalInvocationID$$

```glsl
data[index] = data[index] * 2.0;
``` 
这里我们将当前线程中的数据乘以2，因为我们的数据大小为1024，线程数量也是1024，每个线程都会被分配到一个数据，所以一个全局线程id就对应了一个数据，将这个数据乘以2


### 2. 创建 compute shader
创建一个 compute shader 的方式和创建普通 shader 的方式非常类似，但是不需要将其 link 到渲染管线上的 shader program 中去，将着色器类型改为`GL_COMPUTE_SHADER`
``` cpp
GLuint computeShader = glCreateShader(GL_COMPUTE_SHADER);
glShaderSource(computeShader, 1, &shaderCode, NULL);
glCompileShader(computeShader);

GLuint computeProgram = glCreateProgram();
glAttachShader(computeProgram, computeShader);
glLinkProgram(computeProgram);
```
### 3. 创建数据
```cpp
float myData[1024];
for(int i = 0; i < 1024; i++) myData[i] = (float)i;
```

### 4. 创建 SSBO
```cpp
GLuint ssbo;
glGenBuffers(1, &ssbo);
glBindBuffer(GL_SHADER_STORAGE_BUFFER, ssbo);
// 将数据传给 GPU
glBufferData(GL_SHADER_STORAGE_BUFFER, sizeof(myData), myData, GL_DYNAMIC_DRAW);
// 绑定到 binding = 0，与着色器中的声明对应
glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 0, ssbo);
```

### 5. 启动计算
这是最关键的一步，你需要决定全局工作组的数量。我们的本地工作组是一组64个线程，所以我们为了让每个线程只处理一次数据，全局工作组数量应该为 $\frac{1024}{64}=16$
```cpp
glUseProgram(computeProgram);
// 启动 16 个小组，每组 64 个线程，总计 1024 个线程
glDispatchCompute(16, 1, 1); 

// 强制同步：确保 GPU 计算完成，且结果已写回显存，才允许后续读取
glMemoryBarrier(GL_SHADER_STORAGE_BARRIER_BIT);
```
其中`glDispatchCompute` 是启动计算，参数为全局工作组(sm)的数量，它也有三个维度，他们的关系也是乘法关系总的线程数等于全局工作组不同分量的数量乘以本地工作组不同分量的数量，也是便于程序员使用。
`glMemoryBarrier` 是一个同步函数，用于等待 GPU 计算完成，并确保结果已写回显存，才允许后续读取。因为 GPU 和 CPU 是异步的，如果你不等待 GPU 计算完把数据写回，CPU就会读取到错误的数据。
`glMemoryBarrier` 函数的参数是一个位掩码，用于指定等待的资源类型。在这里，我们传入`GL_SHADER_STORAGE_BARRIER_BIT`，表示等待 SSBO 的数据写入完成。

### 6. 读取数据
最后我们等待 GPU 计算完成，读取数据就行了
```cpp
for (int i = 0; i < N_; i++) {
        ImGui::Text("%f", myData[i]);
}
```
