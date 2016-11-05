import jwt from "jwt-simple";

describe("Rota: Usuário", () => {
	const Usuario = app.models.usuario;
	const jwtSecret = app.libs.config.jwtSecret;

	let token;

	beforeEach(done => {
		Usuario
			.remove({})
			.then(() => Usuario.create({
				nome: "John", 
				email: "john@mail.net", 
				senha: "12345"
			}))
			.then(usuario => {
				token = jwt.encode({_id: usuario._id}, jwtSecret);
				done();
			});
	});
	describe("POST /cadastre-se", () => {
		describe("status 200", () => {
			it("cadastra usuário", done => {
				request.post("/cadastre-se")
					.send({
						nome: "Mary",
						email: "mary@mail.net",
						senha: "12345"
					})
					.expect(200)
					.end((err, res) => {
						expect(res.body.nome).to.eql("Mary");
						expect(res.body.email).to.eql("mary@mail.net");
						done(err);
					});
			});
		});
	});
	describe("GET /usuario", () => {
		describe("status 200", () => {
			it("retorna usuário autenticado", done => {
				request.get("/usuario")
					.set("Authorization", `JWT ${token}`)
					.expect(200)
					.end((err, res) => {
						expect(res.body.nome).to.eql("John");
						expect(res.body.email).to.eql("john@mail.net");
						done(err);
					});
			});
		});
	});
	describe("DELETE /usuario", () => {
		describe("status 204", () => {
			it("deleta usuário autenticado", done => {
				request.delete("/usuario")
					.set("Authorization", `JWT ${token}`)
					.expect(204)
					.end(err => done(err));
			});
		});
	});
});