import NTask from "../ntask.js";
import Template from "../templates/tarefaForm.js";

class TarefaForm extends NTask {
  constructor(body) {
    super();
    this.body = body;
  }
  render() {
    this.body.innerHTML = Template.render();
    this.body.querySelector("[data-tarefa]").focus();
    this.addEventListener();
  }
  addEventListener() {
    this.formSubmit();
  }
  formSubmit() {
    const form = this.body.querySelector("form");
    
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const tarefa = e.target.querySelector("[data-tarefa]");
      const opcoes = {
        method: "POST",
        url: `${this.URL}/tarefas`,
        json: true,
        headers: {
          authorization: localStorage.getItem("token")
        },
        body: {
          titulo: tarefa.value
        }
      };
      this.request(opcoes, (err, res, data) => {
        if (err || res.status === 412) {
          this.emit("error");
        }
        else {
          this.emit("submit");
        }
      });
    });
  }
}
module.exports = TarefaForm;