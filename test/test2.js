var fs = require('fs');
var cheerio = require('cheerio');

var path = 'G:\\Java\\workspace\\platform\\src\\main\\webapp\\jsp\\index.jsp';

fs.readFile(path, function(err, file) {
	if(err) {
		console.log(err)
	}
	var doc = file.toString();
	var $ = cheerio.load(doc);
	$('body').append('<p>hahaha...</p>')
	// console.log(doc)
})

require.extensions['.ts'] = function() {

}

// console.log(module)
// console.log(require.extensions)

console.log(__filename);
console.log(__dirname);


var obj = require('./data');
console.log(obj.job)