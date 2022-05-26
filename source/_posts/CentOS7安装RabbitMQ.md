---
title: CentOS7安装RabbitMQ
author: fantasydream
date: 2019-03-06 14:37:00
tags:
  - rabbitmq
categories:
  - Linux
description: RabbitMQ是由spring的开发团队Pivotal用erlang语言编写的一款消息队列。其功能丰富，支持很多插件，spring也对其无缝支持，可以很方便的在spring项目中使用该队列，所以很受市场欢迎。但其在centos上的安装还是有些复杂的，网上的教程也都不一样，我找到了一篇相对简单的安装流程，分享出来
---

## 下载

https://www.lanzous.com/i2ym3xe

下载后解压出两个文件，传到服务器上

## 安装

```shell
yum install erlang-20.3.8.17-1.el6.x86_64.rpm
yum installrabbitmq-server-3.7.10-1.el6.noarch.rpm
```

## 配置

```shell
#开启web管理插件
rabbitmq-plugins enable rabbitmq_management
#启动服务
service rabbitmq-server start

#添加用户和删除guest
rabbitmqctl add_user admin 123456abc
rabbitmqctl set_user_tags admin administrator
rabbitmqctl delete_user guest
rabbitmqctl set_permissions -p "/" admin ".*" ".*" ".*"
```

## 验证

浏览器访问 http://你的ip:15672

输入admin 123456abc 即可访问
