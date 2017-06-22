var express = require('express');
var router = express.Router();

var request = require("request");
var superagent = require("superagent");
var cheerio = require("cheerio");

var mdb = require('../src/MDB');
var log = require("../src/log");	//日志

router.get('/tsy', function(req, res, next) {
	res.render('taoshouyou', { 
		title: '淘手游',
		name: '淘手游'
	});
});

router.get('/tsy/crawler', function(req, res, next) {
	log.logger.info('INFO');
	var url = "http://www.taoshouyou.com/game";

	//获取ajax的数据列表



	request({
		url: url,
		method: 'get',
		headers: {
	        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36",
	        "haha": "112233"
	    },
	}, function(err, response, body) {
		if(!err && response.statusCode == 200) {
			var $ = cheerio.load(body);
			var list = $('#js-gamelist-box');
			list[0].children.forEach(function(value, index) {
				var name = $(value).find('p').eq(0).text()
				mdb.saveName(name);
			})
			res.json({
				status: '200',
				msg: 'success'
			});
		}else {
			res.json({
				status: '500',
				msg: 'fail'
			});
		}
	})

});

var needUrl = "http://www.jiaoyimao.com/youxi/";

router.get('/jym', function(req, res, next) {
	var dsres = res;
    var data = [];//最终要存放数据的数组
    superagent.get(needUrl).end(function(err,res){//使用superagent发起请求，获得页面信息
        if(err){//如果有错误信息则打印
            return console.log(err);
        }
        var $ = cheerio.load(res.text);//这里使用cheerio的load方法处理页面，变为类jquery对象QAQ，应该就是这个意思。。
        console.log($("#scrollMain").find(".select-item").length);
        //分析页面结构得出，页面布局的数据所在的地方是$("#scrollMain")下面的各个 .select
        $("#scrollMain").find(".select-item").each(function(i,items){//下面就是一些数据的处理
            //这里定义了一个总的对象来存放单个商品的信息
            var msgobj = {};
            //title是游戏商品的总的分类，热门游戏或A-Z
            msgobj.title = $(items).find(".title").text();
            //list是当前游戏分类下的商品的所有的游戏列表的存放
            msgobj.list = [];
            $(items).find(".game-list").find("li").each(function(i,items){//这里开始遍历当前分类下的所有游戏
                //同样是定义一个对象用来存放单个游戏的信息
                var gamelist = {};
                //游戏商品详情的url
                gamelist.urls = $(items).find(".pic>a").attr("href");
                //游戏商品的名字
                gamelist.names = $(items).find("div.name").find("a>h2").text();
                //游戏商品的图片的地址
                gamelist.imgurl = $(items).find(".pic>a").find("img").attr("src");
                //infos是为了存放游戏商品下的分类，例如首充帐号、游戏币、帐号、道具等等
                gamelist.infos = [];
                $(items).find(".info").find("a").each(function(i,items){//这里遍历游戏商品下的分类
                    //同样道理定义对象来存放信息
                    var infolist = {};
                    infolist.titles = $(items).attr("title");
                    infolist.urls = $(items).attr("href");
                    //这里开始放置信息，把商品的分类信息等存到infos
                    gamelist.infos.push(infolist);
                })
                //将当前商品的信息存放到对应的商品分类
                msgobj.list.push(gamelist);
            })
            //将当前分类的所有商品信息存放到总的数组data当中
            data.push(msgobj);
        })
        //可以看一下所有信息。。。不过没什么用。太多了
        console.log(JSON.stringify(data));
        //之上的变量存放
        dsres.send(data);
    })
});

module.exports = router;