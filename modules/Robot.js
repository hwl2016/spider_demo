/**
 * 网页爬虫
 */

var File = require("./File.js");
var URL = require("./URL.js");
var http = require("http");
var https = require("https");
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var BufferHelper = require("bufferhelper");
var request = require('request');

var oResult = {
    aNewURLQueue: [],//尚未执行爬取任务的队列
    aOldURLQueue: [],//已完成爬取任务的队列
    aTargetURLList: [],//目标对象URL集合
    oTargetInfoList: {},//目标对象集合
    oRetryCount:{},//失败重试记录
    iCount:0,//爬取url总数
    iSuccessNum:0//爬取成功数
};

/**
 * 爬虫程序主体
 * @param options
 * @constructor
 */
var Robot= function(options) {
    var self = this;
    this.domain = options.domain || "";//需要爬取网站的域名
    this.firstUrl = options.firstUrl || "";//需要爬取网站的url
    this.id = this.constructor.create();//唯一标识符
    this.encoding = options.encoding || "UTF-8";//页面编码
    this.outputPath = options.outputPath|| "";//爬取内容存放路径
    this.outputFileName = options.outputFileName|| "result.txt";//结果保存文件名
    this.timeout = options.timeout || 5000;//超时时间
    this.retryNum = options.retryNum || 5;//失败重试次数
    this.robots = options.robots || true;//是否读取robots.txt文件
    this.debug = options.debug || false;//是否开启调试模式

    this.file = new File({
        path:this.outputPath,
        filename:this.outputFileName
    });

    oResult.aNewURLQueue.push(this.firstUrl);//将第一个url添加进队列之中

    this.handlerComplete = options.handlerComplete || function() {//队列中所有的url均抓取完毕时执行回调
            console.log("抓取结束...");
            var str = "", i = 0, len = oResult.aTargetURLList.length;
            for(i=0;i<len;i++){
                url = oResult.aTargetURLList[i];
                str += "（"+oResult.oTargetInfoList[url].name+"） : "+url+"\n"
            }
            this.file.save(str, true);
            this.file.save("\n抓取完成...\n", true);
        };

    this.disAllowArr= [];//不允许爬取路径
    var robotsURL = this.firstUrl + "robots.txt";
    request(robotsURL, function(error, response, body){
        if(!error && response.statusCode == 200) {
            this.disAllowArr = self.parseRobots(body);
        }
    });
};

//默认唯一标识
Robot.id= 1;

/**
 * 累加唯一标识
 * @returns {number}
 */
Robot.create= function() {
    return this.id++;
};

/**
 * 解析robots.txt
 * @param str
 * @returns [Array]
 */
Robot.prototype.parseRobots = function(str){
    var line = str.split("\r\n");
    var i= 0, len=line.length, arr = [];
    for(i=0;i<len;i++){
        if(line[i].indexOf("Disallow:") != -1){
            arr.push(line[i].split(":")[1].trim())
        }
    }
    return arr;
};

/**
 * 判断当前路径是否允许爬取
 * @param url
 * @returns {boolean}
 */
Robot.prototype.isAllow = function(url){
    var i = 0, len = this.disAllowArr.length;
    for(i=0;i<len;i++){
        if(url.toLowerCase().indexOf(this.disAllowArr[i].toLowerCase()) != -1){
            return false;
        }
    }
    return true;
};

/**
 * 开启爬虫任务
 */
Robot.prototype.go = function(callback) {
    var url = "";
    if(oResult.aNewURLQueue.length > 0){
        url = oResult.aNewURLQueue.pop();
        if(this.robots && this.isAllow(url)){
            this.send(url, callback);
            oResult.iCount++;
            oResult.aOldURLQueue.push(url);
        }else{
            console.log("禁止爬取页面："+url);
        }
    }else{
        this.handlerComplete.call(this, oResult, this.file);
    }
};

/**
 * 发送请求
 * @param url   请求链接
 * @param callback  请求网页成功回调
 */
Robot.prototype.send= function(url, callback){
    var self = this;
    var timeoutEvent;//由于nodejs不支持timeout,所以，需要自己手动实现
    var req = '';
    if(url.indexOf("https") > -1){
        req = https.request(url);
    }else {
        req = http.request(url);
    }

    timeoutEvent = setTimeout(function() {
        req.emit("timeout");
    }, this.timeout);

    req.on('response', function(res){
        var aType = self.getResourceType(res.headers["content-type"]);
        var bufferHelper = new BufferHelper();

        if(aType[2] !== "binary"){

        }else {
            res.setEncoding("binary");
        }

        res.on('data',function(chunk){
            bufferHelper.concat(chunk);
        });

        res.on('end',function(){//获取数据结束
            clearTimeout(timeoutEvent);

            self.debug && console.log("\n抓取URL:"+url+"成功\n");

            //将拉取的数据进行转码，具体编码跟需爬去数据的目标网站一致
            data = iconv.decode(bufferHelper.toBuffer(), self.encoding);

            //触发成功回调
            self.handlerSuccess(data, aType, url, callback);

            //回收变量
            data = null;
        });

        res.on('error',function(){
            clearTimeout(timeoutEvent);
            self.handlerFailure(url);
            self.debug&& console.log("服务器端响应失败URL:"+url+"\n");
        });

    }).on('error',function(err){
        clearTimeout(timeoutEvent);
        self.handlerFailure(url);
        self.debug && console.log("\n抓取URL:"+url+"失败\n");
    }).on('finish', function(){//调用END方法之后触发
        self.debug && console.log("\n开始抓取URL:"+url+"\n");
    });
    req.on("timeout",function() {
        //对访问超时的资源，进行指定次数的重新抓取，当抓取次数达到预定次数后将不在抓取改url下的数据
        if(oResult.oRetryCount[url] == undefined){
            oResult.oRetryCount[url] = 0;
        }else if(oResult.oRetryCount[url] != undefined && oResult.oRetryCount[url] < self.retryNum){
            oResult.oRetryCount[url]++;
            console.log("请求超时，调度到队列最后...");
            oResult.aNewURLQueue.unshift(url);
        }
        if(req.res) {
            req.res.emit("abort");
        }

        req.abort();
    });

    req.end();//发起请求
};

/**
 * 修改初始化数据，须在调用go方法前使用方能生效
 * @param options
 */
Robot.prototype.setOpt= function(options){

    this.domain= options.domain|| this.domain||"";//需要爬取网站的域名
    this.firstUrl= options.firstUrl|| this.firstUrl|| "";//需要爬取网站的url
    this.id= this.constructor.create();//唯一标识符
    this.encoding= options.encoding|| this.encoding|| "UTF-8";//页面编码
    this.outputPath= options.outputPath|| this.outputPath|| "";//爬取内容存放路径
    this.outputFileName= options.outputFileName|| this.outputFileName|| "result.txt";//结果保存文件名
    this.timeout= options.timeout|| this.timeout|| 5000;//超时时间
    this.retryNum= options.retryNum|| this.retryNum|| 5;//失败重试次数
    this.robots= options.robots|| this.robots|| true;//是否读取robots.txt文件
    this.debug= options.debug|| this.debug|| false;//是否开启调试模式

    this.file= newFile({
        path:this.outputPath,
        filename:this.outputFileName
    });

    oResult.aNewURLQueue.push(this.firstUrl);//将第一个url添加进队列之中

    this.handlerComplete= options.handlerComplete|| this.handlerComplete|| function(){
        console.log("抓取结束...");
        var str = "", i=0, len=oResult.aTargetURLList.length;

        for(i = 0; i < len; i++){
            url = oResult.aTargetURLList[i];
            str +="（"+oResult.oTargetInfoList[url].name+"） : "+url+"\n"
        }
        this.file.save(str,true);
        this.file.save("\n抓取完成...\n",true);
    };
};

/**
 * 数据拉取成功回调
 * @param data  拉取回来的数据
 * @param aType 数据类型
 * @param url   访问链接
 * @param callback  用户给定访问成功回调，抛出给用户做一些处理
 */
Robot.prototype.handlerSuccess= function(data, aType, url, callback){
    if(callback){
        var $ = cheerio.load(data);
        callback.call(this, $, aType, url, oResult.aNewURLQueue, oResult.aTargetURLList, oResult.oTargetInfoList);
        oResult.iSuccessNum++;
        this.go(callback);
    }else{
        this.go();
    }
};

/**
 * 失败后继续执行其他爬取任务
 * @param url
 */
Robot.prototype.handlerFailure= function(url){
    //oResult.aNewURLQueue.indexOf(url)==-1&&oResult.aNewURLQueue.unshift(url);
    this.go();
};

/**
 * @desc 判断请求资源类型
 * @param string  Content-Type头内容
 * @return [大分类,小分类,编码类型] ["image","png","utf8"]
 */
Robot.prototype.getResourceType= function(type){
    if(!type){
        return '';
    }
    var aType = type.split('/');
    aType.forEach(function(s,i,a){
        a[i] = s.toLowerCase();
    });
    if(aType[1] && (aType[1].indexOf(';') > -1)){
        var aTmp = aType[1].split(';');
        aType[1] = aTmp[0];
        for(var i = 1; i < aTmp.length; i++){
            if(aTmp[i] && (aTmp[i].indexOf("charset") > -1)){
                var aTmp2 = aTmp[i].split('=');
                aType[2] = aTmp2[1] ? aTmp2[1].replace(/^\s+|\s+$/,'').replace('-','').toLowerCase() : '';
            }
        }
    }
    if((["image"]).indexOf(aType[0]) > -1){
        aType[2] = "binary";
    }
    return aType;
};

module.exports = Robot;