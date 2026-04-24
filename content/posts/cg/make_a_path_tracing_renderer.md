---
date : '2026-04-17T16:17:50+08:00'
draft : false
title : '【CG】Re0:从零开始搓一个路径追踪渲染器'
tags:
  - graphics

categories:
  - blog

math: true
---
# 背景
你在一个教室中趴在桌子上睡觉，天色开始逐渐变红，教室中的窗帘被一阵风拍的开始乱飞，你被惊醒，发现同学都不见了，你跑出教室，下楼的时候你突然脚滑摔晕。

等你醒来的时候已经晚上，周围的环境让你感到陌生，“有人吗？你好？！”，并没有得到回复。  

你看向唯一发光的物体，是一台笔记本，上面写着你必须实现一个路径追踪渲染器，否则你将一直被关在这个纯黑的密室中，没有时间限制，我们提供了必要的文件，最后需要渲染出一个标准的CornellBox场景，没有性能要求，并发送到邮箱cglab@cglab.top，你发现这台电脑并不能连接网络，“岂可休！”。  

你身为一个计算机系的学生，你对计算机图形学一窍不通只知道计算机图形学是门研究渲染，动画，模拟，几何等等的一门学科，但是你学过C++,cmake,概率论基础，线性代数基础，微积分基础，并且你懂得如何构建让C++代码成功编译并运行。  

你打开了提供的README.md：  

# README
你好啊。当你看到这个文件的时候，说明你已经被邀请加入CGLab了。  

你可能会问：为什么是我？  

这个我们也不知道，我们加入CGLab的原因我们自己也没有搞明白，我们至今只知道拥有图形学潜力的人会被邀请加入CGLab。  

每个被 **xxx** 邀请加入CGLab的人都会和你一样突然进入这个神秘的空间，并且每个人进入这个空间都会被分配一个任务，每个人的任务都是不一样的这次你被分配的任务是实现一个路径追踪渲染器。

如果这个任务没有完成你会永远被关在这个密室中，自生自灭。  
但如果你完成了任务你将会得到对应的 “**加护**”，你被分配的是渲染领域的任务，**xxx** 认为你在渲染领域非常有潜力。

不过不用担心，我们会在这个README中逐步教你实现一个Path Tracing Renderer。让我们开始吧！！

## PPM
在计算机图形学渲染领域学习的时候我们通常需要渲染一张图片或者多张图片所组成一个连续的动画，在这里我们只需要渲染一张图片，我们都知道图片是由一系列像素组成的，我们可以吧像素理解为一个小方块，每个小方块都有自己的颜色属性，由许多不同颜色的像素就可以组成一张图片。  

这就需要我们使用程序将数据写入一张图片中，但是通常我们使用的 png,jpg 等图片格式并不适合我们进行学习，所以我们这里使用一种格式为 ppm 的图片格式，这种图片格式是一种文本图片格式，
它是由一系列字符串表示的。  

ppm 文件有两种数据格式，一种是 **ASCII** 格式，一种是 **BINARY** 格式。我们将使用第一种格式，这种格式下我们可以轻松的知道每个像素是什么颜色。

### 举个例子
假设我们要创建一个 $2 \times 2$ 像素的微型图片，包含红、绿、蓝和黄四种颜色。它的文件内容看起来是这样的：
```text
P3
2 2
255
255 0 0    
0 255 0
0 0 255
255 255 0
```
- P3: 告诉解析器这是ASCII格式PPM文件
- 2 2: 宽 2 像素，高 2 像素,定义图片的大小
- 255: 颜色范围从 0 到 255，图形学中我们通常使用一个三维向量表示颜色，这个向量中的三个分量分别表示红、绿、蓝的权重。如果如果学过美术的应该很容易懂就类似美术中的红黄蓝可以调配出大部分颜色
- 后面的就是颜色值，通常我们每行一个颜色值

所以我们第一步就是写一个写PPM文件的程序，在图形学中底层中我们通常选择C++进行编写程序
```c++
// 身为被选中的你，应该不需要我门对这段简单的C++代码做出解释了
#include <filesystem>
#include <fstream>
#include <iostream>
#include <vector>

struct Color {
    int r, g, b;
};

void writePPM(const std::filesystem::path& path, int width, int height, const std::vector<Color>& data)
{
    std::ofstream ofs(path);

    ofs << "P3\n" << width << " " << height << "\n255\n";

    for (int i = 0; i < width * height; ++i) {
        int r = data[i].r;
        int g = data[i].g;
        int b = data[i].b;

        ofs << r << " " << g << " " << b << "\n";
    }

    ofs.close();
}
```

我们可以测试 `writePPM` 渲染一个简单的图，我们让图片中的像素的2维坐标 $(u,v)$ 作为图片的颜色 $(u,v,0)$ 

```c++
int main()
{
    int width = 100;
    int height = 100;
    std::vector<Color> data(width * height);

    for (int i = 0; i < height; ++i) {
        for (int j = 0; j < width; ++j) {
            data[i * width + j] = {i, j, 0};
        }
    }

    writePPM("out.ppm", width, height, data);

    return 0;
}
```
渲染出来的结果是
![out.ppm](images/cg/re0pt/out1.png)

## Path Tracing
好了我们已经拥有渲染图片的能力了，让我们正式开始学习Path Tracing的概念，在Path Tracing中我们使用的是几何光学，我们假设光线从我们的眼睛（或者叫Camera）出发经过视口（我们最终渲染出来的图）后在场景中经过一系列弹射最后打到光源的这么一个过程。  

我们可以这么理解，我们通过数学的方式定义了一个在抽象空间的场景，我们想通过我们的眼睛在电脑的显示器上看到这个场景，我们需要通过渲染器才能有办法看到这个场景，这个渲染器会模拟我们的行为，渲染器中会定义我们的眼睛（Camera），我们想以什么角度看这个场景，以及我们的眼睛（Camera）的参数也可以调整，然后定义我们的眼睛最终看到的图片的大小，也就是可视范围，然后模拟光线的弹射，根据光线的弹射将场景中的信息写入可视范围中最后保存为一张图片。  

这其中有很多我们需要解决的问题
- 为什么光线是从相机出发不是从光源出发
- 光线是怎么从相机打出去的
- 光线怎么知道与物体作用了
- 光线与物体作用了之后怎么弹射
- 光线怎么知道打到了光源
- 怎么让渲染的结果与真实物理世界一致  

我们先回答这些问题
### 1. 为什么光线是从相机出发而不是从光源出发
从光源出发向四面八方发射数百万条光线。其中大部分光线会撞到墙角、地板或天花板，经过多次反弹后能量耗尽，永远无法进入你的瞳孔。对于计算机来说，计算这些光线完全是浪费资源。  

而从相机出发我们只需要处理那些“注定”会影响屏幕像素的光线。每一条从相机射出的射线，只要撞击到物体，就必然对应着屏幕上的一个点。

### 2. 光线是怎么从相机打出去的
我们先定义我们使用的坐标系，我们使用的坐标系是这样的：  
我们以标准坐姿面向显示器正面，原点位于你显示器正中心，z轴垂直于显示器向外（也就是指向你），y轴与你显示器垂直方向平行向上，x轴与显示器水平方向平行向右。  

我们可以在抽象空间中定义一个点表示我们的相机的位置，我们假设相机的向上方向永远是与y轴正方向一致，并且位于(1,0,0)看向原点，视口是我们最终渲染的图片，或者说是我们的屏幕。  
 
我们还需要了解屏幕空间和像素空间  
- 屏幕空间是一个2维空间，定义原点在左上角，x轴向右，y轴向下。假设你的屏幕的宽度是1920，高度是1080，那么屏幕空间就是(0,0)到(1920,1080)。  
- 像素空间是离散的网格系统  
像素空间与屏幕空间的映射关系是：像素空间中的点$(x,y)$对应屏幕空间中的点$(x+0.5,y+0.5)$，屏幕空间中的点$(x,y)$对应像素空间中的点$(\left \lfloor x\right \rfloor ,\left \lfloor y\right \rfloor )$
我们在抽象空间中从相机点出发与像素空间中的点进行连线，这就构成了一个射线或者称作向量，我们遍历像素空间中所有的点即可渲染出我们所需的可视图了

### 3. 光线怎么知道与物体作用了
我们需要定义光线的方程，然后通过解析的方式判断这个方程在某些几何体表面上是否有解，如果有解则说明相交了，回想一下我们怎么计算两个直线的交点你就明白了

### 4. 光线与物体作用了之后怎么弹射
我们需要定义物体的材质，材质决定了光线在这个物体作用后怎么弹射

### 5. 光线怎么知道打到了光源
我们让光线在场景中不断的弹射，再定义哪些物体是光源，每次光线与改物体相交之后询问一下你是光源吗

### 6. 怎么让渲染的结果与真实物理世界一致  
我们需要使用物理的方式去渲染一张图，而不是随便定义



在开始实现其他的代码之前我们提供一个Vec3向量运算头文件给你

```cpp
#pragma once

#include <cmath>
#include <cstddef>

#include <array>
#include <iostream>

class Vec3 {
public:
    constexpr Vec3() noexcept = default;

    constexpr Vec3(double x, double y, double z) noexcept
        : elements_{x, y, z}
    {}

    [[nodiscard]] constexpr double x() const noexcept
    {
        return elements_[0];
    }

    [[nodiscard]] constexpr double y() const noexcept
    {
        return elements_[1];
    }

    [[nodiscard]] constexpr double z() const noexcept
    {
        return elements_[2];
    }

    [[nodiscard]] constexpr Vec3 operator-() const noexcept
    {
        return Vec3{-elements_[0], -elements_[1], -elements_[2]};
    }

    [[nodiscard]] constexpr double operator[](std::size_t index) const noexcept
    {
        return elements_[index];
    }

    constexpr double& operator[](std::size_t index) noexcept
    {
        return elements_[index];
    }

    constexpr Vec3& operator+=(const Vec3& other) noexcept
    {
        elements_[0] += other.elements_[0];
        elements_[1] += other.elements_[1];
        elements_[2] += other.elements_[2];
        return *this;
    }

    constexpr Vec3& operator*=(double scalar) noexcept
    {
        elements_[0] *= scalar;
        elements_[1] *= scalar;
        elements_[2] *= scalar;
        return *this;
    }

    constexpr Vec3& operator/=(double scalar) noexcept
    {
        return *this *= 1.0 / scalar;
    }

    [[nodiscard]] double length() const noexcept
    {
        return std::sqrt(lengthSquared());
    }

    [[nodiscard]] constexpr double lengthSquared() const noexcept
    {
        return elements_[0] * elements_[0] + elements_[1] * elements_[1] + elements_[2] * elements_[2];
    }

    [[nodiscard]] bool nearZero() const noexcept
    {
        constexpr auto threshold = 1e-8;
        return std::abs(elements_[0]) < threshold && std::abs(elements_[1]) < threshold &&
               std::abs(elements_[2]) < threshold;
    }

private:
    std::array<double, 3> elements_{};
};

inline std::ostream& operator<<(std::ostream& out, const Vec3& v)
{
    return out << v.x() << ' ' << v.y() << ' ' << v.z();
}

[[nodiscard]] constexpr Vec3 operator+(const Vec3& lhs, const Vec3& rhs) noexcept
{
    return Vec3{lhs.x() + rhs.x(), lhs.y() + rhs.y(), lhs.z() + rhs.z()};
}

[[nodiscard]] constexpr Vec3 operator-(const Vec3& lhs, const Vec3& rhs) noexcept
{
    return Vec3{lhs.x() - rhs.x(), lhs.y() - rhs.y(), lhs.z() - rhs.z()};
}

[[nodiscard]] constexpr Vec3 operator*(const Vec3& lhs, const Vec3& rhs) noexcept
{
    return Vec3{lhs.x() * rhs.x(), lhs.y() * rhs.y(), lhs.z() * rhs.z()};
}

[[nodiscard]] constexpr Vec3 operator*(double scalar, const Vec3& v) noexcept
{
    return Vec3{scalar * v.x(), scalar * v.y(), scalar * v.z()};
}

[[nodiscard]] constexpr Vec3 operator*(const Vec3& v, double scalar) noexcept
{
    return scalar * v;
}

[[nodiscard]] constexpr Vec3 operator/(const Vec3& v, double scalar) noexcept
{
    return (1.0 / scalar) * v;
}

[[nodiscard]] constexpr double dot(const Vec3& lhs, const Vec3& rhs) noexcept
{
    return lhs.x() * rhs.x() + lhs.y() * rhs.y() + lhs.z() * rhs.z();
}

[[nodiscard]] constexpr Vec3 cross(const Vec3& lhs, const Vec3& rhs) noexcept
{
    return Vec3{
        lhs.y() * rhs.z() - lhs.z() * rhs.y(),
        lhs.z() * rhs.x() - lhs.x() * rhs.z(),
        lhs.x() * rhs.y() - lhs.y() * rhs.x(),
    };
}

[[nodiscard]] inline Vec3 unitVector(const Vec3& v)
{
    return v / v.length();
}

```


## 光线
我们先定义一下光线，光线在图形学中我们定义为：
$$\mathbf{r}(t) = \mathbf{o} + t\mathbf{d} \quad 0\le t < \infty$$
其中
- $\mathbf{o}$ 表示光线的起点
- $\mathbf{d}$ 表示光线的方向是一个单位向量，后续只要提到方向都是单位向量
- $t$  表示光线的步进，可以这样想象，我们的光线从点 $\mathbf{o}$ 出发，沿着 $\mathbf{d}$ 方向走过时间 $t$ 到达的位置
所以我们可这写出这样的代码
```cpp
#pragma once
#include "Vec3.h"

class Ray {
public:
    Ray(const Vec3& origin, const Vec3& direction, double t = 0.0)
        : origin_(origin),
          direction_(direction),
          t_(t)
    {}

    Vec3 getOrigin() const
    {
        return origin_;
    }

    Vec3 getDirection() const
    {
        return direction_;
    }

    Vec3 operator()(double t) const
    {
        return origin_ + direction_ * t;
    }

private:
    Vec3 origin_;
    Vec3 direction_;
    double t_;
};
```

## 相机
我们再定义一下相机，相机定义了我们以什么角度什么位置看向场景，所以它应该有以下属性
- Position 相机的位置
- Traget 相机看向哪个位置
- Up 相机的向上方向，就像我们让一个向量从我们的大脑中心指向我们头顶的最高点一样，这个方向决定了相机的是怎么以z为轴旋转的（翻滚角），就像你用手机拍照可以竖着拍，也可以横着拍
- Vertical Fov 垂直可视范围，定义了我们在垂直方向上能看到多少内容，就像我们的眼睛一样，我们看到的东西的范围是有限的，我们没办法看到我们头顶上的东西   

除此之外我们还需要存放图片信息
- Image Width 像素空间的宽度
- Image Height 像素空间的高度
- Aspect Ratio 宽高比，保留计算结果，后续多次使用
- Frame Buffer 像素空间，存放我们渲染的结果  

除此之外我们还需要预计算图片上的像素是怎么偏移的，这个偏移值不一定是1，因为我们的fov会影响图片的偏移量，为什么会被多次使用？因为我们上面提到过，我们会遍历像素空间多次获取光线
- Pixel Left Top 左上角第一个像素(0,0)的中心点空间坐标，保留计算结果，后续多次使用
- Pixel DeltaU 水平方向移动一个像素的向量差，保留计算结果，后续多次使用
- Pixel DeltaV 垂直方向移动一个像素的向量差，保留计算结果，后续多次使用

我们需要从相机中发射出一条光线所以它应该需要一个获得光线的方法   
获取光线很简单，获取一个像素点的位置，用像素点的位置减去相机原点位置就得到了一根光线。  
所以最重要的问题是怎么获取一个像素点的位置 
我们需要通过相机的除了我们需要计算的属性计算出 Pixel Left Top 、Pixel DeltaU 、Pixel DeltaV  

vertical_fov_ 的定义：一个平面与经过了相机点，并且垂直于视口，这个平面会与视口平面相交，交线与相机点会形成一个三角形，在这个三角形中相机点这个这个顶点的角度就是Vertical Fov  
我们假设我们的相机的焦距（相机与视口之间的距离）始终是1。 
下面的图片解释了如何计算
![](images/cg/re0pt/1.jpg)

使用代码实现
```cpp
void initCamera()
{
    Vec3 forward = unitVector(target_ - position_);
    Vec3 right = unitVector(cross(forward, up_));
    Vec3 camera_up = unitVector(cross(right, forward));

    double theta = vertical_fov_ * 3.141592653589793 / 180.0;
    double viewport_height = 2.0 * std::tan(theta / 2.0);
    double viewport_width = aspect_ratio_ * viewport_height;

    Vec3 viewport_u = right * viewport_width;
    Vec3 viewport_v = camera_up * (-viewport_height);

    pixel_delta_u_ = viewport_u / image_width_;
    pixel_delta_v_ = viewport_v / image_height_;

    Vec3 viewport_left_top_ = position_ + forward - (viewport_u / 2.0) - (viewport_v / 2.0);

    pixel_left_top_ = viewport_left_top_ + 0.5 * (pixel_delta_u_ + pixel_delta_v_);
}
```
现在我们能够获取像素空间中任意像素的位置了，通过pixel_left_top_，pixel_delta_u_和pixel_delta_v_
```cpp
Ray getRay(int i, int j) const
{
    Vec3 pixel_center = pixel_left_top_ + (i * pixel_delta_u_) + (j * pixel_delta_v_);
    Vec3 ray_direction = unitVector(pixel_center - position_);
    return Ray{position_, ray_direction};
}
```
最终我们的相机长这样
```cpp
#pragma once
#include "Ray.h"
#include "Vec3.h"

#include <cmath>

#include <vector>

class Camera {
public:
    Camera(int image_width, int image_height)
        : position_(Vec3(278, 273, -800)),
          target_(Vec3(0, 0, 0)),
          up_(Vec3(0, 1, 0)),
          vertical_fov_(90),
          image_width_(image_width),
          image_height_(image_height),
          aspect_ratio_(static_cast<double>(image_width) / image_height),
          frame_buffer_(image_width * image_height)
    {
        initCamera();
    }

    int getImageWidth() const
    {
        return image_width_;
    }

    int getImageHeight() const
    {
        return image_height_;
    }

    std::vector<Vec3>& getFrameBuffer()
    {
        return frame_buffer_;
    }

    const std::vector<Vec3>& getFrameBuffer() const
    {
        return frame_buffer_;
    }

    Ray getRay(int i, int j) const
    {
        Vec3 pixel_center = pixel_left_top_ + (i * pixel_delta_u_) + (j * pixel_delta_v_);
        Vec3 ray_direction = unitVector(pixel_center - position_);
        return Ray{position_, ray_direction};
    }

private:
    Vec3 position_;
    Vec3 target_;
    Vec3 up_;
    double vertical_fov_;
    int image_width_;
    int image_height_;
    double aspect_ratio_;
    std::vector<Vec3> frame_buffer_;

    Vec3 pixel_left_top_;
    Vec3 pixel_delta_u_;
    Vec3 pixel_delta_v_;

    void initCamera()
    {
        Vec3 forward = unitVector(target_ - position_);
        Vec3 right = unitVector(cross(forward, up_));
        Vec3 camera_up = unitVector(cross(right, forward));

        double theta = vertical_fov_ * 3.141592653589793 / 180.0;
        double viewport_height = 2.0 * std::tan(theta / 2.0);
        double viewport_width = aspect_ratio_ * viewport_height;

        Vec3 viewport_u = right * viewport_width;
        Vec3 viewport_v = camera_up * (-viewport_height);

        pixel_delta_u_ = viewport_u / image_width_;
        pixel_delta_v_ = viewport_v / image_height_;

        Vec3 viewport_left_top_ = position_ + forward - (viewport_u / 2.0) - (viewport_v / 2.0);

        pixel_left_top_ = viewport_left_top_ + 0.5 * (pixel_delta_u_ + pixel_delta_v_);
    }
};

```
## 光源与物体求交
相机和光线我们解决了，接下来我们解决光线如何与物体作用中的光线如何判断与物体相交
### 光线与球体求交
我们首先看看光线如何与球体求交
我们知道光线的方程是
$$\mathbf{r}(t) = \mathbf{o} + t\mathbf{d} \quad 0\le t < \infty$$
球体的方程是
$$\mathbf{p}:(\mathbf{p}-\mathbf{c})^2 -R^2 = 0$$
我们令
$$\mathbf{r}(t) =\mathbf{p}$$
有
$$(\mathbf{o} + t\mathbf{d}-\mathbf{c})^2 -R^2 = 0$$
方程中 $\mathbf{o}$ 、$\mathbf{d}$、$\mathbf{c}$都是向量和$R$是已知的，展开我们得到
$$\mathbf{d}\cdot\mathbf{d}t^2+2(\mathbf{o}-\mathbf{c})\cdot\mathbf{d}t+(\mathbf{o}-\mathbf{c})\cdot(\mathbf{o}-\mathbf{c})-R^2=0$$
可以看到向量之间都变为了点乘运算，最后算出来的是t是一个标量，这也符合这个方程，而且这是一个二次方程，所以我们可以直接使用求根公式
我们令
- $a = \mathbf{d}\cdot\mathbf{d}$
- $b = 2(\mathbf{o}-\mathbf{c})\cdot\mathbf{d}$
- $c = (\mathbf{o}-\mathbf{c})\cdot(\mathbf{o}-\mathbf{c})-R^2$
使用求根公式
$$t = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$我们取 t>0 的就行
使用代码实现，我们首先需要实现一个 Object 基类表示我们所有可以被光线击中的物体，其次我们需要记录我们的交点的信息，比如交点的坐标,是否相交，交点的材质（后续添加）等等
```cpp
#pragma once
#include "Ray.h"
#include "Vec3.h"

#include <optional>

struct InterInfo {
    bool is_Intersected = false;
    Vec3 position;
};

class Object {
    Object() = default;
    virtual ~Object() = default;
    virtual bool intersect(const Ray& ray) const = 0;

    virtual InterInfo getInterInfo(const Ray& ray) const = 0;

protected:
    InterInfo inter_info_;
};
```
我们再实现一个Sphere子类，通过我们上面的公式可以实现
```cpp
#include "Object.h"

class Sphere final : public Object {
public:
    Sphere(const Vec3& center, double radius)
        : center_(center),
          radius_(radius)
    {}

    ~Sphere() noexcept override = default;

    // 使用 b^2 - 4ac > 0 来判断是否有实根，如果有实根则说明与球相交
    bool intersect(const Ray& ray) const override
    {
        Vec3 oc = ray.getOrigin() - center_;
        double a = dot(ray.getDirection(), ray.getDirection());
        double b = 2.0 * dot(oc, ray.getDirection());
        double c = dot(oc, oc) - radius_ * radius_;
        double discriminant = b * b - 4 * a * c;
        return discriminant > 0;
    }

    InterInfo getInterInfo(const Ray& ray) const override
    {
        Vec3 oc = ray.getOrigin() - center_;
        double a = dot(ray.getDirection(), ray.getDirection());
        double b = 2.0 * dot(oc, ray.getDirection());
        double c = dot(oc, oc) - radius_ * radius_;
        double discriminant = b * b - 4 * a * c;

        if (discriminant > 0) {
            double sqrt_disc = std::sqrt(discriminant);
            double t1 = (-b - sqrt_disc) / (2.0 * a);
            double t2 = (-b + sqrt_disc) / (2.0 * a);

            double t = t1 < t2 ? t1 : t2; // 选择较小的正根
            if(t > 1e-8){
                Vec3 hit_position = ray(t);
                return InterInfo{true, hit_position};
            }
        }

        return InterInfo{false, Vec3()};
    }

private:
    Vec3 center_;
    double radius_;
};

```
我们再定义一个场景类，用于存放我们场景中存在的东西
```cpp
#pragma once
#include "Camera.h"
#include "Object.h"
#include "Sphere.h"
#include "Vec3.h"

#include <memory>
#include <vector>

class Scene {

public:
    Scene(Camera camera)
        : camera_(camera)
    {}

    ~Scene() = default;

    void addObject(std::unique_ptr<Object> object)
    {
        objects_.push_back(std::move(object));
    }

    void addSphere(const Vec3& center, double radius)
    {
        addObject(std::make_unique<Sphere>(center, radius));
    }

    void clearObjects()
    {
        objects_.clear();
    }

    Camera& getCamera()
    {
        return camera_;
    }

    const Camera& getCamera() const
    {
        return camera_;
    }

    const std::vector<std::unique_ptr<Object>>& getObjects() const
    {
        return objects_;
    }

private:
    Camera camera_;
    std::vector<std::unique_ptr<Object>> objects_;
};

```
我们再定义一个渲染器用于渲染我们最终的图
```cpp
#include "Camera.h"
#include "Ray.h"
#include "Scene.h"
#pragma once

class Renderer {
public:
    Renderer() = default;
    ~Renderer() = default;

    void render(Camera& camera, const std::vector<std::unique_ptr<Object>>& objects)
    {
        for (int j = 0; j < camera.getImageHeight(); ++j) {
            for (int i = 0; i < camera.getImageWidth(); ++i) {
                Ray ray = camera.getRay(i, j);
                Vec3 pixel_color = traceRay(ray, objects);
                camera.getFrameBuffer()[j * camera.getImageWidth() + i] = pixel_color;
            }
        }
    }

private:
    Vec3 traceRay(const Ray& ray, const std::vector<std::unique_ptr<Object>>& objects)
    {
        for (const auto& object : objects) {
            if (object->intersect(ray)) {
                // 如果击中物体则显示红色
                return Vec3(255.0, 0.0, 0.0);
            }
        }
        // 否则显示黑色
        return Vec3(0.0, 0.0, 0.0);
    }
};
```

最后我们修改mian.cpp
```cpp
#include "Camera.h"
#include "Object.h"
#include "Renderer.h"
#include "Scene.h"
#include "Vec3.h"

#include <filesystem>
#include <fstream>
#include <iostream>
#include <memory>
#include <vector>

void writePPM(const std::filesystem::path& path, int width, int height, const std::vector<Vec3>& data)
{
    std::ofstream ofs(path);

    ofs << "P3\n" << width << " " << height << "\n255\n";

    for (int i = 0; i < width * height; ++i) {
        int r = data[i].x();
        int g = data[i].y();
        int b = data[i].z();

        ofs << r << " " << g << " " << b << "\n";
    }

    ofs.close();
}

int main()
{
    int width = 600;
    int height = 600;
    Camera camera(width, height);

    std::unique_ptr<Object> sphere1 = std::make_unique<Sphere>(Vec3(0, 0, 0), 600);
    Scene scene(camera);
    scene.addObject(std::move(sphere1));

    Renderer renderer;
    renderer.render(scene.getCamera(), scene.getObjects());
    renderer.render(camera, scene.getObjects());

    writePPM("out.ppm", width, height, camera.getFrameBuffer());

    return 0;
}
```
最后我们能渲染出来这个图，跟着代码的思路来有一些C++项目开发经验应该就能懂
![](images/cg/re0pt/image2.png)
### 光线与三角形求交
但是我们的目标是渲染 Cornell Box 其中都是由三角形面组成的模型，所以我们需要知道怎么求光线与三角形是否相交。  
在这之前我们先学习一下计算机图形学中一个重要的概念，三角形的重心坐标。  
通常我们使用三个点定义一个三角形，但是我们怎么知道三角形内部的点的坐标呢？也就是我们需要通过三角形的三个顶点计算出三角形内部点的坐标。  
假设在平面 $ D $ 中有个一个三角形 $ ABC $ ，那么我们可以这么看，如果我们从点(向量) $\mathbf{A}$ 出发，沿着向量 $\mathbf{B}-\mathbf{A}$ 方向移动 $u$ 的距离，在沿着向量 $\mathbf{C}-\mathbf{A}$ 方向移动 $v$ 的距离，那么我们最终会到达三角形的内部，我们可以通过这种方式定义三角形内部的顶点，也就是三角形内部的点
$$\mathbf{P} = \mathbf{A} + u(\mathbf{B}-\mathbf{A}) + v(\mathbf{C}-\mathbf{A}) $$
展开整理可得
$$\mathbf{P} = (1-u-v)\mathbf{A}+u\mathbf{B}+v\mathbf{C}$$
我们令 $w = 1-u-v$ 则
$$\mathbf{P} = w\mathbf{A}+u\mathbf{B}+v\mathbf{C}$$

思路和球体一样我们联立两个方程：
$$\mathbf{r}(t) = \mathbf{A} + u(\mathbf{B}-\mathbf{A}) + v(\mathbf{C}-\mathbf{A})$$
由于其中的 $t$,$u$,$v$都是未知标量，所以我们整理为非齐次线性方程的形式：
$$-t\mathbf{d}+u(\mathbf{B}-\mathbf{A})+v(\mathbf{C}-\mathbf{A}) = \mathbf{o}-\mathbf{A}$$

我们令
- $\mathbf{E}_1 = \mathbf{B}-\mathbf{A}$
- $\mathbf{E}_2 = \mathbf{C}-\mathbf{A}$
- $\mathbf{S} = \mathbf{o}-\mathbf{A}$

所以我们可以将原方程组写成矩阵的形式
$$
\begin{bmatrix}
 -\mathbf{d} & \mathbf{E_1}  &\mathbf{E_2}
\end{bmatrix}\begin{bmatrix}
t \\
u \\
v
\end{bmatrix} = \mathbf{S}
$$
 
根据 Cramer's Rule 我们可以求解 $t,u,v$, 我们设矩阵 $M = \begin{bmatrix} -\mathbf{d} & \mathbf{E}_1 & \mathbf{E}_2 \end{bmatrix}$，其行列式为 $|M|$  
$$t = \frac{\det(\mathbf{S}, \mathbf{E}_1, \mathbf{E}_2)}{|M|}, \quad u = \frac{\det(-\mathbf{d}, \mathbf{S}, \mathbf{E}_2)}{|M|}, \quad v = \frac{\det(-\mathbf{d}, \mathbf{E}_1, \mathbf{S})}{|M|}$$
但是我们通常不这么计算，因为矩阵的行列式计算起来很麻烦，我们可以使用标量三重积
$$\det(A, B, C) = (A \times B) \cdot C = (B \times C) \cdot A = (C \times A) \cdot B$$

据此我们可以把分母整理为
$$\Delta = |M| = \det(-\mathbf{d}, \mathbf{E}_1, \mathbf{E}_2) = (\mathbf{d} \times \mathbf{E}_2) \cdot \mathbf{E}_1$$
令
$$\mathbf{P} = \mathbf{d} \times \mathbf{E}_2,\quad \mathbf{Q} = \mathbf{S} \times \mathbf{E}_1$$
那么就可以得到更适合写成代码的形式
$$u = \frac{\mathbf{S} \cdot \mathbf{P}}{\Delta},\quad v = \frac{\mathbf{d} \cdot \mathbf{Q}}{\Delta},\quad t = \frac{\mathbf{E}_2 \cdot \mathbf{Q}}{\Delta}$$
其中 $\Delta$ 接近 0 时说明射线和三角形所在平面平行；否则只需要判断 $t > 0$，$u \ge 0$，$v \ge 0$，$u + v \le 1$，即可知道射线是否击中了这个三角形。

这个算法叫做 Moller-Trumbore 算法
所以我们可以基于此实现
```c++
#pragma once

#include "Object.h"

#include <optional>

class Triangle final : public Object {
public:
    Triangle(const Vec3& p1, const Vec3& p2, const Vec3& p3)
        : p1_(p1),
          p2_(p2),
          p3_(p3)
    {}

    ~Triangle() noexcept override = default;

    bool intersect(const Ray& ray) const override
    {
        return hitDistance(ray).has_value();
    }

    InterInfo getInterInfo(const Ray& ray) const override
    {
        const auto t = hitDistance(ray);
        if (!t.has_value()) {
            return InterInfo{false, Vec3()};
        }

        return InterInfo{true, ray(*t)};
    }

private:
    std::optional<double> hitDistance(const Ray& ray) const
    {
        constexpr double kEpsilon = 1e-8;

        const Vec3 origin = ray.getOrigin();
        const Vec3 direction = ray.getDirection();
        const Vec3 edge1 = p2_ - p1_;
        const Vec3 edge2 = p3_ - p1_;
        const Vec3 p = cross(direction, edge2);
        const double det = dot(edge1, p);

        if (std::abs(det) < kEpsilon) {
            return std::nullopt;
        }

        const double inv_det = 1.0 / det;
        const Vec3 s = origin - p1_;
        const double u = dot(s, p) * inv_det;
        if (u < 0.0 || u > 1.0) {
            return std::nullopt;
        }

        const Vec3 q = cross(s, edge1);
        const double v = dot(direction, q) * inv_det;
        if (v < 0.0 || u + v > 1.0) {
            return std::nullopt;
        }

        const double t = dot(edge2, q) * inv_det;
        if (t <= kEpsilon) {
            return std::nullopt;
        }

        return t;
    }

    Vec3 p1_;
    Vec3 p2_;
    Vec3 p3_;
};
```
我们给Scene添加一个`addTriangle`方法
```c++
void addTriangle(const Vec3& p1, const Vec3& p2, const Vec3& p3)
{
    addObject(std::make_unique<Triangle>(p1, p2, p3));
}
```
好了现在我们已经具备了渲染 Cornell Box 的能力，我们提供了构建 Cornell Box 模型的方法：
```c++
Vec3 cornellVertex(double x, double y, double z)
{
    // 将标准 Cornell Box 坐标平移到以盒子开口中线为中心的局部坐标。
    return Vec3(x - 278.0, y - 273.0, z);
}

void addQuad(Scene& scene, const Vec3& a, const Vec3& b, const Vec3& c, const Vec3& d)
{
    scene.addTriangle(a, b, c);
    scene.addTriangle(a, c, d);
}

void buildCornellBox(Scene& scene)
{
    const auto v = [](double x, double y, double z) {
        return cornellVertex(x, y, z);
    };

    // 地面、天花板、后墙、左墙、右墙
    addQuad(scene, v(552.8, 0.0, 0.0), v(0.0, 0.0, 0.0), v(0.0, 0.0, 559.2), v(549.6, 0.0, 559.2));
    addQuad(scene, v(556.0, 548.8, 0.0), v(556.0, 548.8, 559.2), v(0.0, 548.8, 559.2), v(0.0, 548.8, 0.0));
    addQuad(scene, v(549.6, 0.0, 559.2), v(0.0, 0.0, 559.2), v(0.0, 548.8, 559.2), v(556.0, 548.8, 559.2));
    addQuad(scene, v(0.0, 0.0, 559.2), v(0.0, 0.0, 0.0), v(0.0, 548.8, 0.0), v(0.0, 548.8, 559.2));
    addQuad(scene, v(552.8, 0.0, 0.0), v(549.6, 0.0, 559.2), v(556.0, 548.8, 559.2), v(556.0, 548.8, 0.0));

    // 顶灯
    addQuad(scene, v(343.0, 548.7, 227.0), v(343.0, 548.7, 332.0), v(213.0, 548.7, 332.0), v(213.0, 548.7, 227.0));

    // 矮盒子
    addQuad(scene, v(130.0, 165.0, 65.0), v(82.0, 165.0, 225.0), v(240.0, 165.0, 272.0), v(290.0, 165.0, 114.0));
    addQuad(scene, v(290.0, 0.0, 114.0), v(290.0, 165.0, 114.0), v(240.0, 165.0, 272.0), v(240.0, 0.0, 272.0));
    addQuad(scene, v(130.0, 0.0, 65.0), v(130.0, 165.0, 65.0), v(290.0, 165.0, 114.0), v(290.0, 0.0, 114.0));
    addQuad(scene, v(82.0, 0.0, 225.0), v(82.0, 165.0, 225.0), v(130.0, 165.0, 65.0), v(130.0, 0.0, 65.0));
    addQuad(scene, v(240.0, 0.0, 272.0), v(240.0, 165.0, 272.0), v(82.0, 165.0, 225.0), v(82.0, 0.0, 225.0));

    // 高盒子
    addQuad(scene, v(423.0, 330.0, 247.0), v(265.0, 330.0, 296.0), v(314.0, 330.0, 456.0), v(472.0, 330.0, 406.0));
    addQuad(scene, v(423.0, 0.0, 247.0), v(423.0, 330.0, 247.0), v(472.0, 330.0, 406.0), v(472.0, 0.0, 406.0));
    addQuad(scene, v(472.0, 0.0, 406.0), v(472.0, 330.0, 406.0), v(314.0, 330.0, 456.0), v(314.0, 0.0, 456.0));
    addQuad(scene, v(314.0, 0.0, 456.0), v(314.0, 330.0, 456.0), v(265.0, 330.0, 296.0), v(265.0, 0.0, 296.0));
    addQuad(scene, v(265.0, 0.0, 296.0), v(265.0, 330.0, 296.0), v(423.0, 330.0, 247.0), v(423.0, 0.0, 247.0));
}
```
同时我们需要修改我们的 Camera
```c++
Camera(int image_width,
        int image_height,
        const Vec3& position = Vec3(278, 273, -800),
        const Vec3& target = Vec3(0, 0, 0),
        const Vec3& up = Vec3(0, 1, 0),
        double vertical_fov = 90.0)
    :   position_(position),
        target_(target),
        up_(up),
        vertical_fov_(vertical_fov),
        image_width_(image_width),
        image_height_(image_height),
        aspect_ratio_(static_cast<double>(image_width) / image_height),
        frame_buffer_(image_width * image_height)
{
    initCamera();
}
```
在`main`函数中我们调整我们的相机为
```cpp
Camera camera(width, height, Vec3(0.0, 0.0, -800.0), Vec3(0.0, 0.0, 280.0), Vec3(0.0, 1.0, 0.0), 40.0);
```
此时`main`函数应该为
```cpp
int main()
{
    const int width = 600;
    const int height = 600;
    Camera camera(width, height, Vec3(0.0, 0.0, -800.0), Vec3(0.0, 0.0, 280.0), Vec3(0.0, 1.0, 0.0), 40.0);
    Scene scene(camera);
    buildCornellBox(scene);

    Renderer renderer;
    renderer.render(scene.getCamera(), scene.getObjects());

    writePPM("out.ppm", width, height, scene.getCamera().getFrameBuffer());

    return 0;
}
```
此时我们渲染我们的场景会得到下面这副图
![](images/cg/re0pt/out2.png)
一片红色，这是因为我们的 Renderer 目前是如果光线击中物体就直接无差异的返回红色, 所以我们可以根据我们的击中点与击中该点的ray的距离来确定颜色，距离越远颜色越深
```cpp
#include "Camera.h"
#include "Ray.h"
#include "Scene.h"
#pragma once

#include <algorithm>
#include <limits>

class Renderer {
public:
    Renderer() = default;
    ~Renderer() = default;

    void render(Camera& camera, const std::vector<std::unique_ptr<Object>>& objects)
    {
        for (int j = 0; j < camera.getImageHeight(); ++j) {
            for (int i = 0; i < camera.getImageWidth(); ++i) {
                Ray ray = camera.getRay(i, j);
                Vec3 pixel_color = traceRay(ray, objects);
                camera.getFrameBuffer()[j * camera.getImageWidth() + i] = pixel_color;
            }
        }
    }

private:
    Vec3 traceRay(const Ray& ray, const std::vector<std::unique_ptr<Object>>& objects)
    {
        double closest_t = std::numeric_limits<double>::infinity();
        bool hit_anything = false;

        for (const auto& object : objects) {
            const InterInfo info = object->getInterInfo(ray);
            if (!info.is_Intersected) {
                continue;
            }

            // 计算射线到交点的距离
            const double t = (info.position - ray.getOrigin()).length();
            // 如果距离小于0或者大于当前最短距离，则忽略
            if (t <= 0.0 || t >= closest_t) {
                continue;
            }

            closest_t = t;
            hit_anything = true;
        }

        if (!hit_anything) {
            return Vec3(0.0, 0.0, 0.0);
        }

        const double shade = std::clamp(1.0 - closest_t / 1400.0, 0.15, 1.0);
        return Vec3(255.0 * shade, 255.0 * shade, 255.0 * shade);
    }
};
```
最后渲染出来的图为
![](images/cg/re0pt/out3.png)
## PBR
终于我们看到了一些有趣的效果了，接下来我们将进入复杂的领域也就是 基于物理的渲染(Physically Based Rendering) 简称PBR。  
这是一种着色模型，它基于物理公式来描述光线怎么传输，光线的能量，光线的反弹，物体的材质等等。  
而我们首先介绍一下物体的材质，后面我们一步一步的向前推进知道我们对整个PBR有基本的认识，同时你会完成整个简单Path Tracing Renderer
### 材质 Material
我们都知道我们的现实世界中有各种各样的材质，木头，铁，布料等等。为什么我们能够通过观察，也就是光进入你的眼睛就能判断这个物体是什么材质呢？这是因为不同的物体的材质的属性各不相同，光线会以不同的方式反射到你的眼睛中所导致的。  

所以材质就是定义了光线如何反射，我们高中就学过一些几何光学的知识，我们知道漫反射和镜面反射，这是由材质中一个名为粗糙度 Rougness 决定的，并且如果是标准的镜面反射，那么光线会被反射到以光线击中的这个平面法线的对称位置。

所以材质中一个很重要的属性就是Roughness和法线n。  
法线我们可以在几何中获取，而材质我们需要单独定义。  

### 球体的法线
对于一个球体，它的法线非常好获取，假设我们的光线击中了球体的点$\mathbf{P}$，我们需要获取该点的法线向量$\mathbf{n}$，那么
$$\mathbf{n} = \frac{\mathbf{P}-\mathbf{C}}{r} $$
其中$\mathbf{C}$是球体的球心，$r$是球体的半径。
### 三角形的法线
对于一个三角形，它的法线也非常好获取，通常我们需要定义一个面的正反面，这决定了我们法线的方向，通常我们法线是指向正面的单位向量，我们可以通过三角形边构成的向量的叉乘定义法线，而向量叉乘的顺时针逆时针的结果是不同的，由于我们提供的构建 Cornell Box的代码中，我们使用的是逆时针定义，所以我们将使用逆时针定义的法线。
对于一个三角形 $ABC$ ，假设三角形的三个顶点分别为 $\mathbf{A}, \mathbf{B}, \mathbf{C}$，逆时针顺序 $\mathbf{A}\to\mathbf{B}\to\mathbf{C}$，
则法线向量 $\mathbf{n}$ 可以通过向量叉乘得到：
$$\mathbf{n} = \frac{(\mathbf{B} - \mathbf{A} )\times (\mathbf{C} - \mathbf{A})}{||(\mathbf{B} - \mathbf{A} )\times (\mathbf{C} - \mathbf{A})||}$$

三角形的法线与交点无关，球体的法线与交点有关。我们这个教程不考虑背面是怎么反射的。

由于我们需要获取法线信息，并且我们可能会使用到最小的t所以
```cpp
struct InterInfo {
    bool is_Intersected = false;
    Vec3 position;
    Vec3 normal;
    double closest_t;
};
```
更新球体的法线信息：
```cpp
InterInfo getInterInfo(const Ray& ray) const override
{
    ...
    double t = t1 < t2 ? t1 : t2; // 选择较小的正根
        if (t > 1e-8) {
            Vec3 hit_position = ray(t);
            Vec3 normal = (hit_position - center_) / radius_;
            return InterInfo{true, hit_position, normal, t};
        }
    }
    ...
    return InterInfo{false, Vec3(), Vec3(), std::numeric_limits<double>::infinity()};
}
```
更新三角形的法线信息：
```cpp
class Triangle final : public Object {
public:
    Triangle(const Vec3& p1, const Vec3& p2, const Vec3& p3)
        : p1_(p1),
          p2_(p2),
          p3_(p3)
    {
        normal_ = cross((p2_ - p1_), (p3_ - p1_));
        normal_ = unitVector(normal_);
    }
...
    InterInfo getInterInfo(const Ray& ray) const override
    {
        const auto t = hitDistance(ray);
        if (!t.has_value()) {
            return InterInfo{false, Vec3(), Vec3(), std::numeric_limits<double>::infinity()};
        }

        return InterInfo{true, ray(*t), normal_, t.value()};
    }
...
    Vec3 p1_;
    Vec3 p2_;
    Vec3 p3_;
    Vec3 normal_;
};
```
据此我们可以更新我们的渲染器代码：  
我们可以直接将法线作为颜色输出  
```cpp
Vec3 traceRay(const Ray& ray, const std::vector<std::unique_ptr<Object>>& objects)
{
    double closest_t = std::numeric_limits<double>::max();
    Vec3 normal;
    bool hit_anything = false;

    for (const auto& object : objects) {
        InterInfo info = object->getInterInfo(ray);
        if (!info.is_Intersected || info.closest_t >= closest_t) {
            continue;
        }

        closest_t = info.closest_t;
        normal = info.normal;
        hit_anything = true;
    }

    if (!hit_anything) {
        return Vec3(0.0, 0.0, 0.0);
    }

    // 将法线从[-1,1]映射到[0,1]
    const Vec3 mapped_normal = 0.5 * (normal + Vec3(1.0, 1.0, 1.0));
    return 255.0 * mapped_normal;
}
```
渲染后我们能得到这么一张图
![](images/cg/re0pt/out4.png)

## 光线的传播
在实现材质之前我想必须得介绍一下 Path Tracing 中最重要的一些概念，我们现在的渲染器对光线的处理非常简单，在击中物体之后就直接结束了，但是我们现实世界中的光线会进行多次弹射，而正确的Path Tracing 就是模拟这种多次弹射的过程。而在实现这个效果之前，也就是现在我们必须介绍一下 Radiometry 辐射度量学，因为我们通过 Radiometry 这个物理模型解释光的能量是怎么传播的

## Radiant Energy
光本质上是电磁波，而只要是波就能携带能量。我们将光所携带的能量称为辐射能。  
符号：$Q$， 单位：焦耳 $J$

## Radiant Flux
在图形学中我们通常不会使用**辐射能**来计算光照，因为如果一个光源一直发光那么它释放的能量是无限变大的。
而在图形学中，我们更关注一帧画面中的能量。即**Radiant Flux**  
- 定义：单位时间内 **Radiant Energy** 的变化量
- 符号：$\Phi$
- 单位：瓦特 $W$，或者焦耳每秒 $J/s$  
公式：
$$\Phi = \frac{dQ}{dt}$$

## Solid Angle
在介绍其他的物理量之前先介绍一下**立体角**，因为这些物理量需要使用到立体角。  
立体角是一个数学中的概念，类似于二维平面上，我们使用弧度表示来表示一个二维角度 $\theta = \frac{s}{r} $。    
类似的，在三维空间中，我们使用类似的定义来表示立体角。  
（除以半径的平方对应了物理中的平方反比定律）  
$$ \Omega = \frac{A}{r^2} $$  
- 单位: 球面度 (Steradian, sr)
![](images/cg/solid_angle.png)

例1：  
计算整个球体和半球的立体角：   
根据球体面积公式: $A = 4\pi r^2$

$$ \Omega_1 = \frac{A}{r^2}  = \frac{4\pi r^2}{r^2} = 4\pi$$  
$$ \Omega_2 = \frac{\Omega_1}{2}= 2\pi$$  

### 微分立体角
在球体上我们通常使用经纬度来表示一个点的位置
- 极角 $\theta$ ：与 $z$ 轴的夹角 $[0, \pi]$
- 方位角 $\phi$ ：在 $xy$ 平面上的投影与 $x$ 轴的夹角，范围 $[0, 2\pi]$。
- 定义
$$ d\omega = \frac{dA}{r^2} $$
其中 

$$ dA = (rd\theta)(rsin\theta d\phi) = r^2sin\theta d\theta d\phi $$
![](images/cg/differential_solid_angle.png)
所以原公式可以化简为
$$ d\omega = sin\theta d\theta d\phi  $$

例2    
使用微分立体角计算半个球体的立体角：  
$$ \Omega = \int_{\mathcal{H} } d\omega=\int_{0}^{2\pi} \int_{0}^{\frac{\pi}{2}} sin\theta d\theta d\phi  = \int_{0}^{\frac{\pi}{2}}sin\theta d\theta \int_{0}^{2\pi} d\phi  = \left [ -cos\theta \right ] ^{\pi}_{0}2\pi = 2\pi  $$
(积分区域是矩形且被积函数是可分离的，所以可以化为两个独立定积分)

## Intensity
Radiant Flux描述的是光源向所有方向发射的总功率，但光源在不同方向发出的能量是不同的。辐射强度用于描述光源在特定方向上的发光能力。
- 定义：单位立体角内的 Radiant Flux 的变化率
- 符号：$I$
- 单位：瓦特每立体角 $W/sr$
- 公式：
$$ I(\omega) =\lim_{\Delta\omega \to 0}\frac{\Delta \Phi}{\Delta \omega}= \frac{d\Phi}{d\omega} $$
如果一个光源是各项同性的，那么它的 Radiant Intensity 是 $I = \frac{\Phi}{4\pi}$（$4\pi$ 是整个球的立体角）
![](images/cg/intensity.png)

## irradiance
Irradiance 描述了某一个表面上接受的 Radiant Flux。
- 定义: 单位面积内的接受的 Radiant Flux 的变化率
- 符号：$E$
- 单位：瓦特每平方米 $W/m^2$
- 公式：
$$ E(p) =\lim_{\Delta A \to 0}\frac{\Delta \Phi(p)}{\Delta A}= \frac{d\Phi(p)}{ dA} $$

![](images/cg/irradiance.png)

## Radiance
它结合了方向和面积，描述了**光线在空间中沿一条射线的强度**
- 定义： 单位立体角、单位投影面积上的辐射通量。
- 符号：$L$
- 单位：$\frac{W}{sr\cdot m^2}$
- 公式：
$$L(p, \omega)= \lim_{\Delta\omega \to 0}\frac{\Delta E_{\omega}(p)}{\Delta \omega}=\frac{d E_{\omega}(p)}{d\omega}= \frac{d^2\Phi}{d\omega dA }$$
（其中 $p$ 是表面上的点，$\omega$ 是光线方向，$\theta$ 是光线方向与表面法线的夹角）。

![](images/cg/radiance.png)

实际上 $ dA cos\theta $才是radiance中所定义的面积
![](images/cg/radiance_area.png)
所以原方程为
$$ L(p, \omega) = \frac{d E_{\omega}(p)}{d\omega cos\theta}=\frac{d^2\Phi}{d\omega dA cos\theta} $$

**好了上面的都不重要重要的是下面这些概念 **   

## BRDF 双向反射分布函数
BRDF（双向反射分布函数，Bidirectional Reflectance Distribution Function）是计算机图形学和光学中用于描述光线在不透明表面如何反射的核心概念。它定义了物体的材质，描述了入射光是如何被反射到其他方向上去的。它的定义是：“在某个点上，在某个给定方向上反射出去的Radiance，与 **从某个给定方向入射的Irradiance** 之间的比例关系”。    
根据其定义：  

$$f_r(\omega_i, \omega_o) = \frac{dL_r(\omega_o)}{dE_i(\omega_i)} = \frac{dL_r(\omega_o)}{L_i(\omega_i) \cos\theta_i d\omega_i}$$
- $\omega_i$：入射光方向
- $\omega_o$：反射光方向
- $dL_r(\omega_o)$：表面在 $\omega_o$ 方向反射出去的radiance
- $dE_i(\omega_i)$：来自 $\omega_i$ 方向的微分入射irradiance
- $\theta_i$：入射光与表面法线的夹角

简单来说 BRDF 它定义了材质，材质定义了光线如何反射，所以BRDF就是定义了光如何反射， 如果有来自方向 $\omega_i$ 的irradiance $dE_i$ 照到这一点，那么在 $\omega_o$ 方向上产生的反射radiance $dL_r$ 是多少

## 反射方程 
有了 BRDF 那么我们就可以定义出反射方程了。很显然观察者接受到的物体的反射光是由不同方向上照射到物体表面经过材质反射的入射光贡献而来的。对 BRDF 方程两边同时乘以分子再对整个半球做积分就得到了：  
$$ L_r( \omega_o) = \int_{\mathcal{H} } f_r(\omega_i, \omega_o) L_i(\omega_i) \cos\theta_i  d\omega_i $$
由此我们可以根据这个方程计算出出射光了。  

简单来说，如果我们有一束光 $L_i$ 从$\omega_i$方向入射到$f_r(\omega_i, \omega_o)$上最终变为$ \omega_o$方向的出射光，而我们需要的就是$ \omega_o$方向的出射光，我们对半球上所有的入射光进行积分(因为光可能来自半球中的所有位置)，就得到$ \omega_o$方向的出射光了。
## 渲染方程
渲染方程 Rendering Equation 只是在反射方程的基础之上添加了一个自发光项(Emission term)，物体可能自己会发光
$$L_o( \omega_o) = L_e( \omega_o) + \int_{\mathcal{H} } f_r(\omega_i, \omega_o) L_i(\omega_i) \cos\theta_i  d\omega_i$$

我们观察 Rendering Equation 可以发现，这是一个积分方程，并且是递归定义的积分方程，所以想要得到解析解几乎是不可能的，而且其中还有一个及其复杂的BRDF我们不知道怎么算，我们只知道它的定义式。

## 微表面理论 Microsurface Theory
为了解决我们的 BRDF 的计算问题，我们引入了 Mircosurface Theory ，在 Mircosurface Theory 中假设所有的物体的表面在微观层面下都是由微小的朝向各不相同的绝对镜面反射平面组成的。

而在 Mircosurface Theory 下最经典的 BRDF 模型是 Cook-Torrance BRDF 模型 ,在Cook-Torrance BRDF 模型下 BRDF 为:

$$f_r = k_d f_{lambert} + k_s f_{cook-torrance}$$

- $k_d$：漫反射系数。
- $k_s$：镜面反射系数
- $f_{lambert} = \frac{c}{\pi}$：最基础的兰伯特漫反射（$c$ 为表面颜色）

$$f_{cook-torrance} = \frac{D \cdot G \cdot F}{4(\omega_i \cdot \mathbf{n})(\omega_o \cdot \mathbf{n})}$$

其中
- D (Distribution Function): 法线分布函数，它描述了有多少比例的微表面法线正好对准了能把光线反射到你眼睛里的方向
- G (Geometry Function): 几何函数，描述了微表面之间的自遮挡（Shadowing）和自掩蔽（Masking）
- F (Fresnel Term): 菲涅尔项，决定了光线在不同角度下的反射率  

而我们最终的目标渲染出一个标准的 Cornell Box 是不需要 $$f_{cook-torrance} $$的因为这是一个纯漫反射场景

### 漫反射材质
由于我们的目标Cornell Box是一个纯漫反射场景所以Material的实现将会变得非常简单
```cpp
#pragma once
#include "Vec3.h"

class Material {
public:
    Material(const Vec3& base_color, const double& kd)
        : base_color_(base_color),
          kd_(kd)
    {}

    Vec3 eval() const
    {
        return kd_ * base_color_ / (3.141592653589793);
    }

private:
    Vec3 base_color_{};
    double kd_ = 1.0;
};
```
由于 kd_和 base_color_在数学上是线性相关的。通常我们会把它们合二为一，直接叫 Albedo，所以代码改为
```cpp
#pragma once
#include "Vec3.h"

class Material {
public:
    Material(const Vec3& albedo)
        : albedo_(albedo)
    {}

    Vec3 eval() const
    {
        return albedo_ / (3.141592653589793);
    }

private:
    Vec3 albedo_;
};
```
让后我们修改`Object`，让其拥有Material
```cpp
...

class Object {
public:
    explicit Object(std::shared_ptr<Material> material = nullptr)
        : material_(std::move(material))
    {}

    virtual ~Object() = default;
    virtual bool intersect(const Ray& ray) const = 0;
    virtual InterInfo getInterInfo(const Ray& ray) const = 0;

    std::shared_ptr<Material> getMaterial() const
    {
        return material_;
    }

protected:
    InterInfo inter_info_;
    std::shared_ptr<Material> material_ = nullptr;
};


```
同时`Sphere` 和 `Triangle` 也要更新
```cpp
...
class Sphere final : public Object {
public:
    Sphere(const Vec3& center, double radius, std::shared_ptr<Material> material = nullptr)
        : Object(std::move(material)),
          center_(center),
          radius_(radius)
    {}
...
};
```
```cpp
...
class Triangle final : public Object {
public:
    Triangle(const Vec3& p1, const Vec3& p2, const Vec3& p3, std::shared_ptr<Material> material = nullptr)
        : Object(std::move(material)),
          p1_(p1),
          p2_(p2),
          p3_(p3)
    {
        normal_ = cross((p2_ - p1_), (p3_ - p1_));
        normal_ = unitVector(normal_);
    }
...
};
```
并且我们提供了标准的Cornell Box材质
```cpp
Vec3 cornellVertex(double x, double y, double z)
{
    // 将标准 Cornell Box 坐标平移到以盒子开口中线为中心的局部坐标。
    return Vec3(x - 278.0, y - 273.0, z);
}

void addQuad(Scene& scene,
             const Vec3& a,
             const Vec3& b,
             const Vec3& c,
             const Vec3& d,
             const std::shared_ptr<Material>& material)
{
    scene.addTriangle(a, b, c, material);
    scene.addTriangle(a, c, d, material);
}

void buildCornellBox(Scene& scene)
{
    const auto v = [](double x, double y, double z) {
        return cornellVertex(x, y, z);
    };

    const std::shared_ptr<Material> white = makeCornellMaterial(0.725, 0.710, 0.680);
    const std::shared_ptr<Material> red = makeCornellMaterial(0.630, 0.065, 0.050);
    const std::shared_ptr<Material> green = makeCornellMaterial(0.140, 0.450, 0.091);
    const std::shared_ptr<Material> light = makeCornellMaterial(1.000, 1.000, 1.000);

    // 地面、天花板、后墙、左墙、右墙
    addQuad(scene, v(552.8, 0.0, 0.0), v(0.0, 0.0, 0.0), v(0.0, 0.0, 559.2), v(549.6, 0.0, 559.2), white);
    addQuad(scene, v(556.0, 548.8, 0.0), v(556.0, 548.8, 559.2), v(0.0, 548.8, 559.2), v(0.0, 548.8, 0.0), white);
    addQuad(scene, v(549.6, 0.0, 559.2), v(0.0, 0.0, 559.2), v(0.0, 548.8, 559.2), v(556.0, 548.8, 559.2), white);
    addQuad(scene, v(0.0, 0.0, 559.2), v(0.0, 0.0, 0.0), v(0.0, 548.8, 0.0), v(0.0, 548.8, 559.2), red);
    addQuad(scene, v(552.8, 0.0, 0.0), v(549.6, 0.0, 559.2), v(556.0, 548.8, 559.2), v(556.0, 548.8, 0.0), green);

    // 顶灯
    addQuad(scene, v(343.0, 548.7, 227.0), v(343.0, 548.7, 332.0), v(213.0, 548.7, 332.0), v(213.0, 548.7, 227.0), light);

    // 矮盒子
    addQuad(scene, v(130.0, 165.0, 65.0), v(82.0, 165.0, 225.0), v(240.0, 165.0, 272.0), v(290.0, 165.0, 114.0), white);
    addQuad(scene, v(290.0, 0.0, 114.0), v(290.0, 165.0, 114.0), v(240.0, 165.0, 272.0), v(240.0, 0.0, 272.0), white);
    addQuad(scene, v(130.0, 0.0, 65.0), v(130.0, 165.0, 65.0), v(290.0, 165.0, 114.0), v(290.0, 0.0, 114.0), white);
    addQuad(scene, v(82.0, 0.0, 225.0), v(82.0, 165.0, 225.0), v(130.0, 165.0, 65.0), v(130.0, 0.0, 65.0), white);
    addQuad(scene, v(240.0, 0.0, 272.0), v(240.0, 165.0, 272.0), v(82.0, 165.0, 225.0), v(82.0, 0.0, 225.0), white);

    // 高盒子
    addQuad(scene, v(423.0, 330.0, 247.0), v(265.0, 330.0, 296.0), v(314.0, 330.0, 456.0), v(472.0, 330.0, 406.0), white);
    addQuad(scene, v(423.0, 0.0, 247.0), v(423.0, 330.0, 247.0), v(472.0, 330.0, 406.0), v(472.0, 0.0, 406.0), white);
    addQuad(scene, v(472.0, 0.0, 406.0), v(472.0, 330.0, 406.0), v(314.0, 330.0, 456.0), v(314.0, 0.0, 456.0), white);
    addQuad(scene, v(314.0, 0.0, 456.0), v(314.0, 330.0, 456.0), v(265.0, 330.0, 296.0), v(265.0, 0.0, 296.0), white);
    addQuad(scene, v(265.0, 0.0, 296.0), v(265.0, 330.0, 296.0), v(423.0, 330.0, 247.0), v(423.0, 0.0, 247.0), white);
}
```
我们的渲染器需要修改为
```cpp
Vec3 traceRay(const Ray& ray, const std::vector<std::unique_ptr<Object>>& objects)
{
    double closest_t = std::numeric_limits<double>::max();
    bool hit_anything = false;
    std::shared_ptr<Material> material = nullptr;
    for (const auto& object : objects) {
        InterInfo info = object->getInterInfo(ray);
        if (!info.is_Intersected || info.closest_t >= closest_t) {
            continue;
        }

        closest_t = info.closest_t;
        hit_anything = true;
        material = object->getMaterial();
    }

    if (!hit_anything || !material) {
        return Vec3(0.0, 0.0, 0.0);
    }

    return material->eval();
}
```
这时候我们渲染出来的图形是这样的
![](images/cg/re0pt/out5.png)
这是因为我们的光线击中物体后会直接返回改物体的材质颜色，我们还没有使用最标准的渲染方程进行渲染，还记得我们的渲染方程吗
$$L_o( \omega_o) = L_e( \omega_o) + \int_{\mathcal{H} } f_r(\omega_i, \omega_o) L_i(\omega_i) \cos\theta_i  d\omega_i$$
这个积分方程我们没方法求得其解析解，所以我们需要通过数值的方式求解，而在图形学中用的最广泛的方法就是蒙特卡洛积分，这是一个概率论中的方法。  

你可以这么理解蒙特卡洛积分，想象一下你在求一个单变量实函数的定积分，但是这个定积分也是求不出来的，我们知道定积分实际上就是求面积，所以我们可以这么做：  
对于积分区间为$[a,b]$
$$I = \int_{a}^{b}f(x)dx$$
我们在区间中均匀取一个$c_i\in[a,b]$，可以求得：
$$S_i = (b-a)f(c_i)$$
如果我们对这个过程进行无穷多次,并求和取平均，即
$$S_t = \lim_{N\to\infty} \frac{1}{N}\sum_{i=1}^{N}S_i =\lim_{N\to\infty}\frac{1}{N} \sum_{i=1}^{N}(b-a)f(c_i)$$
那么最后
$$I = S_t$$
背后的数学证明就不推导了，因为我们的目的是实现出一个 Path Tracing 渲染器！  
蒙特卡洛积分就是这么个过程，我们要计算这么一个反射方程：
$$L_o( \omega_o) = \int_{\mathcal{H} } f_r(\omega_i, \omega_o) L_i(\omega_i) \cos\theta_i  d\omega_i$$
我们需要找到一个$p(x)$，然后通过蒙特卡洛积分，
$$\hat{L}_o(\omega_o) = \frac{1}{N} \sum_{j=1}^{N} \frac{f_r(\omega_i, \omega_j) L_i(\omega_j) \cos\theta_j}{p(\omega_j)}$$

其中我们的$f_r = k_d\frac{c}{\pi}$，$p(x)$是概率密度函数，通常我们需要选择一个$p(x)$它的分布与BRDF的反射分布一致，
漫反射当一个入射光击中这个点他会均匀的向半球反射光线，所以我们这里$p(x)$将会选择在半球随机均匀采样，也就是
$$\int_0^{2\pi} \int_0^{\pi/2} C \sin\theta d\theta d\phi = C \cdot 2\pi = 1 \implies C = \frac{1}{2\pi}$$
```cpp
...
class Material {
public:
    Material(const Vec3& albedo)
        : albedo_(albedo)
    {}

    Vec3 eval() const
    {
        return albedo_ / (3.141592653589793);
    }

    double pdf(const Vec3& wi, const Vec3& wo, const Vec3& normal)
    {
        const double cosThetaI = dot(normal, wi);
        const double cosThetaO = dot(normal, wo);

        // 如果入射或出射方向在表面以下，概率为 0
        if (cosThetaI <= 0.0 || cosThetaO <= 0.0) {
            return 0.0;
        }

        // 均匀半球采样的 PDF = 1 / (2 * PI)
        return 1.0 / (2.0 * 3.141592653589793);
    }


private:
    Vec3 albedo_;
};
```
并且我们需要对$p(x)$进行在给定的入射光$w_o$采样得到出射光$w_i$，不然我们没法获取出射光，
这其中会用到这几个函数与我们的主线无关我们提供给你
```cpp
static double randomDouble()
{
    static thread_local std::mt19937 generator(std::random_device{}());
    static thread_local std::uniform_real_distribution<double> distribution(0.0, 1.0);
    return distribution(generator);
}

static Vec3 sampleUniformHemisphere()
{
    const double z = randomDouble();
    const double phi = 2.0 * 3.141592653589793 * randomDouble();
    const double r = std::sqrt(std::max(0.0, 1.0 - z * z));

    return Vec3(r * std::cos(phi), r * std::sin(phi), z);
}

static Vec3 toWorld(const Vec3& local, const Vec3& normal)
{
    const Vec3 n = unitVector(normal);
    const Vec3 helper = std::abs(n.x()) > 0.9 ? Vec3(0.0, 1.0, 0.0) : Vec3(1.0, 0.0, 0.0);
    const Vec3 tangent = unitVector(cross(helper, n));
    const Vec3 bitangent = cross(n, tangent);

    return local.x() * tangent + local.y() * bitangent + local.z() * n;
}
```
最终我们的材质变为：
```cpp
#pragma once
#include "Vec3.h"

#include <cmath>

#include <optional>
#include <random>

class Material {
public:
    Material(const Vec3& albedo)
        : albedo_(albedo)
    {}

    Vec3 eval() const
    {
        return albedo_ / (3.141592653589793);
    }

    // 计算在入射光w_i,出射光w_o的光照条件下，入射光被反射到出射光方向上的概率
    double pdf(const Vec3& wi, const Vec3& wo, const Vec3& normal)
    {
        const double cosThetaI = dot(normal, wi);
        const double cosThetaO = dot(normal, wo);

        // 如果入射或出射方向在表面以下，概率为 0
        if (cosThetaI <= 0.0 || cosThetaO <= 0.0) {
            return 0.0;
        }

        // 均匀半球采样的 PDF = 1 / (2 * PI)
        return 1.0 / (2.0 * 3.141592653589793);
    }

    // 在给定入射光wi，通过采样获得出射光wo
    std::optional<Vec3> sample(const Vec3& wi, const Vec3& normal)
    {
        Vec3 local_wo = sampleUniformHemisphere();
        // 由于我们采样获得的向量是在着色点的本地坐标的所以我们需要转换到世界坐标
        Vec3 wo = toWorld(local_wo, normal);

        if (dot(normal, wo) <= 1e-6) {
            return std::nullopt;
        }

        return unitVector(wo);
    }

private:
    static double randomDouble()
    {
        static thread_local std::mt19937 generator(std::random_device{}());
        static thread_local std::uniform_real_distribution<double> distribution(0.0, 1.0);
        return distribution(generator);
    }

    static Vec3 sampleUniformHemisphere()
    {
        const double z = randomDouble();
        const double phi = 2.0 * 3.141592653589793 * randomDouble();
        const double r = std::sqrt(std::max(0.0, 1.0 - z * z));

        return Vec3(r * std::cos(phi), r * std::sin(phi), z);
    }

    static Vec3 toWorld(const Vec3& local, const Vec3& normal)
    {
        const Vec3 n = unitVector(normal);
        const Vec3 helper = std::abs(n.x()) > 0.9 ? Vec3(0.0, 1.0, 0.0) : Vec3(1.0, 0.0, 0.0);
        const Vec3 tangent = unitVector(cross(helper, n));
        const Vec3 bitangent = cross(n, tangent);

        return local.x() * tangent + local.y() * bitangent + local.z() * n;
    }

    Vec3 albedo_;
};

```
还记得我们文章最开始提到的"最后打到光源"吗，所以我们需要标记一下这个物体是不是光源。
我们修改我们的`Object`类
```cpp
...

class Object {
public:
    explicit Object(std::shared_ptr<Material> material = nullptr, bool is_light = false)
        : material_(std::move(material)),
          is_light_(is_light)
    {}

   ...
    bool is_light_ = false;
};
```
并且修改`Sphere`、`Triangle`、`Scene`
```cpp
...
Sphere(const Vec3& center, double radius, std::shared_ptr<Material> material = nullptr, bool is_light = false)
    : Object(std::move(material), is_light),
        center_(center),
        radius_(radius)
{}
...
```
```cpp
...
Triangle(const Vec3& p1,
            const Vec3& p2,
            const Vec3& p3,
            std::shared_ptr<Material> material = nullptr,
            bool is_light = false)
    : Object(std::move(material), is_light),
        p1_(p1),
        p2_(p2),
        p3_(p3)
{
    normal_ = cross((p2_ - p1_), (p3_ - p1_));
    normal_ = unitVector(normal_);
}
...
```
```cpp
void addSphere(const Vec3& center, double radius, std::shared_ptr<Material> material = nullptr, bool is_light = false)
{
    addObject(std::make_unique<Sphere>(center, radius, std::move(material), is_light));
}

void addTriangle(const Vec3& p1,
                    const Vec3& p2,
                    const Vec3& p3,
                    std::shared_ptr<Material> material = nullptr,
                    bool is_light = false)
{
    addObject(std::make_unique<Triangle>(p1, p2, p3, std::move(material), is_light));
}
```
我们还需要修改我们的Cornell box的构建函数
```cpp
void addQuad(Scene& scene,
             const Vec3& a,
             const Vec3& b,
             const Vec3& c,
             const Vec3& d,
             const std::shared_ptr<Material>& material,
             bool is_light = false)
{
    scene.addTriangle(a, b, c, material, is_light);
    scene.addTriangle(a, c, d, material, is_light);
}
...
 // 顶灯
    addQuad(scene, v(343.0, 548.7, 227.0), v(343.0, 548.7, 332.0), v(213.0, 548.7, 332.0), v(213.0, 548.7, 227.0), light, true);
```
最后我们只需要实现光线的递归就行了，在此之前我们先给我们的相机中的`getRay()`函数修改一下
```cpp
...
Ray getRay(int i, int j) const
{
    return getRay(i, j, 0.0, 0.0);
}

Ray getRay(int i, int j, double offset_u, double offset_v) const
{
    Vec3 pixel_center =
        pixel_left_top_ + ((i + offset_u) * pixel_delta_u_) + ((j + offset_v) * pixel_delta_v_);
    Vec3 ray_direction = unitVector(pixel_center - position_);
    return Ray{position_, ray_direction};
}
...
```
这样我们可以在一个像素点中进行偏移微小的偏移，这样我们可以多次采样一个像素点，从而得到一个更精确的图像，因为我们如果只采样一次像素点，那么从这个像素中射出的光线很有可能最终不会命中光源，那么这个像素的颜色就会是黑色   
最终我们的渲染器长这个样子


```cpp
...
class Renderer {
public:
    Renderer() = default;
    ~Renderer() = default;

    void render(Camera& camera, const std::vector<std::unique_ptr<Object>>& objects)
    {
        for (int j = 0; j < camera.getImageHeight(); ++j) {
            for (int i = 0; i < camera.getImageWidth(); ++i) {
                Vec3 pixel_color;
                // 多次采样同一个像素，在同一个像素中进行微小偏移，因为可能一次光线追踪找不到光源，渲染出来的像素就是黑的
                for (int sample = 0; sample < kSamplesPerPixel; ++sample) {
                    const Ray ray = camera.getRay(i, j, randomOffset(), randomOffset());
                    pixel_color += traceRay(ray, objects);
                }
                // 由于我们 pixel_color += traceRay(ray, objects);所以我们需要平均回去
                pixel_color /= kSamplesPerPixel;
                camera.getFrameBuffer()[j * camera.getImageWidth() + i] = pixel_color;
            }
            printProgress(j + 1, camera.getImageHeight());
        }
    }

private:
    // 递归深度
    static constexpr int kMaxDepth = 5;
    // 一个像素的采样次数
    static constexpr int kSamplesPerPixel = 8;

    Vec3 traceRay(const Ray& ray, const std::vector<std::unique_ptr<Object>>& objects)
    {
        // 递归调用
        return traceRay(ray, objects, kMaxDepth);
    }

    Vec3 traceRay(const Ray& ray, const std::vector<std::unique_ptr<Object>>& objects, int depth)
    {
        // 递归出口
        if (depth <= 0) {
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

        // 如果打到光源就直接返回光源的材质颜色
        if (is_light) {
            return material->eval();
        }

        // 在计算的时候向量起点都设在交点上
        const Vec3 wo = -ray.getDirection();
        // 判断wo是否在物体的正面，如果不是则矫正
        const Vec3 normal = faceForward(closest_info.normal, wo);

        // 在给定入射光wi，通过采样获得出射光wo
        const std::optional<Vec3> sampled_direction = material->sample(wo, normal);
        if (!sampled_direction.has_value()) {
            return Vec3(0.0, 0.0, 0.0);
        }

        // 获取pdf的值
        const double sample_pdf = material->pdf(*sampled_direction, wo, normal);
        if (sample_pdf <= 1e-8) {
            return Vec3(0.0, 0.0, 0.0);
        }

        // 计算被积函数中的cos项
        const double cos_theta = std::max(0.0, dot(normal, *sampled_direction));
        // 获取反射后的光线，+ normal * 1e-4是向物体表面偏移一点点为了防止光线与物体表面相交，
        const Ray scattered_ray(closest_info.position + normal * 1e-4, *sampled_direction);
        // 递归
        const Vec3 incoming_light = traceRay(scattered_ray, objects, depth - 1);

        // 返回最终颜色
        return material->eval() * incoming_light * (cos_theta / sample_pdf);
    }

    // 判断wo是否在物体的正面，如果不是则矫正
    Vec3 faceForward(const Vec3& normal, const Vec3& direction) const
    {
        return dot(normal, direction) < 0.0 ? -normal : normal;
    }

    // 用于在像素点中进行偏移
    double randomOffset() const
    {
        static thread_local std::mt19937 generator(std::random_device{}());
        static thread_local std::uniform_real_distribution<double> distribution(-0.5, 0.5);
        return distribution(generator);
    }

    // 添加一个渲染进度条，以便我们知道还有多久可以渲染好
    void printProgress(int completed_rows, int total_rows) const
    {
        const double progress = static_cast<double>(completed_rows) / total_rows;
        const int filled = static_cast<int>(progress * 40);

        std::cout << "\rRendering [";
        for (int i = 0; i < 40; ++i) {
            std::cout << (i < filled ? '#' : '-');
        }
        std::cout << "] " << static_cast<int>(progress * 100.0) << "%";

        if (completed_rows == total_rows) {
            std::cout << '\n';
        }
        std::cout << std::flush;
    }
};
```
设置`kSamplesPerPixel = 1`,`kMaxDepth = 5`渲染出来的图为
![](images/cg/re0pt/outspp1.png)
设置`kSamplesPerPixel = 16`,`kMaxDepth = 30`渲染出来的图为
![](images/cg/re0pt/outspp16.png)
设置`kSamplesPerPixel = 256`,`kMaxDepth = 64`渲染出来的图为
![](images/cg/re0pt/outspp256.png)


## 结语
因为你是被CGLab选中的人所以你在实现渲染器的过程中应该感觉非常轻松，并且热爱上了计算机图形学，如果实现起来很困难说明你的资质还不足以加入CGLab，那么可以选则查看这个repo[Re0-PathTracing](https://github.com/CGLaboratory/Re0-PathTracing)，这个仓库中的代码可能与教程中有一点点不同，不过总体上都是相同的，如果你选择了查看这个仓库，你会自动获得网络，并且你将失去进入CGLab的资格，同时你只需要提交一张渲染截图，就可以逃出这个黑室了。