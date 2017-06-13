var urlUtil = require('url');
var cheerio = require('cheerio');
var request = require('request');
var http = require("http");
var https = require("https");
var BufferHelper = require("bufferhelper");
var iconv = require('iconv-lite');
var log = require('./log');
// var log = require('./MDB');

var oResult = {
    aNewURLQueue: [],//尚未执行爬取任务的队列
    aOldURLQueue: [],//已完成爬取任务的队列
    aTargetURLList: [],//目标对象URL集合
    oTargetInfoList: {},//目标对象集合
    oRetryCount:{},//失败重试记录
    iCount:0,//爬取url总数
    iSuccessNum:0//爬取成功数
};

function Crawler(option) {
	this.website = option.website || null;	//爬取的网站

	this.encoding = option.encoding || 'UTF-8';

	this.timeout = option.timeout || 5000;

	this.retryNum = option.retryNum || 3;

	this.cb = option.cb || function() {
		log.logger.info('crawler...');
	}

	// this.start();

}

Crawler.prototype = {
	start: function() {
		if(this.website) {
			this.getResource(this.website, this.cb);
		}
	},
	getResource: function(url, cb) {
		var _this = this;
		var req = '';
		if(url.indexOf('https') !== -1) {
			req = https.request(url);
		}else {
			req = http.request(url);
		}

		var timeoutEvent = setTimeout(function() {
	        req.emit("timeout");
	    }, this.timeout);

		req.on('response', (res) => {
			var aType = _this.getResourceType(res.headers["content-type"]);
			var bufferHelper = new BufferHelper();

			if(aType[2] == "binary"){
				res.setEncoding("binary");
			}

			res.on('data', (chunk) => {
				bufferHelper.concat(chunk);
			});
			res.on('end', () => {
				clearTimeout(timeoutEvent);
				var d = iconv.decode(bufferHelper.toBuffer(), _this.encoding);
				var $ = cheerio.load(d);
	            cb($, d);
	            var d = null;
	            log.logger.info(`请求：${url} 成功`);
			});
			res.on('error', () => {
				clearTimeout(timeoutEvent);
				_this.start();
				log.logger.error(`服务器响应失败`);
			})
		}).on('error', () => {
			clearTimeout(timeoutEvent);
			_this.start();
			log.logger.error(`请求：${url} 失败`);
		});

		req.on('timeout', () => {
			//对访问超时的资源，进行指定次数的重新抓取，当抓取次数达到预定次数后将不在抓取改url下的数据
	        // if(oResult.oRetryCount[url] == undefined){
	        //     oResult.oRetryCount[url] = 0;
	        // }else if(oResult.oRetryCount[url] != undefined && oResult.oRetryCount[url] < _this.retryNum){
	        //     oResult.oRetryCount[url]++;
	        //     log.logger.error("请求超时，调度到队列最后...");
	        //     oResult.aNewURLQueue.unshift(url);
	        // }
	        log.logger.error(`请求 ${url} 超时`);

	        if(req.res) {
	            req.res.emit("abort");
	        }

	        req.abort();
		});

		req.end();

	},
	getJSON: function(url, cb) {
		request(url, function(err, response, body) {
			if(!err && response.statusCode === 200) {
				cb(body);
			}
		})
	},
	getResourceType: function(type) {
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
	}
}

module.exports = Crawler;