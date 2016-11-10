import NTask from "../ntask.js";
import Template from "../templates/cadastrar.js";

class Cadastrar extends NTask {
  constructor(body) {
    super();
    this.body = body;
  }
  render() {
    this.body.innerHTML = Template.render();
    this.body.querySelector("[data-nome]").focus();
    this.addEventListener();
  }
  addEventListener() {
    this.formSubmit();
  }
  formSubmit() {
    const form = this.body.querySelector("form");
    
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const nome = e.target.querySelector("[data-nome]");
      const email = e.target.querySelector("[data-email]");
      const senha = e.target.querySelector("[data-senha]");
      const opcoes = {
        method: "POST",
        url: `${this.URL}/usuarios`,
        json: true,
        body: {
          nome: nome.value,
          email: email.value,
          senha: senha.value
        }
      };
      this.request(opcoes, (err, res, data) => {
        if (err || res.status === 412) {
          this.emit("error", err);
        }
        else {
          this.emit("cadastrar", data);
        }
      });
    });
  }
}
module.exports = Cadastrar;