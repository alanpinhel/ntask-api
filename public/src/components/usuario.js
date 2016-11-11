import NTask from "../ntask.js";
import Template from "../templates/usuario.js";

class Usuario extends NTask {
  constructor(body) {
    super();
    this.body = body;
  }
  render() {
    this.renderUsuarioDados();
  }
  addEventListener() {
    this.usuarioCancelarClick();
  }
  renderUsuarioDados() {
    const opcoes = {
      method: "GET",
      url: `${this.URL}/usuario`,
      json: true,
      headers: {
        authorization: localStorage.getItem("token")
      }
    };
    this.request(opcoes, (err, res, data) => {
      if (err || res.status === 412) {
        this.emit("error", err);
      }
      else {
        this.body.innerHTML = Template.render(data);
        this.addEventListener();
      }
    });
  }
  usuarioCancelarClick() {
    const button = this.body.querySelector("[data-remove-conta]");
    
    button.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Tem certeza que deseja excluír sua conta?")) {
        const opcoes = {
          method: "DELETE",
          url: `${this.URL}/usuario`,
          headers: {
            authorization: localStorage.getItem("token")
          }
        };
        this.request(opcoes, (err, res, data) => {
          if (err || res.status === 412) {
            this.emit("remove-error", err);
          }
          else {
            this.emit("remove-conta");
          }
        });
      }
    });
  }
}
module.exports = Usuario;