exports.render = () => {
  return `<form>
    <div class="list">
      <label class="item item-input item-stacked-label">
        <span class="input-label">Nome</span>
        <input type="text" data-nome>
      </label>
      <label class="item item-input item-stacked-label">
        <span class="input-label">E-mail</span>
        <input type="text" data-email>
      </label>
      <label class="item item-input item-stacked-label">
        <span class="input-label">Senha</span>
        <input type="password" data-senha>
      </label>
    </div>
    <div class="padding">
      <button class="button button-positive button-block">
        <i class="ion-thumbsup"></i> Cadastrar
      </button>
    </div>
  </form>`;
};