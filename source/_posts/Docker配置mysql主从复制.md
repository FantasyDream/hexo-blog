---
title: Docker配置mysql主从复制
date: 2019-03-05 14:46:22
tags: 
  - docker
  - mysql
categories:
  - Linux
author: fantasydream
description: 随着docker在微服务中的流行，现在的大部分中间件也开始部署在docker中。docker部署这些中间件时是不需要考虑系统环境因素的，只需几行简单的命令，就能部署完成一个软件。但同时也会带来一些其他的麻烦，比如中间件的数据会存储在容器中，这样容器一销毁就会导致数据丢失，还有就是容器间的通讯也是问题。好在docker都有给出很方便的解决方案，是我们更好的享受便利。本文就会借着mysql在docker中的主从配置来讲解如何将数据存储在容器外和容器之间的通讯
---

## 1.创建文件夹和配置文件

(1)创建主数据库文件夹及配置文件

```sh
mkdir /docker
mkdir /docker/mysql
mkdir /docker/mysql/{master,slave}
// 主库配置
mkdir /docker/mysql/master/data
mkdir /docker/mysql/master/mysql-files
vim /docker/mysql/master/my.cnf
// 下面的内容填入my.cnf
[mysqld]
user=mysql
log-bin=mysql-bin
server-id=11
character-set-server=utf8
default_authentication_plugin=mysql_native_password
table_definition_cache=400
[client]
default-character-set=utf8
[mysql]
default-character-set=utf8
```

(2)创建从数据库文件夹及配置文件

```sh
// 从库配置
mkdir /docker/mysql/slave/data
mkdir /docker/mysql/slave/mysql-files
vim /docker/mysql/slave/my.cnf
// 下面的内容填入my.cnf
[mysqld]
user=mysql
log-bin=mysql-bin
server-id=22
character-set-server=utf8
default_authentication_plugin=mysql_native_password
table_definition_cache=400
[client]
default-character-set=utf8
[mysql]
default-character-set=utf8
```

## 2.创建docker 桥接网络，用于MySQL主从容器之间互联

```shell
docker network create mysql
```

## 3.创建mysql容器
创建mysql主数据库容器

```sh
docker run -d --privileged=true -p 3306:3306 -v /docker/mysql/master/my.cnf:/etc/mysql/my.cnf -v /docker/mysql/master/data:/var/lib/mysql -v /docker/mysql/master/mysql-files:/var/lib/mysql-files -e MYSQL_ROOT_PASSWORD=123456 --name mysql-master --network mysql --network-alias mysql-master mysql:latest
```
创建mysql从数据库容器
``` shell
docker run -d --privileged=true -p 3307:3306 -v /docker/mysql/slave/my.cnf:/etc/mysql/my.cnf -v /docker/mysql/slave/data:/var/lib/mysql -v /docker/mysql/slave/mysql-files:/var/lib/mysql-files -e MYSQL_ROOT_PASSWORD=123456 --name mysql-slave --network mysql --network-alias mysql-slave mysql:latest
```

## 4.配置mysql主从复制

(1)配置主服务器:

``` shell
docker exec -it mysql-master bash

mysql -uroot -p
// 输入密码

// 我这里用root用户来进行主从复制,也可以自己创建新用户来替换掉
// '%' 代表所有ip都能来复制,可以改成从自己的ip来提高安全性
GRANT REPLICATION SLAVE ON *.* TO 'root'@'%';

// 刷新权限
flush privileges;

// 查看主服务器状态
show master status;
// 记住其中的File Position 列的内容

// 退出mysql
exit;

// 退出mysql容器
exit
```

(2)配置从服务器:

``` shell
// 进入MySQL从数据库容器
docker exec -it mysql-slave bash

mysql -uroot -p
// 输入密码

change master to master_host='mysql-master',master_user='root',master_password='123456',master_log_file='刚才记住的File列的内容',master_log_pos=position的内容(不用加引号),master_port=3306;

// 启动slave
start slave;

// 查看slave状态
show slave status\G;
```

当 Slave_IO_Running , Slave_SQL_Running 都为yes时代表配置成功

## 5.验证

去主库做一些操作,看看从库是否会同步更新,如果用的是一些图形化管理工具,记得点一下刷新

## 6.关于非docker环境下的主从复制配置

只需不执行关于docker的命令就可