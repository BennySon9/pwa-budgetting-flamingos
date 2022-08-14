const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;

const database = "budget";
const objectStore = "transactions";
const request = indexedDB.open(database, 1);

request.onupgradeneeded = ({ target }) => {
  let db = target.result;
  db.createObjectStore(objectStore, { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
  db = target.result;
  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["transactions"], "readwrite");
  const store = transaction.objectStore("transactions");
  store.add(record);
}

function checkDatabase() {
  const transaction = db.transaction(["transactions"], "readwrite");
  const store = transaction.objectStore("transactions");
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transactions/", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          return response.json();
        })
        .then(() => {
          const transaction = db.transaction([objectStore], "readwrite");
          const store = transaction.objectStore(objectStore);
          store.clear();
        });
    }
  };
}

window.addEventListener("online", checkDatabase);
