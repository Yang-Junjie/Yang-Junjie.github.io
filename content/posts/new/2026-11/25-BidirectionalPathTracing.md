+++
title = "【CG】Bidirectional Path Tracing"
date = "2026-11-25"
draft = false
tags = ["CG"]
categories = ["图形学"]
+++

朴素单向 Path Tracing 通常难以处理**小面积**或**方向性强**的光源，并且也难以采样到 LSDE 路径（也就是 Caustics 路径）。由 [Eric P Lafortune and Yves D Willems. 1993][^2] 首次提出的 Bidirectional Path Tracing (BDPT) 改善了这一问题，并由 [Eric Veach and Leonidas J. Guibas.  1994][^1] 完善。和 Path Tracing 一样，Bidirectional Path Tracing 也是基于 Monte Carlo 方法的，这一技术通过从 Camera, Light 同时出发，使用不同的策略在场景中生成子路径，最后将不同的策略生成得到的子路径的端点连接起来形成同一条完整的光路。再结合 [Eric Veach and Leonidas J. Guibas 1995][^3] 首次提出的 Multiple Importance Sampling (MIS) 将不同策略生成得到的同一完整路径计算出的结果组合到一起。[Eric Veach. 1997][^4] 在其博士论文中总结性的给出了更完整的阐述。

在这篇文章中我们将会在 Section 1 中介绍朴素单向 Path Tracing 的局限性；在 Section 2 中介绍 Bidirectional Path Tracing 的具体做法；在 Section 3 中我们会先回顾一下要使用的数学前提；在 Section 4 中我们将结合 MIS 进行推导并给出 Bidirectional Path Tracing 的 Monte Carlo 估计量；最后我们在 Section 5 中介绍 Bidirectional Path Tracing 的局限性。

在下文中我们将使用 `BDPT` 表示 Bidirectional Path Tracing 、`MIS` 表示 Multiple Importance Sampling，并且我们会使用 [路径表达式](https://tds-graphics.github.io/TDS-Graphics-Website/blog/2026/11/21/cg/LightPathRegularExpressions) 如 LSDE 来表示一类路径。

## 1. 朴素单向 Path Tracing 的局限性
朴素单向 Path Tracing 主要分两类技术：**从相机出发** 与 **从光源出发**。

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

**对于 LS+DE 路径**。LS+DE 路径会产生 Caustics 现象，而通常朴素单向 Path Tracing 难以采样到 LS+DE 路径。从相机发出光线，击中场景中的 Diffuse 材质物体根据其 BSDF 采样生成下一条光线 (Secondary Ray)，这条由 Diffuse 材质 BSDF 分布生成的 Secondary Ray 需要击中理想 Specular 材质物体，并通过理想 Specular 材质物体的反射或折射击中光源才能产生 Caustics 。这其中，在 Diffuse 物体上通过 BSDF 采样得到的光线恰好击中理想 Specular 物体并且经过其反射或折射击中光源其概率是非常低的。

如 Fig.3. 所展示的场景：一个光源、一个理想折射球体、Diffuse 房间与相机。先不看具体的算法，在现实世界中光源的发出的黄色区域的光线会被球体折射到地面产生 Caustics 也就是红色区域，好我们反过来想只有光线在黄色区域中运动才能产生 Caustics （不一定是如图所示发生一次弹射，可以在其中发生多次弹射只需要保证有一个顶点连接着光源），所以从相机发出的光线需要在蓝色区域中（因为所有的红色区域的光线都有机会产生 Caustics），击中红色区域的 Diffuse 材质，经过 BSDF 采样与理想折射所生成的光线需要保持在黄色区域内才能产生折射。

<p align="center">
<img src="/images/new/2026-11/25-bdpt/3.png" width="50%">
<br>
 Fig.3. 黄色蓝色区域的路径构成 LSDE 路径，在红色区域上产生 Caustics.
</p>

> 对于存在 Caustics 的场景，使用朴素 PT 通常会产生 **萤火虫 (Fireflies)** 现象，即在画面上产生严重的亮点。这是因为 LS+DE 路径被采样到的概率极低，对于绝大多数的路径是无法采样到 LS+DE 路径的，极少数侥幸命中的路径，由于除以了极小的概率密度 $p$，会携带巨大的权重，导致出现严重的亮点，像素值很大。

### 1.2 从光源出发
从光源出发的算法思想和 Path Tracing 类似，不过严格意义上它并不是 Path Tracing ，它的名字叫做 **Light Tracing** 。它的方向与从相机出发的 Path Tracing 相反，它从光源出发，经过场景的弹射，最后到达相机，其在场景中弹射的方式以及其他的各种技术都和我们的 Path Tracing 一样仅仅是出发点不同。我们从相机出发击中光源很困难，那么从光源出发击中相机也同样困难。相比直接从相机出发能直接计算最后像素值得 Path Tracing 来说不同，Light Tracing在常规场景下的渲染效率往往很差，因为几乎没有多少光线能够击中相机导致有效样本少、噪点多；而 Path Tracing 则是从观测目标（相机/像素）出发，无论路径经过多少次弹射，都能直接服务于对应像素的估计。

### 1.3 Path Tracing + MIS + NEE
在 [Kajiya 1986][^5] 提出 The Rendering Equation 时就指出了将直接光与间接光分开计算的思路，在 Path Tracing 中对应的技术就是对光源进行采样，在场景中将除光源顶点外的所有顶点都直接连接到光源上计算直接光，这一技术还有另一个名字叫做 NEE . 不过在 [Eric Veach and Leonidas J. Guibas. 1995][^3] 提出 MIS 之前还没有一种很好的方法能够组合 BSDF 采样与 Light 采样。

在 [Eric Veach and Leonidas J. Guibas. 1995][^3] 提出 MIS 之后，形成了标准的单向路径追踪组合框架 Path Tracing + MIS + NEE 。这种方法在小光源场景得到了不错的改善，对着色点每个点向光源连接一条线计算直接光不至于让大部分光线的贡献为 0。虽然这种方法改善了小光源的问题，但它仍然无法处理其他两种情况的问题。

单向算法有很多特殊路径都难以被采样，所以我们在接下来 Section 2 中我们开始介绍 Bidirectional Path Tracing 它在很大程度上改善了上述的问题，并且在更多场景下表现良好，是现代渲染器中的常驻算法。

## 2. Bidirectional Path Tracing
[Eric P Lafortune and Yves D Willems. 1993][^2] 首次提出了 BDPT 的概念，随后由 [Eric Veach and Leonidas J. Guibas. 1994][^1] 发展完善。我们接下来有关 BDPT 的介绍都来自 [Eric Veach. 1997][^4] 的博士论文，这基于 Veach 提出的 Path Integral 概念，所以如果你对 Path Integral 还不熟悉可以看看 Veach 的原文，或者看看 [Akiyama Artichoke, 2026][^6] 的简单介绍（至少你需要熟悉路径的概念），不过不熟悉也没关系接着往下看，我相信你能看懂。

双向路径追踪 (Bidirectional Path Tracing BDPT) 也是一种基于 Monte Carlo 的光传输算法，它的思想非常简单，它同时从光源和相机双向生成子路径，再把它们连接起来成为一条完整的路径以估计像素值。我们可以通过改变两条子路径的顶点数，以获得一系列路径；或者在保持顶点总数不变的情况下改变两条子路径的顶点数，以获得一系列用于采样相同路径的策略，每种采样策略在路径空间上都有不同的概率分布 $p$，最后使用 MIS 将来自所有这些策略的样本组合成无偏的 Monte Carlo 估计量。

### 2.1 生成路径
BDPT 与 Path Tracing 不同，它不是递归方法，而是将我们之前熟悉的递归采样得到的一条光路作为整条路径。简单起见我们再看 Fig.1. 路径通常是选光源作为起点 $\mathbf{x}_0$ , 则物体上的点记作 $\mathbf{x}_1$ ，相机上的点记作 $\mathbf{x}_2$ ，则这条简单的路径可以记作 $\bar{x} = \mathbf{x}_0 \mathbf{x}_1 \mathbf{x}_2$ ，这是一条长度为 $k = 2$ 的路径。

具体的，我们可以看下面的一个 BDPT 生成路径的例子。如 Fig.4. 所示，通过从光源采样一个顶点 $\mathbf{x}_0$，然后沿随机方向发射光线得到 $\mathbf{x}_1$ 构建光源子路径；通过在相机上随机选择一点 $\mathbf{x}_4$，然后沿随机方向发射光线得到 $\mathbf{x}_3$ （工程实现上可以选择具体的点和方向，依然是无偏的，因为对于随机都可以，那么对于具体也可以），随后在 $\mathbf{x}_3$ 根据表面信息采样方向并发射光线得到 $\mathbf{x}_2$ ，最后我们将 $\mathbf{x}_2$ 与 $\mathbf{x}_1$ 连接起来即可得到一条完整的长度 $k = 4$ 路径。

<p align="center">
<img src="/images/new/2026-11/25-bdpt/4.png" width="80%">
<br>
 Fig.4. BDPT 生成一条长度为 4 的路径。
</p>

对于任意一条路径 $k$ ，可以由光源子路径和相机子路径组成，设光源子路径由 $s$ 个顶点组成，相机子路径由 $t$ 个顶点组成，则组合而成的路径长度 $k = s + t - 1$ 。这很好理解，就像你将线段分成 $n$ 段，需要切 $n - 1$ 刀一个道理。

### 2.2 改变子路径的顶点数
我们只需要修改光源子路径或相机子路径的顶点数就可以得到各种长度的路径，这很显然，我们不解释了，我们看下面这种情况。

保持路径长度 $k$ 不变通过改变光源子路径或相机子路径的顶点数，我们得到多种策略。更形式化的，给定路径长度 $k$, 对任意的光源路径顶点 $s$，相机路径顶点 $t$ , 满足 $s + t - 1 = k$，则对于任意的 $s$ 有 $t = k - s +1$ ,组合成路径生成策略 $(s,t)$。也就是对于不同长度的路径，都存在不止一种采样策略，对于给定长度 $k$ ，存在 $k + 2$ 种路径生成策略，每种路径生成策略对应一种采样策略。

为什么是 $k+2$ 种？我们观察一下 $s + t - 1 = k$ 这个等式，我们变形为 $s + t = k + 1$ 这从组合数学的角度来看，就是将 $k + 1$ 个顶点分成左右两部分 ，你在高中时学过，将 $k + 1$ 个完全一样的球分别放入两个桶里面有多少种分法允许桶中球的个数为 $0$ ，使用隔板法我们可以知道为 $C_{k+2}^1$ 种分法，即 $k+2$。

如 Fig.5. 所示，对于一条长度为 $2$ 的路径，拥有 4 种采样策略。


<p align="center">
<img src="/images/new/2026-11/25-bdpt/5.png" width="75%">
<br>
 Fig.5. 一条长度为 2 的路径拥有 4 种采样策略，分别是 (a)(0,3)、(b)(1,2)、(c)(2,1)、(b)(3,0)。
</p>

我们在一开始说了，对于不同的采样策略 $(s,t)$ 在路径空间上都有不同的概率分布。对于策略 $(s, t)$，路径的生成由光源端采样、眼睛端采样、各散射顶点的 BSDF 方向采样以及子路径末端连接共同决定；在路径空间上，这些采样步骤的密度共同构成了策略 $(s, t)$ 对应的概率分布 $p_{s,t}$，从而给出具体路径 $\overline{\mathbf{x}}$ 的概率密度 $p_{s,t}(\overline{\mathbf{x}})$。

接下来我们将在 Section 3 中复习路径积分与 Monte Carlo 方法。并在 Section 4 中深入数学推导了解一下如何通过 MIS 组合这些不同策略的概率密度，最终给出无偏的 MIS Path Integral Monte Carlo Estimator.

[^1]:[Eric Veach and Leonidas J. Guibas.  1994 Bidirectional Estimators for Light Transport](https://www.cs.jhu.edu/~misha/ReadingSeminar/Papers/Veach94.pdf)
[^2]:[Eric P Lafortune and Yves D Willems. 1993 BIDIRECTIONAL PATH TRACING](https://graphics.cs.kuleuven.be/publications/BDPT/BDPT_paper.pdf)
[^3]:[Eric Veach, Leonidas J. Guibas. 1995 Optimally Combining Sampling Techniques for Monte Carlo Rendering](https://dl.acm.org/doi/10.1145/218380.218498)
[^4]:[Eric Veach. 1997 ROBUST MONTE CARLO METHODS FOR LIGHT TRANSPORT SIMULATION](https://graphics.stanford.edu/papers/veach_thesis/thesis.pdf)
[^5]:[James T. Kajiya, 1986](https://dl.acm.org/doi/epdf/10.1145/15886.15902)
[^6]:[Akiyama Artichoke, 2026 TDSG 路径积分推导](https://tds-graphics.github.io/TDS-Graphics-Website/blog/2026/11/16/cg/PathIntegral/)