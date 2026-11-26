+++
title = "【CG】Bidirectional Path Tracing"
date = "2026-11-25"
draft = false
tags = ["CG"]
categories = ["图形学"]
+++

传统 Path Tracing 通常难以处理**小面积**或**方向性强**的光源，并且也难以采样到 LSDE 路径（也就是 Caustics 路径）。由 [Eric P Lafortune and Yves D Willems. 1993][^2] 首次提出的 Bidirectional Path Tracing (BDPT) 改善了这一问题，并由 [Eric Veach and Leonidas J. Guibas.  1994][^1] 完善。和 Path Tracing 一样，Bidirectional Path Tracing 也是基于 Monte Carlo 方法的，这一技术通过从 Camera, Light 同时出发，使用不同的策略在场景中生成子路径，最后将不同的策略生成得到的子路径的端点连接起来形成同一条完整的光路。再结合 [Eric Veach and Leonidas J. Guibas 1995][^3] 首次提出的 Multiple Importance Sampling (MIS) 将不同策略生成得到的同一完整路径计算出的结果组合到一起。[Eric Veach. 1997][^4] 在其博士论文中总结性的给出了更完整的阐述。

在这篇文章中我们将会在 Section 1 中介绍传统单向 Path Tracing 的局限性；在 Section 2 中介绍 Bidirectional Path Tracing 的具体做法；在 Section 3 中我们会先回顾一下要使用的数学前提；在 Section 4 中我们将结合 MIS 进行推导并给出 Bidirectional Path Tracing 的 Monte Carlo 估计量；最后我们在 Section 5 中介绍 Bidirectional Path Tracing 的局限性。

在下文中我们将使用 `BDPT` 表示 Bidirectional Path Tracing 、`MIS` 表示 Multiple Importance Sampling，并且我们会使用 [路径表达式](https://tds-graphics.github.io/TDS-Graphics-Website/blog/2026/11/21/cg/LightPathRegularExpressions) 如 LSDE 来表示一类路径。

## 1. 传统单向 Path Tracing 的局限性
传统单向 Path Tracing 主要分两类技术：**从相机出发** 与 **从光源出发**。

### 1.1 从相机出发
对于从相机出发我们都熟悉，这就是我们通常意义上讲的 Path Tracing ，光线从相机出发经过场景的弹射最后打到光源才有效，如果最后光线没有打到光源那么这次追踪的结果对图像像素的贡献为 $0$ 。

**对于一个面积非常小的光源**。如果一个光源的面积非常的小，那么光线经过场景的弹射最终光线将很难打光源上，即使我们对一个像素采样多次，最后也可能没有多少有效样本。

如 Fig.1. 所示，场景中只包含了三个物体：一个相机、一个物体、一个面光源。相机对某个像素采样 6 次，即 spp 为 6，向场景中发射 Primary Ray ，Primary Ray 击中物体根据物体的表面信息递归生成 Secondary Ray , Secondary Ray 只有一个击中光源，对图片像素进行贡献。

<p align="center">
<img src="/images/new/2026-11/25-bdpt/1.png" width="50%">
<br>
 Fig.1. 相机对某个像素采样 6 次，但只有一次恰好击中光源。真实情况可能更差。
</p>


**对于被遮挡的光源**。如果一个光源被一个物体遮住，光源无法直接照射场景中的大部分有效物体，只能通过间接光照射场景中的大部分信息，那么通常从相机出发将很难采样到有效路径。

如 Fig.2. 所示，场景中主要的物体信息：球体和台灯的灯架，它们都不在光源的直接光范围内（黄色区域），单面发光光源面向墙面被自身几何信息遮挡。我们从相机出发递归生成光线，由于黄色区域过于狭窄，我们很难生成最后能击中光源的样本。

<p align="center">
<img src="/images/new/2026-11/25-bdpt/2.png" width="50%">
<br>
 Fig.2. 光源面向非有效信息，并被自身几何遮挡，普通 PT 难以追踪此类光照分布。
</p>

**对于 LS+DE 路径**。

<p align="center">
<img src="/images/new/2026-11/25-bdpt/3.png" width="50%">
<br>
 Fig.3. LSDE 路径，在红色区域内产生 Caustics.
</p>
[^1]:[Eric Veach and Leonidas J. Guibas.  1994 Bidirectional Estimators for Light Transport](https://www.cs.jhu.edu/~misha/ReadingSeminar/Papers/Veach94.pdf)
[^2]:[Eric P Lafortune and Yves D Willems. 1993 BIDIRECTIONAL PATH TRACING](https://graphics.cs.kuleuven.be/publications/BDPT/BDPT_paper.pdf)
[^3]:[Eric Veach, Leonidas J. Guibas. 1995 Optimally Combining Sampling Techniques for Monte Carlo Rendering](https://dl.acm.org/doi/10.1145/218380.218498)
[^4]:[Eric Veach. 1997 ROBUST MONTE CARLO METHODS FOR LIGHT TRANSPORT SIMULATION](https://graphics.stanford.edu/papers/veach_thesis/thesis.pdf)