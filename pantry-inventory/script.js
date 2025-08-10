const auth = firebase.auth();
const db = firebase.firestore();

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('password').value;
  await auth.signInWithEmailAndPassword(email, pass);
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  auth.signOut();
});

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('inventory-section').style.display = 'block';
    loadInventory();
  } else {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('inventory-section').style.display = 'none';
  }
});

async function loadInventory() {
  const table = document.getElementById('inventory-table');
  table.innerHTML = "<tr><th>Item</th><th>Qty</th><th>Unit</th></tr>";
  const snapshot = await db.collection('inventory').get();
  snapshot.forEach(doc => {
    const data = doc.data();
    table.innerHTML += `<tr>
      <td>${data.name}</td>
      <td>${data.quantity}</td>
      <td>${data.unit}</td>
    </tr>`;
  });
}

document.getElementById('addItemBtn').addEventListener('click', async () => {
  const name = document.getElementById('item-name').value;
  const qty = parseInt(document.getElementById('item-qty').value);
  const unit = document.getElementById('item-unit').value;
  const user = auth.currentUser.email;

  const itemRef = db.collection('inventory').doc(name);
  const docSnap = await itemRef.get();
  let oldValue = "N/A";
  if (docSnap.exists) {
    oldValue = `${docSnap.data().quantity} ${docSnap.data().unit}`;
  }

  await itemRef.set({
    name, quantity: qty, unit,
    lastUpdatedBy: user,
    lastUpdatedAt: new Date().toISOString()
  });

  await db.collection('logs').add({
    item: name,
    oldValue,
    newValue: `${qty} ${unit}",
    changedBy: user,
    timestamp: new Date().toISOString()
  });

  loadInventory();
});
