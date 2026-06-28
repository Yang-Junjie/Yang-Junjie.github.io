---
date : '2025-06-28T10:38:24+08:00'
draft : false
title : '【 理论力学 】 最小作用量原理'
tags:
  - physics

categories:
  - blog

math: true
---
# 理论力学 | 最小作用量原理

在理论力学中，**欧拉-拉格朗日方程**是求解系统运动方程的核心工具。它将经典力学问题转化为变分问题，通过最小作用量原理得到系统的运动规律。

## 拉格朗日函数

**拉格朗日函数** $ L $ 是一个多元函数，只要给出广义坐标 $q$ 、广义速度 $\dot q$ 和时间 $t$ 它可以表征任意一个力学系统。换句话说只要你告诉我系统的广义坐标、广义速度和时间，我就能用一个拉格朗日函数完全描述这个系统的动力学行为。拉格朗日函数可以理解为系统在每一时刻的“运动净收益”。
$$
L(q,\dot q,t)=T-V
$$
其中

- $ T $是动能

- $ V $是势能

Q:为什么拉格朗日函数等于动能减去势能？

A:猜的！对没错就是猜的，最初它是一个**经验性构造**，这样定义后发现它是自洽的所有已知力学系统都符合。

## 作用量 (Action)

**作用量 $ S $** 是一个标量泛函，它将一条轨迹 $q(t)$ (函数)映射到一个数值，即量化了运动轨迹。
$$
S = \int_{t1}^{t2}L(q,\dot q,t)dt
$$

## 最小作用量原理

自然界中，一个物理系统在两个时刻之间的实际运动路径，是使作用量 $ S $ 取极值(通常是极小值)的那条路径即**真实的运动轨迹使作用量达到极值**。不太严谨的说法：一个物理系统的运动路径仅会采取“运动总收益“最小的情况。

## 欧拉-拉格朗日方程

根据最小作用量原理：一个物理系统在两个时刻之间的实际运动路径，是使作用量 $ S $ 取极值(通常是极小值)的那条路径。我们可以获得一种不同于牛顿力学的解决物理系统的方法，即通过求得作用量的极小值。而不是受力分析等传统力学方法。

### 求作用量的极值

由于作用量是一个泛函，所以求极值需要用到变分法。即我们需要对作用量求一阶变分。

#### 变分法

类比于微分，如果一个函数 $f(x)$ 在 $x_0$ 处取得极值，则对于任意 $\delta x$有
$$
f(x_0+\delta x) -f(x_0)=0+o(\delta x)
$$
换句话说，**一阶微小变化不会改变函数值**

同样的对于一个泛函对所有满足固定端点条件，假设泛函 $ S $ 在 $q(t)$ 处取得极值，我们引入一个微小的变化函数 $\delta {q(t)}$，将路径 $q(t)$变为 $q(t)+\delta q(t)$，如果此时作用量的值与原路径下的作用量的值相同(即对路径做微小扰动后的作用量进行一阶变分为零)，那么 $q(t)$ 就是极值轨迹，也就是物理系统的真实运动轨迹。

所以我们对作用量引入一个微小扰动 $\delta q$
$$
S = \int_{t1}^{t2}L(q+\delta q,\dot q+\delta \dot q,t)dt
$$
 对其求一阶变分

令 $\delta q =  \epsilon \eta $ 并且 $  \eta (t_1)=\eta (t_2)=0$ 则
$$
S = \int_{t1}^{t2}L(q+\epsilon \eta ,\dot q+\epsilon \dot \eta ,t)dt
$$
一阶变分定义：泛函对扰动参数 $ \epsilon$ 的导数在 $ \epsilon =0$ 处的取值。
$$
\delta S = \left.\frac{d}{d\epsilon} S\right|_{\varepsilon=0} = \int_{t1}^{t2}\left.\frac{L(q+\epsilon \eta ,\dot q+\epsilon \dot \eta ,t)}{d\epsilon}\right|_{\varepsilon=0}dt= \int_{t1}^{t2}\left(\frac{\partial L}{\partial q}\eta+\frac{\partial L}{\partial\dot q}\dot\eta\right)dt
$$

$$
\delta S = \int_{t1}^{t2}\left(\frac{\partial L}{\partial q}\eta\right) dt+\int_{t1}^{t2}\left (\frac{\partial L}{\partial \dot q}\dot \eta\right) dt
$$

对第二项使用分部积分
$$
\delta S =\int_{t1}^{t2}\left(\frac{\partial L}{\partial q}\eta\right) dt+\left .\frac{\partial L}{\partial\dot q} \eta \right |_{t_1}^{t_2}-\int_{t1}^{t2}\frac{d}{dt}\left(\frac{\partial L}{\partial\dot q}\right)\eta dt
$$
由于 $  \eta (t_1)=\eta (t_2)=0$ 所以第二项等于零
$$
\delta S =\int_{t1}^{t2}\left(\frac{\partial L}{\partial q}-\frac{d}{dt}\left (\frac{\partial L}{\partial\dot q}\right)\right)\eta dt
$$
根据最小最用量原理 最用量的一阶变分为0，由于微小扰动不能为0值函数(不然就相当于没有扰动)，所以必须是
$$
\frac{\partial L}{\partial q}-\frac{d}{dt}\left (\frac{\partial L}{\partial\dot q}\right)=0
$$
这就是**欧拉-拉格朗日方程**

对于 $s$ 个自由度的系统，在最小作用量原理中有 $s$ 个不同的函数 $ q_i(t)$ 所以我们会得到 $s$ 个欧拉-拉格朗日方程：
$$
\frac{\partial L}{\partial q_i}-\frac{d}{dt}\left (\frac{\partial L}{\partial\dot q_i}\right)=0\quad (i=1,2,\ldots,s)
$$