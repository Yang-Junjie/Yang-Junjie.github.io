const manifestPath = 'manifest.json';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const gallery = document.querySelector('#gallery');
const galleryBrand = document.querySelector('#galleryBrand');
const galleryTitle = document.querySelector('#galleryTitle');
const articleList = document.querySelector('#articleList');
const unlockPanel = document.querySelector('#unlockPanel');
const selectedArticleLabel = document.querySelector('#selectedArticleLabel');
const unlockForm = document.querySelector('#unlockForm');
const unlockKey = document.querySelector('#unlockKey');
const unlockButton = document.querySelector('#unlockButton');
const toggleKey = document.querySelector('#toggleKey');
const statusLine = document.querySelector('#status');
const backButton = document.querySelector('#backButton');
const reader = document.querySelector('#reader');
const readerCover = document.querySelector('#readerCover');
const readerCoverImage = document.querySelector('#readerCoverImage');
const novelTitle = document.querySelector('#novelTitle');
const content = document.querySelector('#content');
const lockButton = document.querySelector('#lockButton');

let manifest = null;
let selectedArticle = null;
const payloadCache = new Map();

initialize();

if (!crypto?.subtle) {
  showStatus('当前浏览器不支持 Web Crypto，请使用 HTTPS 或 localhost。', true);
  unlockButton.disabled = true;
}

toggleKey.addEventListener('click', () => {
  const shouldShow = unlockKey.type === 'password';
  unlockKey.type = shouldShow ? 'text' : 'password';
  toggleKey.setAttribute('aria-label', shouldShow ? '隐藏密钥' : '显示密钥');
  toggleKey.setAttribute('title', shouldShow ? '隐藏密钥' : '显示密钥');
});

unlockForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!selectedArticle) {
    return;
  }

  const passphrase = unlockKey.value;
  if (!passphrase) {
    showStatus('请输入解锁密钥。', true);
    return;
  }

  unlockButton.disabled = true;
  showStatus('正在解锁...', false);

  try {
    const payload = await loadPayload(selectedArticle);
    const markdown = await decryptPayload(payload, passphrase);
    renderReader(payload.title || selectedArticle.title, markdown);
    unlockKey.value = '';
  } catch (error) {
    console.error(error);
    showStatus(normalizeError(error), true);
  } finally {
    unlockButton.disabled = false;
  }
});

backButton.addEventListener('click', () => {
  showGallery();
});

lockButton.addEventListener('click', () => {
  content.replaceChildren();
  showGallery();
});

async function initialize() {
  try {
    manifest = await loadManifest();
    document.title = manifest.siteTitle;
    galleryBrand.textContent = manifest.siteTitle;
    galleryTitle.textContent = manifest.siteTitle;
    renderGallery(manifest.articles);
  } catch (error) {
    console.error(error);
    articleList.innerHTML = '<p class="empty-state">无法读取回廊索引。</p>';
  }
}

async function loadManifest() {
  const response = await fetch(manifestPath, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`无法读取文章索引：${response.status}`);
  }

  const data = await response.json();
  if (data.version !== 1 || !Array.isArray(data.articles)) {
    throw new Error('文章索引格式不受支持。');
  }

  return data;
}

function renderGallery(articles) {
  articleList.replaceChildren();

  for (const article of articles) {
    const button = document.createElement('button');
    button.className = 'article-button';
    button.type = 'button';

    if (article.cover) {
      const image = document.createElement('img');
      image.className = 'article-cover';
      image.src = article.cover;
      image.alt = '';
      image.loading = 'lazy';
      button.append(image);
    }

    const title = document.createElement('span');
    title.className = 'article-title';
    title.textContent = article.title;
    button.append(title);

    button.addEventListener('click', () => {
      selectedArticle = article;
      selectedArticleLabel.textContent = article.title;
      showUnlock();
    });
    articleList.append(button);
  }
}

async function loadPayload(article) {
  if (payloadCache.has(article.id)) {
    return payloadCache.get(article.id);
  }

  const response = await fetch(article.payload, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`无法读取密文文件：${response.status}`);
  }

  const payload = await response.json();

  if (
    payload.version !== 1 ||
    payload.algorithm !== 'AES-256-GCM' ||
    payload.kdf !== 'PBKDF2-SHA-256'
  ) {
    throw new Error('密文格式不受支持。');
  }

  payloadCache.set(article.id, payload);
  return payload;
}

async function decryptPayload(payload, passphrase) {
  const salt = base64ToBytes(payload.salt);
  const iv = base64ToBytes(payload.iv);
  const ciphertext = base64ToBytes(payload.ciphertext);
  const tag = base64ToBytes(payload.tag);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase.normalize('NFC')),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: payload.iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );

  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128,
    },
    key,
    concatBytes(ciphertext, tag),
  );

  return decoder.decode(plaintext);
}

function renderReader(title, markdown) {
  novelTitle.textContent = title;
  content.innerHTML = renderMarkdown(markdown);

  if (selectedArticle?.cover) {
    readerCoverImage.src = selectedArticle.cover;
    readerCoverImage.alt = title;
    readerCover.hidden = false;
  } else {
    readerCoverImage.removeAttribute('src');
    readerCoverImage.alt = '';
    readerCover.hidden = true;
  }

  gallery.hidden = true;
  unlockPanel.hidden = true;
  reader.hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function showGallery() {
  selectedArticle = null;
  unlockKey.value = '';
  showStatus('', false);
  gallery.hidden = false;
  unlockPanel.hidden = true;
  reader.hidden = true;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function showUnlock() {
  unlockKey.value = '';
  showStatus('', false);
  gallery.hidden = true;
  unlockPanel.hidden = false;
  reader.hidden = true;
  unlockKey.focus();
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let paragraph = [];
  let list = null;
  let codeBlock = null;

  const flushParagraph = () => {
    if (!paragraph.length) {
      return;
    }

    html.push(`<p>${paragraph.map(renderInline).join('<br>')}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list) {
      return;
    }

    html.push(
      `<${list.type}>${list.items
        .map((item) => `<li>${renderInline(item)}</li>`)
        .join('')}</${list.type}>`,
    );
    list = null;
  };

  for (const line of lines) {
    const fence = line.match(/^```(.*)$/);
    if (fence) {
      if (codeBlock) {
        html.push(renderCodeBlock(codeBlock));
        codeBlock = null;
      } else {
        flushParagraph();
        flushList();
        codeBlock = { info: fence[1].trim(), lines: [] };
      }
      continue;
    }

    if (codeBlock) {
      codeBlock.lines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^[-*_]\s*[-*_]\s*[-*_][-*_\s]*$/.test(line.trim())) {
      flushParagraph();
      flushList();
      html.push('<hr>');
      continue;
    }

    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const type = unordered ? 'ul' : 'ol';
      const item = unordered ? unordered[1] : ordered[1];
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push(item);
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      flushList();
      html.push(`<blockquote><p>${renderInline(quote[1])}</p></blockquote>`);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  if (codeBlock) {
    html.push(renderCodeBlock(codeBlock));
  }

  flushParagraph();
  flushList();
  return html.join('\n');
}

function renderCodeBlock(codeBlock) {
  const chatMessages = parseChatTranscript(codeBlock);

  if (chatMessages.length) {
    return renderChatTranscript(chatMessages);
  }

  return `<pre class="code-block"><code>${escapeHtml(
    codeBlock.lines.join('\n'),
  )}</code></pre>`;
}

function parseChatTranscript(codeBlock) {
  if (codeBlock.info.toLowerCase() !== 'text') {
    return [];
  }

  const messages = [];
  let current = null;

  for (const line of codeBlock.lines) {
    const header = line.match(/^([^:\n]{1,24}):\s+(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})$/);

    if (header) {
      if (current) {
        messages.push(current);
      }

      current = {
        speaker: header[1],
        time: header[2],
        body: [],
      };
      continue;
    }

    if (!current) {
      if (line.trim()) {
        return [];
      }
      continue;
    }

    if (line.trim()) {
      current.body.push(line);
    }
  }

  if (current) {
    messages.push(current);
  }

  return messages.length ? messages : [];
}

function renderChatTranscript(messages) {
  return `<div class="chat-transcript">${messages.map(renderChatMessage).join('')}</div>`;
}

function renderChatMessage(message) {
  const isSelf = message.speaker === '氧均竭';
  const body = message.body.length ? message.body.join('\n') : ' ';

  return `<section class="chat-message${isSelf ? ' chat-message-self' : ''}">
    <header class="chat-meta">
      <strong>${escapeHtml(message.speaker)}</strong>
      <time>${escapeHtml(message.time)}</time>
    </header>
    <div class="chat-body">${escapeHtml(body)}</div>
  </section>`;
}

function renderInline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function concatBytes(first, second) {
  const output = new Uint8Array(first.byteLength + second.byteLength);
  output.set(first, 0);
  output.set(second, first.byteLength);
  return output;
}

function showStatus(message, isError) {
  statusLine.textContent = message;
  statusLine.classList.toggle('error', isError);
}

function normalizeError(error) {
  if (error instanceof DOMException) {
    return '密钥不正确，或密文已损坏。';
  }

  return error?.message || '解锁失败。';
}
