---
date : '2025-06-28T10:34:29+08:00'
draft : false
title : '距离约束'
tags:
  - graphics
  - physics

categories:
  - blog

math: true
---
# 距离约束

在物理引擎中我们常常需要限制两个物体(或者点)之间的相对相对距离，这种效果在现实中就类似拿一根固定长度的刚体丝线连接两个物体上的某个点，这就不得不再次用到约束了。

通过之前《基于冲量的约束求解》这篇文章我们了解到我们只需要写出我们需要的约束方程，然后找出Jacobian矩阵就可以通过之前那篇文章最后导出的公式求解冲量了。接下来我们将介绍解释碰撞约束的约束方程和推导Jacobian矩阵。

## 距离约束的约束方程

假设存在两个物体：**物体A**，**物体B**。我们要将 **物体A** 上的点$\mathbf{P}_A$连接到 **物体B** 上的点$\mathbf{P}_B$上。

我们的目的是使得这两个点之间的距离（在欧几里得度量下）在某个期望值 $d$下保持不变。为了实现这一目标，那么我们的位置约束方程可以这么写：
$$
C=(\mathbf{P}_A-\mathbf{P}_B)\cdot(\mathbf{P}_A-\mathbf{P}_B) -d^2=0
$$
表示的是两个点之间的距离与期望距离相等

事实上还可以这么写
$$
C=\sqrt{(\mathbf{P}_A-\mathbf{P}_B)\cdot(\mathbf{P}_A-\mathbf{P}_B) -d^2}=0
$$

$$
C=\sqrt{(\mathbf{P}_A-\mathbf{P}_B)\cdot(\mathbf{P}_A-\mathbf{P}_B)}-d = 0
$$

$$
C=\left \| \mathbf{P}_A-\mathbf{P}_B \right \|-d=0
$$

上述表示方式都是正确的，选择哪一种取决于具体的应用场景和个人偏好。第一种方式避免了开方运算，在某些数值计算中更为高效；而下面三种种方式则更加直观，直接表达了距离的概念。接下来采用第一种进行推导。

## Jacobian矩阵

还记得我们《物理引擎中的约束》中提到的我们找到位置约束方程后，我们还需要对时间求导，得到速度约束方程。

在这里由于我们只有一个系统所以我们的约束方程退化成了多元函数，Jacobian 矩阵退化成了梯度。
$$
\dot C =\frac{\partial C}{\partial t}=\nabla C\cdot \begin{bmatrix}
\dot {\mathbf{P} }_A  \\
\dot {\mathbf{P} }_B
\end{bmatrix}
$$
其中
$$
\nabla C = (\frac{\partial C}{\partial \mathbf{P}_A},\frac{\partial C}{\partial \mathbf{P}_B})=(2(\mathbf{P}_A-\mathbf{P}_B),-2(\mathbf{P}_A-\mathbf{P}_B))
$$
我们需要将其展开，我们知道
$$
\mathbf{P}_A = \mathbf{c}_A + \mathbf{r}_A, \quad \mathbf{P}_B = \mathbf{c}_B + \mathbf{r}_B
$$
其中：

- $\mathbf{c}_A, \mathbf{c}_B$ 是物体质心位置
- $\mathbf{r}_A, \mathbf{r}_B$ 是点相对于质心的局部偏移

我们知道
$$
\dot{\mathbf{P}}_A = \mathbf{v}_A + \boldsymbol{\omega}_A \times \mathbf{r}_A, \quad \dot{\mathbf{P}}_B = \mathbf{v}_B + \boldsymbol{\omega}_B \times \mathbf{r}_B
$$
带入速度约束
$$
\dot{C} = 2 (\mathbf{P}_A - \mathbf{P}_B) \cdot \dot{\mathbf{P}}_A - 2 (\mathbf{P}_A - \mathbf{P}_B) \cdot \dot{\mathbf{P}}_B
$$

$$
\dot{C} = 2 (\mathbf{P}_A - \mathbf{P}_B) \cdot \Big( (\mathbf{v}_A + \boldsymbol{\omega}_A \times \mathbf{r}_A) - (\mathbf{v}_B + \boldsymbol{\omega}_B \times \mathbf{r}_B) \Big)
$$

$$
\dot C =2 (\mathbf{P}_A - \mathbf{P}_B)\cdot\mathbf{v}_A+2 \boldsymbol{\omega}_A\cdot( \mathbf{r}_A\times (\mathbf{P}_A - \mathbf{P}_B))-2 (\mathbf{P}_A - \mathbf{P}_B)\cdot\mathbf{v}_B-2 \boldsymbol{\omega}_B\cdot( \mathbf{r}_B\times (\mathbf{P}_A - \mathbf{P}_B))
$$

我们将其写成矩阵的形式
$$
\dot{C} = \mathbf{J} \cdot \mathbf{V} =  \begin{bmatrix} 2 (\mathbf{P}_A - \mathbf{P}_B) & 2 (\mathbf{r}_A \times(\mathbf{P}_A - \mathbf{P}_B))  & -2 (\mathbf{P}_A - \mathbf{P}_B) & -2 (\mathbf{r}_B \times(\mathbf{P}_A - \mathbf{P}_B)) \end{bmatrix}\begin{bmatrix} \mathbf{v}_A \\ \boldsymbol{\omega}_A \\ \mathbf{v}_B \\ \boldsymbol{\omega}_B \end{bmatrix}
$$
在带入我们的《物理引擎中的约束》最后的得到的方程我们可以解出冲量