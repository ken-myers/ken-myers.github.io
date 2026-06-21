// inline ascii players for the tapes page.
// each .tape row owns its own <audio>; only one plays at a time.
(function () {
  function fmt(t) {
    if (isNaN(t) || !isFinite(t)) return "--:--";
    t = Math.max(0, Math.floor(t));
    var m = Math.floor(t / 60);
    var s = t % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  var players = [];

  function setup(tape) {
    var audio = tape.querySelector("audio");
    var btn = tape.querySelector(".tapePlay");
    var bar = tape.querySelector(".tapeBar");
    var timeEl = tape.querySelector(".tapeTime");
    if (!audio || !btn || !bar || !timeEl) return;

    // bar = "[" + fill + rest + "]" ; only the two inner spans change.
    var fill = document.createElement("span");
    fill.className = "tapeBarFill";
    var rest = document.createElement("span");
    rest.className = "tapeBarRest";
    bar.textContent = "";
    bar.appendChild(document.createTextNode("["));
    bar.appendChild(fill);
    bar.appendChild(rest);
    bar.appendChild(document.createTextNode("]"));

    var cells = 1; // recomputed by layout() from the bar's actual width

    function fraction() {
      var d = audio.duration;
      if (!d || !isFinite(d)) return 0;
      return Math.max(0, Math.min(1, audio.currentTime / d));
    }

    // the bar is flex-grow, so its pixel width = whatever space is left in the
    // row. measure one monospace char in that exact font and print enough
    // "=/-" cells to span the box (minus the two bracket chars).
    function measureCells() {
      var box = bar.getBoundingClientRect().width;
      if (!box) return cells;
      var ruler = document.createElement("span");
      ruler.textContent = "0000000000";
      ruler.style.visibility = "hidden";
      ruler.style.position = "absolute";
      ruler.style.whiteSpace = "pre";
      bar.appendChild(ruler);
      var chw = ruler.getBoundingClientRect().width / 10;
      bar.removeChild(ruler);
      if (!chw) return cells;
      return Math.max(2, Math.floor(box / chw) - 2);
    }

    function renderBar() {
      var filled = Math.round(fraction() * cells);
      fill.textContent = "#".repeat(filled);
      rest.textContent = "·".repeat(cells - filled);
    }

    // always elapsed / total (idle = 0:00 / dur) so the readout never changes width.
    function renderTime() {
      timeEl.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration);
    }

    function renderBtn() {
      var playing = !audio.paused && !audio.ended;
      // single-width glyphs so both states are the same width: play = U+25B6
      // triangle (+U+FE0E forces text, not colour emoji); pause = U+2016 double
      // bar (the font has no U+23F8 pause glyph, so that rendered blank).
      btn.textContent = playing ? "[‖]" : "[▶︎]";
      btn.setAttribute("aria-label", playing ? "pause" : "play");
    }

    function render() {
      renderBar();
      renderTime();
    }

    function layout() {
      cells = measureCells();
      renderBar();
    }

    function reset() {
      audio.pause();
      if (audio.currentTime !== 0) audio.currentTime = 0;
      render();
      renderBtn();
    }

    players.push({ audio: audio, layout: layout, reset: reset });

    // drive the bar from requestAnimationFrame while playing (~60fps) instead
    // of the "timeupdate" event (~4fps), so progress advances one cell at a
    // time smoothly instead of jumping several cells per tick on short clips.
    var raf = null;
    function tick() {
      render();
      raf = (!audio.paused && !audio.ended) ? requestAnimationFrame(tick) : null;
    }
    function startTick() { if (raf == null) raf = requestAnimationFrame(tick); }
    function stopTick() { if (raf != null) { cancelAnimationFrame(raf); raf = null; } }

    audio.addEventListener("loadedmetadata", render);
    audio.addEventListener("play", function () {
      for (var i = 0; i < players.length; i++) {
        if (players[i].audio !== audio) players[i].reset();
      }
      renderBtn();
      startTick();
    });
    audio.addEventListener("pause", function () { stopTick(); render(); renderBtn(); });
    audio.addEventListener("ended", function () {
      stopTick();
      render();      // hold the bar full at the end; don't rewind to empty
      renderBtn();
    });

    btn.addEventListener("click", function () {
      if (audio.paused) {
        if (audio.ended) audio.currentTime = 0; // replay from the top after it finished
        audio.play();
      } else {
        audio.pause();
      }
    });

    // click anywhere on the bar to seek; measured over the cell region
    // (between the brackets) so it maps cleanly to playback position.
    bar.addEventListener("click", function (e) {
      var d = audio.duration;
      if (!d || !isFinite(d)) return;
      var startX = fill.getBoundingClientRect().left;
      var endX = rest.getBoundingClientRect().right;
      var span = endX - startX;
      if (span <= 0) return;
      var frac = Math.max(0, Math.min(1, (e.clientX - startX) / span));
      audio.currentTime = frac * d;
      render();
    });

    // initial paint
    layout();
    renderTime();
    renderBtn();
  }

  function layoutAll() {
    for (var i = 0; i < players.length; i++) players[i].layout();
  }

  // bar width changes with the viewport; the monospace char width changes once
  // the webfont swaps in — re-measure on both.
  window.addEventListener("resize", layoutAll);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(layoutAll);
  }

  function init() {
    var tapes = document.querySelectorAll(".tape");
    for (var i = 0; i < tapes.length; i++) setup(tapes[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
