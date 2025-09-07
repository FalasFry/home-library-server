document.addEventListener("DOMContentLoaded", () => {
  const authSection = document.getElementById("auth-section");
  const librarySection = document.getElementById("library-section");

  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const logoutBtn = document.getElementById("logout-btn");

  const scanBtn = document.getElementById("scan-btn");
  const scannerDiv = document.getElementById("scanner");
  const resultP = document.getElementById("result");
  const bookList = document.getElementById("book-list");

  let loggedIn = false;

  // ----------------- LOGIN -----------------
  loginBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include"
    });

    if (res.ok) {
      loggedIn = true;
      authSection.style.display = "none";
      librarySection.style.display = "block";
      loadBooks();
    } else {
      document.getElementById("auth-status").textContent = "❌ Invalid credentials";
    }
  });

  // ----------------- REGISTER -----------------
  registerBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      document.getElementById("auth-status").textContent = "✅ Account created, please log in";
    } else {
      document.getElementById("auth-status").textContent = "❌ Failed to register";
    }
  });

  // ----------------- LOGOUT -----------------
  logoutBtn.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    loggedIn = false;
    authSection.style.display = "block";
    librarySection.style.display = "none";
  });

  // ----------------- BOOK SCANNER -----------------
  scanBtn.addEventListener("click", () => {
    if (!loggedIn) {
      alert("You must be logged in to scan books!");
      return;
    }

    if (scannerDiv.style.display === "none") {
      scannerDiv.style.display = "block";
      startScanner();
    } else {
      stopScanner();
    }
  });

  function startScanner() {
    Quagga.init({
      inputStream: {
        type: "LiveStream",
        target: scannerDiv,
        constraints: {
          facingMode: "environment"
        }
      },
      decoder: {
        readers: ["ean_reader", "ean_13_reader", "upc_reader", "upc_e_reader"]
      }
    }, err => {
      if (err) {
        console.error(err);
        return;
      }
      Quagga.start();
    });

    Quagga.onDetected(async data => {
      const isbn = data.codeResult.code;
      stopScanner();
      resultP.textContent = `Scanned ISBN: ${isbn}`;

      const res = await fetch(`/api/lookup/${isbn}`, { credentials: "include" });
      if (res.ok) {
        const book = await res.json();
        saveBook(book);
      } else {
        alert("Book not found");
      }
    });
  }

  function stopScanner() {
    Quagga.stop();
    scannerDiv.style.display = "none";
  }

  // ----------------- BOOK LIST -----------------
  async function saveBook(book) {
    if (!loggedIn) return;

    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(book),
      credentials: "include"
    });

    if (res.ok) {
      loadBooks();
    } else {
      alert("Failed to save book");
    }
  }

  async function loadBooks() {
    const res = await fetch("/api/books", { credentials: "include" });
    if (res.ok) {
      const books = await res.json();
      renderBooks(books);
    }
  }

  function renderBooks(books) {
    bookList.innerHTML = "";
    books.forEach(book => {
      const li = document.createElement("li");
      li.textContent = `${book.title} — ${book.author}`;
      bookList.appendChild(li);
    });
  }
});
