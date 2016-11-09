describe("Routes: Token", () => {
  const Usuarios = app.models.usuarios;

  describe("POST /token", () => {
    beforeEach(done => {
      Usuarios
        .remove({})
        .then(() => Usuarios.create({
          nome: "John",
          email: "john@mail.net",
          senha: "12345"
        }))
        .then(done());
    });
    describe("status 200", () => {
      it("retorna token de autenticação", done => {
        request
          .post("/token")
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
      it("retorna erro de senha incorreta", done => {
        request
          .post("/token")
          .send({
            email: "john@mail.net",
            senha: "SENHA_ERRADA"
          })
          .expect(401)
          .end((err, res) => {
            done(err);
          });
      });
      it("retorna erro de e-mail inexistente", done => {
        request
          .post("/token")
          .send({
            email: "EMAIL_ERRADO",
            senha: "SENHA_ERRADA"
          })
          .expect(401)
          .end((err, res) => {
            done(err);
          });
      });
      it("retorna erro de e-mail e/ou senha em brancos", done => {
        request
          .post("/token")
          .expect(401)
          .end((err, res) => {
            done(err);
          });
      });
    });
  });
});