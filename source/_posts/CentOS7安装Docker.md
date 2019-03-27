---
title: CentOS7安装Docker
tags:
  - docker
  - mysql
  - rabbitmq
  - redis
  - zookeeper
categories:
  - Linux
author: fantasydream
date: 2019-03-4 10:37:00
description: docker与微服务的相性让他们两个都发展迅速，现在大部分公司都会用docker来部署他们的微服务。而在服务器端，通常公司都会用centos而不是ubuntu，docker在centos上安装是没有Ubuntu便捷的，所以本文就记录一下docker在centos上的安装，以及一些常用软件在docker上的安装，其中在部署软件时，会将数据及配置文件移动到容器外，以方便修改和保存数据。
---
![](https://ws1.sinaimg.cn/large/006WmYZrgy1g0s0ipooj5j30l10eyq6i.jpg)

## 一、安装docker

### 1.检查内核版本

​    Docker要求Linux系统的内核版本高于3.10，所以安装前通过命令检查内核版本, 命令如下

``` shell
uname -r 
```

### 2.更新系统软件

​    更新系统依赖包，以便于Docker的安装

``` shell
sudo yum update 
```

### 3.卸载旧版本docker

​    卸载掉旧版本，以免与新版本冲突

``` shell
sudo yum remove docker  docker-common docker-selinux docker-engine
```

### 4.安装需要的软件包

​    yum-util 提供yum-config-manager功能，另外两个是devicemapper驱动依赖的

``` shell
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
```

### 5.设置docker的yum源

​    用于安装最新版docker

``` shell
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

### 6.安装docker

```shell
sudo yum install docker-ce
```

### 7.启动并加入开机启动

```shell
sudo systemctl start docker
sudo systemctl enable docker
```

### 8.检查是否安装成功

```shell
docker version
```

## 二、Docker常用的一些命令

```shell
// 查看本地所有的镜像
docker images
// 搜索软件镜像
docker search 你要搜索的软件镜像名
// 下载软件镜像,不加版本号则默认为最新版
docker pull 镜像名:版本号 
// 将镜像启动为容器，部分参数在安装mysql时会解释
docker run 镜像名或者镜像id
// 容器的启动，停止，重启
docker start/stop/restart 容器名或者容器id
// 查看运行中的容器
docker ps
// 查看所有容器
docker ps -a
// 删除容器
docker rm 容器名或者容器id
// 删除镜像
docker rmi 镜像id
```

容器与镜像的关系：

镜像类似与oop中的类，而容器的类似与对象，一个镜像可以启动多个容器，只要容器名和映射端口号不同

## 三、Docker安装常用的开发软件

下面的安装基本都将软件的数据和配置放到主机上，便于修改配置和备份

### 1.安装mysql

（1）创建目录用于存储mysql的文件和配置

创建文件夹
```shell
mkdir /docker
mkdir /docker/mysql
mkdir /docker/mysql/data
mkdir /docker/mysql/mysql-files //安装mysql8.0才需要这个文件夹，5.7不需要
```
创建配置文件
```shell
vim /docker/mysql/my.cnf
```
编辑配置文件
``` shell
[mysqld]
user=mysql
character-set-server=utf8
default_authentication_plugin=mysql_native_password
table_definition_cache=400
[client]
default-character-set=utf8
[mysql]
default-character-set=utf8
```

（2） 安装最新版MySQL

```shell
docker run -d --privileged=true -p 3306:3306 -v /docker/mysql/my.cnf:/etc/mysql/my.cnf -v /docker/mysql/data:/var/lib/mysql -v /docker/mysql/mysql-files:/var/lib/mysql-files -e MYSQL_ROOT_PASSWORD=yourpassword --name mysql mysql:latest
```

这样mysql最新版的docker容器就安装成功了。

（3）若想要自定义安装版本，可以这样

```shell
docker pull mysql:5.7 //5.7可替换为自己想要的版本
docker run -d --privileged=true -p 3306:3306 -v /docker/mysql/my.cnf:/etc/mysql/my.cnf -v /docker/mysql/data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=yourpassword --name mysql mysql:5.7
```

（4）run部分命令参数解释

```shell
-d // 以守护进程方式运行
-privileged=true // 让docker容器的内部root用户拥有真正的root权限
-p // 映射端口号
-v // 映射容器内的文件夹到宿主机的文件夹
--name //给容器取名
```

（5）进入容器内部操作

```shell
docker exec -it mysql bash // mysql为镜像名，bash为进去要操作的见面
mysql -u root -p 
// 输入你设置的密码
// 即可进入数据库
// 也可以直接使用navicat等工具进行连接，记得ip填写你的服务器公网ip
```

### 2.安装redis

（1）创建文件夹存储redis 的配置文件和持久化数据

```shell
mkdir /docker/redis
mkdir /docker/redis/data
wget https://raw.githubusercontent.com/antirez/redis/4.0/redis.conf -O /docker/redis/redis.conf
vim /docker/redis/redis.conf
// 将"logfile "" " 改为 "logfile "access.log" "
// 将"bind 127.0.0.1" 改为 "# bind 127.0.0.1"
// 将"appendonly no" 改为 "appendonly yes" 
// 将"# requirepass foobared" 改为 "requirepass 你的密码"
// 修改后即可开启远程连接和密码验证
```

（2）安装最新版redis

```shell
docker run -d --privileged=true -p 6379:6379 -v /docker/redis/redis.conf:/etc/redis/redis.conf -v /docker/redis/data:/data --name redis redis:latest redis-server /etc/redis/redis.conf
```

（3） 进入容器内部操作

``` shell
//进入容器内部
docker exec -it redis bash
// 连接redis
redis-cli -h 127.0.0.1 -p 6379 -a 你的密码 
// 测试
ping
// 返回 pong 就成功了
```

### 3.安装rabbitmq

（1）同样，先创建文件夹用于将rabbitmq的数据放到主机上

```shell
mkdir /docker/rabbitmq
mkdir /docker/rabbitmq/data
wget https://raw.githubusercontent.com/rabbitmq/rabbitmq-server/master/docs/rabbitmq.conf.example -O /docker/rabbitmq/rabbitmq.conf
```

（2）安装rabbitmq，安装的是3.7.8的rabbitmq的带web管理界面的版本，是目前为止的最新版

``` shell
docker run -d --privileged=true -p 15672:15672 -p 5672:5672 -v /docker/rabbitmq/data:/var/rabbitmq/lib -v /docker/rabbitmq/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf --name rabbitmq rabbitmq:3.7.8-management
```

（3）进入rabbitmq容器中增加一个管理员用户，因为guest用户在默认配置下不能用外部ip登陆

``` shell
docker exec -it rabbitmq bash
# 这里的admin可以替换成你的用户名和密码
rabbitmqctl add_user admin admin
rabbitmqctl set_user_tags admin administrator
```

（4）用web界面配置

打开浏览器， 输入http://你的ip:15672，输入用户名和密码，进去后可以添加用户和设置权限

### 4.安装mongo

（1）还是创建文件夹

```shell
mkdir /docker/mongo
mkdir /docker/mongo/data
```

（2）安装最新版mongodb

``` shell
docker run -d --privileged=true -p 27017:27017 -v /docker/mongo/data:/data/db --name mongo mongo:latest
```

（3）进入mongo容器，进行简单设置

``` shell
docker exec -it mongo bash
mongo
use admin
db.createUser({ user: 'root', pwd: '你的密码', roles: [ { role: "userAdminAnyDatabase", db: "admin" } ] })
//之后即可在连接工具输入相应参数连接
```

### 5.安装zookeeper

（1）创建文件夹和配置文件

``` shell
mkdir /docker/zookeeper
mkdir /docker/zookeeper/data
vim /docker/zookeeper/zoo.cfg
//将下面的内容输入到文件中
clientPort=2181
dataDir=/data
dataLogDir=/datalog
tickTime=2000
initLimit=5
syncLimit=2
autopurge.snapRetainCount=3
autopurge.purgeInterval=0
maxClientCnxns=60
```

（2）安装zookeeper

```shell
docker run -d --privileged=true -p 2181:2181 -v /docker/zookeeper/zoo.cfg:/conf/zoo.cfg -v /docker/zookeeper/data:/data --name zookeeper zookeeper:latest
```

