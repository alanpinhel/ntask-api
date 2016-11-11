module.exports = app => {
	const Usuarios = app.models.usuarios;

	app.route("/usuario")
		.all(app.auth.authenticate())
		
		/**
		 * @api {get} /usuario Exibe usuário autenticado
		 * @apiGroup Usuario
		 * @apiHeader {String} Authorization Token de usuário
		 * @apiHeaderExample {json} Header
		 *		{"Authorization": "JWT xyz.abc.123.hgf"}
		 * @apiSuccess {String} _id Id de registro
		 * @apiSuccess {String} nome Nome
		 * @apiSuccess {String} email E-mail
		 * @apiSuccessExample {json} Sucesso
		 *		HTTP/1.1 200 OK
		 *		{
		 *			"_id": aajsajs112String,
		 *			"name": "John Connor",
		 *			"email": "john@connor.net"
		 *		}
		 * @apiErrorExample {json} Erro de consulta
		 *		HTTP/1.1 412 Precondition Failed
		 */
		.get((req, res) => {
			Usuarios
				.findById(req.user._id)
				.select("_id nome senha email")
				.then(usuario => {
					res.json(usuario);
				})
				.catch(err => {
					res.status(412).json({msg: err.message});
				});
		})
		
		/**
		 * @api {delete} /usuario Excluí usuário autenticado
		 * @apiGroup Usuario
		 * @apiHeader {String} Authorization Token de usuário
		 * @apiHeaderExample {json} Header
		 *		{"Authorization": "JWT xyz.abc.123.hgf"}
		 * @apiSuccessExample {json} Sucesso
		 *		HTTP/1.1 204 No Content
		 * @apiErrorExample {json} Erro na exclusão
		 *		HTTP/1.1 412 Precondition Failed
		 */
		.delete((req, res) => {
			Usuarios
				.remove({_id: req.user._id})
				.then(res.sendStatus(204))
				.catch(err => {
					res.status(412).json({msg: err.message});
				});
		});
		
	app.route("/usuarios")
	
		/**
		 * @api {post} /usuarios Cadastra novo usuário
		 * @apiGroup Usuario
		 * @apiParam {String} nome Nome
		 * @apiParam {String} email E-mail
		 * @apiParam {String} senha Senha
		 * @apiParamExample {json} Entrada
		 *		{
		 *			"nome": "John Connor",
		 *			"email": "john@connor.net",
		 *			"senha": "123456"
		 *		}
		 * @apiSuccess {String} _id Id de registro
		 * @apiSuccess {String} nome Nome
		 * @apiSuccess {String} email E-mail
		 * @apiSuccess {String} senha Senha criptografada
		 * @apiSuccess {Date} alterado Data de atualização
		 * @apiSuccess {Date} criado Data de cadastro
		 * @apiSuccessExample {json} Sucesso
		 *		HTTP/1.1 200 OK
		 *		{
		 *			"_id": aajsajs112,
		 *			"name": "John Connor",
		 *			"email": "john@connor.net",
		 *			"password": "$2a$10$SK1B1",
		 *			"alterado": "2015-09-24T15:46:51.778Z",
		 *			"criado": "2015-09-24T15:46:51.778Z"
		 *		}
		 * @apiErrorExample {json} Erro no cadastro
		 *		HTTP/1.1 412 Precondition Failed
		 */
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