const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const authMessage = document.getElementById('authMessage');

const startScanBtn = document.getElementById('startScan');
const resultDiv = document.getElementById('result');
const saveBtn = document.getElementById('saveBook');
const saveMessage = document.getElementById('saveMessage');

const refreshLibraryBtn = document.getElementById('refreshLibrary');
const bookList = document.getElementById('bookList');

let lastScannedBook = null;

// ----------------- Auth -----------------
registerBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) return;

  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    authMessage.textContent = res.ok ? 'Registered! You can login.' : `Error: ${data.error}`;
  } catch (err) {
    console.error(err);
    authMessage.textContent = 'Registration failed';
  }
});

loginBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) return;

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      authMessage.textContent = `Logged in as ${username}`;
      loadLibrary();
    } else {
      authMessage.textContent = `Error: ${data.error}`;
    }
  } catch (err) {
    console.error(err);
    authMessage.textContent = 'Login failed';
  }
});

// ----------------- ISBN Scanner -----------------
startScanBtn.addEventListener('click', () => {
  Quagga.init({
    inputStream: { type: "LiveStream", target: document.querySelector('#scanner'), constraints: { facingMode: { exact: "environment" } } },
    decoder: { readers: ["ean_reader"] }
  }, err => {
    if (err) { alert("Quagga init error: " + err); return; }
    Quagga.start();
  });

  Quagga.onDetected(async (data) => {
    const isbn = data.codeResult.code;
    resultDiv.innerHTML = `Scanned ISBN: ${isbn}<br>Fetching info...`;
    Quagga.stop();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/openlibrary/isbn/${isbn}`, { headers: { "Authorization": `Bearer ${token}` } });
      if (!response.ok) { resultDiv.innerHTML = 'Book not found'; saveBtn.style.display = 'none'; return; }
      const book = await response.json();
      lastScannedBook = book;
      resultDiv.innerHTML = `<strong>${book.title}</strong><br>Authors: ${book.authors.join(', ')}<br>Pages: ${book.number_of_pages || '-'}<br>Published: ${book.publish_date || '-'}<br>Publishers: ${book.publishers || '-'}`;
      saveBtn.style.display = 'inline-block';
      saveMessage.textContent = '';
    } catch (err) {
      console.error(err);
      resultDiv.innerHTML = 'Error fetching book info';
      saveBtn.style.display = 'none';
    }
  });
});

// ----------------- Save Book -----------------
saveBtn.addEventListener('click', async () => {
  if (!lastScannedBook) return;
  const token = localStorage.getItem('token');

  try {
    const res = await fetch('/books', {
      method: 'POST',
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ title: lastScannedBook.title, author: lastScannedBook.authors.join(', '), isbn: lastScannedBook.isbn })
    });
    const data = await res.json();
    saveMessage.textContent = res.ok ? `Book saved: ${data.title}` : `Error: ${data.error}`;
    if (res.ok) { saveBtn.style.display = 'none'; lastScannedBook = null; loadLibrary(); }
  } catch (err) {
    console.error(err);
    saveMessage.textContent = 'Failed to save book';
  }
});

// ----------------- Library -----------------
async function loadLibrary() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('/books', { headers: { "Authorization": `Bearer ${token}` } });
    if (!res.ok) { bookList.innerHTML = `<li>Error loading library</li>`; return; }
    const books = await res.json();
    bookList.innerHTML = books.length === 0 ? `<li>No books saved yet</li>` : '';
    books.forEach(b => { const li = document.createElement('li'); li.textContent = `${b.title} by ${b.author} (ISBN: ${b.isbn || '-'})`; bookList.appendChild(li); });
  } catch (err) {
    console.error(err);
    bookList.innerHTML = `<li>Failed to fetch library</li>`;
  }
}

refreshLibraryBtn.addEventListener('click', loadLibrary);

// ----------------- Service Worker -----------------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').then(() => console.log('Service Worker registered')).catch(console.error);
}
