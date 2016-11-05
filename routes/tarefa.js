module.exports = app => {
	const Usuario = app.models.usuario;

	app.route("/tarefas")
		.all(app.auth.authenticate())
		.get((req, res) => {
			Usuario
				.findById(req.user._id)
				.select("-_id tarefas")
				.then(usuario => res.json(usuario.tarefas))
				.catch(err => res.status(412).json({msg: err.message}));
		})
		.post((req, res) => {
			Usuario
				.findById(req.user._id)
				.select("-_id tarefas")
				.then(usuario => {
					usuario.tarefas.push(req.body);
					usuario.save();
					res.json(usuario);
				})
				.catch(err => res.status(412).json({msg: err.message}));
		});

	app.route("/tarefas/:_id")
		.all(app.auth.authenticate())
		.get((req, res) => {
			Tarefa
				.findOne({_id: req.params._id, dono: {_id: req.user._id}})
				.select("_id titulo feito alterado criado usuarioId")
				.then(tarefa => {
					if (tarefa) {
						res.json(tarefa);
					}
					else {
						res.sendStatus(404);
					}
				})
				.catch(err => res.status(412).json({msg: err.message}));
		})
		.put((req, res) => {
			Tarefa
				.update({_id: req.params._id, dono: {_id: req.user._id}}, req.body)
				.then(res.sendStatus(204))
				.catch(err => res.status(412).json({msg: err.message}));
		})
		.delete((req, res) => {
			Tarefa
				.remove({_id: req.params._id, dono: {_id: req.user._id}})
				.then(res.sendStatus(204))
				.catch(err => res.status(412).json({msg: err.message}));
		});
};