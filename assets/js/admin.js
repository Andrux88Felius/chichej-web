document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-filter-scope]').forEach((scope) => {
    const search = scope.querySelector('[data-filter-search]');
    const filterbar = scope.querySelector('.admin-filterbar');
    const moduleName = window.location.pathname.split('/').pop();
    let dateInput = null;
    if (filterbar && ['usuarios.php', 'pedidos.php', 'reservas.php'].includes(moduleName)) {
      const label = document.createElement('label');
      label.textContent = 'Fecha exacta';
      dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.setAttribute('aria-label', 'Filtrar por fecha exacta');
      label.appendChild(dateInput);
      filterbar.insertBefore(label, filterbar.querySelector('[data-filter-count]'));
    }
    const filters = Array.from(scope.querySelectorAll('[data-filter-key]'));
    const rows = Array.from(scope.querySelectorAll('[data-filter-row]'));
    const count = scope.querySelector('[data-filter-count]');
    const empty = scope.querySelector('[data-filter-empty]');
    const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const apply = () => {
      const term = normalize(search?.value);
      let visible = 0;
      rows.forEach((row) => {
        const matchesText = !term || normalize(row.dataset.search).includes(term);
        const matchesFilters = filters.every((filter) => {
          const expected = normalize(filter.value);
          const actual = normalize(row.dataset[filter.dataset.filterKey]);
          return !expected || actual.split('|').includes(expected);
        });
        const dateNeedle = dateInput?.value ? dateInput.value.split('-').reverse().join('/') : '';
        const matchesDate = !dateNeedle || normalize(row.textContent).includes(dateNeedle);
        const show = matchesText && matchesFilters && matchesDate;
        row.hidden = !show;
        if (show) visible += 1;
      });
      if (count) count.textContent = `${visible} registro${visible === 1 ? '' : 's'}`;
      if (empty) empty.hidden = visible !== 0;
    };
    search?.addEventListener('input', apply);
    filters.forEach((filter) => filter.addEventListener('change', apply));
    dateInput?.addEventListener('change', apply);
    apply();
  });
});
