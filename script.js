const mobileToggle = document.getElementById('mobileToggle');
const mainNav = document.getElementById('mainNav');

if (mobileToggle && mainNav) {
  mobileToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
    mobileToggle.classList.toggle('active');
  });
}

document.querySelectorAll('.slider-btn').forEach((button) => {
  button.addEventListener('click', () => {
    const trackId = button.dataset.track;
    const track = document.getElementById(trackId);

    if (!track) return;

    const amount = track.clientWidth * 0.85;
    const direction = button.classList.contains('next') ? amount : -amount;
    track.scrollBy({ left: direction, behavior: 'smooth' });
  });
});
