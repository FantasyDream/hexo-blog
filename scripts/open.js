var exec = require('child_process').exec;

// Hexo 3 复制这段
hexo.on('new', function(data){
  let path = data.path.replace("/mnt/c","");
  exec("typora.exe "+ path);
});