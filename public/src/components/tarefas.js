import NTask from "../ntask.js";
import Template from "../templates/tarefas.js";

class Tarefas extends NTask {
  constructor(body) {
    super();
    this.body = body;
  }
  render() {
    this.renderTarefaList();
  }
  addEventListener() {
    this.tarefaFeitoCheckbox();
    this.tarefaRemoveClick();
  }
  renderTarefaList() {
    const opcoes = {
      method: "GET",
      url: `${this.URL}/tarefas`,
      json: true,
      headers: {
        authorization: localStorage.getItem("token")
      }
    };
    
    this.request(opcoes, (err, res, data) => {
      if (err) {
        this.emit("error", err);
      }
      else {
        this.body.innerHTML = Template.render(data);
        this.addEventListener();
      }
    });
  }
  tarefaFeitoCheckbox() {
    const feitos = this.body.querySelectorAll("[data-feito]");
    
    for (let i = 0, max = feitos.length; i < max; i++) {
      feitos[i].addEventListener("click", (e) => {
        e.preventDefault();
        
        const _id = e.target.getAttribute("data-tarefa-_id");
        const feito = e.target.getAttribute("data-tarefa-feito");
        const opcoes = {
          method: "PUT",
          url: `${this.URL}/tarefas/${_id}`,
          headers: {
            authorization: localStorage.getItem("token"),
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            feito: !feito
          })
        };
        this.request(opcoes, (err, res, data) => {
          if (err || res.status === 412) {
            this.emit("update-error", err);
          }
          else {
            this.emit("update");
          }
        });
      });
    }
  }
  tarefaRemoveClick() {
    const remover = this.body.querySelectorAll("[data-remove]");
    
    for (let i = 0, max = remover.length; i < max; i++) {
      remover[i].addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Deseja excluir está tarefa?")) {
          const _id = e.target.getAttribute("data-tarefa-_id");
          const opcoes = {
            method: "DELETE",
            url: `${this.URL}/tarefas/${_id}`,
            headers: {
              authorization: localStorage.getItem("token")
            }
          };
          this.request(opcoes, (err, res, data) => {
            if (err || res.status === 412) {
              this.emit("remove-error", err);
            }
            else {
              this.emit("remove");
            }
          });
        }
      });
    }
  }
}
module.exports = Tarefas;