const renderTarefas = tarefas => {
  return tarefas.map(tarefa => {
    let feito = tarefa.feito ? "ios-checkmark" : "ios-circle-outline";
    
    return `<li class="item item-icon-left item-button-right">
      <i class="icon ion-${feito}" data-feito data-tarefa-feito="${tarefa.feito ? 'feito' : ''}" data-tarefa-_id="${tarefa._id}"></i> ${tarefa.titulo}
      <button data-remove data-tarefa-_id="${tarefa._id}" class="button button-assertive">
        <i class="ion-trash-a"></i>
      </button>
    </li>`;
  }).join("");
};

exports.render = tarefas => {
  if (tarefas && tarefas.length) {
    return `<ul class="list">${renderTarefas(tarefas)}</ul>`;
  }
  return `<h4 class="text-center">Nenhuma tarefa ainda</h4>`;
};