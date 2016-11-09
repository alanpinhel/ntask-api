module.exports = app => {
	const Usuarios = app.models.usuarios;
	
	app.route("/tarefas")
		.all(app.auth.authenticate())
		.get((req, res) => {
			Usuarios
				.findById(req.user._id)
				.select("-_id tarefas")
				.then(usuario => {
					res.json(usuario.tarefas);
				})
				.catch(err => {
					res.status(412).json({msg: err.message});
				});
		})
		.post((req, res) => {
			Usuarios
				.findById(req.user._id)
				.select("_id tarefas")
				.then(usuario => {
					let tarefa = {
						titulo: req.body.titulo,
						feito: req.body.feito
					};
					let tarefas = usuario.tarefas;
					
					tarefas.push(tarefa);
					usuario.save(() => {
						res.json(tarefas);
					});
				})
				.catch(err => {
					res.status(412).json({msg: err.message});
				});
		});
		
	app.route("/tarefas/:_id")
		.all(app.auth.authenticate())
		.get((req, res) => {
			Usuarios
				.findById(req.user._id)
				.select("-_id tarefas")
				.then(usuario => {
					let tarefa = usuario.tarefas.id(req.params._id);
					
					if (tarefa) {
						res.json(tarefa);
					}
					else {
						res.sendStatus(404);
					}
				})
				.catch(err => {
					res.status(412).json({msg: err.message});
				});
		})
		.put((req, res) => {
			Usuarios
				.findById(req.user._id)
				.select("_id tarefas")
				.then(usuario => {
					let tarefa = usuario.tarefas.id(req.params._id);
					
					tarefa.titulo = req.body.titulo;
					tarefa.feito = req.body.feito;
					usuario.save(() => {
						res.sendStatus(204);
					});
				})
				.catch(err => {
					res.status(412).json({msg: err.message});
				});
		})
		.delete((req, res) => {
			Usuarios
				.findById(req.user._id)
				.select("_id tarefas")
				.then(usuario => {
					usuario.tarefas.id(req.params._id).remove();
					usuario.save(() => {
						res.sendStatus(204);
					});
				})
				.catch(err => {
					res.status(412).json({msg: err.message});
				});
		});
};