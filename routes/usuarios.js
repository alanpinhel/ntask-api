module.exports = app => {
	const Usuarios = app.models.usuarios;

	app.route("/usuario")
		.all(app.auth.authenticate())
		.get((req, res) => {
			Usuarios
				.findById(req.user._id)
				.select("_id nome email")
				.then(usuario => {
					res.json(usuario);
				})
				.catch(err => {
					res.status(412).json({msg: err.message});
				});
		})
		.delete((req, res) => {
			Usuarios
				.remove({_id: req.user._id})
				.then(res.sendStatus(204))
				.catch(err => {
					res.status(412).json({msg: err.message});
				});
		});
		
	app.route("/usuarios")
		.post((req, res) => {
			let usuario = {
				nome: req.body.nome,
				senha: req.body.senha,
				email: req.body.email
			};
			
			Usuarios
				.create(usuario)
				.then(usuario => {
					res.json(usuario);
				})
				.catch(err => res.status(412).json({msg: err.message}));
		});
};