+++
title = "【CG】Bidirectional Path Tracing"
date = "2026-11-25"
draft = true
tags = ["CG"]
categories = ["图形学"]
+++

传统 Path Tracing 通常难以处理**小面积**或**方向性强**的光源，并且也难以采样到 LSDE 路径（也就是 Caustics 路径）。由 [Eric Veach and Leonidas J. Guibas 1994][^1] 首次提出的 Bidirectional Path Tracing (BDPT) 改善了这一问题。和 Path Tracing 一样，Bidirectional Path Tracing 也是基于 Monte Carlo 方法的，这一技术通过从 Camera, Light 同时出发，使用不同的策略在场景中生成子路径，最后将不同的策略生成得到的子路径的端点连接起来形成同一条完整的光路。再结合 [Eric Veach and Leonidas J. Guibas 1995][^2] 首次提出的 Multiple Importance Sampling (MIS) 将不同策略生成得到的同一完整路径计算出的结果组合到一起。[Eric Veach. 1997][^3] 在其博士论文中总结性的给出了更完整的阐述。

在这篇文章中我们将会在 Section 1 中介绍传统单向 Path Tracing 的局限性；在 Section 2 中介绍 Bidirectional Path Tracing 的具体做法；在 Section 3 中我们将结合 MIS 进行推导并给出 Bidirectional Path Tracing 的 Monte Carlo 估计量；最后我们在 Section 4 中介绍 Bidirectional Path Tracing 的局限性。

在下文中我们将使用 `BDPT` 表示 Bidirectional Path Tracing 、`MIS` 表示 Multiple Importance Sampling，并且我们会使用 [路径表达式](https://tds-graphics.github.io/TDS-Graphics-Website/blog/2026/11/21/cg/LightPathRegularExpressions) 如 LSDE 来表示路径。

[^1]:[Eric Veach and Leonidas J. Guibas.  1994 Bidirectional Estimators for Light Transport](https://www.cs.jhu.edu/~misha/ReadingSeminar/Papers/Veach94.pdf)
[^2]:[Eric Veach, Leonidas J. Guibas. 1995 Optimally Combining Sampling Techniques for Monte Carlo Rendering](https://dl.acm.org/doi/10.1145/218380.218498)
[^3]:[Eric Veach. 1997 ROBUST MONTE CARLO METHODS FOR LIGHT TRANSPORT SIMULATION](https://graphics.stanford.edu/papers/veach_thesis/thesis.pdf)