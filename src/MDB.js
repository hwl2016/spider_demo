var mongoose = require("mongoose");
var db = mongoose.createConnection('localhost', 'test_1');

var GameSchema = new mongoose.Schema({
	price: Number,
	name: String
})

var GameModel = db.model('Game', GameSchema);


function MDB() {

}
var cnt = 0;
MDB.saveData = (name, price) => {
	var gameEntity = new GameModel({
		name: name,
		price: price
	})
	gameEntity.save();
	cnt ++ ;
	// console.log(`save ${name} -- ${price} success -- ${cnt}`)
}

module.exports = MDB;