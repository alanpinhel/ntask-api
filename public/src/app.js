import Tarefas from "./components/tarefas.js";
import TarefaForm from "./components/tarefaForm.js";
import Usuario from "./components/usuario.js";
import Entrar from "./components/entrar.js";
import Cadastrar from "./components/cadastrar.js";
import Menu from "./components/menu.js";

class App {
  constructor(body, footer) {
    this.entrar = new Entrar(body);
    this.cadastrar = new Cadastrar(body);
    this.tarefas = new Tarefas(body);
    this.tarefaForm = new TarefaForm(body);
    this.usuario = new Usuario(body);
    this.menu = new Menu(footer);
  }
  init() {
    this.entrar.render();
    this.addEventListener();
  }
  addEventListener() {
    this.entrarEvents();
    this.cadastrarEvents();
    this.tarefasEvents();
    this.tarefaFormEvents();
    this.usuarioEvents();
    this.menuEvents();
  }
  entrarEvents() {
    this.entrar.on("error", () => {
      alert("Erro de autenticação");
    });
    this.entrar.on("entrar", (token) => {
      localStorage.setItem("token", `JWT ${token}`);
      this.menu.render("tarefas");
      this.tarefas.render();
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
  tarefasEvents() {
    this.tarefas.on("error", () => {
      alert("Erro ao listar tarefas");
    });
    this.tarefas.on("remove-error", () => {
      alert("Erro ao excluir");
    });
    this.tarefas.on("update-error", () => {
      alert("Erro ao atualizar");
    });
    this.tarefas.on("remove", () => {
      this.tarefas.render();
    });
    this.tarefas.on("update", () => {
      this.tarefas.render();
    });
  }
  tarefaFormEvents() {
    this.tarefaForm.on("error", () => {
      alert("Erro ao cadastrar tarefa");
    });
    this.tarefaForm.on("submit", () => {
      this.menu.render("tarefas");
      this.tarefas.render();
    });
  }
  usuarioEvents() {
    this.usuario.on("error", () => {
      alert("Erro carregar usuário");
    });
    this.usuario.on("remove-error", () => {
      alert("Erro ao excluir conta");
    });
    this.usuario.on("remove-conta", () => {
      alert("Que pena! Sua conta foi excluída.");
      localStorage.clear();
      this.menu.clear();
      this.entrar.render();
    });
  }
  menuEvents() {
    this.menu.on("click", (path) => {
      this.menu.render(path);
      this[path].render();
    });
    this.menu.on("sair", () => {
      localStorage.clear();
      this.menu.clear();
      this.entrar.render();
    });
  }
}
module.exports = App;