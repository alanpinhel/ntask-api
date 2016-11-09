describe("Rota: Index", () => {
  describe("GET /", () => {
    it("retorna o status da API", done => {
      request.get("/")
        .expect(200)
        .end((err, res) => {
          const esperado = {status: "online"};
          
          expect(res.body).to.eql(esperado);
          done(err);
        });
    });
  });
});