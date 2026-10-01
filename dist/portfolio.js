import { db } from './supabase.js';

const search = document.querySelector('#project-search');
const list = document.querySelector('#live-projects');
const count = document.querySelector('#project-count');
const filterGroup = document.querySelector('#project-filters');
const featured = document.querySelector('#featured-projects');
const featuredCards = [...featured.querySelectorAll('[data-project-slug]')];
const featuredSlugs = new Set(featuredCards.map(card => card.dataset.projectSlug));
let projects = [];
let category = 'all';

function projectLink(url) {
  try { const parsed = new URL(url); return parsed.protocol === 'https:' ? parsed.href : ''; }
  catch { return ''; }
}

function render() {
  const term = search.value.trim().toLocaleLowerCase('no');
  const shown = projects.filter(p => (category === 'all' || p.category === category) && `${p.title} ${p.category} ${p.summary}`.toLocaleLowerCase('no').includes(term));
  featuredCards.forEach(card => {
    const project = shown.find(p => p.slug === card.dataset.projectSlug);
    card.hidden = !project;
    if (!project) return;
    card.querySelector('h3').textContent = project.title;
    card.querySelector('.project-card-bottom p').textContent = project.summary;
    card.querySelector('.tag').textContent = project.category;
    card.querySelector('.project-status').textContent = `${project.status} ↗`;
    const href = projectLink(project.external_url);
    if (href) card.href = href; else card.removeAttribute('href');
  });
  featured.hidden = featuredCards.every(card => card.hidden);
  list.replaceChildren(...shown.filter(p => !featuredSlugs.has(p.slug)).map(p => {
    const article = document.createElement('article');
    article.className = 'live-project vd-card';
    article.style.setProperty('--card-accent', /^#[0-9a-f]{6}$/i.test(p.accent) ? p.accent : '#eb6e66');
    const meta = document.createElement('p'); meta.className = 'live-project-meta'; meta.textContent = `${p.category} / ${p.status}`;
    const title = document.createElement('h3'); title.textContent = p.title;
    const summary = document.createElement('p'); summary.textContent = p.summary;
    article.append(meta, title, summary);
    const href = projectLink(p.external_url);
    if (href) { const link = document.createElement('a'); link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Utforsk ↗'; article.append(link); }
    return article;
  }));
  count.textContent = `${shown.length} ${shown.length === 1 ? 'prosjekt' : 'prosjekter'}`;
}

search.addEventListener('input', render);
const { data, error } = await db.from('projects').select('slug,title,category,summary,status,accent,sort_order,external_url').eq('is_published', true).order('sort_order');
if (error) count.textContent = 'Prosjektlisten kunne ikke lastes akkurat nå.';
else {
  projects = data || [];
  filterGroup.replaceChildren(...['all', ...new Set(projects.map(p => p.category))].map(value => {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.filter = value;
    button.textContent = value === 'all' ? 'Alle' : value; button.setAttribute('aria-pressed', String(value === category));
    button.addEventListener('click', () => { category = value; filterGroup.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button))); render(); });
    return button;
  }));
  render();
}
