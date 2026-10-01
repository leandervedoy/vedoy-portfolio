import { db } from './supabase.js';

const $ = selector => document.querySelector(selector);
const message = (text, login = false) => { $(login ? '#login-status' : '#dashboard-status').textContent = text; };
const nok = minor => new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' }).format(minor / 100);
let projects = [];
let entries = [];

function row(title, subtitle, actions) {
  const article = document.createElement('article'); article.className = 'admin-row';
  const content = document.createElement('div'); const heading = document.createElement('h3'); heading.textContent = title;
  const small = document.createElement('p'); small.textContent = subtitle; content.append(heading, small);
  const buttons = document.createElement('div'); buttons.className = 'row-actions';
  actions.forEach(([label, handler]) => { const button = document.createElement('button'); button.textContent = label; button.addEventListener('click', handler); buttons.append(button); });
  article.append(content, buttons); return article;
}

async function loadProjects() {
  const { data, error } = await db.from('projects').select('*').order('sort_order');
  if (error) return message(error.message);
  projects = data || [];
  $('#project-list').replaceChildren(...projects.map(p => row(p.title, `${p.category} · ${p.is_published ? 'Publisert' : 'Arkivert'} · ${p.status}`, [
    ['Rediger', () => editProject(p)],
    [p.is_published ? 'Arkiver' : 'Publiser', () => toggleProject(p)]
  ])));
}

function editProject(p) {
  $('#project-form').hidden = false;
  $('#editor-heading').textContent = p ? 'Rediger prosjekt' : 'Nytt prosjekt';
  $('#project-id').value = p?.id || '';
  $('#project-title').value = p?.title || '';
  $('#project-slug').value = p?.slug || '';
  $('#project-category').value = p?.category || '';
  $('#project-status').value = p?.status || '';
  $('#project-summary').value = p?.summary || '';
  $('#project-url').value = p?.external_url || '';
  $('#project-accent').value = /^#[0-9a-f]{6}$/i.test(p?.accent) ? p.accent : '#eb6e66';
  $('#project-order').value = p?.sort_order ?? 100;
  $('#project-published').checked = p?.is_published || false;
  $('#project-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function toggleProject(p) {
  const { error } = await db.from('projects').update({ is_published: !p.is_published }).eq('id', p.id);
  if (error) return message(error.message);
  message(`${p.title} er ${p.is_published ? 'arkivert' : 'publisert'}.`); await loadProjects();
}

$('#new-project').addEventListener('click', () => editProject(null));
$('#cancel-project').addEventListener('click', () => { $('#project-form').hidden = true; });
$('#project-title').addEventListener('input', () => { if (!$('#project-id').value) $('#project-slug').value = $('#project-title').value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/å/g, 'a').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); });
$('#project-form').addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('#project-id').value;
  const payload = { title: $('#project-title').value.trim(), slug: $('#project-slug').value.trim(), category: $('#project-category').value.trim(), status: $('#project-status').value.trim(), summary: $('#project-summary').value.trim(), accent: $('#project-accent').value, sort_order: Number($('#project-order').value), is_published: $('#project-published').checked };
  if (!id) payload.device_type = 'desktop';
  const url = $('#project-url').value.trim();
  if (url) {
    try { if (new URL(url).protocol !== 'https:') return message('Prosjektlenken må bruke HTTPS.'); }
    catch { return message('Skriv inn en gyldig prosjektlenke.'); }
  }
  payload.external_url = url || null;
  const { error } = id ? await db.from('projects').update(payload).eq('id', id) : await db.from('projects').insert(payload);
  if (error) return message(error.message);
  $('#project-form').hidden = true; message('Prosjektet er lagret.'); await loadProjects();
});

async function loadEconomy() {
  const { data: snapshots, error: snapshotError } = await db.from('vedoy_economy_snapshots').select('provider,account_name,period_start,period_end,currency,total_sales_minor,orders_count,fetched_at').order('fetched_at', { ascending: false });
  const snapshotList = $('#provider-snapshots');
  if (snapshotError) snapshotList.textContent = 'Salgsrapporten kunne ikke lastes.';
  else snapshotList.replaceChildren(...(snapshots || []).map(s => {
    const card = document.createElement('article'); card.className = 'provider-snapshot';
    const title = document.createElement('h3'); title.textContent = `${s.account_name} · Shopify`;
    const period = document.createElement('p'); period.textContent = `${s.period_start} – ${s.period_end}`;
    const value = document.createElement('strong'); value.textContent = `${new Intl.NumberFormat('nb-NO', { style: 'currency', currency: s.currency }).format(s.total_sales_minor / 100)} · ${s.orders_count} ordre`;
    const time = document.createElement('p'); time.textContent = `Hentet ${new Date(s.fetched_at).toLocaleString('nb-NO')}. Rapportimport via tilkoblet Shopify-app. Oppdateres ikke automatisk.`;
    card.append(title, period, value, time); return card;
  }));
  const { data, error } = await db.from('vedoy_economy_entries').select('id,kind,amount_minor,label,source,occurred_on').eq('currency', 'NOK').order('occurred_on', { ascending: false });
  if (error) return message(error.message);
  entries = data || [];
  const income = entries.filter(e => e.kind === 'income').reduce((a, e) => a + e.amount_minor, 0);
  const expense = entries.filter(e => e.kind === 'expense').reduce((a, e) => a + e.amount_minor, 0);
  $('#income-total').textContent = nok(income); $('#expense-total').textContent = nok(expense); $('#net-total').textContent = nok(income - expense);
  $('#entry-list').replaceChildren(...entries.map(e => row(e.label, `${e.occurred_on} · ${e.kind === 'income' ? 'Inntekt' : 'Utgift'} · ${e.source} · ${nok(e.amount_minor)}`, [['Slett', async () => {
    if (!confirm(`Slett posten «${e.label}»?`)) return;
    const { error: deleteError } = await db.from('vedoy_economy_entries').delete().eq('id', e.id);
    if (deleteError) message(deleteError.message); else await loadEconomy();
  }]])));
}

$('#entry-date').value = new Date().toISOString().slice(0, 10);
$('#entry-form').addEventListener('submit', async event => {
  event.preventDefault();
  const amount = Math.round(Number($('#entry-amount').value) * 100);
  if (!Number.isSafeInteger(amount) || amount < 0) return message('Ugyldig beløp.');
  const { error } = await db.from('vedoy_economy_entries').insert({ kind: $('#entry-kind').value, amount_minor: amount, currency: 'NOK', label: $('#entry-label').value.trim(), occurred_on: $('#entry-date').value, source: 'manual' });
  if (error) return message(error.message);
  $('#entry-form').reset(); $('#entry-date').value = new Date().toISOString().slice(0, 10); message('Økonomiposten er lagret.'); await loadEconomy();
});

document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
  const tab = button.dataset.tab;
  document.querySelectorAll('[data-tab]').forEach(item => item.setAttribute('aria-selected', String(item === button)));
  ['projects','economy','integrations'].forEach(name => { $(`#${name}-panel`).hidden = name !== tab; });
}));

$('#github-login').addEventListener('click', async () => {
  const { error } = await db.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: new URL('admin.html', location.href).href } });
  if (error) message(error.message, true);
});
$('#email-form').addEventListener('submit', async event => {
  event.preventDefault();
  const { error } = await db.auth.signInWithOtp({ email: $('#email').value.trim(), options: { emailRedirectTo: new URL('admin.html', location.href).href, shouldCreateUser: false } });
  message(error ? error.message : 'Innloggingslenken er sendt hvis kontoen finnes.', true);
});
$('#logout').addEventListener('click', async () => { await db.auth.signOut(); location.reload(); });

async function boot() {
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return;
  const { data: profile, error: profileError } = await db.from('vedoy_profiles').select('role').eq('id', user.id).single();
  if (profileError || profile?.role !== 'admin') { message('Kontoen har ikke administratortilgang.', true); return; }
  $('#login-panel').hidden = true; $('#dashboard').hidden = false; $('#logout').hidden = false;
  $('#signed-in-as').textContent = user.email || 'Administrator';
  await Promise.all([loadProjects(), loadEconomy()]);
}
boot();
