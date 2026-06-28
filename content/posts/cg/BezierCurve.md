---
date : '2025-06-28T10:36:45+08:00'
draft : false
title : '贝塞尔曲线'
tags:
  - graphics
  - physics

categories:
  - blog

math: true
---
**贝塞尔曲线（Bézier Curve）** 是一种在计算机图形学，图形设计软件（如 Adobe Illustrator）、动画制作、字体设计等领域中广泛使用的参数曲线，常用于设计平滑的曲线路径。

本文将介绍贝塞尔曲线的基本原理，公式推导。

## 贝塞尔曲线的基本原理

贝塞尔曲线由一组控制点定义。最常见的是一次、二次和三次贝塞尔曲线。

所以我们只介绍一次、二次和三次贝塞尔曲线。

贝塞尔曲线是通过一组有序控制点定义的参数函数，该函数将参数 t 映射到曲线上的空间点。

## 一次贝塞尔曲线

在平面中两个点可以确定一条线段，那么我们怎么表示线段上的任意一个点呢？

假设平面中存在任意两个点$\mathbf{P_1},\mathbf{P_2}$（注：这里的点指的是向量）

那么线段$\mathbf{P_2-P_1}$上的任意一个点$\mathbf{P}$的模长应该满足
$$
||\mathbf{P_1}||\le||\mathbf{P}||\le||\mathbf{P_2}||
$$
且方向与$\mathbf{P_1}$的方向一致

那么$\mathbf{P}$可以由$\mathbf{P_1}$,$\mathbf{P_2-P_1}$和一个参数 $t$ 来决定

即
$$
\mathbf{P}=\mathbf{P_1}+t(\mathbf{P_2-P_1}),0\le t\le 1
$$
$\mathbf{P_1}$确定初始位置，$t(\mathbf{P_2-P_1})$控制范围

变换一下有
$$
\mathbf{P}=(1-t)\mathbf{P_1}+t\mathbf{P_2},0\le t\le 1
$$
对图形学熟悉的一眼能看出来这个公式是一个线性插值公式，也就是 `lerp` 表达式

标准`lerp`表达式为
$$
lerp(a,b,t) = (1-t)a+tb
$$

## 二次贝塞尔曲线

两个点可以确定一个线段，那么三个点就可以确定两个线段，这样我们可以得到两个一次贝塞尔曲线。

假设平面上有三个点$\mathbf{P_1},\mathbf{P_2},\mathbf{P_3}$

那么我们可以的到两个lerp表达式
$$
lerp(\mathbf{P_1},\mathbf{P_2},t),\quad0\le t\le 1
$$

$$
lerp(\mathbf{P_2},\mathbf{P_3},t),\quad0\le t\le 1
$$

给定任意 $t$ 我们可以确定两个点$\mathbf{P_4},\mathbf{P_5}$

当我们 $t$ 取不同的值时$\mathbf{P_4},\mathbf{P_5}$的位置也会随之变化，如果我们将$\mathbf{P_4},\mathbf{P_5}$连接起来我们又会的到一条线段记作 $l$ ，很显然我们又得到一条lerp表达式
$$
lerp(\mathbf{P_4},\mathbf{P_5},t),\quad0\le t\le 1
$$
当我们的 $t$ 从0 到 1 取遍每一个数，那么线段 $l$ 也会随之动起来，当你把所有取不同数得到的 $l$ 画出来你会发现某个点的轨迹是一条曲线。

这个点的轨迹正是(注：$\mathbf{P_4},\mathbf{P_5}$是动点)
$$
lerp(\mathbf{P_4},\mathbf{P_5},t),\quad0\le t\le 1
$$

$$
lerp(lerp(\mathbf{P_1},\mathbf{P_2},t),lerp(\mathbf{P_2},\mathbf{P_3},t),t),\quad0\le t\le 1
$$

我们将表达式写出来
$$
\mathbf{P} = (1-t)[(1-t)\mathbf{P_1}+t\mathbf{P_2}]+t[(1-t)\mathbf{P_2}+t\mathbf{P_3}],\quad0\le t\le 1
$$
化简
$$
\mathbf{P} = (1-t)^2\mathbf{P_1}+2t(1-t)\mathbf{P_2}+t^2\mathbf{P_3},\quad0\le t\le 1
$$
这就是二次贝塞尔曲线

## 三次贝塞尔曲线

与二次贝塞尔曲线同理，4个点可以确定三条选段，得到三个lerp表达式

，这三个表达式可以确定3个点，这就退化到二次贝塞尔曲线了。

所以通过相同方式的推导我们可以的到三次贝塞尔曲线公式
$$
B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3, \quad t \in [0,1]
$$