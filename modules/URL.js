/**
 * URL处理类
 */
var urlUtil = require("url");
var pathUtil = require("path");

var URL= function(){};

/**
 * @desc 获取URL地址 路径部分 不包含域名以及QUERYSTRING
 * @param string url
 * @return string
 */
URL.getUrlPath= function(url){

    if(!url){
        return '';
    }
    var oUrl = urlUtil.parse(url);
    if(oUrl["pathname"] && (/\/$/).test(oUrl["pathname"])){
        oUrl["pathname"] += "index.html";
    }
    if(oUrl["pathname"]){
        return oUrl["pathname"].replace(/^\/+/,'');
    }
    return '';

};

/**
 * @desc 判断是否是合法的URL地址一部分
 * @param string urlPart
 * @return boolean
 */
URL.isValidPart= function(urlPart){
    if(!urlPart){
        return false;
    }
    if(urlPart.indexOf("javascript") > -1){
        return false;
    }
    if(urlPart.indexOf("mailto") > -1){
        return false;
    }
    if(urlPart.charAt(0) === '#'){
        return false;
    }
    if(urlPart ==='/'){
        return false;
    }
    if(urlPart.substring(0,4) === "data"){//base64编码图片
        return false;
    }
    return true;
};

/**
 * @desc 修正被访问地址分析出来的URL 返回合法完整的URL地址
 * @param string url 访问地址
 * @param string url2 被访问地址分析出来的URL
 * @return string || boolean
 */
URL.prototype.fix= function(url, url2){
    if(!url || !url2){
        return false;
    }
    var oUrl = urlUtil.parse(url);
    if(!oUrl["protocol"] || !oUrl["host"] || !oUrl["pathname"]){//无效的访问地址
        return false;
    }
    if(url2.substring(0,2) === "//"){
        url2 = oUrl["protocol"]+url2;
    }
    var oUrl2 = urlUtil.parse(url2);
    if(oUrl2["host"]){
        if(oUrl2["hash"]){
            delete oUrl2["hash"];
        }
        return urlUtil.format(oUrl2);
    }
    var pathname = oUrl["pathname"];
    if(pathname.indexOf('/') > -1){
        pathname = pathname.substring(0,pathname.lastIndexOf('/'));
    }
    if(url2.charAt(0) === '/'){
        pathname = '';
    }
    url2 = pathUtil.normalize(url2);//修正 ./ 和 ../
    url2 = url2.replace(/\\/g,'/');
    while(url2.indexOf("../") > -1){//修正以../开头的路径
        pathname = pathUtil.dirname(pathname);
        url2 = url2.substring(3);
    }
    if(url2.indexOf('#') > -1){
        url2 = url2.substring(0,url2.lastIndexOf('#'));
    }else if(url2.indexOf('?') >　-1){
        url2 = url2.substring(0,url2.lastIndexOf('?'));
    }
    var oTmp = {
        "protocol": oUrl["protocol"],
        "host": oUrl["host"],
        "pathname": pathname +'/' + url2
    };
    return urlUtil.format(oTmp);
};

module.exports = URL;