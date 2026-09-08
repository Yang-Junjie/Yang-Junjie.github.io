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

线性变换更严格的定义是：  
设 $V$ 和 $W$ 两个线性空间，映射 $T:V\to W$ 被称为线性变换，当且仅当它满足可加性和齐次性。  
- 可加性： $T(\mathbf{u}+\mathbf{v})=T(\mathbf{u})+T(\mathbf{v})$  
- 齐次性： $T(k\mathbf{u})=kT(\mathbf{u})$  

而矩阵可以用来表示这个映射操作，我们都知道矩阵满足可加性和齐次性。

------

## 模型变换
在计算机图形学中通常将对模型的变换叫做 **模型变换（Model Transform）** ，模型变换在非齐次坐标下是线性变换。  

我们都知道模型是由一系列 **网格 (Mesh)** 组成的，而网格又是由三维空间中的顶点组成的，所以我们只需要 **对网格中的所有的顶点都做一次相同的模型变换**，就能对整个模型进行一次模型变换了。

我们知道线性变换是一种映射操作，而我们在高中数学中学过函数就是一种映射，并且有各种各样的函数（映射）如：三角函数，指数函数等等。   

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

我们可以看到与 缩放、旋转变换 的 $\mathbf{x}^{\prime} = \mathbf{M}\mathbf{x}$ 形式不同的是 平移变换 是 $\mathbf{x}^{\prime} = \mathbf{x} + s\mathbf{v}$，根据线性变换的定义平移变换及不满足可加性，也不满足齐次性，所以平移变换并不是线性变换。

如果是这样我们就需要根据不同的运算实现不同的算法，这非常的不优雅，事实上我们有更好的方法将平移操作也变为 $\mathbf{x}^{\prime} = \mathbf{M}\mathbf{x}$ 的形式，那就是引入齐次坐标。

## 齐次坐标
齐次坐标的做法就是给每一个点增加一个额外的坐标分量 $w$，通常情况下对于一个点 $w = 1$，对于一个向量 $w = 0$

- 二维点 $[x,y]^T \to [x,y,1]^T$
- 三维点 $[x,y,z]^T \to [x,y,z,1]^T$    

这样我们就可以将平移操作变为 $\mathbf{x}^{\prime} = \mathbf{M}\mathbf{x}$ 的形式了  

此时，平移变换可以写成矩阵乘法：
$$
T(t_x,t_y,t_z) = \begin{bmatrix}
1  & 0 & 0 &t_x \\
0  & 1 & 0 &t_y \\
0  & 0 & 1 &t_z \\
0  & 0 & 0 &1
\end{bmatrix}
$$

对齐次坐标点 $ [x,y,z,1]^T $ 作用:
$$
\begin{bmatrix}
1  & 0 & 0 &t_x \\
0  & 1 & 0 &t_y \\
0  & 0 & 1 &t_z \\
0  & 0 & 0 &1
\end{bmatrix}
\begin{bmatrix}
x \\
y \\
z \\
1
\end{bmatrix}=
\begin{bmatrix}
x+t_x \\
y+t_y \\
z+t_z \\
1
\end{bmatrix}
$$

这样，平移、旋转、缩放全都统一为矩阵乘法。

接下来解释一下为什么对于齐次坐标点 $w = 1$ 齐次坐标向量 $w = 0$
我们都看到了对于一个点，在平移变换下 $w = 1$ 刚好可以让 x y z 分量都加上一个数。而对于一个向量我们希望向量保持平移后向量不变的性质，所以我们令 $w = 0$ 这样对向量进行平移变换，向量不变。  

并且在齐次坐标下向量的运算性质和非齐次坐标下保持一致。在齐次坐标下（在非齐次坐标下，向量和点是一一对应的，他们的运算是一致的）两个点的运算会改变 $w$ 的值。

如对 $\mathbf{u} = [a,b,c,1]^T$ 和  $\mathbf{v} = [e,f,g,1]^T$ 进行加法：
$$
 \mathbf{k} =  \mathbf{u} + \mathbf{v} = [a+e,b+f,c+g,2]^T 
$$
可以看到 $w$ 变成了 $2$ ，而这并不是一个点，所以我们需要对 $\mathbf{k}$ 进行归一化 
$$
\frac{1}{2} \cdot \mathbf{k} = [(a+e)/2,(b+f)/2,(c+g)/2,1]^T
$$

## 再看模型变换
在引入齐次坐标后，平移变换的问题是解决了，但是多了一个分量，我们之前的缩放、旋转变换的矩阵就不适用了，为了解决这个问题，我们需要调整一下缩放、旋转变换的矩阵，让其适配新的齐次坐标。

三维缩放变换在齐次坐标下为：
$$
scale(s_x,s_y,s_z)=\begin{bmatrix}
 s_x & 0 & 0 & 0\\
 0 & s_y & 0 & 0\\
 0 & 0 & s_z & 0 \\
 0 & 0 & 0 & 1
 \end{bmatrix}
 $$


二维旋转变换在齐次坐标下为：

$$
rotate(\theta)=\begin{bmatrix}
 \cos\theta & -\sin\theta & 0\\ 
 \sin\theta & \cos\theta  & 0\\
 0 &  0 & 1
 \end{bmatrix}
$$

三维旋转变换同理。

### 变换的顺序问题
在上一节中，我们知道矩阵的乘法是不满足交换律的，所以对一个点进行变换的时候不同的顺序会导致变换得到的结果也不同，

我们使用 python 来做一个实验，我们看看先平移和先旋转的变换结果是否相同：
```python
import numpy

def rotate(radians, point):
    rotation_matrix = numpy.array([[numpy.cos(radians), -numpy.sin(radians), 0],
                                   [numpy.sin(radians),  numpy.cos(radians), 0],
                                   [     0,                    0,            1]])
    return rotation_matrix.dot(point)

def translate(translation, point):
    translation_matrix = numpy.array([[1, 0, translation[0]],
                                      [0, 1, translation[1]],
                                      [0, 0,      1        ]])
    return translation_matrix.dot(point)

p = numpy.array([1, 0, 1])

print("rotate(pi/4) * translate(1,1) * p = ", rotate(numpy.pi/4, translate([1, 1], p)))

print("translate(1,1) * rotate(pi/4) * p = ", translate([1, 1], rotate(numpy.pi/4, p)))

print("Is equal:", numpy.allclose(rotate(numpy.pi/4, translate([1, 1], p)), 
                              translate([1, 1], rotate(numpy.pi/4, p))))
```

运行结果为：
```
rotate(pi/4) * translate(1,1) * p =  [0.70710678 2.12132034 1.        ]
translate(1,1) * rotate(pi/4) * p =  [1.70710678 1.70710678 1.        ]
is equal: False
```

而在游戏引擎中，无论是先旋转还是先平移得到的结果都是一样的，这是为什么呢？ 是因为在不同的游戏引擎中，固定了模型变换矩阵的顺序，无论你调整了那个模型变换矩阵都会按照一样的顺序执行一遍变换。

这样说还是太抽象了，我们举一些具体的例子：

假设你在游戏引擎中先调整 Transform 组件的 Translate ，再调整 Rotate 引擎会对模型的点 $ x $ , 进行如下运算 $ \mathbf{x}^{\prime} = \mathbf{S}\mathbf{R}\mathbf{T} \mathbf{x} $ 计算即顺序被固定为 先平移，再旋转，再缩放。无论你怎么调都是这个顺序所以结果是一样的。