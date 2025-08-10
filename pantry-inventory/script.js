  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
  import { signInWithEmailAndPassword, getAuth } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
  };
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);


const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

const loginSection = document.getElementById('login-section');
const inventorySection = document.getElementById('inventory-section');
const inventoryTable = document.getElementById('inventory-table');

const itemNameInput = document.getElementById('item-name');
const itemQtyInput = document.getElementById('item-qty');
const itemUnitInput = document.getElementById('item-unit');
const addItemBtn = document.getElementById('addItemBtn');

const loadingIndicator = document.createElement('div');
loadingIndicator.id = 'loading-indicator';
loadingIndicator.textContent = 'Loading...';
loadingIndicator.style.display = 'none';
document.body.insertBefore(loadingIndicator, inventorySection);

const messageBox = document.createElement('div');
messageBox.id = 'message-box';
document.body.insertBefore(messageBox, inventorySection);

// Show/hide loading spinner
function setLoading(isLoading) {
  loadingIndicator.style.display = isLoading ? 'block' : 'none';
}

// Show messages to user
function showMessage(msg, isError = false) {
  messageBox.textContent = msg;
  messageBox.style.color = isError ? 'red' : 'green';
  setTimeout(() => (messageBox.textContent = ''), 4000);
}

// Input validation
function validateInputs(name, qty, unit) {
  if (!name || name.trim() === '') {
    showMessage('Item name is required', true);
    return false;
  }
  if (!qty || isNaN(qty) || qty <= 0) {
    showMessage('Quantity must be a positive number', true);
    return false;
  }
  if (!unit || unit.trim() === '') {
    showMessage('Unit is required', true);
    return false;
  }
  return true;
}

// Login
loginBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
    alert("Login successful!");
  } catch (err) {
    showMessage('Login failed: ' + err.message, true);
    alert(`Login failed: ${error.message}`);
  } 
});

// Logout
logoutBtn.addEventListener('click', () => {
  auth.signOut();
});

// Load inventory and display
async function loadInventory() {
  try {
    setLoading(true);
    inventoryTable.innerHTML = '<tr><th>Item</th><th>Quantity</th><th>Unit</th></tr>';
    const snapshot = await db.collection('inventory').get();
    snapshot.forEach(doc => {
      const data = doc.data();
      inventoryTable.innerHTML += `<tr>
        <td>${data.name}</td>
        <td>${data.quantity}</td>
        <td>${data.unit}</td>
      </tr>`;
    });
  } catch (err) {
    showMessage('Failed to load inventory: ' + err.message, true);
  } finally {
    setLoading(false);
  }
}

// Add or update item
addItemBtn.addEventListener('click', async () => {
  const name = itemNameInput.value.trim();
  const qty = parseInt(itemQtyInput.value, 10);
  const unit = itemUnitInput.value.trim();
  const user = auth.currentUser ? auth.currentUser.email : 'unknown';

  if (!validateInputs(name, qty, unit)) return;

  try {
    setLoading(true);
    const itemRef = db.collection('inventory').doc(name);
    const docSnap = await itemRef.get();

    const oldValue = docSnap.exists ? `${docSnap.data().quantity} ${docSnap.data().unit}` : 'N/A';

    await itemRef.set({
      name,
      quantity: qty,
      unit,
      lastUpdatedBy: user,
      lastUpdatedAt: new Date().toISOString(),
    });

    await db.collection('logs').add({
      item: name,
      oldValue,
      newValue: `${qty} ${unit}`,
      changedBy: user,
      timestamp: new Date().toISOString(),
    });

    showMessage('Item added/updated successfully!');
    itemNameInput.value = '';
    itemQtyInput.value = '';
    itemUnitInput.value = '';

    loadInventory();
  } catch (err) {
    showMessage('Failed to add/update item: ' + err.message, true);
  } finally {
    setLoading(false);
  }
});

// Auth state changes
auth.onAuthStateChanged(user => {
  if (user) {
    loginSection.style.display = 'none';
    inventorySection.style.display = 'block';
    loadInventory();
  } else {
    loginSection.style.display = 'block';
    inventorySection.style.display = 'none';
  }
});
