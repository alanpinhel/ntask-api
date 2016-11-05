import jwt from "jwt-simple";

describe("Rota: Tarefa", () => {
	const Usuario = app.models.usuario;
	const Tarefa = app.models.tarefa;
	const jwtSecret = app.libs.config.jwtSecret;

	let token;
	let falsaTarefa;

	beforeEach(done => {
		Usuario
			.remove({})
			.then(() => Usuario.create({
				nome: "John",
				email: "john@mail.net",
				senha: "12345"
			}))
			.then(usuario => {
				Tarefa
					.remove({})
					.then(() => Tarefa.insertMany([{
						titulo: "Trabalhar",
						dono: {
							_id: usuario._id,
							nome: usuario.nome,
							email: usuario.email
						}
					}, {
						titulo: "Estudar",
						dono: {
							_id: usuario._id,
							nome: usuario.nome,
							email: usuario.email
						}
					}]))
					.then(tarefas => {
						falsaTarefa = tarefas[0];
						token = jwt.encode({_id: usuario._id}, jwtSecret);
						done();
					});
			});
	});
	describe("GET /tarefas", () => {
		describe("status 200", () => {
			it("retorna lista de tarefas", done => {
				request.get("/tarefas")
					.set("Authorization", `JWT ${token}`)
					.expect(200)
					.end((err, res) => {
						expect(res.body).to.have.length(2);
						expect(res.body[0].titulo).to.eql("Trabalhar");
						expect(res.body[1].titulo).to.eql("Estudar");
						done(err);
					});
			});
		});
	});
	describe("POST /tarefa", () => {
		describe("status 200", () => {
			it("cadastra tarefa", done => {
				request.post("/tarefa")
					.set("Authorization", `JWT ${token}`)
					.send({titulo: "Correr"})
					.expect(200)
					.end((err, res) => {
						expect(res.body.titulo).to.eql("Correr");
						expect(res.body.feito).to.be.false;
						done(err);
					});
			});
		});
	});
	describe("GET /tarefa/:_id", () => {
		describe("status 200", () => {
			it("retorna tarefa", done => {
				request.get(`/tarefa/${falsaTarefa._id}`)
					.set("Authorization", `JWT ${token}`)
					.expect(200)
					.end((err, res) => {
						expect(res.body.titulo).to.eql("Trabalhar");
						done(err);
					});
			});
		});
		describe("status 404", () => {
			it("lança erro de tarefa inexistente", done => {
				request.get("/tarefa/57f3f93cc9dc6c1c50006941")
					.set("Authorization", `JWT ${token}`)
					.expect(404)
					.end(err => done(err));
			});
		});
	});
	describe("PUT /tarefa/:_id", () => {
		describe("status 204", () => {
			it("atualiza tarefa", done => {
				request.put(`/tarefa/${falsaTarefa._id}`)
					.set("Authorization", `JWT ${token}`)
					.send({
						titulo: "Viajar",
						feito: true
					})
					.expect(204)
					.end(err => done(err));
			});
		});
	});
	describe("DELETE /tarefa/:_id", () => {
		describe("status 204", () => {
			it("excluí tarefa", done => {
				request.delete(`/tarefa/${falsaTarefa._id}`)
					.set("Authorization", `JWT ${token}`)
					.expect(204)
					.end(err => done(err));
			});
		});
	});
});