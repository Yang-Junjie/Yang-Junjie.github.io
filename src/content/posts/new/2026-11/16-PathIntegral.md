---
title: "【CG】路径积分推导"
published: 2026-11-16
draft: false
tags:
  - "CG"
category: "计算机图形学"
---
这篇文章我们从渲染方程开始推导一下路径积分，当然我们这里指的路径积分不是物理学中由 理查德·费曼 提出来的路径积分，而是由图形学领域的 [Eric Veach][^1] 提出来的。

由于路径积分定义在测度这个概念下，所以我们的文章会讲清楚测度是什么，其实不是很难。

看这篇文章的前提条件是你熟悉渲染方程、对测度论有简单的了解（我也会在文章中简单介绍一下）

## 渲染方程与测度变换
我们熟悉的 **渲染方程** 长下面这个样子。
$$
\begin{equation}
L_o(x, \omega_o) = L_e(x, \omega_o) + \int_{S^2} f_r(x, \omega_i, \omega_o) L_i(x, \omega_i) (\omega_i \cdot \mathbf{n}) \, d\omega_i
\end{equation}
$$

它定义在单位球空间 $S^2$ 上，并对立体角 $\omega$ 进行积分。

我们需要将其从单位球面空间 $S^2$ 变换到几何表面空间（任意的三维流形）上 $\mathcal{M} \subset \mathbb{R}^3$，$\mathbb{R}^3$ 是三维欧几里得空间。（我们做的这件事，在 Games 101 中将 Path Tracing 时，对光源采样有提到。）

如下图：

> 需要注意的是下图所示的 半球空间 $\mathcal{H}$ 是 $S^2$ 的真子集。

![Fig.1.](/images/new/2026-11/16-PathIntegral/1.png)

- 黄色表面 $M_0$ 是 $\mathcal{M}$ 的子集 $M_0 \subseteq \mathcal{M}$.    
- $x^{\prime}$ 是 黄色表面上的某个点 $x^{\prime} \in M_0$.   
- 点 $p$ 是我们的着色点，我们令渲染方程中的 $x = p$ 。则 $\omega_i $ 是在方向 $x^{\prime} - p$ 上的单位向量（方向），两点间的距离记为 $r = \| x^{\prime} - p \|$。
- $dA$ 表示点 $x^{\prime}$ 处微元面 $U \subset M_0$ 的面积（测度），$A$ 是定义在集合 $M_0$ 上的面积 Lebesgue 测度，记作 $A(U)$.  
- 由于图中的 $\mathbf{n}$ 和我们的方程中的 $\mathbf{n}$ 冲突了，所以我们将图中的 $\mathbf{n}$ 记为 $\mathbf{n}^{\prime}$，为点 $x^{\prime}$ 处的法线。
- 方程中的 $\mathbf{n}$ 为点 $p$ 处的法线。     
- $\theta = \arccos(\mathbf{n}^{\prime} \cdot (-\omega_i))$.

我们改写一下渲染方程。
$$
\begin{equation}
L_o(x, \omega_o) = L_e(x, \omega_o) + \int_{S^2} f_r(x, \omega_i, \omega_o) L_i(x, \omega_i) (\omega_i \cdot \mathbf{n}) \, d\sigma(\omega_i)
\end{equation}
$$
因为渲染方程中的符号其实有点混用：在积分内部，也就是被积函数中的 $\omega$ 代表方向，而微分中的 $\omega$ 却表示立体角。为了让方程变得更清晰所以我们改写这个方程，把 $d\omega_i$ 改成 $d\sigma(\omega_i)$ 表示在 $S^2$ 中的 $\omega_i$ 附近的无穷小邻域的测度。呃..简单说就是微分立体角，和原来你学的是同一个东西，只是更规范。

> 为什么 Artichoke 强调邻域，因为测度是对集合而言的，我们不能说对一个元素的测度，而通常为了方便我们会写 $d\mu(x)$ 这种东西，表示在某个集合中的元素 $x$ 附近的微小邻域下的 $\mu$ 测度。

由于我们的目标和出射方向关系不大，所以我们直接忽视 $\omega_o$。

对上面这么多只是在解释一些符号，提前让你熟悉一下我们接下来推导时所需的测度、空间等等这些符号。

我们都知道，在一个半径为 $r$ 的球面上存在某个区域的面积为 $S$，则对应的立体角 $\omega$ 为： 
$$
\begin{equation}
\omega = \frac{S}{r^2}
\end{equation}
$$
若是单位立体角，即定义在单位球上的立体角，则直接等于区域面积 $S$。

现在我们要将积分从 $S^2$ 变换到 $\mathcal{M}$ 上，那么我们就需要找到他们的关系，我们可以把几何表面投影到单位球面上就像上图所示。在微积分中我们都知道，一个微元面可以近似平面。所以就是将平面投影到另一个平面上的问题。即将 $dA(x^{\prime})$ 变换到  $d\sigma(\omega_i)$ （测度变换）。

根据我们上面定义好的一堆符号，我们知道:
$$
r = \| x^{\prime} - p \|, \quad \omega_i  = \frac{x^{\prime} - p}{r}
$$
把表面微元 $dA(x^{\prime})$ 投影到以 $p$ 为球心、$r$ 为半径的球面上。投影面积为：
$$
dA_{proj} =  \cos \theta \cdot dA(x^{\prime})
$$

根据我们的立体角的定义（公式 3），半径为 $r$ 球面上面积为 $dA_{proj}$ 的立体角为：
$$
d\sigma(\omega_i) = \frac{\cos \theta}{r^2} dA(x^{\prime})
$$

所以我们得到了从 $\mathcal{M}$ 与 $S^2$ 之间的测度变换关系：
$$
\begin{equation}
d\sigma(\omega) = \frac{\cos \theta}{r^2} dA(x)
\end{equation}
$$

我们就其带入公式 (2) 并引入 visibility 项有：
$$
L_o(x, \omega_o) = L_e(x, \omega_o) + \int_{\mathcal{M}} f_r(x, \omega_i, \omega_o) L_i(x, \omega_i) V(x,x') \frac{(\mathbf{n}' \cdot (-\omega_i))\cdot (\mathbf{n} \cdot \omega_i) }{\|x' - x\|^2} dA(x')
$$
我们令
$$
G(x,x') = V(x,x') \frac{(\mathbf{n}' \cdot (-\omega_i))\cdot (\mathbf{n} \cdot \omega_i) }{\|x' - x\|^2}
$$
其中
$$
V(x, x') = \begin{cases} 1, & \text{若点 } x \text{ 与 } x' \text{ 之间无任何几何体遮挡} \\  0, & \text{若点 } x \text{ 与 } x' \text{ 之间存在遮挡物} \end{cases}
$$
如果我们令 $(x,x')$ 是一条从点 $x$ 到 点 $x'$ 的一条在 $\mathbb{R}^3$ 中的路径 (通俗的说就是线段)，则 $V(x,x')$ 还能简短的写成。
$$ 
V(x,x') = \mathbf{1}_{\Phi}(\alpha)
$$
其中 $\mathbf{1}_{\Phi}(\alpha)$ 是集合 $\Phi = \{ \alpha: xx' \cap \mathcal{M} = \emptyset \}$ 的指示函数/示性函数。

由于被积函数中的 $L_i$ 和 $L_o$ 还是不同的函数符号，这在数学上其实并不能说是递归，为了将他们统一起来，我们可以引入光线投射函数 $x_{\mathcal{M}(x,\omega)}$ ，它返回从 $x$ 处沿方向 $\omega$ 在 $\mathcal{M}$ 上的第一个可见点。所以我们可以表示：
$$
L_i(x,\omega) = L_o(x_{\mathcal{M}}(x,\omega),-\omega)
$$

所以最后我们的方程能写成：
$$
\begin{equation}
L_o(x, \omega_o) = L_e(x, \omega_o) + \int_{\mathcal{M}} f_r(x, \omega_i, \omega_o) L_o(x_{\mathcal{M}}(x,\omega_i),-\omega_i) G(x,x') dA(x')
\end{equation}
$$

公式 (5) 被称为光传输方程 (The Light Transport Equation)。

## 路径的表示
在路径积分中我们看不到任何的 $\omega$ 符号，也就是不用方向表示，而是用路径表示，而路径是用 $\mathcal{M}$ 上一系列点 $x$ 所定义的。
所以在这一节中，我们将消去方程中的方向变量 $\omega$ ，转而使用 $x \to x'$ 表示单位方向。

若 $\omega$ 表示方向 $x' - x$，其中 $x,x' \in \mathcal{M}$ 是场景曲面上的点（三维空间中的向量），则我们定义：
$$
L(x \to x') = L(x,\omega)
$$
[^1]:[Eric Veach](https://graphics.stanford.edu/papers/veach_thesis/thesis.pdf)