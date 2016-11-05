import bcrypt from "bcrypt-nodejs";

module.exports = app => {
	const Schema = require('mongoose').Schema;
	
	let tarefa = new Schema({
		titulo: {type: String, required: true},
		feito: {type: Boolean, default: false}
	}, {
		timestamps: {
			createdAt: "alterado",
			updatedAt: "criado"
		}
	});

	let usuario = new Schema({
		nome: {type: String, required: true},
		senha: {type: String, required: true},
		email: {type: String, required: true},
		tarefas: [tarefa]
	}, {
		timestamps: {
			createdAt: "alterado",
			updatedAt: "criado"
		}
	});

	usuario.post("validate", (usuario) => {
  	let salt = bcrypt.genSaltSync();
		usuario.senha = bcrypt.hashSync(usuario.senha, salt);
	});

	usuario.methods.comparaSenha = (senhaCriptograda, senha) => {
		return bcrypt.compareSync(senha, senhaCriptograda);
	};

	return app.db.model('usuarios', usuario);
};