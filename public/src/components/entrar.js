import NTask from "../ntask.js";
import Template from "../templates/entrar.js";

class Entrar extends NTask {
  constructor(body) {
    super();
    this.body = body;
  }
  render() {
    this.body.innerHTML = Template.render();
    this.body.querySelector("[data-email").focus();
    this.addEventListener();
  }
  addEventListener() {
    this.formSubmit();
    this.cadastrarClick();
  }
  formSubmit() {
    const form = this.body.querySelector("form");
    
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const email = e.target.querySelector("[data-email]");
      const senha = e.target.querySelector("[data-senha]");
      const opcoes = {
        method: "POST",
        url: `${this.URL}/token`,
        json: true,
        body: {
          email: email.value,
          senha: senha.value
        }
      };
      
      this.request(opcoes, (err, res, data) => {
        if (err || res.status === 401) {
          this.emit("error", err);
        }
        else {
          this.emit("entrar", data.token);
        }
      });
    });
  }
  cadastrarClick() {
    const cadastrar = this.body.querySelector("[data-cadastrar]");
    
    cadastrar.addEventListener("click", (e) => {
      e.preventDefault();
      this.emit("cadastrar");
    });
  }
}
module.exports = Entrar;