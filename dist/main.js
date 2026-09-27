const snippets = {
  fetch: { title: 'Hent data trygt', code: `async function hentData(url) {\n  const response = await fetch(url);\n  if (!response.ok) {\n    throw new Error(\`HTTP \${response.status}\`);\n  }\n  return response.json();\n}` },
  css: { title: 'Responsivt kortoppsett', code: `.kort-grid {\n  display: grid;\n  grid-template-columns: repeat(\n    auto-fit, minmax(min(100%, 18rem), 1fr)\n  );\n  gap: 1rem;\n}` },
  debug: { title: 'Finn feilen raskere', code: `try {\n  const resultat = await hentData(url);\n  console.log('Svar:', resultat);\n} catch (error) {\n  console.error('Forespørselen feilet:', error);\n}` }
};

const snippetCode = document.querySelector('#snippet-code');
const snippetTitle = document.querySelector('#snippet-title');
const topicButtons = document.querySelectorAll('[data-topic]');
const copyButton = document.querySelector('#copy-snippet');
let activeTopic = 'fetch';

function setTopic(topic) {
  activeTopic = topic;
  snippetCode.textContent = snippets[topic].code;
  snippetTitle.textContent = snippets[topic].title;
  topicButtons.forEach(button => {
    const selected = button.dataset.topic === topic;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  copyButton.textContent = 'Kopier ↗';
}

topicButtons.forEach((button, index) => {
  button.addEventListener('click', () => setTopic(button.dataset.topic));
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let next = event.key === 'Home' ? 0 : event.key === 'End' ? topicButtons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + topicButtons.length) % topicButtons.length;
    topicButtons[next].focus();
    setTopic(topicButtons[next].dataset.topic);
  });
});
setTopic(activeTopic);

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(snippets[activeTopic].code);
    copyButton.textContent = 'Kopiert ✓';
  } catch {
    copyButton.textContent = 'Kunne ikke kopiere';
  }
});

const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Lukk meny' : 'Åpne meny');
  mobileMenu.hidden = !open;
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Åpne meny');
}));

document.querySelector('#year').textContent = new Date().getFullYear();

// Motion adds subtle entrance animation. Content stays visible if the library is unavailable.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  import('https://cdn.jsdelivr.net/npm/motion@latest/+esm').then(({ animate, inView }) => {
    document.querySelectorAll('.reveal').forEach((element, index) => {
      if (element.closest('.hero')) {
        animate(element, { opacity: [0, 1], y: [28, 0] }, { duration: 0.8, delay: Math.min(index * 0.1, 0.35), ease: [0.22, 1, 0.36, 1] });
      } else {
        inView(element, () => {
          animate(element, { opacity: [0, 1], y: [34, 0] }, { duration: 0.75, ease: [0.22, 1, 0.36, 1] });
        }, { margin: '0px 0px -70px 0px', amount: 0.1 });
      }
    });
    const visual = document.querySelector('.visual-v');
    if (visual) animate(visual, { rotate: [-5, 5, -5] }, { duration: 9, repeat: Infinity, ease: 'easeInOut' });
  }).catch(() => {});
}
