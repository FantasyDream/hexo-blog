---
title: Redis主从搭建及配置
date: 2019-03-04 17:10:01
categories: Linux
tags: redis
author: fantasydream
description: redis是一个基于内存的nosql数据库，其超快的读写速度和支持多种数据结构的特性使其很快就在web后端流行起来，一般是用于缓存不频繁更改的数据和存储经常变动的数据，但因为其基于内存，其实还是有抽风的时候，所以一般会组成主从或者集群来使用，这篇文章讲的就是redis主从配置和哨兵配置，哨兵可以在主redis挂了时自动推选出新的主redis来使用。
---

## 下载

自己寻找要用的redis版本进行下载，我这边使用的是3.2.9版本

## 安装

```sh
tar zxvf redis-3.2.9.tar.gz
mkdir redis
mv redis-3.2.9 /usr/local/redis
make
make install
cd /usr/local/redis
```

## 配置

```shell
vim /usr/local/redis/redis.conf
# 修改如下配置
daemonize yes
protectmode no
```

## 运行

```shell
# 运行redis-server
bash /usr/local/redis/bin/redis-server ../redis.conf
# 连接server，之后就能对redis进行存取
bash /usr/local/redis/bin/redis-cli
```

## 主从

```shell
# 编辑 从redis 的服务器上的redis.conf
slaveof 主服务器ip 6379
```

在主服务器上插入一条数据，检查从服务器上有没有该数据几个检验是否配置成功

## 哨兵

```shell
vim /usr/local/redis/sentinel.conf
# 配置如下信息
sentinel monitor mymaster 主redis的ip 6379 2

# 每个Sentinel节点都要定期PING命令来判断Redis数据节点和其余Sentinel节点是否可达，如果超过30000毫秒且没有回复，则判定不可达
sentinel down-after-milliseconds mymaster 30000

# 当Sentinel节点集合对主节点故障判定达成一致时，Sentinel领导者节点会做故障转移操作，选出新的主节点，原来的从节点会向新的主节点发起复制操作，限制每次向新的主节点发起复制操作的从节点个数为1
sentinel parallel-syncs mymaster 1

# 故障转移超时时间为180000毫秒
sentinel failover-timeout mymaster 180000

# 启动
/usr/local/redis/bin/redis-sentinel ../sentinel.conf
# 查看哨兵信息
redis-cli -h 127.0.0.1 -p 26379 INFO Sentinel
```

在两台redis服务器上都配置一下哨兵，其中配置信息中的 mymaster可以当成集群名来使用，用于tomcat session共享
