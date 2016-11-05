import mongoose from "mongoose";

module.exports = () => {
	const config = require("./libs/config.js");
	const uri = config.mongodb[process.env.NODE_ENV];

	let db = null;

	if (!db) {
		mongoose.Promise = global.Promise;
		db = mongoose.createConnection(uri);
	}
	return db;
};