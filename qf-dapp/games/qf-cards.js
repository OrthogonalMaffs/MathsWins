/* ══════════════════════════════════════════════════════════════════════
   QF Cards — Shared Card Rendering Module (Sabre Theme)
   Used by: FreeCell, Cribbage Solitaire, Poker Patience, Golf, Pyramid

   Card values: 0–51
     Suit = Math.floor(c / 13)  →  0=Clubs, 1=Diamonds, 2=Hearts, 3=Spades
     Rank = c % 13              →  0=A, 1=2, ..., 9=10, 10=J, 11=Q, 12=K

   Usage:
     <link rel="stylesheet" href="../qf-cards.css">
     <script src="../qf-cards.js"></script>
     var el = QFCards.createCardEl(cardVal);
     var back = QFCards.createCardBack();
   ══════════════════════════════════════════════════════════════════════ */

var QFCards = (function() {
  'use strict';

  var SUIT_SYMBOLS = ['\u2663', '\u2666', '\u2665', '\u2660']; // ♣ ♦ ♥ ♠
  var RANK_NAMES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  var SUIT_NAMES = ['clubs','diamonds','hearts','spades'];

  function cardSuit(c)   { return Math.floor(c / 13); }
  function cardRank(c)   { return c % 13; }
  function cardColor(c)  { var s = cardSuit(c); return (s === 1 || s === 2) ? 1 : 0; }
  function suitSymbol(c) { return SUIT_SYMBOLS[cardSuit(c)]; }
  function rankName(c)   { return RANK_NAMES[cardRank(c)]; }
  function suitName(c)   { return SUIT_NAMES[cardSuit(c)]; }
  function suitClass(c)  { return cardColor(c) === 1 ? 'red-suit' : 'black-suit'; }

  function renderPips(cardVal, cardEl) {
    var rank = cardRank(cardVal);
    var color = cardColor(cardVal) === 1 ? 'var(--ink-red)' : 'var(--ink-black)';
    var sym = suitSymbol(cardVal);

    var pip_area = document.createElement('div');
    pip_area.className = 'pip-area';
    cardEl.appendChild(pip_area);

    // Face cards (J=10, Q=11, K=12)
    if (rank >= 10) {
      var face = document.createElement('div');
      face.className = 'card-face-letter';
      face.textContent = RANK_NAMES[rank];
      face.style.color = color;
      var faceSuit = document.createElement('span');
      faceSuit.className = 'card-face-suit';
      faceSuit.textContent = sym;
      faceSuit.style.color = color;
      face.appendChild(faceSuit);
      pip_area.appendChild(face);
      return;
    }

    // Number cards (A–10): single centred watermark suit symbol
    var wm = document.createElement('span');
    wm.className = 'card-watermark';
    wm.textContent = sym;
    wm.style.color = color;
    pip_area.appendChild(wm);
  }

  function createCardEl(cardVal) {
    var div = document.createElement('div');
    var sc = suitClass(cardVal);
    div.className = 'card ' + sc;
    div.dataset.card = cardVal;

    // Top-left index
    var tl = document.createElement('div');
    tl.className = 'card-tl';
    tl.innerHTML = '<span class="card-rank">' + rankName(cardVal) + '</span>' +
                   '<span class="card-suit-idx">' + suitSymbol(cardVal) + '</span>';
    div.appendChild(tl);

    // Bottom-right index (rotated)
    var br = document.createElement('div');
    br.className = 'card-br';
    br.innerHTML = '<span class="card-rank">' + rankName(cardVal) + '</span>' +
                   '<span class="card-suit-idx">' + suitSymbol(cardVal) + '</span>';
    div.appendChild(br);

    // Centre area
    renderPips(cardVal, div);

    return div;
  }

  function createCardBack() {
    var div = document.createElement('div');
    div.className = 'card-back';
    return div;
  }

  // Build a standard 52-card deck (0–51)
  function createDeck() {
    var deck = [];
    for (var i = 0; i < 52; i++) deck.push(i);
    return deck;
  }

  // Fisher-Yates shuffle with optional seeded RNG
  function shuffleDeck(deck, rngFn) {
    var rng = rngFn || Math.random;
    var a = deck.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  // Convert card value to short string (e.g. "Ah", "10s", "Kd")
  function cardToStr(c) {
    var suitChar = ['c','d','h','s'][cardSuit(c)];
    return RANK_NAMES[cardRank(c)] + suitChar;
  }

  // Convert short string back to card value
  function strToCard(str) {
    var suitChar = str[str.length - 1];
    var rankStr = str.slice(0, -1);
    var suitIdx = ['c','d','h','s'].indexOf(suitChar);
    var rankIdx = RANK_NAMES.indexOf(rankStr);
    if (suitIdx < 0 || rankIdx < 0) return -1;
    return suitIdx * 13 + rankIdx;
  }

  // Public API
  return {
    createCardEl: createCardEl,
    createCardBack: createCardBack,
    createDeck: createDeck,
    shuffleDeck: shuffleDeck,
    cardSuit: cardSuit,
    cardRank: cardRank,
    cardColor: cardColor,
    suitSymbol: suitSymbol,
    suitName: suitName,
    rankName: rankName,
    suitClass: suitClass,
    cardToStr: cardToStr,
    strToCard: strToCard,
    SUIT_SYMBOLS: SUIT_SYMBOLS,
    RANK_NAMES: RANK_NAMES,
    SUIT_NAMES: SUIT_NAMES
  };
})();
