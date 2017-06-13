var mongoose = require("mongoose");
var db = mongoose.createConnection('localhost', 'test_1');

var GameSchema = new mongoose.Schema({
	name: String
})

var GameModel = db.model('Game', GameSchema);


function MDB() {

}

MDB.saveName = (value) => {
	var gameEntity = new GameModel({
		name: value
	})
	gameEntity.save();
	// console.log(`保存${value}成功！`)
}

module.exports = MDB;