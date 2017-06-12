var request = require("request");
var cheerio = require("cheerio");
var mdb = require("../modules/MDB");

var url = "http://www.taoshouyou.com/";

request({
	url: url,
	method: 'get',
	headers: {
        "haha": "1234",
    },
}, function(err, response, body) {
	if(!err && response.statusCode == 200) {
		var $ = cheerio.load(body);
		var list = $('#js-gamelist-box');
		list[0].children.forEach(function(value, index) {
			var name = $(value).find('p').eq(0).text()
			mdb.saveName(name)
		})
	}else {
		console.log(err)
	}
})
