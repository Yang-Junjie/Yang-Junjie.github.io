---
date : '2025-06-28T10:25:09+08:00'
draft : false
title : '碰撞响应'
tags:
  - graphics
  - physics

categories:
  - blog

math: true
---
# 碰撞响应

在游戏物理引擎中两个物体在碰撞检测阶段结束后一般下一阶段就是要处理碰撞了，也就是碰撞处理阶段，碰撞处理阶段可以细分成两个阶段，先是经过分离阶段，再就是碰撞响应了。

碰撞响应要处理的就是如何实现类似现实世界中的弹性碰撞效果，对此我们需要更新物体碰撞后的运动状态，使得物体的运动状态与现实世界的相似。

## 传统冲量法

还记得我们高中学习物理是怎么解决这类碰撞问题的吗？我们通常使用动量定理那一套方法，所以在这里我们还是使用这套方法来处理。

通过碰撞检测，我们可以得到以下信息：

- 碰撞点位置：$\mathbf{p}_a,\mathbf{p}_b$
- 碰撞法线：$\mathbf{n}$
- 穿透深度：$depth$

并且我们还具有物体此时物体的动力学状态。

- 质心位置：$\mathbf{p}_A,\mathbf{p}_B$
- 线速度：$\mathbf{v}_{Alinear},\mathbf{v}_{Blinear}$
- 角速度：$\mathbf{\omega}_A,\mathbf{\omega}_B$
- 质量：$\mathbf{m}_A,\mathbf{m}_B$
- 转动惯量：$\mathbf{I}_A,\mathbf{I}_B$
- 恢复系数：$e$

如果我们能计算出碰撞时的冲量，那么我们就可以通过冲量来改变速度而达成目的。

令A，B的广义速度为
$$
\mathbf v_A =\mathbf{v}_{Alinear}+\mathbf{\omega}_A\times{\mathbf{r_a}}\\
\mathbf v_B =\mathbf{v}_{Blinear}+\mathbf{\omega}_B\times{\mathbf{r_b}}
$$
其中
$$
\mathbf{r_a}=\mathbf{p_a}-\mathbf{p_A}\\
\mathbf{r_b}=\mathbf{p_b}-\mathbf{p_B}
$$
根据动量定理以及角动量定理有
$$
 J_A \mathbf n= m_A\mathbf{v}^{'}_{Alinear}-m_A\mathbf{v}_{Alinear} \\ 
$$

$$
 J_B\mathbf n = m_B\mathbf{v}^{'}_{Blinear}-m_B\mathbf{v}_{Blinear} \\ 
$$

$$
 J_A\mathbf n\times{\mathbf r_a} = I_A\mathbf{\omega}^{'}_{A}-I_A\mathbf{\omega}_{A} \\
$$

$$
 J_B\mathbf n\times{\mathbf r_b} = I_B\mathbf{\omega}^{'}_{B}-I_B\mathbf{\omega}_{B}
$$

由牛顿第三定律可知
$$
J_A = - J_B
$$
令
$$
J = J_A = -J_B
$$
则碰撞后的广义速度为
$$
\mathbf v_A^{'} =\mathbf{v}^{'}_{Alinear}+\mathbf{\omega}_A^{'}\times{\mathbf{r_a}} \\
$$

$$
\mathbf v_B ^{'}=\mathbf{v}^{'}_{Blinear}+\mathbf{\omega}_B^{'}\times{\mathbf{r_b}}
$$

联立动量定理、牛顿第三定律、碰撞后的广义速度可得
$$
\mathbf v_A^{'} =\mathbf{v}_{A}+\frac{J\mathbf{n}}{m_A}+(\mathbf I_A^{-1}(J\mathbf{n\times{r_a}}))\times \mathbf{r_a} \\
$$

$$
\mathbf v_B^{'} =\mathbf{v}_{B}-\frac{J\mathbf{n}}{m_B}-(\mathbf I_B^{-1}(J\mathbf{n\times{r_b}}))\times \mathbf{r_b}
$$

由于
$$
e = \frac{(\mathbf v_A^{'} -\mathbf v_B^{'})\cdot\mathbf n}{(\mathbf v_B -\mathbf v_A)\cdot\mathbf n} \\
$$

$$
(\mathbf v_A^{'} -\mathbf v_B^{'})\cdot\mathbf n = -e({\mathbf v_A -\mathbf v_B})\cdot\mathbf n
$$

将碰撞后的广义速度两式子相减带入恢复系数的式子中有
$$
(\frac{J\mathbf n}{m_A}+\frac{J\mathbf n}{m_B}+(\mathbf{I}_A^{-1}(J\mathbf n\times{\mathbf r_a}))\times{\mathbf r_a}+(\mathbf{I}_B^{-1}(J\mathbf n\times{\mathbf r_b}))\times{ \mathbf r_b})\cdot\mathbf n=-(1+e)(\mathbf{v}_a-\mathbf{v}_b)\cdot\mathbf n
$$
由于我们只改变碰撞法线方向上的冲量所以我们在两边点乘上碰撞法线即可，然后化简得到
$$
J  = \frac{-(1+e)(\mathbf{v}_A-\mathbf v_B)\cdot{\mathbf{n}}}{\frac{1}{m_A}+\frac{1}{m_B}+\mathbf{n}\cdot((\mathbf{I}_A^{-1}(\mathbf {r_a}\times {\mathbf{n}}))\times{\mathbf r_a}+(\mathbf{I}_B^{-1}(\mathbf {\mathbf r_b}\times {\mathbf{n}}))\times{\mathbf r_b})}
$$
注：需要用到混合积（标量三重积）

特别的，在二维情况下
$$
J  = \frac{-(1+e)(\mathbf{v}_A-\mathbf v_B)\cdot{\mathbf{n}}}{\frac{1}{m_A}+\frac{1}{m_B}+\mathbf{n}\cdot(\frac{(\mathbf {r_a}\times {\mathbf{n}})^2}{I_A}+\frac{(\mathbf {r_b}\times {\mathbf{n}})^2}{I_B})}
$$

### 摩擦力效果

要实现摩擦力的效果需要将上公式中的 $\mathbf n$ 全部替换为$\mathbf n$的正交单位向量即可

## 碰撞约束的响应(弹性碰撞)

在碰撞约束完成后物体不会穿透其他物体，但是也不会发生弹性碰撞，所以我们在碰撞约束中的Baumgarte稳定性方法系数bias上加上 $e(\mathbf v_A-\mathbf v_B)\cdot \mathbf n$ 即可

即bias为
$$
b = \frac{\beta}{\Delta t}C+e(\mathbf v_A-\mathbf v_B)\cdot \mathbf n
$$

### 摩擦力效果

要实现摩擦力的效果需要将上约束方程中的 $\mathbf n$ 全部替换为$\mathbf n$的正交单位向量即可

## 引用

https://math.stackexchange.com/questions/4501575/full-derivation-of-impulse-formula-for-collision-response