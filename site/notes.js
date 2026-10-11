document.documentElement.classList.add('notes-enhanced');
document.querySelector('#current-year')?.replaceChildren(String(new Date().getFullYear()));

const search = document.querySelector('.notes-search');
if (search) {
  const input = search.querySelector('input');
  const clear = search.querySelector('.clear-search');
  const entries = [...document.querySelectorAll('[data-note]')];
  const count = document.querySelector('.notes-result-count');
  const empty = document.querySelector('.notes-empty');
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase();
  function filterNotes() {
    const terms = normalize(input.value.trim()).split(/\s+/u).filter(Boolean);
    let visible = 0;
    entries.forEach(entry => {
      const matches = terms.every(term => normalize(entry.dataset.search).includes(term));
      entry.hidden = !matches;
      if (matches) visible += 1;
    });
    count.textContent = terms.length ? `找到 ${visible} 篇` : `共 ${entries.length} 篇`;
    empty.hidden = visible > 0;
    clear.hidden = input.value.length === 0;
    const url = new URL(location.href);
    if (input.value.trim()) url.searchParams.set('q', input.value.trim());
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
  }
  search.hidden = false;
  input.value = new URLSearchParams(location.search).get('q') || '';
  input.addEventListener('input', filterNotes);
  search.addEventListener('submit', event => { event.preventDefault(); filterNotes(); });
  clear.addEventListener('click', () => { input.value = ''; filterNotes(); input.focus(); });
  filterNotes();
}

const article = document.querySelector('.article-body');
if (article) {
  const toc = document.querySelector('.reading-toc');
  if (window.matchMedia('(max-width: 950px)').matches) toc.open = false;

  article.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;
    const language = [...code.classList].find(value => value.startsWith('language-'))?.slice(9) || 'code';
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    const toolbar = document.createElement('div');
    toolbar.className = 'code-toolbar';
    const label = document.createElement('span');
    label.textContent = language.toUpperCase();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = '复制代码';
    button.setAttribute('aria-label', `复制 ${language} 代码`);
    button.setAttribute('aria-live', 'polite');
    let reset;
    button.addEventListener('click', async () => {
      clearTimeout(reset);
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = '已复制 ✓';
      } catch {
        button.textContent = '请选中复制';
      }
      reset = setTimeout(() => { button.textContent = '复制代码'; }, 2200);
    });
    pre.tabIndex = 0;
    pre.setAttribute('aria-label', `${language} 代码示例，可横向滚动`);
    toolbar.append(label, button);
    pre.before(wrapper);
    wrapper.append(toolbar, pre);
  });

  article.querySelectorAll('table').forEach(table => {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll';
    table.before(wrapper);
    wrapper.append(table);
  });

  const headings = [...article.querySelectorAll('h2[id]')];
  const links = [...toc.querySelectorAll('a')];
  let frame = 0;
  function updateReadingPosition() {
    frame = 0;
    const bounds = article.getBoundingClientRect();
    const distance = Math.max(1, article.offsetHeight - innerHeight + 150);
    const progress = Math.max(0, Math.min(1, (150 - bounds.top) / distance));
    document.documentElement.style.setProperty('--reading-progress', `${progress * 100}%`);
    let current = headings[0]?.id;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= 175) current = heading.id;
      else break;
    }
    links.forEach(link => {
      if (decodeURIComponent(link.hash.slice(1)) === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function requestPosition() {
    if (!frame) frame = requestAnimationFrame(updateReadingPosition);
  }
  window.addEventListener('scroll', requestPosition, { passive: true });
  window.addEventListener('resize', requestPosition, { passive: true });
  updateReadingPosition();
}
