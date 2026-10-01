import { db } from './supabase.js';

const search = document.querySelector('#project-search');
const list = document.querySelector('#live-projects');
const count = document.querySelector('#project-count');
const filters = document.querySelectorAll('[data-filter]');
let projects = [];
let category = 'all';

function projectLink(slug) {
  const known = {
    'vedoy-it': 'https://www.vedoyassist.no/',
    'vedoy-collective': 'https://vedoycollective.no/',
    'vedoy-oauth': 'https://www.vedoystudio.no/developers',
    'omnicart-tycoon': 'https://www.vedoystudio.no/',
    'apper-og-spill': 'https://www.vedoystudio.no/'
  };
  return known[slug] || '';
}

function render() {
  const term = search.value.trim().toLocaleLowerCase('no');
  const shown = projects.filter(p => (category === 'all' || p.category === category) && `${p.title} ${p.category} ${p.summary}`.toLocaleLowerCase('no').includes(term));
  list.replaceChildren(...shown.map(p => {
    const article = document.createElement('article');
    article.className = 'live-project vd-card';
    article.style.setProperty('--card-accent', /^#[0-9a-f]{6}$/i.test(p.accent) ? p.accent : '#eb6e66');
    const meta = document.createElement('p'); meta.className = 'live-project-meta'; meta.textContent = `${p.category} / ${p.status}`;
    const title = document.createElement('h3'); title.textContent = p.title;
    const summary = document.createElement('p'); summary.textContent = p.summary;
    article.append(meta, title, summary);
    const href = projectLink(p.slug);
    if (href) { const link = document.createElement('a'); link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Utforsk ↗'; article.append(link); }
    return article;
  }));
  count.textContent = `${shown.length} prosjekter`;
}

filters.forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  render();
}));
search.addEventListener('input', render);
const { data, error } = await db.from('projects').select('slug,title,category,summary,status,accent,sort_order').eq('is_published', true).order('sort_order');
if (error) count.textContent = 'Prosjektlisten kunne ikke lastes akkurat nå.';
else { projects = data || []; render(); }
