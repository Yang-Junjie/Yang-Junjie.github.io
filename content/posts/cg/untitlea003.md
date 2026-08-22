---
date : '2026-08-19T12:19:47+08:00'
draft : true
title : '【CG】'
tags:
  - graphics

categories:
  - blog

math: true
---
我们知道标准的 Rendering Equation 是
$$
L_o(p, \omega_o) = L_e(p, \omega_o) + \int_{\Omega } f_r(p,\omega_i, \omega_o) L_i(p,\omega_i) (\mathbf{n}\cdot\omega_i)  d\omega_i
$$
其对应的 Mente Carlo Estimation 是
$$
\hat{L}_o(x, \omega_o) = L_e(p, \omega_o) + \frac{1}{N} \sum_{i=1}^{N} \frac{f_r(p, \omega_i, \omega_o) L_i(p, \omega_i) (\mathbf{n}\cdot\omega_i)}{p(\omega_i)}
$$
引入 Russian Roulette 后 Mente Carlo Estimation 变成
$$ 
\hat{L}_o(p, \omega_o) = L_e (p,\omega_o)+\frac{1}{N}\sum_{i=1}^N\frac{f_r(p,\omega_i,\omega_o)L_i(p,\omega_i)(\mathbf{n}\cdot\omega_i)}{p_{BSDF}(\omega_i)\cdot p_{RR}} $$
我们再引入 光源采样（Next Event Estimation）根据 NEE 的思想 $ \hat{L}_o $ 可以被拆成三个部分

$$
\hat{L}_o(p, \omega_o) = L_e(p,\omega_o) + \hat{L}_{dir}(p, \omega_o) + \hat{L}_{ind}(p, \omega_o)
$$

其中 $\hat{L}_{dir}$ 是采样 Light 得到的， $\hat{L}_{ind}$ 是采样 BSDF 得到的。

具体 
$$
\hat{L}_{dir}(p, \omega_o) = \frac{1}{N_{light}} \sum_{k=1}^{N_{light}} \frac{f_r(p, \omega_k, \omega_o) L_e(p', -\omega_k) (\mathbf{n}_p \cdot \omega_k) \cdot V(p, p')}{p_A(p')} \frac{\Vert{}(\mathbf{n}_{p'} \cdot -\omega_k)\Vert{}}{\Vert{}p' - p\Vert{}^2}
$$

$$
\hat{L}_{ind}(p, \omega_o) = \frac{1}{N_{ind}} \sum_{i=1}^{N_{ind}} \frac{f_r(p, \omega_i, \omega_o) L_{ind}(p, \omega_i) (\mathbf{n}_p \cdot \omega_i)}{p_{BSDF}(\omega_i) \cdot p_{RR}}
$$

即
$$
\hat{L}_o(p, \omega_o) = L_e(p,\omega_o) +\frac{1}{N_{light}} \sum_{k=1}^{N_{light}} \frac{f_r(p, \omega_k, \omega_o) L_e(p', -\omega_k) (\mathbf{n}_p \cdot \omega_k) \cdot V(p, p')}{p_A(p')} \frac{\Vert{}(\mathbf{n}_{p'} \cdot -\omega_k)\Vert{}}{\Vert{}p' - p\Vert{}^2} + \frac{1}{N_{ind}} \sum_{i=1}^{N_{ind}} \frac{f_r(p, \omega_i, \omega_o) L_{ind}(p, \omega_i) (\mathbf{n}_p \cdot \omega_i)}{p_{BSDF}(\omega_i) \cdot p_{RR}}
$$