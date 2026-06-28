---
date : '2025-06-28T10:35:52+08:00'
draft : false
title : '角度约束'
tags:
  - graphics
  - physics

categories:
  - blog

math: true
---
# 角度约束

在物理引擎中，我们经常需要控制两个物体之间的相对角度，比如机械臂的关节角度或者两个刚体之间的旋转约束。这种约束在现实中就类似用铰链连接两个物体，使它们在某个期望夹角下旋转。

通过之前《基于冲量的约束求解》这篇文章我们知道，实现约束的关键是写出约束方程，然后求出Jacobian矩阵，最后用公式求解冲量。下面我们将详细介绍角度约束的约束方程和Jacobian矩阵的推导。

## 角度约束的约束方程

假设存在两个物体：**物体A**和**物体B**，我们希望它们的旋转轴之间保持一个期望夹角 $\theta_d$。

设物体A的参考方向为单位向量 $\mathbf{u}_A$，物体B的参考方向为单位向量 $\mathbf{u}_B$。我们希望这两个向量之间的夹角等于 $\theta_d$，约束方程可以写为：

三维情况下
$$
C = \mathbf{u}_A \cdot \mathbf{u}_B - \cos\theta_d = 0
$$
这里 $\mathbf{u}_A \cdot \mathbf{u}_B = \cos\theta$ 表示当前夹角，$C=0$ 表示夹角正好为期望值。

以下写法也正确，但通常不推荐
$$
C=arccos(\mathbf{u}_A\cdot\mathbf{u}_B)-\theta_d=0
$$
二维情况下
$$
C=\theta_A-\theta_B-\theta_d=0
$$
$\theta_A,\theta_B$ 分别表示物体的角度

## Jacobian矩阵

### 三维推导

为了得到速度约束方程，我们对位置约束方程对时间求导：
$$
\dot C = \nabla C\cdot\dot{\mathbf{q}} = \begin{bmatrix}\frac{\partial C}{\partial \mathbf{u}_A}&\frac{\partial C}{\partial \mathbf{u}_B}\end{bmatrix}\begin{bmatrix}\dot{\mathbf{u}}_A\\\dot{\mathbf{u}}_B\end{bmatrix}
$$

$$
\dot C =  \begin{bmatrix}\mathbf{u}_B&{\mathbf{u}}_A\end{bmatrix}\begin{bmatrix}\dot{\mathbf{u}}_A\\\dot{\mathbf{u}}_B\end{bmatrix}
$$

旋转向量的变化可以用角速度表示：
$$
\dot{\mathbf{u}}_A = \boldsymbol{\omega}_A \times \mathbf{u}_A, \quad \dot{\mathbf{u}}_B = \boldsymbol{\omega}_B \times \mathbf{u}_B
$$
代入速度约束：
$$
\dot C = (\boldsymbol{\omega}_A \times \mathbf{u}_A) \cdot \mathbf{u}_B + \mathbf{u}_A \cdot (\boldsymbol{\omega}_B \times \mathbf{u}_B)
$$
利用向量恒等式 $(\mathbf{a} \times \mathbf{b}) \cdot \mathbf{c} = \mathbf{a} \cdot (\mathbf{b} \times \mathbf{c})$，可以得到：
$$
\dot C = \boldsymbol{\omega}_A \cdot (\mathbf{u}_A \times \mathbf{u}_B) + \boldsymbol{\omega}_B \cdot (\mathbf{u}_B \times \mathbf{u}_A)
$$
注意 $\mathbf{u}_B \times \mathbf{u}_A = - (\mathbf{u}_A \times \mathbf{u}_B)$，于是速度约束可以写成矩阵形式：
$$
\dot C = \begin{bmatrix} \mathbf{u}_A \times \mathbf{u}_B & -(\mathbf{u}_A \times \mathbf{u}_B) \end{bmatrix} \begin{bmatrix} \boldsymbol{\omega}_A \\ \boldsymbol{\omega}_B \end{bmatrix} = \mathbf{J} \cdot \boldsymbol{\Omega}
$$
其中
$$
\mathbf{J} = \begin{bmatrix} \mathbf{u}_A \times \mathbf{u}_B & -(\mathbf{u}_A \times \mathbf{u}_B) \end{bmatrix}, \quad
\boldsymbol{\Omega} = \begin{bmatrix} \boldsymbol{\omega}_A \\ \boldsymbol{\omega}_B \end{bmatrix}
$$
为了保证程序通用性一般写作
$$
\mathbf{J} = \begin{bmatrix}0&  \mathbf{u}_A \times \mathbf{u}_B & 0&-(\mathbf{u}_A \times \mathbf{u}_B) \end{bmatrix}, \quad
\mathbf{V} = \begin{bmatrix}\mathbf{v}_A\\ \boldsymbol{\omega}_A \\\mathbf{v}_B\\ \boldsymbol{\omega}_B \end{bmatrix}
$$

## 二维推导

为了得到速度约束方程，我们对位置约束方程对时间求导：
$$
\dot C =\nabla C\cdot\dot {\mathbf{q}}=\begin{bmatrix}\frac{\partial C}{\partial \theta_A}&\frac{\partial C}{\partial \theta_B}\end{bmatrix}\begin{bmatrix}\frac{d}{dt}\theta_A&\frac{d}{dt}\theta_B\end{bmatrix}^T=\begin{bmatrix}1&-1\end{bmatrix}\begin{bmatrix}\omega_A&\omega_B\end{bmatrix}^T
$$
为了保证程序通用性一般写作
$$
\dot C  =\begin{bmatrix}0&1&0&-1\end{bmatrix}\begin{bmatrix}\mathbf{v}_{A}\\ \omega_A \\ \mathbf{v}_{B} \\ \omega_B\end{bmatrix}
$$
其中
$$
\mathbf{J} = \begin{bmatrix}  0 & 1  & 0 & -1 \end{bmatrix}, \quad
\mathbf{V} = \begin{bmatrix}\mathbf{v}_{A}\\ \omega_A \\ \mathbf{v}_{B} \\ \omega_B\end{bmatrix}
$$