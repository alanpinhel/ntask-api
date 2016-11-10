import Entrar from "./components/entrar.js";
import Cadastrar from "./components/cadastrar.js";

class App {
  constructor(body) {
    this.entrar = new Entrar(body);
    this.cadastrar = new Cadastrar(body);
  }
  init() {
    this.entrar.render();
    this.addEventListener();
  }
  addEventListener() {
    this.entrarEvents();
    this.cadastrarEvents();
  }
  entrarEvents() {
    this.entrar.on("error", () => {
      alert("Erro de autenticação");
    });
    this.entrar.on("entrar", (token) => {
      localStorage.setItem("token", `JWT ${token}`);
      alert("Você está autenticado!");
    });
    this.entrar.on("cadastrar", () => {
      this.cadastrar.render();
    });
  }
  cadastrarEvents() {
    this.cadastrar.on("error", () => {
      alert("Erro no cadastro");
    });
    this.cadastrar.on("cadastrar", (usuario) => {
      alert(`${usuario.nome} você foi cadastrado com sucesso!`);
      this.entrar.render();
    });
  }
}
module.exports = App;