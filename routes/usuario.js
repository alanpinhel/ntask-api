module.exports = app => {
	const Usuario = app.models.usuario;

	app.route("/cadastre-se")
		/**
		 * @api {post} /cadastre-se Cadastra usuário
		 * @apiGroup Usuário
		 * @apiParam {String} nome Nome
		 * @apiParam {String} email E-mail
		 * @apiParam {String} senha Senha
		 * @apiParamExample {json} Entrada
		 * 		{
		 *			"nome": "John",
		 *			"email": "john@mail.net",
		 *			"senha": "123456"
		 *		}
		 * @apiSuccess {Number} __v Versão
		 * @apiSuccess {Date} criado Data de criação
		 * @apiSuccess {Date} alterado Data de alteração
		 * @apiSuccess {String} nome Nome
		 * @apiSuccess {String} email E-mail
		 * @apiSuccess {String} senha Senha criptografada
		 * @apiSuccess {String} _id ID
		 * @apiSuccessExample {json} Sucesso
		 *		HTTP/1.1 200 OK
		 *		{
  	 *			"__v": 0,
     *			"criado": "2016-10-04T18:47:24.516Z",
  	 *			"alterado": "2016-10-04T18:47:24.516Z",
  	 *			"nome": "John",
  	 *			"email": "john@mail.net",
  	 *			"senha": "$2a$10$Sum00t/prEJGdN/wyoy94uYKl3n8THoJA6kmOgXpYz7m91sIe5nF2",
     *			"_id": "57f3f93cc9dc6c1c50006941"
		 *		}
		 * @apiErrorExample {json} Erro no cadastro
		 *		HTTP/1.1 412 Precondition Failed
		 */
		.post((req, res) => {
			Usuario
				.create(req.body)
				.then(usuario => res.json(usuario))
				.catch(err => res.status(412).json({msg: err.message}));
		});

	app.route("/usuario")
		.all(app.auth.authenticate())
		/**
		 * @api {get} /usuario Consulta usuário autenticado
		 * @apiGroup Usuário
		 * @apiHeader {String} Authorization Token de usuário
		 * @apiHeaderExample {json} Header
		 *		{"Authorization": "JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1N2YzZjkzY2M5ZGM2YzFjNTAwMDY5NDEifQ.--2BE3pwZr29BN691OKxmF4HyfpxaQB684-4hk6mx6I"}
		 * @apiSuccess {String} _id ID
		 * @apiSuccess {String} nome Nome
		 * @apiSuccess {String} email E-mail
		 * @apiSuccessExample {json} Sucesso
		 *		HTTP/1.1 200 OK
		 *		{
		 *			"_id": "57f3f93cc9dc6c1c50006941",
		 *			"nome": "John",
		 *			"email": "john@mail.net"
		 *		}
		 * @apiErrorExample {json} Erro no cadastro
		 *		HTTP/1.1 412 Precondition Failed
		 */
		.get((req, res) => {
			Usuario
				.findById({_id: req.user._id})
				.select("_id nome email")
				.then(usuario => res.json(usuario))
				.catch(err => res.status(412).json({msg: err.message}));
		})
		/**
		 * @api {delete} /usuario Excluí usuário autenticado
		 * @apiGroup Usuário
		 * @apiHeader {String} Authorization Token de usuário
		 * @apiHeaderExample {json} Header
		 *		{"Authorization": "JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1N2YzZjkzY2M5ZGM2YzFjNTAwMDY5NDEifQ.--2BE3pwZr29BN691OKxmF4HyfpxaQB684-4hk6mx6I"}
		 * @apiSuccessExample {json} Sucesso
		 *		HTTP/1.1 204 No Content
		 * @apiErrorExample {json} Erro no cadastro
		 *		HTTP/1.1 412 Precondition Failed
		 */
		.delete((req, res) => {
			Usuario
				.remove({_id: req.user._id})
				.then(res.sendStatus(204))
				.catch(err => res.status(412).json({msg: err.message}));
		});
};