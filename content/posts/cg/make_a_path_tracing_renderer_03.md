---
date : '2026-05-18T20:09:42+08:00'
draft : true
title : '【CG】Re0:[0x03]'
tags:
  - graphics

categories:
  - blog

math: true
---

# 背景
上次学习了 Radiometry&Monte Carlo Integration 的理论知识，现在觉得自己很强，想学习一下怎么将理论应用到实践中了，你准备在你第一次实现的那个最简单的渲染器上进行扩展，并加入一些新的材质、和优化方法，并且进一步理解上次代码中不懂得一些问题

> 剧情我是真的编不下去了，相信没什么人喜欢看这个剧情，先不写剧情了，有时间再补吧！

# The Lambertian Diffuse Model 
在 Re0:0x02 中我们给出了 BRDF 的定义，但是那只是定义式是没办法用于真正计算的，所以我们需要对真实的材质在我们的定义式下进行建模，通过建模后的式子才适合用于计算。  
接下来我们看一个最最简单的 BRDF 模型，就是 **Lambertian Diffuse Model** , 这是一个漫反射材质模型，顾名思义专门用于建模漫反射材质。

> 在 Re0:0x01 中我们提到这个模型，其中的代码直接给出了类似下面的代码，现在回过头来看其实不是很合适，因为没有说明 Lambertian 漫反射的 BRDF 是怎么推导的，并且引入了微表面模型，其实那个时候没必要引入微表面模型的，从中可以看到我以前对知识的理解也是非常的浅薄
```c++
class Material {
public:
    ...

    Vec3 eval() const
    {
        return albedo_ / (3.141592653589793);
    }

private:
    Vec3 albedo_{};
};
```
## 方向半球反射率
在推导 Lambertian Diffuse Model 的 BRDF 之前我们先介绍一个概念 **方向半球反射率**$\rho_{hd}(\omega_i)$，它表示对于给定的入射方向 $\omega_i$，有多少比例的入射能量被反射到整个半球
$$\rho_{hd}(\omega_i) = \int_{\mathcal{H}^2(\mathbf{n}) }f_r(p,\omega_i, \omega_o)\cos\theta_o  d\omega_o $$
工程上这就是材质的"反射率"参数，通常用一个 RGB 颜色来表示  
它常常被用于验证 BRDF 的能量守恒，即反射的能量不能超过入射的能量
$$
  L_o = \rho_{hd} L_i \qquad 0 \le \rho_{hd}(\omega_i) \le 1
$$


## 推导
好了现在我们开始正式的推导一下 Lambertian Diffuse Model 的 BRDF 

Lambertian Diffuse Model 假设
> 在光线打到漫反射材质上这个光会被均匀的散射到半球的所有方向，或者说是漫反射材质是一种无论观察者从哪个角度看，表面看起来都一样亮的材质

这个假设说明了出射光是一个恒定的常数(因为表面看起来都一样亮)，并且出射光与观察者的角度(出射方向)无关(因为无论观察者从哪个角度看)

我们再来看渲染方程，假设材质不会自发光：
$$
L_o(p, \omega_o) = \int_{\mathcal{H}^2(\mathbf{n}) } f_r(p,\omega_i, \omega_o) L_i(p,\omega_i) \cos\theta_i  d\omega_i
$$
很显然标准的渲染方程的$L_o$与出射方向有关，而被积函数中只有$f_r$是与出射方向有关的，而我们要满足假设让$f_r$与出射方向无关
$$
 f_r(p,\omega_i, \omega_o) =  f_r(p,\omega_i)
$$

> 需要注意的一点是，在图形学中我们一般默认假设 $ f_r(p,\omega_i) = k$是一个常数，即我们新增加了一个假设：漫反射材质是各项同性的，但是现实是漫反射材质也可以是各项异性的，但是在图形学中使用各项同性的 Lambertian Diffuse Model 一般就够了，关于什么是各项同性和各向异性材质的可以去自己搜搜，未来我们会讲

所以有
$$ f_r(p,\omega_i) = k $$
现在我们的渲染方程变为
$$
L_o(p) = k \int_{\mathcal{H}^2(\mathbf{n}) } L_i(p,\omega_i) \cos\theta_i  d\omega_i
$$
而根据 Lambertian Diffuse Model 假设$L_o$是一个恒定的常数，注意到如果$L_i(p,\omega_i)$是一个常数可以提到积分外面去,那么剩下的部分就是带余弦权重的半球积分，而对半球得积分为$\pi$。  

而我们又知道BRDF 是材质的固有属性与场景无关，所以我们可以构造一个最简单的场景来把它求出来。  

我们可以这么构造：以被积微元点为球心放置一个均匀发光的半球，入射 Radiance 恒为 常数，即$L_i$ 为常数。

> Q&A:
> - 为什么可以随便构造场景？因为 BRDF 是材质固有属性，跟光照无关，我选什么场景都行，那我选一个最简单的
> - 最简单的是什么？$L_i$ 处处相等且方向无关的场景

这个时候我们的渲染方程变成
$$
L_o = k L_i \int_{\mathcal{H}^2(\mathbf{n}) } \cos\theta_i  d\omega_i = k L_i \pi
$$

而根据方向半球反射率提到的保证能量守恒
$$
  L_o = \rho_{hd} L_i \qquad 0 \le \rho_{hd} \le 1
$$
我们联立这两个方程
$$
\left\{\begin{matrix}
 L_o = \rho_{hd} L_i  & 0 \le \rho_{hd} \le 1 \\
 L_o = \pi k L_i  &
\end{matrix}\right.
$$
最后解得
$$
k = \frac{\rho_{hd}}{\pi}
$$
即 Lambertian Diffuse Model 为
$$
f_r = k = \frac{\rho_{hd}}{\pi}
$$
其中$\rho_{hd}$为材质的反射率
所以你能看到代码中
```c++
 return kd_ * base_color_ / (3.141592653589793);
```
而$k_d$只是一个比例系数，后面我们会提到

## Importance Sampling of the Lambertian Diffuse Model 
我们看 Re0:0x01 中 Material.h 中的 pdf 代码
```c++
double pdf(const Vec3& wi, const Vec3& wo, const Vec3& normal)
    {
        const double cosThetaI = dot(normal, wi);
        const double cosThetaO = dot(normal, wo);

        if (cosThetaI <= 0.0 || cosThetaO <= 0.0) {
            return 0.0;
        }

        return 1.0 / (2.0 * constants::PI);
    }
```
这里使用的是均匀采样，即
$$
p(x) = \frac{1}{2\pi}
$$
而我们在 Re0:0x02 中学习过重要性采样，当选择一个 pdf 它的形状和分子形状类似时方差就会缩小  
我们先回顾一下蒙特卡洛积分
$$ \hat{L}_o(p, \omega_o)=\frac{1}{N}\sum_{i=1}^N\frac{f_r(p,\omega_i,\omega_o)L_i(p,\omega_i)\cos \theta_i}{p(\omega_i)} $$
我们将其写为 Lambertian Diffuse Model 的形式
$$ \hat{L}_o(p, \omega_o)=\frac{1}{N}\sum_{i=1}^N\frac{(\frac{\rho}{\pi})L_i(p,\omega_i)\cos \theta_i}{p(\omega_i)} $$
我们将其变形为
$$ \hat{L}_o(p, \omega_o)=\frac{1}{N}\sum_{i=1}^N\frac{\frac{\cos \theta_i}{\pi}}{p(\omega_i)} \rho L_i(p,\omega_i) $$
当我们令 $p(\omega_i) = \frac{\cos \theta_i}{\pi}$的时候这个分式就直接变成 1 了，这就是我我们的目标，而学过概率论的都知道一个合法的 pdf 在它的定义域上的积分值必须为 1 ，所以我们来验证一下这个pdf是否合法
$$ \int_{\mathcal{H}^2} \frac{\cos \theta}{\pi} \, d\omega = \frac{1}{\pi} \int_{0}^{2\pi} \! \! \int_{0}^{\frac{\pi}{2}} \cos \theta \sin \theta \, d\theta \, d\phi = \frac{1}{\pi} \cdot \pi = 1 $$
积分正好等于 1  
所以在 the Lambertian Diffuse Model 中我们常用的 pdf 函数就是
$$ p(\omega_i) = \frac{\cos \theta_i}{\pi} $$

所以在渲染器中我们第一个要修改的代码就是 pdf ，我们改成这样
```c++
double pdf(const Vec3& wi, const Vec3& wo, const Vec3& normal)
{
  const double cosThetaI = dot(normal, wi);
  const double cosThetaO = dot(normal, wo);

  if (cosThetaI <= 0.0 || cosThetaO <= 0.0) {
    return 0.0;
  }

  return cosThetaI / (constants::PI);
}
```
> 下面是在递归深度32，spp8下渲染出的两张图，上面这张是使用均匀采样，而下面那张是使用重要性采样，可以看出差距还是很明显的，尤其是在high box上
![](images/cg/re0pt/0x03/1wis.png)
![](images/cg/re0pt/0x03/1is.png)

## Implementing Russian Roulette 
在 Re0:0x02 中我们已经了解过了 Russian Roulette 的原理，这里我们来实现它。
我们希望在实现 RR 的基础上保留最小的递归次数，防止光线刚开始生成就被RR杀死，由于是 RR 概率事件，所以有可能你的运气非常不好还是会进行多次递归，所以我们还需要保留最大递归次数，

所以我们修改一下常量，其中 `kSurvivalProbability` 是 RR 中光线的存活概率
```c++
    static constexpr int kMinDepth = 4;
    static constexpr int kMaxDepth = 128;
    static constexpr int kSamplesPerPixel = 8;
    static constexpr double kSurvivalProbability = 0.8;
```
由于在 RR 中我们需要对在$[0,1)$上进行一个均匀采样，所以我们提供一个私有方法
```c++
double randomProbability() const
    {
        static thread_local std::mt19937 generator(std::random_device{}());
        static thread_local std::uniform_real_distribution<double> distribution(0.0, 1.0);
        return distribution(generator);
    }
```
然后我们实现我们的 RR traceRay 版本 
```c++
Vec3 traceRay(const Ray& ray, const std::vector<std::unique_ptr<Object>>& objects)
    {
        return traceRay(ray, objects, 0);
    }

    Vec3 traceRay(const Ray& ray, const std::vector<std::unique_ptr<Object>>& objects, int depth)
    {
        if (depth >= kMaxDepth) {
            return Vec3(0.0, 0.0, 0.0);
        }

        bool hit_anything = false;
        bool is_light = false;
        double closest_t = std::numeric_limits<double>::max();
        InterInfo closest_info;
        std::shared_ptr<Material> material = nullptr;

        for (const auto& object : objects) {
            const InterInfo info = object->getInterInfo(ray);
            if (!info.is_Intersected || info.closest_t >= closest_t) {
                continue;
            }

            hit_anything = true;
            is_light = object->isLight();
            closest_t = info.closest_t;
            closest_info = info;
            material = object->getMaterial();
        }

        if (!hit_anything || !material) {
            return Vec3(0.0, 0.0, 0.0);
        }

        if (is_light) {
            return material->eval();
        }

        const Vec3 wo = -ray.getDirection();
        const Vec3 normal = faceForward(closest_info.normal, wo);

        const std::optional<Vec3> sampled_direction = material->sample(wo, normal);
        if (!sampled_direction.has_value()) {
            return Vec3(0.0, 0.0, 0.0);
        }

        const double sample_pdf = material->pdf(*sampled_direction, wo, normal);
        if (sample_pdf <= 1e-8) {
            return Vec3(0.0, 0.0, 0.0);
        }

        // 计算被积函数中的cos项
        const double cos_theta = std::max(0.0, dot(normal, *sampled_direction));

        // 获取反射后的光线
        const Ray scattered_ray(closest_info.position + normal * 1e-4, *sampled_direction);

        // 俄罗斯轮盘赌
        Vec3 incoming_light;
        if (depth < kMinDepth) {
            // 在达到最小深度前，强制继续追踪
            incoming_light = traceRay(scattered_ray, objects, depth + 1);
        } else {
            // 达到最小深度后，使用俄罗斯轮盘赌
            if (randomProbability() < kSurvivalProbability) {
                // 存活，继续追踪，并将贡献除以存活概率以保持无偏
                incoming_light = traceRay(scattered_ray, objects, depth + 1) / kSurvivalProbability;
            } else {
                // 终止，返回黑色
                incoming_light = Vec3(0.0, 0.0, 0.0);
            }
        }

        // 返回最终颜色
        return material->eval() * incoming_light * (cos_theta / sample_pdf);
    }
```