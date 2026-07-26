---
date : '2026-07-23T19:19:47+08:00'
draft : false
title : '【CG】 Perlin Noise'
tags:
  - graphics

categories:
  - blog

math: true
---

# 柏林噪声 | Perlin Noise
在很多游戏中，比如 Minecraft 的地形生成，怪物猎人的云，大部分游戏中的火焰，水面的纹理都是基于 Perlin Noise 实现的
![](images/cg/u/a002/mc.png)
![](http://p0.qhimg.com/t11afb5333707f1ee1c544c3bc8.jpg)
![](https://realtimevfx.com/uploads/default/original/3X/7/3/7365fea1be2b20c138c83f95b5b31942c3d96631.gif)

而这篇文章我们将学习 Perlin Noise 的基本思想，以及使用 C++ 实现一个基本的二维 Perlin Noise

通过随机数生成的普通噪声往往是杂乱无章的没有规律的，而柏林噪声使得噪声具有规律性一定连续性的噪声，非常适合用于程序化生成地形山川、大理石的纹路、生锈金属的斑驳等等

我们可以通过如下代码生成一个普通噪声纹理
```cpp
#include "ppm_writer.h"

#include <iostream>
#include <vector>

int main()
{
    constexpr int width = 400;
    constexpr int height = 400;

    std::vector<Vec4> data;
    data.resize(width * height);

    for (int i = 0; i < height; ++i) {
        for (int j = 0; j < width; ++j) {
            float value = rand() / (float) (RAND_MAX + 1.0);
            value = value * 255.0f;
            data[i * width + j] = Vec4(value, value, value, 255.0f);
        }
    }

    PPMWriter ppmWriter;
    ppmWriter.setFileName("normal_noise.ppm");
    ppmWriter.setImageSize(width, height);
    ppmWriter.writePPM(data);

    return 0;
}
```
![](images/cg/u/a002/normal_noise.png)

而使用 Perlin Noise 生成的噪声纹理是这样的
![](images/cg/u/a002/perlin_noise.png)

可以看到相比于 普通噪声，柏林噪声的噪声纹理更具有连续性，而游戏中对普通的 Perlin Noise 算法进行改进，就能实现地形、程序纹理等效果了。

## Perlin Noise 的思想
Perlin Noise 的核心目标是：生成自然、平滑、且具有连续梯度变化的随机纹理  

Perlin Noise 的核心思想是：既然 普通噪声 全都是随机生成的，那么我们不全都随机生成，只选取一些点进行随机生成，然后剩下的部分就通过插值来生成这样就存在一些连续性。并且为了获得具有连续梯度变化的纹理，我们应该在这些选取的点上生成一个随机梯度向量，让这些点具有方向性。而我们要做的不是对这些梯度向量进行插值，而是遍历其他的点，使用选定的点到其他的点的向量与选定的点的梯度向量进行点乘，然后对点乘的结果进行插值。

所以总结一下就是：
1. 选定一些点，通常是整数点如 (0, 0), (1, 0), (0, 1), (1, 1) 等等，在这些点上生成一个随机梯度向量，并保存起来
2. 遍历其他点，使用 选定的点到其他点的向量 与 选定的点的梯度向量 进行点乘，然后对点乘的结果进行双非线性插值

我们现在思考一下这个算法，如果我们不使用梯度向量，直接对选取的点生成一个随机数值，然后对这些随机数进行插值得到的将会是一些具有块状方格的纹理
![](images/cg/u/a002/1.png)
有点类似 Minecraft 的一些方块上的纹理。这并不是我们想要的，我们想表达出的是平滑的而不是块状的。

为了解决这个问题，Ken Perlin 引入了 梯度向量 和 位移向量 的点乘。

为什么向量点乘能产生平滑纹理？
- 当目标点 P 正好落于网格节点上时，位移向量 d = (0, 0)，点乘结果恒等于 0。保证了拼接时候无缝。
- 当目标点 P 对应的位移向量与梯度向量夹角小于90度时，点乘结果为正（上坡）；
- 当目标点 P 对应的位移向量与梯度向量夹角大于90度时，点乘结果为负（下坡）；
- 当目标点 P 对应的位移向量与梯度向量夹角等于90度时，点乘结果为 0 (原地)

当一个像素位于网格中央时，它会同时收到周围 4 个顶点产生的斜面的影响。我们把这 4 个不同方向倾斜的斜面平滑地“缝合”在一起，网格内部就会自然隆起平缓的山丘与谷底，从而彻底消除了网格线与方块感。

并且插值我们不使用线性插值，而是使用 5 次缓动曲线的非线性插值

由此我们可以写出如下代码
```cpp
#include "ppm_writer.h"

#include <cmath>
#include <cstdlib>
#include <iostream>
#include <vector>

struct Vec2 {
    float x, y;

    Vec2() : x(0), y(0) {}
    Vec2(float x_, float y_) : x(x_), y(y_) {}

    // 向量点乘
    float dot(const Vec2& other) const {
        return x * other.x + y * other.y;
    }
};

inline float lerp(float a, float b, float t) {
    return a + t * (b - a);
}

// Ken Perlin 的 5 次缓动曲线: 6t^5 - 15t^4 + 10t^3
inline float fade(float t) {
    return t * t * t * (t * (t * 6.0f - 15.0f) + 10.0f);
}

class PerlinNoise2D {
private:
    int m_grid_size;
    std::vector<Vec2> m_gradients; // 保存网格顶点的随机梯度向量

public:
    PerlinNoise2D(int gridSize) : m_grid_size(gridSize) {
        m_gradients.resize(gridSize * gridSize);
        
        // 随机初始化每一个网格节点上的单位梯度向量
        for (int i = 0; i < gridSize * gridSize; ++i) {
            float angle = (rand() / (float)RAND_MAX) * 2.0f * 3.1415926535f;
            m_gradients[i] = Vec2(std::cos(angle), std::sin(angle));
        }
    }

    float noise(float pixel_x, float pixel_y, int img_width, int img_height) const {
        // 将图像坐标映射到网格空间 [0, m_grid_size - 1]
        float x_i = (pixel_x / (float)img_width) * (m_grid_size - 1);
        float y_i = (pixel_y / (float)img_height) * (m_grid_size - 1);

        // 获取当前像素所在的网格单元左下角整数坐标
        int x0 = static_cast<int>(std::floor(x_i));
        int y0 = static_cast<int>(std::floor(y_i));
        int x1 = x0 + 1;
        int y1 = y0 + 1;

        //  计算相对坐标 (u, v) \in [0, 1]
        float u = x_i - x0;
        float v = y_i - y0;

        //  获取 4 个顶点的梯度向量
        Vec2 g00 = m_gradients[y0 * m_grid_size + x0];
        Vec2 g10 = m_gradients[y0 * m_grid_size + x1];
        Vec2 g01 = m_gradients[y1 * m_grid_size + x0];
        Vec2 g11 = m_gradients[y1 * m_grid_size + x1];

        //  计算顶点到当前点的位移向量，并做点乘
        float n00 = g00.dot(Vec2(u, v));
        float n10 = g10.dot(Vec2(u - 1.0f, v));
        float n01 = g01.dot(Vec2(u, v - 1.0f));
        float n11 = g11.dot(Vec2(u - 1.0f, v - 1.0f));

        //  应用 Fade 曲线平滑插值权重
        float u_f = fade(u);
        float v_f = fade(v);

        //  双线性插值
        float nx0 = lerp(n00, n10, u_f);
        float nx1 = lerp(n01, n11, u_f);
        float n = lerp(nx0, nx1, v_f);

        // 将 [-1, 1] 的噪声值映射到 [0, 1]
        return (n + 1.0f) * 0.5f;
    }
};

int main() {
    constexpr int width = 400;
    constexpr int height = 400;
    constexpr int gridSize = 10; // 10x10 的控制网格

    PerlinNoise2D perlin(gridSize);
    std::vector<Vec4> data(width * height);

    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            float val = perlin.noise(x, y, width, height);
            
            // 截断到 [0, 255]
            float color = std::min(255.0f, std::max(0.0f, val * 255.0f));
            data[y * width + x] = Vec4(color, color, color, 255.0f);
        }
    }

    PPMWriter ppmWriter;
    ppmWriter.setFileName("perlin_noise.ppm");
    ppmWriter.setImageSize(width, height);
    ppmWriter.writePPM(data);

    return 0;
}
```
