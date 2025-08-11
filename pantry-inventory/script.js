  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
  import { signInWithEmailAndPassword, getAuth } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
  import { getFirestore, collection, addDoc ,getDocs,getDoc,doc,setDoc,updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDNCR5ja6EY0GxzjyRHyO1xT4nLF5E0ZcY",
    authDomain: "pantry-inventory-86d8a.firebaseapp.com",
    projectId: "pantry-inventory-86d8a",
    storageBucket: "pantry-inventory-86d8a.firebasestorage.app",
    messagingSenderId:"565134687361",
    appId: "1:565134687361:web:87c54a7b7aabfba2d42180"
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
const modal = document.getElementById("itemModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModal");

const messageBox = document.createElement('div');
messageBox.id = 'message-box';
document.body.insertBefore(messageBox, inventorySection);

// Open modal
openModalBtn.addEventListener("click", () => {
  modal.style.display = "block";
});

// Close modal
closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// Close modal when clicking outside content
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

function populateUnitList(inventoryData) {
  const unitSet = new Set();

  inventoryData.forEach(item => {
    if (item.unit && item.unit.trim() !== '') {
      unitSet.add(item.unit.trim());
    }
  });

  const unitList = document.getElementById('unit-list');
  unitList.innerHTML = ''; // clear old options

  unitSet.forEach(unit => {
    const option = document.createElement('option');
    option.value = unit;
    unitList.appendChild(option);
  });
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
  if ( isNaN(qty) || qty < 0) {
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
    
    const inventoryData = [];
    inventoryTable.innerHTML = '<tr><th>Name</th><th>Quantity</th><th>Unit</th></tr>';
    const snapshot = await getDocs(collection(db, "inventory"));
    snapshot.forEach(doc => {
      const data = doc.data();
      inventoryData.push(data);
      const row = document.createElement("tr");
      row.innerHTML = `
      <td class="item-name" style="cursor: pointer;">${data.name}
        <div class="action-buttons" style="display: none; margin-top: 5px;">
          <button class="edit-btn" data-id="${doc.id}">Edit</button>
          <button class="delete-btn" data-id="${doc.id}">Delete</button>
        </div>
      </td>
      <td>${data.quantity}</td>
      <td>${data.unit}</td>
    `;
      inventoryTable.appendChild(row);
      populateUnitList(inventoryData);
    });
  } catch (err) {
    showMessage('Failed to load inventory: ' + err.message, true);
  } 

 // Toggle buttons on name click
  document.querySelectorAll(".item-name").forEach(nameCell => {
    nameCell.addEventListener("click", () => {
      const btns = nameCell.querySelector(".action-buttons");
      btns.style.display = btns.style.display === "none" ? "block" : "none";
    });
  });

  // Edit functionality
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation(); // Prevent triggering name click
      const id = e.target.dataset.id;
      const newQty = prompt("Enter new quantity:");
      if (newQty !== null && !isNaN(newQty)) {
        await updateDoc(doc(db, "inventory", id), { quantity: Number(newQty) });
        loadInventory();
      }
    });
  });

  // Delete functionality
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = e.target.dataset.id;
      if (confirm("Are you sure you want to delete this item?")) {
        await deleteDoc(doc(db, "inventory", id));
        loadInventory();
      }
    });
  });
  }
// Add or update item
addItemBtn.addEventListener('click', async () => {
  const name = itemNameInput.value.trim();
  const qty = parseFloat(itemQtyInput.value);
  const unit = itemUnitInput.value.trim();
  const user = auth.currentUser ? auth.currentUser.email : 'unknown';

  if (!validateInputs(name, qty, unit)) return;

  try {
  const itemRef = doc(collection(db, 'inventory'), name);
  const docSnap = await getDoc(itemRef);

  const oldValue = docSnap.exists()
    ? `${docSnap.data().quantity}`
    : 'N/A';

  await setDoc(itemRef, {
    name,
    quantity: qty,
    unit,
    lastUpdatedBy: user,
    lastUpdatedAt: new Date().toISOString(),
  });

  await addDoc(collection(db, 'logs'), {
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
