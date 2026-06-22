// inline ascii players for the tapes page.
// each .tape row owns its own <audio>; only one plays at a time.
(function () {
  function fmt(t) {
    if (isNaN(t) || !isFinite(t)) return "--:--";
    t = Math.max(0, Math.floor(t));
    var m = Math.floor(t / 60);
    var s = t % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  var players = [];

  function setup(tape) {
    var audio = tape.querySelector("audio");
    var btn = tape.querySelector(".tapePlay");
    var bar = tape.querySelector(".tapeBar");
    var timeEl = tape.querySelector(".tapeTime");
    if (!audio || !btn || !bar || !timeEl) return;
    // the clock is split into two spans so mobile can hide the elapsed half
    // (.tapeElapsed) and show the total alone; both may be absent for tapes with
    // no known duration.
    var elapsedEl = tape.querySelector(".tapeElapsed");
    var totalEl = tape.querySelector(".tapeTotal");

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

    // total duration comes from the tape's front matter (data-duration, in
    // seconds) so the readout is right instantly and with JS off; prefer the
    // precise value from the file's metadata once it has loaded.
    var dataDur = parseFloat(tape.getAttribute("data-duration"));
    function dur() {
      if (audio.duration && isFinite(audio.duration)) return audio.duration;
      return isFinite(dataDur) ? dataDur : NaN;
    }

    function fraction() {
      var d = dur();
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

    // desktop shows "elapsed / total" (idle = 00:00 / dur); split across two spans
    // so mobile can drop the elapsed half. update total always; elapsed only when
    // its span exists (tapes without a duration render the total alone).
    function renderTime() {
      if (totalEl) totalEl.textContent = fmt(dur());
      if (elapsedEl) elapsedEl.textContent = fmt(audio.currentTime) + " / ";
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

    players.push({ tape: tape, audio: audio, layout: layout, reset: reset });

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
      var d = dur();
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

  function normalizeNumbers(tapes) {
    var max = 0;
    for (var i = 0; i < tapes.length; i++) {
      var numberEl = tapes[i].querySelector(".tapeNumber");
      if (!numberEl) continue;
      var n = parseInt(numberEl.getAttribute("data-number") || numberEl.textContent, 10);
      if (isFinite(n)) max = Math.max(max, n);
    }

    var digits = String(max || tapes.length).length;
    for (var j = 0; j < tapes.length; j++) {
      var el = tapes[j].querySelector(".tapeNumber");
      if (!el) continue;
      var num = parseInt(el.getAttribute("data-number") || el.textContent, 10);
      if (isFinite(num)) el.textContent = String(num).padStart(digits, "0") + ".";
    }
  }

  function setupPagination(tapes) {
    var body = document.getElementById("tapesBody");
    var listings = document.getElementById("tapeListings");
    var pager = document.getElementById("tapePager");
    var prev = document.getElementById("tapePrev");
    var next = document.getElementById("tapeNext");
    var status = document.getElementById("tapePageStatus");
    var boombox = document.getElementById("boombox");
    if (!body || !listings || !pager || !prev || !next || !status || tapes.length === 0) return;

    var pageSize = tapes.length;
    var currentPage = 0;
    var scheduled = false;

    function bodyBottom() {
      var rect = body.getBoundingClientRect();
      var minHeight = parseFloat(body.style.minHeight);
      if (!isFinite(minHeight) || minHeight <= 0) minHeight = rect.height;
      return rect.top + minHeight;
    }

    function boomboxHeight() {
      return boombox ? boombox.getBoundingClientRect().height : 0;
    }

    function rowHeight() {
      for (var i = 0; i < tapes.length; i++) {
        if (tapes[i].hidden) continue;
        var h = tapes[i].getBoundingClientRect().height;
        if (h > 0) return h;
      }

      var first = tapes[0];
      var wasHidden = first.hidden;
      var oldVisibility = first.style.visibility;
      if (wasHidden) {
        first.hidden = false;
        first.style.visibility = "hidden";
      }
      var measured = first.getBoundingClientRect().height;
      if (wasHidden) first.hidden = true;
      first.style.visibility = oldVisibility;
      return measured || 1;
    }

    function measurePageSize(showPager) {
      var wasHidden = pager.hidden;
      var oldVisibility = pager.style.visibility;

      pager.hidden = !showPager;
      pager.style.visibility = showPager ? "hidden" : oldVisibility;

      var available = bodyBottom() - listings.getBoundingClientRect().top - boomboxHeight();
      var h = rowHeight();

      pager.hidden = wasHidden;
      pager.style.visibility = oldVisibility;

      return Math.max(1, Math.floor(available / h));
    }

    function calculatePageSize() {
      var noPagerSize = measurePageSize(false);
      if (noPagerSize >= tapes.length) return tapes.length;
      return measurePageSize(true);
    }

    function render() {
      var totalPages = Math.max(1, Math.ceil(tapes.length / pageSize));
      currentPage = Math.max(0, Math.min(currentPage, totalPages - 1));
      var start = currentPage * pageSize;
      var end = Math.min(tapes.length, start + pageSize);

      for (var i = 0; i < tapes.length; i++) {
        var visible = i >= start && i < end;
        tapes[i].hidden = !visible;
        if (!visible && players[i]) players[i].reset();
      }

      pager.hidden = totalPages <= 1;
      prev.disabled = currentPage === 0;
      next.disabled = currentPage >= totalPages - 1;
      status.textContent = (currentPage + 1) + " / " + totalPages;
      layoutAll();
    }

    function repaginate() {
      scheduled = false;
      var firstVisible = currentPage * pageSize;
      var nextPageSize = calculatePageSize();
      if (nextPageSize !== pageSize) {
        pageSize = nextPageSize;
        currentPage = Math.floor(firstVisible / pageSize);
      }
      render();
    }

    function scheduleRepaginate() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(repaginate);
    }

    prev.addEventListener("click", function () {
      if (currentPage <= 0) return;
      currentPage--;
      render();
    });

    next.addEventListener("click", function () {
      if (currentPage >= Math.ceil(tapes.length / pageSize) - 1) return;
      currentPage++;
      render();
    });

    window.addEventListener("resize", scheduleRepaginate);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleRepaginate);
    }
    repaginate();
  }

  // bar width changes with the viewport; the monospace char width changes once
  // the webfont swaps in — re-measure on both.
  window.addEventListener("resize", layoutAll);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(layoutAll);
  }

  function init() {
    var tapes = document.querySelectorAll(".tape");
    normalizeNumbers(tapes);
    for (var i = 0; i < tapes.length; i++) setup(tapes[i]);
    setupPagination(tapes);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
