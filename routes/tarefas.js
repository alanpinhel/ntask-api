module.exports = app => {
	const Usuarios = app.models.usuarios;
	
	/**
	 * @api {get} /tarefas Lista tarefas
	 * @apiGroup Tarefas
	 * @apiHeader {String} Authorization Token de usuário
	 * @apiHeaderExample {json} Header
	 *		{"Authorization": "JWT xyz.abc.123.hgf"}
	 * @apiSuccess {Object[]} tarefas Lista de tarefas
	 * @apiSuccess {String} tarefas._id Id de registro
	 * @apiSuccess {String} tarefas.titulo Título da tarefa
	 * @apiSuccess {Boolean} tarefas.feito Tarefa foi concluída?
	 * @apiSuccess {Date} tarefas.alterado Data de atualização
	 * @apiSuccess {Date} tarefas.criado Data de cadastro
	 * @apiSuccessExample {json} Sucesso
	 *		HTTP/1.1 200 OK
	 *		[
	 *			{
	 *				"_id": 18uw891usj8,
	 *				"titulo": "Estudar",
	 *				"feito": false
	 *				"alterado": "2015-09-24T15:46:51.778Z",
	 *				"criado": "2015-09-24T15:46:51.778Z"
	 *			}
	 *		]
	 * @apiErrorExample {json} Erro de consulta
	 *		HTTP/1.1 412 Precondition Failed
	 */
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
		
		/**
		 * @api {post} /tarefas Cadastra uma tarefa
		 * @apiGroup Tarefas
		 * @apiHeader {String} Authorization Token de usuário
		 * @apiHeaderExample {json} Header
		 *		{"Authorization": "JWT xyz.abc.123.hgf"}
		 * @apiParam {String} titulo Título da tarefa
		 * @apiParamExample {json} Entrada
		 *		{"title": "Estudar"}
		 * @apiSuccess {String} id Id de registro
		 * @apiSuccess {String} titulo Título da tarefa
		 * @apiSuccess {Boolean} feito=false Tarefa foi concluída?
		 * @apiSuccess {Date} alterado Data de atualização
		 * @apiSuccess {Date} criado Data de cadastro
		 * @apiSuccessExample {json} Sucesso
		 *		HTTP/1.1 200 OK
		 *		{
		 *			"_id": 18uw891usj8,
		 *			"title": "Estudar",
		 *			"done": false,
		 *			"alterado": "2015-09-24T15:46:51.778Z",
		 *			"criado": "2015-09-24T15:46:51.778Z"
		 *		}
		 * @apiErrorExample {json} Erro de consulta
		 *		HTTP/1.1 412 Precondition Failed
		 */
		.post((req, res) => {
			Usuarios
				.findById(req.user._id)
				.select("_id tarefas")
				.then(usuario => {
					let tarefa = {
						titulo: req.body.titulo,
						feito: req.body.feito || false
					};
					let tarefas = usuario.tarefas;
					
					tarefas.push(tarefa);
					usuario.save(() => {
						res.json(tarefa);
					});
				})
				.catch(err => {
					res.status(412).json({msg: err.message});
				});
		});
		
	app.route("/tarefas/:_id")
		.all(app.auth.authenticate())
		
		/**
		 * @api {get} /tarefas/:id Exibe uma tarefa
		 * @apiGroup Tarefas
		 * @apiHeader {String} Authorization Token de usuário
		 * @apiHeaderExample {json} Header
		 *		{"Authorization": "JWT xyz.abc.123.hgf"}
		 * @apiParam {String} _id Id da tarefa
		 * @apiSuccess {String} _id Id de registro
		 * @apiSuccess {String} titulo Título da tarefa
		 * @apiSuccess {Boolean} feito Tarefa foi concluída?
		 * @apiSuccess {Date} alterado Data de atualização
		 * @apiSuccess {Date} criado Data de cadastro
		 * @apiSuccessExample {json} Sucesso
		 *		HTTP/1.1 200 OK
		 *		{
		 *			"_id": 1hs7ay7sa77,
		 *			"titulo": "Estudar",
		 *			"feito": false
		 *			"alterado": "2015-09-24T15:46:51.778Z",
		 *			"criado": "2015-09-24T15:46:51.778Z"
		 *		}
		 * @apiErrorExample {json} Tarefa não existe
		 *		HTTP/1.1 404 Not Found
		 * @apiErrorExample {json} Erro de consulta
		 *		HTTP/1.1 412 Precondition Failed
		 */
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
		
		/**
		 * @api {put} /tarefas/:id Atualiza uma tarefa
		 * @apiGroup Tarefas
		 * @apiHeader {String} Authorization Token de usuário
		 * @apiHeaderExample {json} Header
		 *		{"Authorization": "JWT xyz.abc.123.hgf"}
		 * @apiParam {String} _id Id da tarefa
		 * @apiParam {String} titulo Título da tarefa
		 * @apiParam {Boolean} feito Tarefa foi concluída?
		 * @apiParamExample {json} Entrada
		 *		{
		 *			"titulo": "Trabalhar",
		 *			"feito": true
		 *		}
		 * @apiSuccessExample {json} Sucesso
		 *		HTTP/1.1 204 No Content
		 * @apiErrorExample {json} Erro de consulta
		 *		HTTP/1.1 412 Precondition Failed
		 */
		.put((req, res) => {
			Usuarios
				.findById(req.user._id)
				.select("_id tarefas")
				.then(usuario => {
					usuario.tarefas.id(req.params._id).feito = req.body.feito;
					usuario.save(() => {
						res.sendStatus(204);
					});
				})
				.catch(err => {
					res.status(412).json({msg: err.message});
				});
		})
		
		/**
		 * @api {delete} /tarefas/:id Excluí uma tarefa
		 * @apiGroup Tarefas
		 * @apiHeader {String} Authorization Token de usuário
		 * @apiHeaderExample {json} Header
		 *		{"Authorization": "JWT xyz.abc.123.hgf"}
		 * @apiParam {String} _id Id da tarefa
		 * @apiSuccessExample {json} Sucesso
		 *		HTTP/1.1 204 No Content
		 * @apiErrorExample {json} Erro de consulta
		 *		HTTP/1.1 412 Precondition Failed
		 */
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