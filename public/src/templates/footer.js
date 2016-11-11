exports.render = path => {
  let eTarefas = path === "tarefas" ? "active" : "";
  let eTarefaForm = path === "tarefaForm" ? "active" : "";
  let eUsuario = path === "usuario" ? "active" : "";
  
  return `<div class="tabs-stripped tabs-color-calm">
    <div class="tabs">
      <a data-path="tarefas" class="tab-item ${eTarefas}">
        <i class="icon ion-home"></i>
      </a>
      <a data-path="tarefaForm" class="tab-item ${eTarefaForm}">
        <i class="icon ion-compose"></i>
      </a>
      <a data-path="usuario" class="tab-item ${eUsuario}">
        <i class="icon ion-person"></i>
      </a>
      <a data-sair class="tab-item">
        <i class="icon ion-android-exit"></i>
      </a>
    </div>
  </div>`;
};