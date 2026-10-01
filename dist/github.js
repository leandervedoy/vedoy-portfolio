const trigger = document.querySelector('#load-github');
const output = document.querySelector('#github-projects');
trigger?.addEventListener('click', async () => {
  trigger.disabled = true;
  output.textContent = 'Henter åpne prosjekter fra GitHub …';
  try {
    const response = await fetch('https://api.github.com/users/leandervedoy/repos?type=owner&sort=updated&per_page=6', { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('GitHub svarte ikke. Prøv igjen senere eller åpne profilen.');
    const repos = await response.json();
    if (!Array.isArray(repos)) throw new Error('Kunne ikke lese GitHub-svaret.');
    output.replaceChildren(...repos.filter(repo => !repo.fork).map(repo => {
      const item = document.createElement('li'); const link = document.createElement('a');
      // Links are limited to this account, even if an upstream response is malformed.
      link.href = `https://github.com/leandervedoy/${encodeURIComponent(repo.name)}`;
      link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = `${repo.name} ↗`;
      const info = document.createElement('small'); info.textContent = repo.description || repo.language || 'Åpent prosjekt';
      item.append(link, info); return item;
    }));
    if (!output.children.length) output.textContent = 'Ingen åpne prosjekter i svaret.';
    trigger.textContent = 'Oppdater fra GitHub ↻';
  } catch (error) { output.textContent = error.message; }
  finally { trigger.disabled = false; }
});
