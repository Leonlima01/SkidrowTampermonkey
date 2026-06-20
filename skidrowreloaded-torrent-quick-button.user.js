// ==UserScript==
// @name         Skidrow Reloaded - Botao rapido de torrent
// @namespace    local.codex.skidrowreloaded
// @version      1.0.1
// @downloadURL  https://github.com/Leonlima01/SkidrowTampermonkey/blob/main/skidrowreloaded-torrent-quick-button.user.js
// @updateURL    https://github.com/Leonlima01/SkidrowTampermonkey/blob/main/skidrowreloaded-torrent-quick-button.user.js
// @description  Adiciona um botao "TORRENT" ao lado de cada jogo na pagina principal do skidrowreloaded.com. O botao busca o link na pagina do jogo quando clicado.
// @author       Codex
// @match        *://skidrowreloaded.com/
// @match        *://www.skidrowreloaded.com/
// @match        *://skidrowreloaded.com/page/*
// @match        *://www.skidrowreloaded.com/page/*
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @connect      skidrowreloaded.com
// @connect      www.skidrowreloaded.com
// ==/UserScript==

(function () {
  "use strict";

  const BUTTON_CLASS = "sr-torrent-quick-button";
  const STATUS_CLASS = "sr-torrent-quick-status";
  const cache = new Map();

  addStyles();
  addButtonsToListing();

  function addButtonsToListing() {
    const posts = findListingPosts();

    posts.forEach((post) => {
      if (post.querySelector(`.${BUTTON_CLASS}`)) return;

      const gameLink = findGameLink(post);
      if (!gameLink) return;

      const target = findButtonTarget(post, gameLink);
      if (!target) return;

      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = BUTTON_CLASS;
      openButton.textContent = "TORRENT";

      openButton.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        try {
          const torrentUrl =
            cache.get(gameLink.href) || await fetchTorrentUrl(gameLink.href);

          cache.set(gameLink.href, torrentUrl);
          openUrl(torrentUrl);
        } catch (err) {
          console.error(err);
        }
      });

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = BUTTON_CLASS;
      copyButton.textContent = "COPIAR";
      copyButton.classList.add("sr-copy-button");

      copyButton.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        try {
          const torrentUrl =
            cache.get(gameLink.href) || await fetchTorrentUrl(gameLink.href);

          cache.set(gameLink.href, torrentUrl);

          await navigator.clipboard.writeText(torrentUrl);

          copyButton.textContent = "COPIADO!";

          setTimeout(() => {
            copyButton.textContent = "COPIAR";
          }, 1500);

        } catch (err) {
          console.error(err);

          copyButton.textContent = "ERRO";

          setTimeout(() => {
            copyButton.textContent = "COPIAR";
          }, 1500);
        }
      });

      const status = document.createElement("span");
      status.className = STATUS_CLASS;
      status.setAttribute("aria-live", "polite");

      const wrap = document.createElement("span");
      wrap.className = "sr-torrent-quick-wrap";
      wrap.append(openButton, copyButton, status);

      target.insertAdjacentElement("afterend", wrap);
    });
  }

  function findListingPosts() {
    const selectors = [
      ".post",
      ".entry",
      "article",
      "#content > div",
      ".content > div",
    ];

    const found = selectors
      .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
      .filter((element) => findGameLink(element));

    if (found.length > 0) {
      return uniqueElements(found);
    }

    return uniqueElements(
      Array.from(document.querySelectorAll("h1, h2, h3"))
        .map((heading) => heading.closest("div") || heading.parentElement)
        .filter(Boolean)
        .filter((element) => findGameLink(element)),
    );
  }

  function findGameLink(post) {
    const titleLink =
      post.querySelector("h1 a[href], h2 a[href], h3 a[href]") ||
      Array.from(post.querySelectorAll("a[href]")).find((link) =>
        looksLikeGamePostLink(link),
      );

    if (!titleLink) return null;

    const url = new URL(titleLink.href, location.href);
    if (url.origin !== location.origin) return null;
    if (!/\/[^/]+\/?$/.test(url.pathname)) return null;
    if (url.pathname.startsWith("/page/")) return null;

    return titleLink;
  }

  function looksLikeGamePostLink(link) {
    const text = normalize(link.textContent);
    if (text.length < 4) return false;
    if (/^(home|games list|pc games|pc repack|game updates|donate|dmca|request game)$/i.test(text)) {
      return false;
    }

    const url = new URL(link.href, location.href);
    return url.origin === location.origin && /\/[^/]+\/?$/.test(url.pathname);
  }

  function findButtonTarget(post, gameLink) {
    return (
      post.querySelector("h1, h2, h3") ||
      gameLink.closest("p") ||
      gameLink.parentElement
    );
  }

  async function openTorrentForGame(gameUrl, button) {
    const originalText = button.textContent;
    const status = button.parentElement.querySelector(`.${STATUS_CLASS}`);

    setButtonState(button, status, "loading", "Buscando...");

    try {
      const torrentUrl = cache.get(gameUrl) || await fetchTorrentUrl(gameUrl);
      cache.set(gameUrl, torrentUrl);

      setButtonState(button, status, "ready", "Abrindo");
      openUrl(torrentUrl);

      window.setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        status.textContent = "";
      }, 1200);
    } catch (error) {
      console.error("[Skidrow torrent quick button]", error);
      setButtonState(button, status, "error", "Nao achei");
      window.setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2500);
    }
  }

  function fetchTorrentUrl(gameUrl) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: gameUrl,
        timeout: 30000,
        onload: (response) => {
          try {
            const url = extractTorrentUrl(response.responseText, gameUrl);
            if (url) {
              resolve(url);
            } else {
              reject(new Error("Nenhum link de torrent encontrado."));
            }
          } catch (error) {
            reject(error);
          }
        },
        onerror: () => reject(new Error("Falha ao carregar pagina do jogo.")),
        ontimeout: () => reject(new Error("Tempo esgotado ao carregar pagina do jogo.")),
      });
    });
  }

  function extractTorrentUrl(html, gameUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const anchors = Array.from(doc.querySelectorAll("a[href]"));

    const candidates = anchors
      .map((anchor) => ({
        href: new URL(anchor.getAttribute("href"), gameUrl).href,
        text: normalize(anchor.textContent),
      }))
      .filter((item) => isTorrentCandidate(item.href, item.text));

    const preferred =
      candidates.find((item) => /\.torrent(?:[?#]|$)/i.test(item.href)) ||
      candidates.find((item) => /^magnet:/i.test(item.href)) ||
      candidates[0];

    return preferred ? preferred.href : "";
  }

  function isTorrentCandidate(href, text) {
    if (/^magnet:/i.test(href)) return true;
    if (/\.torrent(?:[?#]|$)/i.test(href)) return true;
    if (/torrent/i.test(text) && !/comment|category|tag/i.test(href)) return true;
    return false;
  }

  function setButtonState(button, status, state, text) {
    button.disabled = state === "loading";
    button.dataset.state = state;
    button.textContent = text;
    if (status) status.textContent = state === "error" ? "sem link" : "";
  }

  function openUrl(url) {
    if (typeof GM_openInTab === "function") {
      GM_openInTab(url, { active: true, insert: true, setParent: true });
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function normalize(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function uniqueElements(elements) {
    return Array.from(new Set(elements));
  }

  function addStyles() {
    if (document.getElementById("sr-torrent-quick-style")) return;

    const style = document.createElement("style");
    style.id = "sr-torrent-quick-style";
    style.textContent = `
      .sr-torrent-quick-wrap {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-left: 10px;
        vertical-align: middle;
      }

      .${BUTTON_CLASS} {
        border: 1px solid #a7ff00;
        background: #101510;
        color: #a7ff00;
        cursor: pointer;
        font: bold 11px/1 Arial, Helvetica, sans-serif;
        padding: 5px 8px;
        text-transform: uppercase;
        text-shadow: 0 1px 0 #000;
      }

      .${BUTTON_CLASS}:hover {
        background: #1d2a13;
        color: #ffff00;
      }

      .${BUTTON_CLASS}:disabled {
        cursor: wait;
        opacity: 0.75;
      }

      .${BUTTON_CLASS}[data-state="error"] {
        border-color: #ff5a5a;
        color: #ff7777;
      }

      .${STATUS_CLASS} {
        color: #bbb;
        font: 11px Arial, Helvetica, sans-serif;
      }

      .sr-copy-button {
        border-color: #00bfff;
        color: #00bfff;
      }
    `;

    document.head.appendChild(style);
  }
})();
