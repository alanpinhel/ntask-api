describe("Rota: Home", () => {
	describe("GET /", () => {
		it("retorna o estado da API", done => {
			request.get("/")
				.expect(200)
				.end((err, res) => {
					const esperado = {status: "Online"};
					expect(res.body).to.eql(esperado);
					done(err);
				});
		});
	});
});