---
title: "【CG】路径积分推导"
published: 2026-11-16
draft: false
tags:
  - "CG"
category: "计算机图形学"
---
这篇文章我们从渲染方程开始推导一下路径积分，当然我们这里指的路径积分不是物理学中由 查理德 费曼 提出来的路径积分，而是由图形学领域的 [Eric Veach][^1] 提出来的。

由于路径积分定义在测度这个概念下，所以我们的文章会讲清楚测度是什么，其实不是很难。

看这篇文章的前提条件是你熟悉渲染方程、对测度论有简单的了解（我也会在文章中简单介绍一下）

## The Rendering Equation
我们熟悉的 **渲染方程** 长下面这个样子。
$$
\begin{equation}
L_o(x, \omega_o) = L_e(x, \omega_o) + \int_{S^2} f_r(x, \omega_i, \omega_o) L_i(x, \omega_i) (\omega_i \cdot \mathbf{n}) \, d\omega_i
\end{equation}
$$

它定义在单位球空间 $S^2$ 上，并对立体角 $\omega$ 进行积分。

我们需要将其从单位球空间 $S^2$ 变换到几何表面空间上 $\mathcal{M} \subseteq \mathbb{R}^3$，$\mathbb{R}^3$ 是三维欧几里得空间 。如下图：

![Fig.1.](/images/new/2026-11/16-PathIntegral/1.png)

- 黄色表面 $M_0$ 是 $\mathcal{M}$ 的子集 $M_0 \subseteq \mathcal{M}$.    
- $x^{\prime}$ 是 黄色表面上的某个点 $x^{\prime} \in M_0$.   
- 点 $p$ 是我们的着色点，我们令渲染方程中的 $x = p$ 。则 $\omega_i $ 是在方向 $x^{\prime} - p$ 上的单位向量（方向）。  
- $dA$ 表示点 $x^{\prime}$ 处微元面 $U \subset M_0$ 的面积（测度），$A$ 是定义在集合 $M_0$ 上的面积 Lebesgue 测度，记作 $A(U)$.  
- 由于图中的 $\mathbf{n}$ 和我们的方程中的 $\mathbf{n}$ 冲突了，所以我们将图中的 $\mathbf{n}$ 记为 $\mathbf{n}^{\prime}$，为点 $x^{\prime}$ 处的法线。
- 方程中的 $\mathbf{n}$ 为点 $p$ 处的法线。     

我们改写一下渲染方程。
$$
\begin{equation}
L_o(x, \omega_o) = L_e(x, \omega_o) + \int_{S^2} f_r(x, \omega_i, \omega_o) L_i(x, \omega_i) (\omega_i \cdot \mathbf{n}) \, d\sigma(\omega_i)
\end{equation}
$$
因为渲染方程中的符号其实有点混用：在积分内部，也就是被积函数中的 $\omega$ 代表方向，而微分中的 $\omega$ 却表示立体角。为了让方程变得更清晰所以我们改写这个方程，把 $d\omega_i$ 改成 $d\sigma(\omega_i)$ 表示在 $S^2$ 中的 $\omega_i$ 附近的无穷小邻域的测度。呃..简单说就是微分立体角，和原来你学的是同一个东西，只是更规范。

> 为什么 Artichoke 强调领域，因为测度是对集合而言的，我们不能说对一个元素的测度，而通常为了方便我们会写 $d\mu(x)$ 这种东西

由于我们的目标和出射方向关系不大，所以我们直接忽视 $\omega_o$。

> 需要注意的是下图所示的 半球空间 $\mathcal{H}$（或写成 $\Omega$） 是 $S^2$ 的真子集。

对上面这么多只是在解释一些东西，并且提前让你熟悉一下我们接下来推导时所需的测度、空间等等数学前提。

[^1]:[Eric Veach](https://graphics.stanford.edu/papers/veach_thesis/thesis.pdf)