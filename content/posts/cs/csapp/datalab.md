---
date : '2026-07-12T16:39:16+08:00'
draft : false
title : '【CS | CSAPP】DataLab 心路历程'
tags:
  - computer science

categories:
  - blog

math: true
---

因为我不是计算机专业的，可以这么说，我是民计（类似民科），所有计算机相关的内容都是自学的，在看 CSAPP 第二章的时候看得我是异常得痛苦，虽然我能看懂，但是我认为我对数据表示这一块不是很感兴趣，所以看起来有点难受，索性我直接采用探索性学习法，我决定不再看第二章，直接去做第二章的作业，以及DataLab，而我将在探索中学习到这些知识，现在这篇文章是我做DataLab的记录。

> 注：这篇文章句子很乱完全就是我自己的思考过程，没有整理

## bitXor(x,y)

```c
/* 
 * bitXor - x^y using only ~ and & 
 *   Example: bitXor(4, 5) = 1
 *   Legal ops: ~ &
 *   Max ops: 14
 *   Rating: 1
 */
int bitXor(int x, int y) {
  
}
```

只用~和&实现异或运算，
我们首先得搞懂异或运算是什么：不同为 1，相同为0

|  a   |  b   | a^b  |
| :--: | :--: | :--: |
|  0   |  1   |  1   |
|  1   |  0   |  1   |
|  1   |  1   |  0   |
|  0   |  0   |  0   |

所以我们可以这么说

异或运算 是：a b 至少有一个1，并且a b不能同时为1

我们又知道 

且运算是 ：a b 同时为 1

或运算是：a b 至少有一个1

那么异或就可以表示为 (a | b) & ~(a \& b)

但是题目只让我们使用 ~ and & 

所以我们需要用 ~ & 表示 |

既然我们要替换掉 |

我们仔细看看它的真值表

|  a   |  b   | a\|b |
| :--: | :--: | :--: |
|  0   |  1   |  1   |
|  1   |  0   |  1   |
|  1   |  1   |  1   |
|  0   |  0   |  0   |

我们还可以这么描述 | 运算 ：a b 不同时为 0

而我们注意到 且运算是 ：a b 同时为 1

我们尝试将 a b 同时为 1 变为 a b 不同时为 0 

我们尝试给 (a & b) 前面加个 ~ 变成了 ~(a & b) 这表示的是 a b 不同时为 1

接近了 我们想想 a b同时为 0 怎么表示，且运算说的是 a b 同时为 1  

那如果 a 和 b 此时为 0 则 ~a 且 ~b 就是 1了 

所以 最终  ~(~a & ~b) 表示为 a b 不同时为 0

所以最终异或就可以表示为 ~(~a & ~b) & ~(a \& b)

```c
/* 
 * bitXor - x^y using only ~ and & 
 *   Example: bitXor(4, 5) = 1
 *   Legal ops: ~ &
 *   Max ops: 14
 *   Rating: 1
 */
int bitXor(int x, int y) {
    return ~(~x & ~y) & ~(x & y);
}
```

> 同理~(~a | ~b)可以表示 &

由此我们可以总结出德摩根律
$$
\neg (A\wedge B) = \neg A\vee \neg B
$$

$$
\neg(A\vee B) = \neg A \wedge \neg B
$$

## tmin()

```c
/* 
 * tmin - return minimum two's complement integer 
 *   Legal ops: ! ~ & ^ | + << >>
 *   Max ops: 4
 *   Rating: 1
 */
int tmin(void) {

}
```

我们观察一下二进制转补码的公式
$$
B2T_w(\vec{x}) = -x_{w-1}2^{w-1}+\sum_{i=0}^{w-2}x_i2^i
$$
可以看到 $\sum_{i=0}^{w-2}x_i2^i\ge0$ 如果这一项等于0 则函数值最小，即从 $w-2$ 到 $i$ 位上 $x_i$ 都为 0

所以我们需要构造出来这么一个数，第 $w-1$ 位 是1 其他位都是 0，我们可以这么构造 0x1<<(w-1)



所以

```c
/* 
 * tmin - return minimum two's complement integer 
 *   Legal ops: ! ~ & ^ | + << >>
 *   Max ops: 4
 *   Rating: 1
 */
int tmin(void) {
    return 1 << 31;
}
```

## isTmax(x)

```c
/*
 * isTmax - returns 1 if x is the maximum, two's complement number,
 *     and 0 otherwise 
 *   Legal ops: ! ~ & ^ | +
 *   Max ops: 10
 *   Rating: 1
 */
int isTmax(int x) {
 
}
```

这题让我们判断 x 是否是 TMax ，

我们稍微改一下题目，如果仅仅不能用if，以及各种条件判断语句，可以使用 == 则可以这么写

```c
int isTmax(int x){
   return x == INT_MAX;
}
```

但是现在的问题是我们不能用 INT_MAX 也不能用 ==，我们需要用题目给的运算符以及已知量 x 构建出另一个式子，

我们对 x==INT_MAX进行改写，写成x == TMax，这样做是因为我们现在不知道TMax ，TMax是一个未知量，

而我们需要通过一系列等价变形将  x == TMax 变为两边只包含x和运算符的式子，由于x也是变量，最终如果这个式子为真当且仅当 x 的值为TMax，所以我们假设这个式子一直为真，即 x 的值为TMax，我们的目标就是将 x==TMax 变为两边只包含x和运算符的式子，第一个想到的式子就是 TMax + 1 = TMin，这样式子就变为 x+1 == TMin ,然后再利用 TMin == -TMin这个性质，有 x+1 == -(x+1)，但是注意 0 == -0 也有这个性质，所以我们需要判断 (x+1)!=0 

所以我们可以写成这样一个式子 ： ((x+1) == -(x+1)) & ((x+1)!=0)

现在我们唯一要做的就是将 "-","==","!="用题目给的运算负表示，我们知道异或的性质:A^A = 0，(A^B)!=0 ,我们也知道在c语言中 !a 表示 :如果a为0则 !a 为 1，如果 a 不为 0 则 !a 为 0，所以我们可以用!(a^b)表示 a==b这个运算，可以用!!(a) 表示 a!=0这个运算，而根据补码的性质 -x = ~x+1

所以最终我们可以得到：!((x+1) ^ (~(x+1)+1)) & !!(x+1)



```c
/*
 * isTmax - returns 1 if x is the maximum, two's complement number,
 *     and 0 otherwise 
 *   Legal ops: ! ~ & ^ | +
 *   Max ops: 10
 *   Rating: 1
 */
int isTmax(int x) {
 	return !((x+1) ^ (~(x+1)+1)) & !!(x+1);
}
```





# 待更新