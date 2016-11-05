import jwt from "jwt-simple";

module.exports = app => {
	const config = app.libs.config;
	const Usuario = app.models.usuario;

	/**
	 * @api {post} /token Token autenticado
	 * @apiGroup Credencial
	 * @apiParam {String} email Email de usuário
	 * @apiParam {String} senha Senha de usuário
	 * @apiParamExample {json} Entrada
	 * 		{
	 *			"email": "john@mail.net",
	 *			"senha": "123456"
	 *		}
	 * @apiSuccess {String} token Token de usuário autenticado
	 * @apiSuccessExample {json} Sucesso
	 *		HTTP/1.1 200 OK
	 *		{"token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1N2YzZjkzY2M5ZGM2YzFjNTAwMDY5NDEifQ.--2BE3pwZr29BN691OKxmF4HyfpxaQB684-4hk6mx6I"}
	 * @apiErrorExample {json} Erro de autenticação
	 *		HTTP/1.1 401 Unauthorized
	 */
	app.post("/token", (req, res) => {
		Usuario
			.findOne({email: req.body.email})
			.select("_id senha")
			.then(usuario => {
				if ((usuario) && usuario.comparaSenha(usuario.senha, req.body.senha)) {
					let payload = {_id: usuario._id};
					res.json({token: jwt.encode(payload, config.jwtSecret)});
				}
				else {
					res.sendStatus(401);	
				}
			})
			.catch(err => res.sendStatus(401));
	});
};