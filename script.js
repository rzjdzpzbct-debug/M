const cards = document.querySelectorAll('.card-verse');

cards.forEach((card) => {
  card.addEventListener('click', () => {
    cards.forEach((item) => item.classList.remove('active'));
    card.classList.add('active');
  });
});

const selector = document.querySelector('.play-right select');
if (selector) {
  selector.addEventListener('change', (event) => {
    const value = event.target.value;
    document.querySelector('.player-title').textContent = value;
  });
}

const tabs = document.querySelectorAll('.tab-pill');
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => item.classList.add('muted'));
    tab.classList.remove('muted');
  });
});
