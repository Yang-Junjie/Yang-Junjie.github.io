---
date : '2026-06-18T23:36:57+08:00'
draft : false
title : '【Math】Jacobi Iteration Method'
tags:
  - math

categories:
  - blog

math: true
---
雅可比迭代法（Jacobi Iteration Method）是一种求解线性方程组的方法，它与我们熟悉的高斯消元法两种不同的方法，高斯消元法是一种直接法，能直接得到方程的精确解，而 Jacobi 迭代法从名字就能猜到是一种间接法，也就是通过迭代来逼近精确解，给出的是近似解。

这篇文章将会简单推导一下 jacobi 迭代法并说明为什么收敛，不会严格的证明

## 推导
假设我们有一个 $n$ 阶线性方程组：
$$\mathbf{A}\mathbf{x} = \mathbf{b}$$
其中
- $\mathbf{A}$ 为非奇异矩阵（主对角线元素均不为 0）
- $\mathbf{x}$ 为待求向量，
- $\mathbf{b}$ 为常数向量。  
雅可比迭代法的核心是将系数矩阵 $\mathbf{A}$ 分解为三个矩阵的和：
$$\mathbf{A} = \mathbf{D} + \mathbf{L} + \mathbf{U}$$
- $\mathbf{D}$：对角矩阵
- $\mathbf{L}$：严格下三角矩阵
- $\mathbf{U}$：严格上三角矩阵  

代入原方程：  
$$(\mathbf{D} + \mathbf{L} + \mathbf{U})\mathbf{x} = \mathbf{b}$$
$$\mathbf{D}\mathbf{x} = -(\mathbf{L} + \mathbf{U})\mathbf{x} + \mathbf{b}$$
因为 $\mathbf{A}$ 的主对角线元素不为 0，所以 $\mathbf{D}$ 可逆。
两边同时左乘 $\mathbf{D}^{-1}$，可以得到雅可比迭代的标准形式：
$$\mathbf{x} = -\mathbf{D}^{-1}(\mathbf{L} + \mathbf{U})\mathbf{x} + \mathbf{D}^{-1}\mathbf{b}$$
这个式子在数学上叫**不动点方程（Fixed-point equation）**，类似于 $x = f(x)$。如果我们已经知道了精确解 $\mathbf{x}$，把它同时代入等号左边和右边，等式两边完全相等，但问题是，我们现在不知道精确解 $\mathbf{x}$ 是多少。  

所以我们将其改为迭代式
$$\mathbf{x}_{(k+1)} = -\mathbf{D}^{-1}(\mathbf{L} + \mathbf{U})\mathbf{x}_{(k)} + \mathbf{D}^{-1}\mathbf{b}$$
或者写为工程中常用的形式
$$x_i^{(k+1)} = -\frac{1}{a_{ii}} \sum_{j \neq i} a_{ij}x_j^{(k)} + \frac{1}{a_{ii}} b_i$$
$$x_i^{(k+1)} = \frac{1}{a_{ii}} \left( b_i - \sum_{j \neq i} a_{ij}x_j^{(k)} \right)$$

## 收敛
接下来说明为什么 jacobi 迭代法能够收敛，我们先看一个例子：  
假设我们要解这样一个一元方程：
$$x = \frac{1}{2}x + 1$$
显而易见，真实解是 $x = 2$，假设我们不知道怎么解这个方程，我们直接将它改写为$x_{(k+1)} = \frac{1}{2}x_{(k)} + 1$
然后我们随便瞎猜一个初始值，比如 $x_{(0)} = 10$（当然猜的肯定与真实结果不一样，我们需要通过这个迭代式来逼近真实解）  
我们将这个计算结果代入迭代式中进行迭代

1. 第 1 步：$x_{(1)} = \frac{1}{2}(10) + 1 = 6$ （误差从 8 变成了 4）
2. 第 2 步：$x_{(2)} = \frac{1}{2}(6) + 1 = 4$  （误差从 4 变成了 2）
3. 第 3 步：$x_{(3)} = \frac{1}{2}(4) + 1 = 3$  （误差从 2 变成了 1）    

发现了吗每一次迭代，新值都在向真实解靠拢

为什么会靠近真实值（收敛）？因为右边那个系数是 $\frac{1}{2}$。在数学上，如果一个映射（函数）能够把两点之间的距离缩小，它就叫压缩映射

### 压缩映射
如果有一个度量空间，比如 $n$ 维实数空间 $\mathbb{R}^n$，空间里任意两点之间的距离是 $d(\mathbf{x}, \mathbf{y})$。
如果存在一个映射$f$，它满足：$$d(f(\mathbf{x}), f(\mathbf{y})) \le q \cdot d(\mathbf{x}, \mathbf{y}) \quad (0 \le q < 1)$$
那么这个映射 $f$ 被称为**压缩映射**。  
这个公式的意思是：空间里的任意两点 $\mathbf{x},\mathbf{y}$，经过映射 $f$ 变换之后，它们之间的距离变近了，变近了 $q$ 倍$(0 \le q < 1)$。这个 $q$ 被称为压缩常数。
压缩映射有两个性质
1. 它在这个空间内有且仅有一个不动点 $\mathbf{x}^*$（使得 $f(\mathbf{x}^*) = \mathbf{x}^*$）。
2. 你从空间里任意瞎猜一个初始点 $\mathbf{x}_{(0)}$ 开始，不停地做迭代 $\mathbf{x}_{(k+1)} = f(\mathbf{x}_{(k)})$，最终都会必然收敛到这个不动点。

第二个结论简单说一下  
假设 $f(\mathbf{x})$ 是一个压缩映射，对于度量空间中的两个点 $\mathbf{x}^*$，$\mathbf{x_{(0)}}$，其中 $\mathbf{x_{(0)}}$ 是猜测点， $\mathbf{x}^*$是不动点  
经过第一次迭代迭 $\mathbf{x}_{(1)} = f(\mathbf{x}_{(0)})$，根据压缩映射的定义和性质1：
$$\|\mathbf{x}_{(1)} - \mathbf{x}^*\| = \|f(\mathbf{x}_{(0)}) - f(\mathbf{x}^*)\|\le q \|\mathbf{x}_{(0)} - \mathbf{x}^*\|$$
再进行一次迭代
$\mathbf{x}_{(2)} = f(\mathbf{x}_{(1)})$
$$\|\mathbf{x}_{(2)} - \mathbf{x}^*\| = \|f(\mathbf{x}_{(1)}) - f(\mathbf{x}^*)\| \le q \|\mathbf{x}_{(1)} - \mathbf{x}^*\|$$
我们可以把第一次迭代的结果代入第二次迭代中去
$$\|\mathbf{x}_{(2)} - \mathbf{x}^*\| \le q^2 \|\mathbf{x}_{(0)} - \mathbf{x}^*\|$$
依次类推有
$$\|\mathbf{x}_{(k)} - \mathbf{x}^*\| \le q^k \|\mathbf{x}_{(0)} - \mathbf{x}^*\|$$
因为 $0 \le q < 1$ ,所以当 $k \to \infty$ 时，$\|\mathbf{x}_{(k)} - \mathbf{x}^*\| = 0$ ，即 $\mathbf{x}_{(k)} = \mathbf{x}^*$

所以我们要证明 jacobi 迭代法能够收敛实际上就是判断 jacobi 迭代法是否是一个压缩映射  
对于
$$\mathbf{x} = -\mathbf{D}^{-1}(\mathbf{L} + \mathbf{U})\mathbf{x} + \mathbf{D}^{-1}\mathbf{b}$$
我们令 $\mathbf{B} = -\mathbf{D}^{-1}(\mathbf{L} + \mathbf{U})$，$\mathbf{g} = \mathbf{D}^{-1}\mathbf{b}$ 就有
$$\mathbf{x} = f(\mathbf{x}) = \mathbf{B}\mathbf{x} + \mathbf{g}$$
根据压缩映射的定义
$$\|f(\mathbf{x}) - f(\mathbf{y})\| = \|(\mathbf{B}\mathbf{x} + \mathbf{g}) - (\mathbf{B}\mathbf{y} + \mathbf{g})\| = \|\mathbf{B}(\mathbf{x} - \mathbf{y})\|$$
而根据矩阵范数与向量范数的相容性
$$\|\mathbf{B}(\mathbf{x} - \mathbf{y})\| \le \|\mathbf{B}\| \cdot \|\mathbf{x} - \mathbf{y}\|$$
所以，只要矩阵 $\mathbf{B}$ 的某种范数满足 $\|\mathbf{B}\| < 1$，jacobi 迭代就是一个严格的压缩映射

> 要注意的是矩阵 $\mathbf{B}$ 的某种范数满足 $\|\mathbf{B}\| < 1$是 jacobi 迭代法收敛的充分条件，jacobi 迭代法收敛不一定$\|\mathbf{B}\| < 1$，也可能大于 1

而要满足 $\|\mathbf{B}\| < 1$ 则原系数矩阵 $A$ 必须是严格对角占优矩阵，即
$$|a_{ii}| > \sum_{j \neq i} |a_{ij}|$$
## 总结
jacobi 迭代法是一种求解线性方程组的方法，是通过迭代的方式去逼近精确解，它适用于系数矩阵是严格对角占优矩阵的情况（同时包含了主对角线不能含 0 ），对于谱半径大于1的矩阵无法收敛，而$\|\mathbf{B}\| < 1$必然收敛