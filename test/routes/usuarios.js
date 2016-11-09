import jwt from "jwt-simple";

describe("Routes: Tasks", () => {
  const Usuarios = app.db.models.usuarios;
  const jwtSecret = app.libs.config.jwtSecret;
  let token;
  
  beforeEach(done => {
    Usuarios
      .remove({})
      .then(() => Usuarios.create({
        nome: "John",
        email: "john@mail.net",
        senha: "12345"
      }))
      .then(usuario => {
        token = jwt.encode({_id: usuario._id}, jwtSecret);
        done();
      });
  });
  describe("GET /usuario", () => {
    describe("status 200", () => {
      it("retorna o usuário autenticado", done => {
        request
          .get("/usuario")
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
    describe("status 200", () => {
      it("deleta o usuário autenticado", done => {
        request
          .delete("/usuario")
          .set("Authorization", `JWT ${token}`)
          .expect(204)
          .end((err, res) => {
            done(err);
          });
      });
    });
  });
  describe("POST /usuarios", () => {
    describe("status 200", () => {
      it("cria novo usuário", done => {
        request
          .post("/usuarios")
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
});