import jwt from "jwt-simple";

describe("Routes: Tasks", () => {
  const Usuarios = app.models.usuarios;
  const jwtSecret = app.libs.config.jwtSecret;
  let token;
  let tarefa;

  beforeEach(done => {
    Usuarios
      .remove({})
      .then(() => Usuarios.create({
        nome: "John",
        email: "john@mail.net",
        senha: "12345"
      }))
      .then(usuario => {
        usuario.tarefas.push({titulo: "Trabalhar"});
        usuario.tarefas.push({titulo: "Estudar"});
        usuario.save(() => {
          tarefa = usuario.tarefas[0];
          token = jwt.encode({_id: usuario._id}, jwtSecret);
          done();
        });
      });
  });
  describe("GET /tarefas", () => {
    describe("status 200", () => {
      it("retorna lista de tarefas", done => {
        request
          .get("/tarefas")
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
  describe("POST /tarefas", () => {
    describe("status 200", () => {
      it("cria uma nova tarefa", done => {
        request
          .post("/tarefas")
          .set("Authorization", `JWT ${token}`)
          .send({
            titulo: "Correr"
          })
          .expect(200)
          .end((err, res) => {
            expect(res.body.titulo).to.eql("Correr");
            expect(res.body.feito).to.be.false;
            done(err);
          });
      });
    });
  });
  describe("GET /tarefas/:id", () => {
    describe("status 200", () => {
      it("retorna uma tarefa", done => {
        request
          .get(`/tarefas/${tarefa._id}`)
          .set("Authorization", `JWT ${token}`)
          .expect(200)
          .end((err, res) => {
            expect(res.body.titulo).to.eql("Trabalhar");
            done(err);
          });
      });
    });
    describe("status 404", () => {
      it("retorna erro de tarefa inexistente", done => {
        request
          .get("/tarefas/0")
          .set("Authorization", `JWT ${token}`)
          .expect(404)
          .end((err, res) => {
            done(err);
          });
      });
    });
  });
  describe("PUT /tarefas/:id", () => {
    describe("status 204", () => {
      it("atualiza uma tarefa", done => {
        request
          .put(`/tarefas/${tarefa._id}`)
          .set("Authorization", `JWT ${token}`)
          .send({
            titulo: "Viajar",
            feito: true
          })
          .expect(204)
          .end((err, res) => {
            done(err);
          });
      });
    });
  });
  describe("DELETE /tarefas/:id", () => {
    describe("status 204", () => {
      it("remove uma tarefa", done => {
        request
          .delete(`/tarefas/${tarefa._id}`)
          .set("Authorization", `JWT ${token}`)
          .expect(204)
          .end((err, res) => {
            done(err);
          });
      });
    });
  });
});