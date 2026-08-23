---
date : '2026-08-22T20:42:39+08:00'
draft : false
title : '【CG】150行C++路径追踪'
tags:
  - graphics

categories:
  - blog

math: true
---
学了 离线渲染 相关的知识这么久了，自己也写过一些渲染器，但是我认为我对渲染器中的积分器的实现的理解还是不够透彻，于是打算写一个简单的 path tracer 程序来加深自己的印象
，于是就得到了（无第三方库
![](images/cg/u/a005/output.png)
代码
```c++
#include <cmath>
#include <iostream>
#include <random>
#include <vector>
constexpr float EPSILON = 1e-5f;
constexpr float PI = 3.14159265358979323846f;
struct Vec3 {
  float x, y, z;
  Vec3(float x, float y, float z) : x(x), y(y), z(z) {}
  Vec3() : x(0), y(0), z(0) {}
  Vec3 operator+(const Vec3 &other) const {
    return Vec3(x + other.x, y + other.y, z + other.z);
  }
  Vec3 operator-(const Vec3 &other) const {
    return Vec3(x - other.x, y - other.y, z - other.z);
  }
  Vec3 operator*(float other) const {
    return Vec3(x * other, y * other, z * other);
  }
  Vec3 operator*(Vec3 other) {
    return Vec3(x * other.x, y * other.y, z * other.z);
  }
  Vec3 operator-() const { return Vec3(-x, -y, -z); }
};
Vec3 normalize(Vec3 v) { return v * (1.0f / sqrt(v.x * v.x + v.y * v.y + v.z * v.z)); }
float dot(Vec3 a, Vec3 b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
float clamp(float x, float min, float max) {
  return x < min ? min : (x > max ? max : x);
}
float linear_to_srgb(float x) {
  x = clamp(x, 0.0f, 1.0f);
  if (x <= 0.0031308f)
    return 12.92f * x;
  return 1.055f * std::pow(x, 1.0f / 2.4f) - 0.055f;
}
struct Ray {
  Vec3 origin;
  Vec3 direction;
  Ray(Vec3 origin, Vec3 direction) : origin(origin), direction(direction) {}
  Vec3 at(float t) const { return origin + direction * t; }
};
struct Sphere {
  Sphere(float radius, Vec3 center, Vec3 color, bool light = false): radius(radius), center(center), color(color), is_light(light) {}
  float radius;
  Vec3 center;
  Vec3 color;
  bool is_light = false;
};
struct HitInfo {
  bool is_hit;
  float t;
  Vec3 position;
  Vec3 normal;
  Sphere const* sphere = nullptr;
};
HitInfo intersect(const Ray &ray, const Sphere &sphere) {
  Vec3 oc = ray.origin - sphere.center;
  float b = 2.0f * dot(oc, ray.direction);
  float c = dot(oc, oc) - sphere.radius * sphere.radius;
  float discriminant = b * b - 4.0f * c;
  if (discriminant < 0.0f)
    return {false, 0.0f, Vec3(), Vec3(), &sphere};
  float sqrt_d = sqrt(discriminant);
  float t0 = (-b - sqrt_d) * 0.5f,t1 = (-b + sqrt_d) * 0.5f;
  float t = t0;
  if (t < EPSILON)
    t = t1;
  if (t < EPSILON)
    return {false, 0.0f, Vec3(), Vec3(), &sphere};
  return {true, t, ray.at(t), normalize(ray.at(t) - sphere.center), &sphere};
}
float random_float() {
  thread_local std::mt19937 gen(std::minstd_rand{}());
  thread_local std::uniform_real_distribution<float> dis(0.0f, 1.0f);
  return dis(gen);
}
Vec3 sampling_hemisphere(const Vec3 &normal) {
  float z = random_float();
  float r = std::sqrt(1.0f - z * z);
  float phi = 2.0f * PI * random_float();
  Vec3 local(r * std::cos(phi), r * std::sin(phi), z);
  Vec3 tangent;
  if (std::abs(normal.x) > 0.9f)
    tangent = normalize(Vec3(0.0f, 1.0f, 0.0f) - normal * normal.y);
  else
    tangent = normalize(Vec3(1.0f, 0.0f, 0.0f) - normal * normal.x);
  Vec3 bitangent = Vec3(normal.y * tangent.z - normal.z * tangent.y,normal.z * tangent.x - normal.x * tangent.z,normal.x * tangent.y - normal.y * tangent.x);
  return normalize(tangent * local.x + bitangent * local.y + normal * local.z);
}
Vec3 Lo(Ray ray, const std::vector<Sphere> &spheres, int depth) {
  if (depth <= 0)
    return Vec3();
  float rr_prob = 0.9f;
  if (random_float() > rr_prob)
    return Vec3();
  HitInfo nearest_hit;
  nearest_hit.t = 1e10;
  nearest_hit.is_hit = false;
  for (auto &sphere : spheres) {
    HitInfo hit = intersect(ray, sphere);
    if (hit.is_hit && hit.t < nearest_hit.t)
      nearest_hit = hit;
  }
  if (!nearest_hit.is_hit)
    return Vec3();
  if (nearest_hit.sphere->is_light) {
    Vec3 Le = nearest_hit.sphere->color * 30.0f;
    return Le;
  }
  Vec3 wo = -ray.direction,wi = sampling_hemisphere(nearest_hit.normal);
  float pdf = 1.0f / (2.0f * PI);
  Vec3 f_r = nearest_hit.sphere->color * (1.0f / PI);
  float cos_theta = dot(wi, nearest_hit.normal);
  Ray new_ray = Ray(nearest_hit.position + nearest_hit.normal * EPSILON, wi);
  Vec3 Li = Lo(new_ray, spheres, depth - 1);
  return f_r * Li * cos_theta * (1.0f / (rr_prob * pdf));
}
int main() {
  int image_width = 256, image_height = 256,samples_per_pixel = 1024;
  std::vector<Vec3> framebuffer(image_width * image_height);
  Sphere left_wall = {1000.0f, Vec3(-1003.0f, 0.0f, -6.0f), Vec3(0.75f, 0.12f, 0.10f)};
  Sphere right_wall = {1000.0f, Vec3(1003.0f, 0.0f, -6.0f),Vec3(0.12f, 0.45f, 0.12f)};
  Sphere back_wall = {1000.0f, Vec3(0.0f, 0.0f, -1006.0f), Vec3(1.0f, 1.0f, 1.0f)};
  Sphere floor = {1000.0f, Vec3(0.0f, -1002.6f, -6.0f), Vec3(1.0f, 1.0f, 1.0f)};
  Sphere ceiling = {1000.0f, Vec3(0.0f, 1002.6f, -6.0f), Vec3(1.0f, 1.0f, 1.0f)};
  Sphere light = {0.35f, Vec3(0.0f, 2.6f, -4.0f), Vec3(1.0f, 1.0f, 1.0f), true};
  Sphere big_sphere = {1.3f, Vec3(-1.0f, -1.6f, -5.0f), Vec3(1.0f, 1.0f, 1.0f)};
  Sphere small_sphere = {0.8f, Vec3(1.3f, -2.0f, -4.0f), Vec3(1.0f, 1.0f, 1.0f)};
  std::vector<Sphere> spheres = {left_wall,  right_wall,  back_wall,floor,ceiling,light,big_sphere, small_sphere};
  std::cout << "P3\n" << image_width << ' ' << image_height << "\n255\n";
  for (int j = 0; j < image_height; j++) {
    for (int i = 0; i < image_width; i++) {
      Vec3 color;
      for (int s = 0; s < samples_per_pixel; s++) {
        float u = (((double(i) + random_float()) / image_width)-0.5f)*2;
        float v = (((double(j) + random_float()) / image_height)-0.5f)*-2;
        Vec3 ray_direction = normalize(Vec3(u, v, -1));
        Ray ray = Ray(Vec3(), ray_direction);
        color = color + Lo(ray, spheres, 10);
      }
      color = color * (1.0f / samples_per_pixel);
      int ir = static_cast<int>(linear_to_srgb(color.x) * 255.0f);
      int ig = static_cast<int>(linear_to_srgb(color.y) * 255.0f);
      int ib = static_cast<int>(linear_to_srgb(color.z) * 255.0f);
      std::cout << ir << ' ' << ig << ' ' << ib << '\n';
    }
  }
}
```
原仓库：https://github.com/Yang-Junjie/mini_path_tracer