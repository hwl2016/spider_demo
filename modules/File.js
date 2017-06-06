/**
 * 文件处理类
 */
var fs = require('fs'),//文件操作
    mkdirp = require("mkdirp");//目录操作

var File= function(options) {
    this.path = options.path || "";
    this.filename = options.filename || "";
    this.encoding = options.encoding || "UTF-8";
};

/**
 * 修改文件内容并保存
 * @param content   文件内容
 * @param bAppend   是否追加模式
 * @param encoding  文件编码，默认为UTF-8
 */
File.prototype.save= function(content,bAppend,encoding) {
    var self = this;
    var buffer = new Buffer(content, encoding || self.encoding);

    var doFs = function () {
        fs.open(self.path + self.filename, bAppend ? 'a': 'w', "0666", function (err,fd) {
            if(err) {
                throw err;
            }
            var cb2 = function (err) {
                if(err){
                    throw err;
                }

                fs.close(fd, function(err){
                    if(err){
                        throw err;
                    }
                    console.log('文件成功关闭...');
                })
            };
            fs.write(fd, buffer, 0, buffer.length, 0, cb2);
        });

    };

    fs.exists(self.path, function (exists) {
        if(!exists) {
            self.mkdir(self.path, "0666", function () {
                doFs();
            });
        }else {
            doFs();
        }
    });

};

/**
 * 递归创建目录
 * @param path      目录路径
 * @param mode      模式  默认使用 0666
 * @param fn        回调
 * @param prefix    父级菜单
 */
File.prototype.mkdir= function(path, mode, fn, prefix) {

    var sPath = path.replace(/\\+/g,'/');
    var aPath = sPath.split('/');
    prefix = prefix ||'';
    sPath = prefix + aPath.shift();
    var self = this;
    var cb =function () {
        fs.mkdir(sPath, mode, function (err) {
            if((!err) || ( ([47,-4075]).indexOf(err["errno"]) > -1 )) {//创建成功或者目录已存在
                if(aPath.length> 0) {
                    self.mkdir(aPath.join('/'), mode, fn, sPath.replace(/\/$/,'') +'/');
                }else {
                    fn();
                }
            }else {
                console.log(err);
                console.log('创建目录:'+ sPath + '失败');
            }
        });
    };
    fs.exists(sPath, function (exists) {
        if(!exists) {
            cb();
        }else if (aPath.length> 0) {
            self.mkdir(aPath.join('/'), mode, fn, sPath.replace(/\/$/,'') +'/');
        }else {
            fn();
        }
    });

};

module.exports = File;