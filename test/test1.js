var iconv = require('iconv-lite');

var str = iconv.decode(new Buffer([0x68, 0x65, 0x6c, 0x6c, 0x6f]), 'GBK');
var buf = iconv.encode("Sample input string", 'win1251');

console.log(str);	//打印 hello
console.log(buf);	//打印 <Buffer 53 61 6d 70 6c 65 20 69 6e 70 75 74 20 73 74 72 69 6e 67>

