exports.render = usuario => {
  return `<div>
    <label class="item item-input item-stacked-label">
      <span class="input-label">Nome</span>
      <small class="dark">${usuario.nome}</small>
    </label>
    <label class="item item-input item-stacked-label">
      <span class="input-label">E-mail</span>
      <small class="dark">${usuario.email}</smal>
    </label>
  </div>
  <div class="padding">
    <button data-remove-conta class="button button-assertive button-block">
      <i class="ion-trash-a"></i> Excluir conta
    </button>
  </div>`;
};