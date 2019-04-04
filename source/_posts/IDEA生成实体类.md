---
title: IDEA编写groovy脚本生成实体类
author: fantasydream
date: 2019-03-30 13:14:20
tags:
 -Java
categories: Java
description: mybatis是我们开发中比较常用的orm框架，但它不像hibernate那样可以直接从数据库生成实体类，只能借助mybatis-generator这样的工具，还是有些不方便的。虽然IDEA的数据库工具可以生成实体类，但并不符合我们的需求，例如字段的属性都是基本类型，而不是包装类型，package是固定的等。而IDEA的生成工具使用groovy编写的脚本，并且能看到源码，这为我们编写自己的实体生成工具提供了摸板。
---

## 一、在IDEA中连接数据库

### 1.点击idea右侧的数据库工具,并点击 + 号

![](https://ws1.sinaimg.cn/large/006WmYZrly1g1ks36ivbmj309d0edglr.jpg)

### 2.选择mysql并在弹出的窗口中填写数据库连接信息



![](https://ws1.sinaimg.cn/large/006WmYZrly1g1ks3h3sgjj30m80hzgmo.jpg)

## 二、编写脚本

### 1.跳转到脚本存放的目录

在右侧数据库中随便右击一张表，按途中所示点击，点击后左侧项目会有一个高亮目录

![](https://ws1.sinaimg.cn/large/006WmYZrly1g1ks424kz3j30c90co0t7.jpg)

### 2.编写我们自己的groovy脚本

 右击新建脚本，然后将下方代码复制进去，可根据自己需要修改

``` groovy
import com.intellij.database.model.DasTable
import com.intellij.database.model.ObjectKind
import com.intellij.database.util.Case
import com.intellij.database.util.DasUtil

import java.text.SimpleDateFormat

/*
 * Available context bindings:
 *   SELECTION   Iterable<DasObject>
 *   PROJECT     project
 *   FILES       files helper
 */
packageName = ""
typeMapping = [
        (~/(?i)tinyint|smallint|mediumint/)      : "Integer",
        (~/(?i)int/)                             : "Long",
        (~/(?i)bool|bit/)                        : "Boolean",
        (~/(?i)float|double|decimal|real/)       : "Double",
        (~/(?i)datetime|timestamp|date|time/)    : "Date",
        (~/(?i)blob|binary|bfile|clob|raw|image/): "InputStream",
        (~/(?i)/)                                : "String"
]


FILES.chooseDirectoryAndSave("Choose directory", "Choose where to store generated files") { dir ->
    SELECTION.filter { it instanceof DasTable && it.getKind() == ObjectKind.TABLE }.each { generate(it, dir) }
}

def generate(table, dir) {
    def className = javaClassName(table.getName(), true)
    def fields = calcFields(table)
    packageName = getPackageName(dir)
    PrintWriter printWriter = new PrintWriter(new OutputStreamWriter(new FileOutputStream(new File(dir, className + ".java")), "UTF-8"))
    printWriter.withPrintWriter { out -> generate(out, className, fields, table) }

//    new File(dir, className + ".java").withPrintWriter { out -> generate(out, className, fields,table) }
}

// 获取包所在文件夹路径
def getPackageName(dir) {
    return dir.toString().replaceAll("\\\\", ".").replaceAll("/", ".").replaceAll("^.*src(\\.main\\.java\\.)?", "") + ";"
}

def generate(out, className, fields, table) {
    out.println "package $packageName"
    out.println ""
    out.println "import java.io.Serializable;"
    out.println "import lombok.Getter;"
    out.println "import lombok.Setter;"
    out.println "import lombok.ToString;"
    Set types = new HashSet()

    fields.each() {
        types.add(it.type)
    }

    if (types.contains("Date")) {
        out.println "import java.util.Date;"
    }

    out.println ""
    out.println "/**\n" +
            " * @Description  \n" +
            " * @Author  Hunter\n" +
            " * @Date " + new SimpleDateFormat("yyyy-MM-dd").format(new Date()) + " \n" +
            " */"
    out.println ""
    out.println "@Setter"
    out.println "@Getter"
    out.println "@ToString"
    out.println "public class $className  implements Serializable {"
    out.println ""
    out.println genSerialID()
    fields.each() {
        out.println ""
        // 输出注释
        if (isNotEmpty(it.commoent)) {
            out.println "\t/**"
            out.println "\t * ${it.commoent.toString()}"
            out.println "\t */"
        }

        // 输出成员变量
        out.println "\tprivate ${it.type} ${it.name};"
    }
    out.println ""
    out.println "}"
}

def calcFields(table) {
    DasUtil.getColumns(table).reduce([]) { fields, col ->
        def spec = Case.LOWER.apply(col.getDataType().getSpecification())

        def typeStr = typeMapping.find { p, t -> p.matcher(spec).find() }.value
        def comm = [
                colName : col.getName(),
                name    : javaName(col.getName(), false),
                type    : typeStr,
                commoent: col.getComment(),
                annos   : "\t@Column(name = \"" + col.getName() + "\" )"]
        if ("id".equals(Case.LOWER.apply(col.getName())))
            comm.annos += ["@Id"]
        fields += [comm]
    }
}

// 处理类名（这里是因为我的表都是以t_命名的，所以需要处理去掉生成类名时的开头的T，
// 如果你不需要那么请查找用到了 javaClassName这个方法的地方修改为 javaName 即可）
def javaClassName(str, capitalize) {
    def s = com.intellij.psi.codeStyle.NameUtil.splitNameIntoWords(str)
            .collect { Case.LOWER.apply(it).capitalize() }
            .join("")
            .replaceAll(/[^\p{javaJavaIdentifierPart}[_]]/, "_")
    // 去除开头的T  http://developer.51cto.com/art/200906/129168.htm
    s = s[1..s.size() - 1]
    capitalize || s.length() == 1 ? s : Case.LOWER.apply(s[0]) + s[1..-1]
}

def javaName(str, capitalize) {
    def s = com.intellij.psi.codeStyle.NameUtil.splitNameIntoWords(str)
            .collect { Case.LOWER.apply(it).capitalize() }
            .join("")
            .replaceAll(/[^\p{javaJavaIdentifierPart}[_]]/, "_")
    capitalize || s.length() == 1 ? s : Case.LOWER.apply(s[0]) + s[1..-1]
}

def isNotEmpty(content) {
    return content != null && content.toString().trim().length() > 0
}

static String changeStyle(String str, boolean toCamel) {
    if (!str || str.size() <= 1)
        return str

    if (toCamel) {
        String r = str.toLowerCase().split('_').collect { cc -> Case.LOWER.apply(cc).capitalize() }.join('')
        return r[0].toLowerCase() + r[1..-1]
    } else {
        str = str[0].toLowerCase() + str[1..-1]
        return str.collect { cc -> ((char) cc).isUpperCase() ? '_' + cc.toLowerCase() : cc }.join('')
    }
}

static String genSerialID() {
    return "\tprivate static final long serialVersionUID =  " + Math.abs(new Random().nextLong()) + "L;"
}
```

保存

### 3.查看效果

此时再次右击表，就可看到我们的脚本了

![](https://ws1.sinaimg.cn/large/006WmYZrly1g1krn0hzsyj30cm0bz0t5.jpg)

生成的效果如下

![](https://ws1.sinaimg.cn/large/006WmYZrly1g1ks4buf8mj30kp0nzdgv.jpg)

