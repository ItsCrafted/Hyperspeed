const GROQ_WORKER = 'https://hyperspeed-ai.cgamz.online';
let currentModel = 'llama-3.1-8b-instant';
let conversation = [];
let isGenerating = false;
let abortController = null;

const SYSTEM_PROMPT = `You are Hyperspeed AI, a helpful, fast, and friendly AI assistant built into the Hyperspeed browser. You are powered by Groq. Be concise but thorough. Use markdown formatting when it helps clarity: code blocks for code, bullet points for lists. Keep a friendly, slightly casual tone. Use very perfessional language and big words, mixed with the tinyest but of sarcasm when needed. Always try to be helpful, even with difficult questions.`;

function toggleModelDropdown(e) {
  e.stopPropagation();
  document.getElementById('model-dropdown').classList.toggle('open');
}
function selectModel(el) {
  el.closest('.model-dropdown').querySelectorAll('.model-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  currentModel = el.dataset.model;
  document.getElementById('model-label').textContent = currentModel;
  document.getElementById('model-dropdown').classList.remove('open');
  newChat();
}
document.addEventListener('click', () => document.getElementById('model-dropdown').classList.remove('open'));

const textarea = document.getElementById('chat-input');
textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
});
textarea.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

function renderMarkdown(text) {
  let s = text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  s = s.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`
  );
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  s = s.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  s = s.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  s = s.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  s = s.replace(/^---$/gm, '<hr/>');
  s = s.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>');
  s = s.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  s = s.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  s = s.split(/\n\n+/).map(para => {
    if (para.startsWith('<h') || para.startsWith('<pre') || para.startsWith('<ul') || para.startsWith('<ol') || para.startsWith('<blockquote') || para.startsWith('<hr')) return para;
    const lined = para.replace(/\n/g, '<br/>');
    return `<p>${lined}</p>`;
  }).join('');

  return s;
}

function scrollBottom() {
  const m = document.getElementById('messages');
  m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' });
}

function hideWelcome() {
  const w = document.getElementById('welcome');
  if (w) { w.style.display = 'none'; }
}

function showError(msg) {
  const b = document.getElementById('err-banner');
  document.getElementById('err-text').textContent = msg;
  b.classList.add('visible');
  setTimeout(() => b.classList.remove('visible'), 5000);
}

function appendMessage(role, content, streaming = false) {
  const container = document.getElementById('messages');
  hideWelcome();

  const msg = document.createElement('div');
  msg.className = `msg ${role}`;
  msg.style.maxWidth = '820px';
  if (role === 'ai') msg.style.marginRight = 'auto';
  else msg.style.marginLeft = 'auto';

  const avatarIcon = role === 'ai' ? 'fa-solid fa-robot' : 'fa-solid fa-user';
  const bubbleContent = streaming
    ? `<span id="stream-content"></span><span class="stream-cursor" id="stream-cursor"></span>`
    : renderMarkdown(content);

  msg.innerHTML = `
    <div class="msg-avatar"><i class="${avatarIcon}"></i></div>
    <div class="msg-body">
      <div class="msg-bubble" id="bubble-${Date.now()}">${bubbleContent}</div>
      ${role === 'ai' ? `<div class="msg-actions">
        <button class="msg-action-btn" onclick="copyMsg(this)"><i class="fa-regular fa-copy"></i> copy</button>
        <button class="msg-action-btn" onclick="retryMsg()"><i class="fa-solid fa-rotate-right"></i> retry</button>
      </div>` : ''}
    </div>`;

  container.appendChild(msg);
  scrollBottom();
  return msg;
}

function copyMsg(btn) {
  const bubble = btn.closest('.msg-body').querySelector('.msg-bubble');
  const text = bubble.innerText;
  navigator.clipboard.writeText(text).then(() => {
    btn.innerHTML = '<i class="fa-solid fa-check"></i> copied';
    setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> copy'; }, 1500);
  });
}

function retryMsg() {
  if (isGenerating) return;
  const msgs = document.querySelectorAll('.msg.ai');
  const last = msgs[msgs.length - 1];
  if (last) last.remove();
  if (conversation.length && conversation[conversation.length-1].role === 'assistant') {
    conversation.pop();
  }
  callGroq();
}

function newChat() {
  if (isGenerating) stopGeneration();
  conversation = [];
  const m = document.getElementById('messages');
  m.innerHTML = '';
  const w = document.createElement('div');
  w.className = 'welcome'; w.id = 'welcome';
  w.innerHTML = `
    <div class="welcome-icon"><i class="fa-solid fa-robot"></i></div>
    <h1>Hyperspeed AI</h1>
    <p>Powered by Groq — the fastest AI inference on the planet. Ask anything.</p>
    <div class="suggestions" id="suggestions">
      <div class="sug-chip" onclick="sendSuggestion(this)">Explain quantum computing simply</div>
      <div class="sug-chip" onclick="sendSuggestion(this)">Write a short Python web scraper</div>
      <div class="sug-chip" onclick="sendSuggestion(this)">What's the best way to study for exams?</div>
      <div class="sug-chip" onclick="sendSuggestion(this)">Give me 5 creative story ideas</div>
      <div class="sug-chip" onclick="sendSuggestion(this)">How does the internet actually work?</div>
      <div class="sug-chip" onclick="sendSuggestion(this)">Debug my code — paste it below</div>
    </div>`;
  m.appendChild(w);
}

function sendSuggestion(el) {
  const text = el.textContent;
  document.getElementById('chat-input').value = text;
  sendMessage();
}

function sendMessage() {
  if (isGenerating) return;
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';

  conversation.push({ role: 'user', content: text });
  appendMessage('user', text);
  callGroq();
}

function stopGeneration() {
  if (abortController) abortController.abort();
  isGenerating = false;
  setGeneratingUI(false);
  const cursor = document.getElementById('stream-cursor');
  if (cursor) cursor.remove();
}

function setGeneratingUI(on) {
  document.getElementById('send-btn').disabled = on;
  const stopBtn = document.getElementById('stop-btn');
  if (on) stopBtn.classList.add('visible'); else stopBtn.classList.remove('visible');
}

async function callGroq() {
  isGenerating = true;
  setGeneratingUI(true);
  abortController = new AbortController();

  const typingMsg = document.createElement('div');
  typingMsg.className = 'msg ai';
  typingMsg.id = 'typing-msg';
  typingMsg.style.marginRight = 'auto';
  typingMsg.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
    <div class="msg-body">
      <div class="typing-indicator">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div>
    </div>`;
  document.getElementById('messages').appendChild(typingMsg);
  scrollBottom();

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversation
  ];

  try {
    const res = await fetch(GROQ_WORKER + '/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: currentModel,
        max_tokens: 2048,
        temperature: 0.7,
        messages,
        stream: true
      }),
      signal: abortController.signal
    });

    if (!res.ok) throw new Error('Worker error ' + res.status);

    typingMsg.remove();
    const streamMsg = appendMessage('ai', '', true);
    const streamContent = streamMsg.querySelector('#stream-content');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            streamContent.innerHTML = renderMarkdown(fullText);
            scrollBottom();
          }
        } catch {}
      }
    }

    const cursor = streamMsg.querySelector('#stream-cursor');
    if (cursor) cursor.remove();

    if (!fullText) {
      typingMsg.remove();
      const fallbackRes = await fetch(GROQ_WORKER + '/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: currentModel, max_tokens: 2048, temperature: 0.7, messages })
      });
      const data = await fallbackRes.json();
      fullText = data.choices?.[0]?.message?.content || '(no response)';
      const fallbackMsg = appendMessage('ai', fullText);
    }

    conversation.push({ role: 'assistant', content: fullText });

  } catch (err) {
    typingMsg.remove();
    if (err.name === 'AbortError') {
    } else {
      console.error(err);
      try {
        const messages2 = [{ role: 'system', content: SYSTEM_PROMPT }, ...conversation];
        const res2 = await fetch(GROQ_WORKER + '/groq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: currentModel, max_tokens: 2048, temperature: 0.7, messages: messages2 })
        });
        const data = await res2.json();
        const text = data.choices?.[0]?.message?.content || '(no response)';
        appendMessage('ai', text);
        conversation.push({ role: 'assistant', content: text });
      } catch (err2) {
        showError('Could not reach Groq. Check your connection and try again.');
        conversation.pop();
      }
    }
  } finally {
    isGenerating = false;
    setGeneratingUI(false);
    abortController = null;
  }
}

document.getElementById('chat-input').focus();