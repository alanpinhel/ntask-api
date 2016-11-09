import bcrypt from "bcrypt-nodejs";

module.exports = app => {
	const Schema = require("mongoose").Schema;

	let tarefas = new Schema({
		titulo: {type: String, required: true},
		feito: {type: Boolean, default: false}
	}, {
		timestamps: {
			createdAt: "alterado",
			updatedAt: "criado"
		}
	});

	let usuarios = new Schema({
		nome: {type: String, required: true},
		senha: {type: String, required: true},
		email: {type: String, required: true},
		tarefas: [tarefas]
	}, {
		timestamps: {
			createdAt: "alterado",
			updatedAt: "criado"
		}
	});

	usuarios.post("validate", (usuario) => {
		let salt = bcrypt.genSaltSync();
		usuario.senha = bcrypt.hashSync(usuario.senha, salt);
	});

	usuarios.methods.comparaSenha = (senhaCriptograda, senha) => {
		return bcrypt.compareSync(senha, senhaCriptograda);
	};

	return app.db.model("usuarios", usuarios);
};