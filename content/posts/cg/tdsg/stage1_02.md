---
date : '2026-08-09T20:39:34+08:00'
draft : true
title : '线性变换以及齐次坐标'
tags:
  - graphics

categories:
  - blog

math: true
---
## 线性变换 
在计算机图形学中我们通常使用 **矩阵** 对模型进行变换操作，如进行缩放、旋转等。而这些操作在非齐次坐标下（齐次坐标是什么我们后面介绍）都是线性变换。

> 线性变换更严格的定义是：  
设 $V$ 和 $W$ 两个线性空间，映射 $T:V\to W$ 被称为线性变换，当且仅当它满足可加性和齐次性。  
而矩阵可以用来表示这个映射操作，我们都知道矩阵满足可加性和齐性。

------

## 模型变换
在计算机图形学中我们通常将对模型的变换叫做 **模型变换（Model Transform）** ，模型变换在非齐次坐标下是线性变换。  

我们都知道模型是由一系列网格组成的，而网格又是由三维空间中的顶点组成的，所以我们只需要对模型网格中的所有的顶点都做一次相同的模型变换，就能对整个模型进行一次模型变换了。

我们知道线性变换是一种映射操作，而我们在高宗数学中学过函数就是一种映射，并且有各种各样的函数（映射）如：三角函数，指数函数等等。   

而模型变换是线性变换，线性变换是映射，与我们高中学的函数一样，有很多种类型。接下来我们介绍一些常用的模型变换矩阵（因为线性变换可以用矩阵表示）。

### 缩放变换（Scale Transform）
在二维空间下，缩放变换的矩阵被定义为：

$$
scale(s_x,s_y)=\begin{bmatrix}
 s_x & 0\\
 0 & s_y
\end{bmatrix}
$$

对于二维模型中的某个向量（点） $[x,y]^{T}$ ，我们希望对其在 $x$ 轴缩放到原来的$s_x$倍，在 $y$ 轴缩放到原来的$s_y$倍，得到新的点$(x',y')$，相当于我们进行了如下的数学操作，

$$
\begin{bmatrix}
x^{\prime} \\
y^{\prime}
\end{bmatrix}=
scale(s_x,s_y)\begin{bmatrix}
x \\
y
\end{bmatrix}=
\begin{bmatrix}
 s_x & 0\\
 0 & s_y
\end{bmatrix}\begin{bmatrix}
x \\
y
\end{bmatrix}=\begin{bmatrix}
s_x\cdot x \\
s_y\cdot y
\end{bmatrix}
$$

例如：我们对一个二维图形进行缩放变换，对其在 $x$ 轴缩放到原来的 $0.5$ 倍，在 $y$ 轴缩放到原来的 $1.5$ 倍，那么这个缩放变换的矩阵就是：
$$
scale(0.5,1.5)=
\begin{bmatrix}
 0.5 & 0\\
 0 & 1.5
\end{bmatrix}\
$$
![来自Fundamentals of Computer Graphics](images/cg/tdsg/course/stage1/stage1_02/image1.png)

而在三维空间下，缩放变换的矩阵被定义为：
$$
scale(s_x,s_y,s_z)=\begin{bmatrix}
 s_x & 0 & 0\\
 0 & s_y & 0\\
 0 & 0 & s_z
 \end{bmatrix}
 $$

-----

## 旋转变换（Rotate Transform）
在二维空间下，旋转变换的矩阵被定义为：

$$
rotate(\theta)=\begin{bmatrix}
 \cos\theta & -\sin\theta\\
 \sin\theta & \cos\theta
 \end{bmatrix}
$$

对于二维空间中的一个向量 $[x,y]^{T}$ ，我们希望对这个向量逆时针旋转 $\frac{\pi}{2}$ 度，旋转后的向量 $(x',y')$，相当于我们进行了如下的数学操作，

$$
\begin{bmatrix}
x^{\prime} \\
y^{\prime}
\end{bmatrix}=
rotate(\frac{\pi}{2})
\begin{bmatrix}
x \\
y
\end{bmatrix}
=\begin{bmatrix}
 \cos\frac{\pi}{2} & -\sin\frac{\pi}{2}\\
 \sin\frac{\pi}{2} & \cos\frac{\pi}{2}
 \end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}=
\begin{bmatrix}
-y \\
x
\end{bmatrix}
$$

对于一个二维图形，我们希望对这个图形逆时针旋转 $\frac{\pi}{4}$ 度，那么这个旋转变换的矩阵就是：  

$$
rotate(\frac{\pi}{4})=\begin{bmatrix}
 \cos\frac{\pi}{4} & -\sin\frac{\pi}{4}\\
 \sin\frac{\pi}{4} & \cos\frac{\pi}{4}
 \end{bmatrix}=
 \begin{bmatrix}
 0.707 & -0.707\\
 0.707 & 0.707
 \end{bmatrix}
 $$
![来自Fundamentals of Computer Graphics](images/cg/tdsg/course/stage1/stage1_02/image2.png)

在二维空间下旋转变换非常简单，因为你只能在这个平面中旋转。而在三维中间下，旋转矩阵通常由三个，分别是绕 $x$ , $y$ ,$z$ 轴旋转的旋转矩阵

假设旋转角度为 $\theta$，在**右手坐标系**下，按照右手定则（大拇指指向旋转轴正方向，四指弯曲方向为旋转正方向），绕三个轴旋转的矩阵分别为：

### 绕 $x$ 轴旋转 $R_x(\theta)$

绕 $x$ 轴旋转时，$x$ 坐标保持不变：


$$R_x(\theta) = \begin{bmatrix} 1 & 0 & 0 \\ 0 & \cos\theta & -\sin\theta \\ 0 & \sin\theta & \cos\theta \end{bmatrix}$$

### 绕 $y$ 轴旋转 $R_y(\theta)$

绕 $y$ 轴旋转时，$y$ 坐标保持不变（注意符号位置与其他两个矩阵相反，这是因为在右手系中 $z \times x = y$ 的循环顺序导致的）：


$$R_y(\theta) = \begin{bmatrix} \cos\theta & 0 & \sin\theta \\ 0 & 1 & 0 \\ -\sin\theta & 0 & \cos\theta \end{bmatrix}$$

### 绕 $z$ 轴旋转 $R_z(\theta)$

绕 $z$ 轴旋转时，$z$ 坐标保持不变，本质上就是二维平面旋转矩阵在三维的扩展：


$$R_z(\theta) = \begin{bmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix}$$

## 平移操作

我们已经介绍了我们常用的两个模型变换操作了，还剩下平移操作，平移与前面两个都不太一样。

我们都知道对于一个点（向量）$[x,y,z]^T$ 移动一段距离事实上就是对这个点加上一个向量。

例如，我们希望对点 $[x,y,z]^T$ 沿着 $\mathbf{v}$ 方向（单位向量） 移动 $s$ 距离，得到新的点 $[x',y',z']^T$，事实上就是：

$$
\begin{bmatrix}
x^{\prime} \\
y^{\prime} \\
z^{\prime}
\end{bmatrix}=\begin{bmatrix}
x \\
y \\
z
\end{bmatrix}+s\mathbf{v}
$$

我们可以看到与缩放、旋转的 $\mathbf{x}^{\prime} = \mathbf{M}\mathbf{x}$ 形式不同的是平移是 $\mathbf{x}^{\prime} = \mathbf{x} + s\mathbf{v}$

如果就这样我们需要根据操作的不同实现不同的算法，这非常的不优雅，事实上我们有更好的方法将平移操作也变为 $\mathbf{x}^{\prime} = \mathbf{M}\mathbf{x}$ 的形式，那就是引入齐次坐标。

## 齐次坐标


上面没介绍的原因是如果想把平移操作纳入