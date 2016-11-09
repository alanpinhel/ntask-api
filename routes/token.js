import jwt from "jwt-simple";

module.exports = app => {
	const config = app.libs.config;
	const Usuarios = app.models.usuarios;
	
	app.post("/token", (req, res) => {
		Usuarios
			.findOne({email: req.body.email})
			.select("_id senha")
			.then(usuario => {
				if ((usuario) && usuario.comparaSenha(usuario.senha, req.body.senha)) {
					let payload = {_id: usuario._id};
					
					res.json({
						token: jwt.encode(payload, config.jwtSecret)
					});
				}
				else {
					res.sendStatus(401);	
				}
			})
			.catch(() => {
				res.sendStatus(401);
			});
	});
};