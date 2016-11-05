describe("Rota: Token", () => {
	const Usuario = app.models.usuario;

	describe("POST /token", () => {
		beforeEach(done => {
			Usuario
				.remove({})
				.then(() => Usuario.create({
					nome: "John",
					email: "john@mail.net",
					senha: "12345"
				}, done()));
		});
		describe("status 200", () => {
			it("retorna token de autenticação de usuário", done => {
				request.post("/token")
					.send({
						email: "john@mail.net",
						senha: "12345"
					})
					.expect(200)
					.end((err, res) => {
						expect(res.body).to.include.keys("token");
						done(err);
					});
			});
		});
		describe("status 401", () => {
			it("lança erro de senha incorreta", done => {
				request.post("/token")
					.send({
						email: "john@mail.net",
						senha: "SENHA_ERRADA"
					})
					.expect(401)
					.end(err => done(err));
			});
			it("lança erro de e-mail inexistente", done => {
				request.post("/token")
					.send({
						email: "EMAIL_ERRADO",
						senha: "SENHA_ERRADA"
					})
					.expect(401)
					.end(err => done(err));
			});
			it("lança erro de e-mail e/ou senha em branco(s)", done => {
				request.post("/token")
					.expect(401)
					.end(err => done(err));
			});
		});
	});
});