---
date : '2026-07-01T15:07:35+08:00'
draft : true
title : 'Stage1_1'
tags:
  - graphics

categories:
  - blog

math: true
---
# 线性代数
> tips：我们这里教的都是极为感性的认识，是绝对不严谨的。我们的目标是教会你这个数学工具是怎么使用，更为严谨的需要在学校课堂中或者网上学习！

这篇文章讲讲述线性代数在图形学中的应用，主要内容有：矩阵、线性变换、投影变换、基变换
# 矩阵
在计算机图形学中矩阵是一个矩形数表，其中可以放很多数，例如这样
$$
\mathbf{A} = \begin{bmatrix}
1  & \pi \\
2  & 1
\end{bmatrix} \quad \mathbf{B} = \begin{bmatrix}
\ln2  &\frac{1}{2}  &0.5 \\
78  & 88 &114514
\end{bmatrix}
$$
我们用 $\mathbf{A}_{i,j}$ 表示矩阵 $\mathbf{A}$ 的第 $i$ 行第 $j$ 列的元素，例如 $\mathbf{A}_{1,2}$ 表示矩阵 $\mathbf{A}$ 的第 1 行第 2 列的元素，也就是元素 $3$

## 矩阵的运算 (乘法是重点)
### 矩阵的加减法
矩阵的加减法运算规则只需要记住一句话就好了，对应位置对应元素 相加/相减。 

既然是对应元素进行运算，那么必然矩阵的形状是相同的
例如我们想算
$$ \mathbf{A} \pm \mathbf{B} $$
那么我们就对所有的下标 $i$ 和 $j$ 对应的元素进行运算 $\mathbf{A}_{i,j} \pm \mathbf{B}_{i,j}$ （注：这里的 $\mathbf{A}_{i,j}$ 和 $\mathbf{B}_{i,j}$ 都是我们熟悉的实数，实数的加减法我们小学就会了）这样我们会得到一个新的数我们记作 $\mathbf{C}_{i,j}$，最后你会发现 $\mathbf{C}_{i,j}$ 会构成一个形状和 $\mathbf{A}$ 、$\mathbf{B}$ 一样的矩阵，我们记作 $\mathbf{C}$

我们拿加法举例：
$$
\mathbf{A} = \begin{bmatrix}
 1 & 1 & 1\\
 2 & 2 & 2\\
 3 & 3 & 3
\end{bmatrix} \quad \mathbf{B} = \begin{bmatrix}
 1 & 2 & 3\\
 1 & 2 & 3 \\
 1 & 2 & 3
\end{bmatrix}
$$
那么
$$
\mathbf{C} = \mathbf{A}+\mathbf{B} = \begin{bmatrix}
 1+1 & 2+1 & 1+3\\
 2+1 & 2+2 & 2+3\\
 3+1 & 3+2 & 3+3
\end{bmatrix}=\begin{bmatrix}
 2 & 3 & 4\\
 3 & 4 & 5\\
 4 & 5 & 6
\end{bmatrix}
$$
### 矩阵的转置
矩阵的转置是线性代数中的一种新的运算，在我们之前学习的代数中是没有这个运算的，或者是说这个运算在我们之前学习的代码中是没有意义的。  

转置运算就是将矩阵的行和列进行交换，就像你拿着一个矩形的两个对角（不相邻的两个角）将这个矩形平面绕着这个轴旋转 180 度一样

假设我们有一个矩阵 $\mathbf{A}$ ，那么我们将矩阵 $\mathbf{A}$ 的转置记作 $\mathbf{A}^{T}$。
对每个元素 $\mathbf{A}_{i,j}$ 有 $\mathbf{A}^{T}_{i,j} = \mathbf{A}_{j,i}$

例如：
$$ 
\mathbf{A} = \begin{bmatrix}
 1 & 1 & 1\\
 2 & 2 & 2\\
 3 & 3 & 3
\end{bmatrix} \quad \mathbf{A}^{T} = \begin{bmatrix}
 1 & 2 & 3\\
 1 & 2 & 3 \\
 1 & 2 & 3
\end{bmatrix}
$$

### 矩阵的数乘
矩阵的数乘很简单就是目标是让一个 实数 与 矩阵 相乘，那么规则是：对矩阵中的每个元素乘以这个数  
假设我们有一个矩阵 $\mathbf{A}$ 和 实数 $k$ ，那么对每个元素 $\mathbf{A}_{i,j}$ 乘以 $k$ ，即 $k \cdot \mathbf{A}_{i,j}$。

例如：
$$
\mathbf{A} = \begin{bmatrix}
 1 & 1 & 1\\
 2 & 2 & 2\\
 3 & 3 & 3
\end{bmatrix} \quad k = 2 \quad
k \cdot \mathbf{A} = 2 \cdot \mathbf{A} = \begin{bmatrix}
 2 & 2 & 2\\
 4 & 4 & 4\\
 6 & 6 & 6
\end{bmatrix}
$$
### 矩阵的乘法
在接受矩阵的乘法前，我们先介绍一下向量（虽然你很熟悉，我们只会介绍你不熟悉的）
其实我们的矩阵还可以是 1 行 n 列的，也可以是 n 行 1 列的，这样形状的矩阵就是我们熟悉的向量了，所以向量其实是一种特殊的矩阵
例如：
$$
\mathbf{v} = \begin{bmatrix}
1  & 2 &3
\end{bmatrix}
$$
$$
\mathbf{x} = \begin{bmatrix}
1 \\
2 \\
3
\end{bmatrix}
$$
我们利用转置运算可以得到：
$$ \mathbf{v}^{T} = \mathbf{x} $$

我们知道了向量其实是特殊形状的矩阵，它相对简单，我们首先看看向量（简单的矩阵）之间的乘法是怎么做的。

我们都知道向量的点乘运算是对应元素相加最后求和（显然他们的形状必须相同）。  

但是我们在矩阵中我们需要稍微调整一下，我们需要让它们的形状不同。  

在矩阵中，1 行 n 列的向量只能和 n 行 1 列的向量相乘，
假设我们有向量 $ \mathbf{v} $ 它是1 行 3 列的，以及向量 $\mathbf{x} $ 它是 n 行 1 列的，那么 他们做点乘就是 
$$ \sum_{i=1}^{3}\mathbf{v}_{1,i} \cdot \mathbf{x}_{i,1} = \mathbf{v}_{1,1} \cdot \mathbf{x}_{1,1} + \mathbf{v}_{1,2} \cdot \mathbf{x}_{2,1} + \mathbf{v}_{1,3} \cdot \mathbf{x}_{3,1} $$

写成矩阵的形式：
$$ 
\mathbf{v} \mathbf{x} = \begin{bmatrix}
1  & 2 &3
\end{bmatrix}\begin{bmatrix}
1 \\
2 \\
3
\end{bmatrix} = 1 \cdot 1 + 2 \cdot 2 + 3 \cdot 3 = 14
$$ 
