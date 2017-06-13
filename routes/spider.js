var express = require('express');
var router = express.Router();

var request = require("request");
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
	var url = "http://www.taoshouyou.com/";

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
				status: '200',
				msg: 'fail'
			});
		}
	})

	// res.json({
	// 	status: '200',
	// 	data: {
	// 		index: 1,
	// 		total: 3,
	// 		list: [
	// 			{
	// 				id: 1,
	// 				name: 'Michael',
	// 				age: 18
	// 			},
	// 			{
	// 				id: 2,
	// 				name: 'Tom',
	// 				age: 20
	// 			},
	// 			{
	// 				id: 3,
	// 				name: 'Jack',
	// 				age: 19
	// 			}
	// 		]
	// 	}
	// });
});

router.get('/jym', function(req, res, next) {
	res.send('正在爬取交易猫网站');
});

module.exports = router;