var express = require('express');
var router = express.Router();

router.get('/tsy', function(req, res, next) {

	res.send('正在爬取淘手游网站');
});

router.get('/jym', function(req, res, next) {
	res.send('正在爬取交易猫网站');
});

module.exports = router;