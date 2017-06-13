var Crawler = require('../src/crawler');
var cheerio = require('cheerio');
var request = require('request');
var mdb = require('../src/MDB');

var robot = new Crawler({
	website: 'http://www.taoshouyou.com/',
	cb: function($, data) {
		$('a').each(function() {
			var _this = $(this);
			var href = _this.attr('href');
			if(/\/game\//.test(href)) {
				console.log(href);
			}
		})
	}
});

// robot.start();
var keyWorlds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z'];

keyWorlds = ['A', 'B', 'C'];

var urlQueue = [];

// keyWorlds.forEach((value, index, arr) => {
// 	var url = 'http://www.taoshouyou.com/com/game/gamelist-interface?firstletter=' + value;
// 	robot.getJSON(url, function(d) {
// 		var res = typeof d == 'string' ? JSON.parse(d) : d;
// 		var hrefArr = createPath(res.data);
// 		urlQueue.push(hrefArr);
// 		if(index == keyWorlds.length - 1) {
// 			getPageInfo(hrefArr[0], 0, hrefArr);
// 		}
// 	})
// });

getAllUrl(keyWorlds[0], 0, keyWorlds)

function getAllUrl(ch, i, arr) {
	url = 'http://www.taoshouyou.com/com/game/gamelist-interface?firstletter=' + ch;
	robot.getJSON(url, function(d) {
		var res = typeof d == 'string' ? JSON.parse(d) : d;
		var hrefArr = createPath(res.data);
		urlQueue.concat(hrefArr);
		i++;
		if(i < arr.length) {
			getAllUrl(url, i, arr)
		}else {
			console.log(urlQueue)
		}
		
	})
}

function createPath(obj) {
	var arr = [];
	for(var i = 0; i < obj.length; i++) {
		arr.push(`http://www.taoshouyou.com/game/${obj[i].spelling}-${obj[i].id}-0-0`);
	}
	console.log(arr)
	return arr;
}

//递归调用
function getPageInfo(url, i, arr) {
	request(url, function(err, response, body) {
		if(!err && response.statusCode == 200) {
			var $ = cheerio.load(body);
			getDetailInfo($, body);
			getPageInfo(url);
			i++;
			if(i < arr.length) {
				getPageInfo(arr[i], i, arr);
			}
		}
	})
	
}

function getDetailInfo($, data) {
	$('#js-b-trade-list-conlist-trade-list')[0].children.forEach(function(v, i) {
		var _this = $(v);
		var price = _this.find('.price').text().trim();
		var name = _this.find('.jiage').text().trim();
		price = parseFloat(price);
		mdb.saveData(name, price);
		
	})

	//查找分页
	var totalPage = $('.pagination .jumpto').prev('li').find('a').text().split('/')[1];
	console.log(`totalPage: ${totalPage}`)
}

