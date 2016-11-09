import jwt from "jwt-simple";

module.exports = app => {
	const config = app.libs.config;
	const Usuarios = app.models.usuarios;
	
	/**
	 * @api {post} /token Token autenticado
	 * @apiGroup Credencial
	 * @apiParam {String} email E-mail de usuário
	 * @apiParam {String} senha Senha de usuário
	 * @apiParamExample {json} Entrada
	 *		{
	 *			"email": "john@connor.net",
	 *			"password": "123456"
	 *		}
	 * @apiSuccess {String} token Token de usuário autenticado
	 * @apiSuccessExample {json} Sucesso
	 *		HTTP/1.1 200 OK
	 *		{"token": "xyz.abc.123.hgf"}
	 * @apiErrorExample {json} Erro de autenticação
	 *		HTTP/1.1 401 Unauthorized
	 */
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