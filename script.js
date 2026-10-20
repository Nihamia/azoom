const vehicle = {
  "byd-dolphin": {
    name: "BYD Dolphin",
    cat: "City EV",
    rate: 72
  },
  "mg4-ev": {
    name: "MG4 EV Trophy Long Range",
    cat: "City EV",
    rate: 78
  },
  "ora-good-cat": {
    name: "ORA Good Cat",
    cat: "City EV",
    rate: 84
  },
  "nissan-leaf": {
    name: "Nissan LEAF e+ (2020)",
    cat: "City EV",
    rate: 88
  },
  "hyundai-inster": {
    name: "Hyundai INSTER Long Range",
    cat: "City EV",
    rate: 76
  },
  "mini-cooper-se": {
    name: "MINI Cooper SE Electric",
    cat: "City EV",
    rate: 82
  },
  "byd-atto-3": {
    name: "BYD Atto 3",
    cat: "Family EV",
    rate: 105
  },
  "kia-ev3": {
    name: "Kia EV3 Long Range",
    cat: "Family EV",
    rate: 118
  },
  "tesla-model-y": {
    name: "Tesla Model Y Long Range RWD",
    cat: "Family EV",
    rate: 138
  },
  "hyundai-ioniq-5": {
    name: "Hyundai IONIQ 5 Long Range 2WD",
    cat: "Family EV",
    rate: 125
  },
  "kia-ev6": {
    name: "Kia EV6 AWD Long Range",
    cat: "Family EV",
    rate: 132
  },
  "bmw-i4": {
    name: "BMW i4 eDrive35",
    cat: "Premium EV",
    rate: 178
  },
  "tesla-model-3": {
    name: "Tesla Model 3 Premium RWD",
    cat: "Premium EV",
    rate: 188
  },
  "mercedes-eqe-300": {
    name: "Mercedes-Benz EQE 300",
    cat: "Premium EV",
    rate: 228
  },
  "porsche-taycan-4s": {
    name: "Porsche Taycan 4S",
    cat: "Premium EV",
    rate: 268
  },
  "audi-e-tron-gt": {
    name: "Audi e-tron GT quattro",
    cat: "Premium EV",
    rate: 288
  }
};
const bookingKey = "azoomBooking",
bookingsKey = "azoomBookings",
inspectKey = "azoomInspection",
fleetStatusKey = "azoomFleetStatus";
function readBookings() {
  try {
    const saved = localStorage.getItem(bookingsKey);
    if (saved !== null) {
      const bookings = JSON.parse(saved);
      return Array.isArray(bookings) ? bookings : []
    }
    const oldBooking = JSON.parse(localStorage.getItem(bookingKey) || "null");
    if (oldBooking && typeof oldBooking === "object") {
      let oldStatuses = {}, oldInspection = null;
      try {
        oldStatuses = JSON.parse(localStorage.getItem(fleetStatusKey) || "{}");
        oldInspection = JSON.parse(localStorage.getItem(inspectKey) || "null")
      }
      catch (err) {
      }
      oldBooking.status = oldStatuses[oldBooking.carId] || (localStorage.getItem("azoomPaid") === "yes" ? "rented" : "reserved");
      oldBooking.paid = localStorage.getItem("azoomPaid") === "yes";
      oldBooking.paidAmount = Number(localStorage.getItem("azoomPaidAmount") || 0);
      oldBooking.inspection = oldInspection && oldInspection.reference === oldBooking.reference ? oldInspection : null;
      localStorage.setItem(bookingsKey, JSON.stringify([oldBooking]));
      localStorage.removeItem(bookingKey);
      localStorage.removeItem(fleetStatusKey);
      localStorage.removeItem(inspectKey);
      localStorage.removeItem("azoomPaid");
      localStorage.removeItem("azoomPaidAmount");
      return [oldBooking]
    }
    return []
  }
  catch (err) {
    return []
  }
}
function saveBookings(bookings) {
  localStorage.setItem(bookingsKey, JSON.stringify(bookings))
}
function findBooking(reference) {
  const bookings = readBookings();
  for (let i = 0; i < bookings.length; i++) {
    if (bookings[i].reference === reference) return bookings[i]
  }
  return null
}
function getBookingForCar(carId) {
  const bookings = readBookings();
  for (let i = bookings.length - 1; i >= 0; i--) {
    if (bookings[i].carId === carId) return bookings[i]
  }
  return null
}
function bookingStatus(booking) {
  if (!booking) return "available";
  if (booking.status === "available" || booking.status === "returned") return booking.status;
  if (booking.status === "rented") return "rented";
  if (booking.status === "reserved") return "reserved";
  if (booking.status) return "rented";
  return booking.paid ? "rented" : "reserved"
}
function bookingDamageTotal(booking) {
  if (!booking || !booking.inspection) return 0;
  if (booking.inspection.items && Array.isArray(booking.inspection.items)) {
    let total = 0;
    for (let i = 0; i < booking.inspection.items.length; i++) {
      total += Number(booking.inspection.items[i].repairCost || 0)
    }
    return total
  }
  return Number(booking.inspection.damageCost || 0)
}
function bookingTotal(booking) {
  return Number(booking.dailyRate || 0) * Number(booking.rentalDays || 0) + bookingDamageTotal(booking)
}
function queryValue(name) {
  const parts = window.location.search.substring(1).split("&");
  for (let i = 0; i < parts.length; i++) {
    const pair = parts[i].split("=");
    if (pair[0] === name) {
      try {
        return decodeURIComponent((pair[1] || "").replace(/\+/g, " "))
      }
      catch (err) {
        return ""
      }
    }
  }
  return ""
}
function latestBooking() {
  const reference = queryValue("ref");
  if (reference) return findBooking(reference);
  const bookings = readBookings(), user = getCurrentAccount();
  if (user) {
    for (let i = bookings.length - 1; i >= 0; i--) {
      if (bookings[i].email === user.email) return bookings[i]
    }
  }
  return bookings.length ? bookings[bookings.length - 1] : null
}
const accountsKey = "azoomAccounts",
loginKey = "azoomLoggedIn";
const searchKey = "azoomSearch",
reservationDraftKey = "azoomReservationDraft",
staffLoginKey = "azoomStaffLoggedIn";
function readAccounts() {
  try {
    const saved = JSON.parse(localStorage.getItem(accountsKey) || "[]");
    return Array.isArray(saved) ? saved : []
  }
  catch (err) {
    return []
  }
}
function readReservationDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(reservationDraftKey) || "null");
    return saved && typeof saved === "object" ? saved : null
  }
  catch (err) {
    return null
  }
}
function getCurrentAccount() {
  try {
    const email = localStorage.getItem(loginKey),
    accounts = readAccounts();
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i].email === email) {
        return accounts[i]
      }
    }
  }
  catch (err) {
  }
  return null
}
function updateAccountLink() {
  const link = document.getElementById("account-link");
  if (!link) return;
  let staffSignedIn = false;
  try {
    staffSignedIn = localStorage.getItem(staffLoginKey) === "yes"
  }
  catch (err) {
  }
  if (staffSignedIn) {
    link.textContent = "Sign out";
    link.href = "#";
    link.onclick = function(e) {
      e.preventDefault();
      try {
        localStorage.removeItem(staffLoginKey)
      }
      catch (err) {
      }
      window.location.href = "account.html"
    }
  }
  else if (getCurrentAccount()) {
    link.textContent = "My account";
    link.href = "account.html";
    link.onclick = null
  }
  else {
    link.textContent = "Log in";
    link.href = "account.html";
    link.onclick = null
  }
}
function accountMessage(id, message) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = message;
    el.hidden = false
  }
}
function showAccount(user) {
  const forms = document.getElementById("account-forms"),
  state = document.getElementById("account-state");
  if (forms) {
    forms.hidden = true
  }
  if (state) {
    state.hidden = false
  }
  show("account-name", user.name);
  show("account-email", user.email);
  showAccountReservation(user);
  updateAccountLink()
}
function addBillLine(parent, label, value) {
  const line = document.createElement("p"), strong = document.createElement("b");
  strong.textContent = label + ": ";
  line.appendChild(strong);
  line.appendChild(document.createTextNode(value));
  parent.appendChild(line)
}
function createAccountBill(booking) {
  const bill = document.createElement("section"),
  heading = document.createElement("h4"),
  total = document.createElement("p"),
  actions = document.createElement("div"),
  payment = document.createElement("p");
  bill.className = "account-bill";
  heading.textContent = "Final bill · " + booking.reference;
  bill.appendChild(heading);
  addBillLine(bill, "Rental", money(Number(booking.dailyRate) * Number(booking.rentalDays)) + " (" + booking.rentalDays + " day(s) x " + money(booking.dailyRate) + ")");
  const inspection = booking.inspection || {}, items = inspection.items || [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i], row = document.createElement("div"), detail = document.createElement("p");
    row.className = "bill-item";
    detail.textContent = item.label + " — " + item.condition + (item.condition === "Needs repair" ? " · Repair: " + money(item.repairCost) : " · S$0.00");
    row.appendChild(detail);
    if (item.comment) {
      const comment = document.createElement("p");
      comment.className = "bill-comment";
      comment.textContent = "Staff comment: " + item.comment;
      row.appendChild(comment)
    }
    if (item.images) {
      for (let j = 0; j < item.images.length; j++) {
        const photo = document.createElement("img");
        photo.className = "bill-photo";
        photo.src = item.images[j].data;
        photo.alt = item.label + " inspection photo: " + item.images[j].name;
        row.appendChild(photo)
      }
    }
    bill.appendChild(row)
  }
  if (inspection.comment) addBillLine(bill, "Staff summary", inspection.comment);
  total.className = "account-bill-total";
  total.textContent = "Total due: " + money(bookingTotal(booking));
  bill.appendChild(total);
  payment.className = booking.paid ? "msg success" : "note";
  payment.textContent = booking.paid ? "Payment recorded: " + money(booking.paidAmount || bookingTotal(booking)) : "Payment is outstanding. Pay or appeal this bill below.";
  bill.appendChild(payment);
  actions.className = "tools";
  if (!booking.paid) {
    const pay = document.createElement("button");
    pay.className = "btn"; pay.type = "button"; pay.textContent = "Pay bill";
    pay.setAttribute("data-pay-reference", booking.reference);
    actions.appendChild(pay)
  }
  else {
    const paid = document.createElement("span");
    paid.className = "status available"; paid.textContent = "Paid";
    actions.appendChild(paid)
  }
  if (booking.appeal) {
    addBillLine(bill, "Appeal submitted", booking.appeal)
  }
  else {
    const appealButton = document.createElement("button"), appealForm = document.createElement("form"),
    appealLabel = document.createElement("label"), appealInput = document.createElement("textarea"), appealSubmit = document.createElement("button");
    appealButton.className = "btn alt"; appealButton.type = "button"; appealButton.textContent = "Appeal bill";
    appealButton.setAttribute("data-appeal-toggle", booking.reference);
    actions.appendChild(appealButton);
    appealForm.className = "appeal-form"; appealForm.hidden = true;
    appealForm.setAttribute("data-appeal-form", booking.reference);
    appealLabel.textContent = "Explain why you are appealing this bill";
    appealInput.rows = 3; appealInput.required = true; appealInput.maxLength = 1000;
    appealInput.setAttribute("aria-label", "Appeal reason");
    appealSubmit.className = "btn alt"; appealSubmit.type = "submit"; appealSubmit.textContent = "Submit appeal";
    appealForm.appendChild(appealLabel); appealForm.appendChild(appealInput); appealForm.appendChild(appealSubmit);
    bill.appendChild(appealForm)
  }
  bill.appendChild(actions);
  const note = document.createElement("p");
  note.className = "small"; note.textContent = "Assignment prototype: payment and appeal status are saved in this browser.";
  bill.appendChild(note);
  return bill
}
function showAccountReservation(user) {
  const list = document.getElementById("account-bookings-list"),
  empty = document.getElementById("account-no-booking");
  if (!list || !empty) return;
  while (list.firstChild) list.removeChild(list.firstChild);
  const bookings = readBookings();
  let count = 0;
  for (let i = bookings.length - 1; i >= 0; i--) {
    const booking = bookings[i];
    if (booking.email !== user.email) continue;
    count++;
    const card = document.createElement("article"),
    heading = document.createElement("h3"),
    status = document.createElement("p"),
    pickup = document.createElement("p"),
    returning = document.createElement("p"),
    branch = document.createElement("p"),
    location = document.createElement("p"),
    receipt = document.createElement("p"),
    tools = document.createElement("div"),
    view = document.createElement("a");
    card.className = "account-booking";
    heading.textContent = booking.carName;
    status.innerHTML = "<b>Status:</b> ";
    const badge = document.createElement("span"), state = bookingStatus(booking);
    badge.className = "status " + (booking.billIssued ? "available" : state);
    badge.textContent = booking.billIssued ? "Bill issued" : state === "rented" ? "Rented out" : state === "returned" ? "Returned" : "Reserved";
    status.appendChild(badge);
    pickup.innerHTML = "<b>Pickup date:</b> "; pickup.appendChild(document.createTextNode(booking.pickupDate || ""));
    returning.innerHTML = "<b>Return date:</b> "; returning.appendChild(document.createTextNode(booking.returnDate || ""));
    branch.innerHTML = "<b>Pickup branch:</b> "; branch.appendChild(document.createTextNode(booking.pickupBranch || ""));
    location.innerHTML = "<b>Collection point:</b> "; location.appendChild(document.createTextNode(booking.pickupLocation || pickupLocation(booking.pickupBranch)));
    receipt.innerHTML = "<b>Receipt number:</b> "; receipt.appendChild(document.createTextNode(booking.reference));
    tools.className = "tools";
    view.className = "btn alt"; view.href = "confirmation.html?ref=" + encodeURIComponent(booking.reference); view.textContent = "View booking summary";
    tools.appendChild(view);
    if (state === "reserved") {
      const cancel = document.createElement("button");
      cancel.className = "btn alt"; cancel.type = "button"; cancel.textContent = "Cancel reservation";
      cancel.setAttribute("data-cancel-reference", booking.reference);
      tools.appendChild(cancel)
    }
    card.appendChild(heading); card.appendChild(status); card.appendChild(pickup); card.appendChild(returning);
    card.appendChild(branch); card.appendChild(location); card.appendChild(receipt); card.appendChild(tools);
    if (booking.billIssued) card.appendChild(createAccountBill(booking));
    list.appendChild(card)
  }
  empty.hidden = count > 0;
  list.hidden = count === 0
}
function getAccountNext() {
  const parts = window.location.search.substring(1).split("&");
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].indexOf("next=") === 0) {
      try {
        return decodeURIComponent(parts[i].substring(5).replace(/\+/g, " "))
      }
      catch (err) {
        return ""
      }
    }
  }
  return ""
}
function goAccountNext() {
  const next = getAccountNext();
  if (next.indexOf("reservation.html") === 0 && next.indexOf("..") === -1 && next.indexOf("\\") === -1) {
    window.location.href = next;
    return true
  }
  return false
}
updateAccountLink();
function keepAccountNext(id, page) {
  const link = document.getElementById(id),
  next = getAccountNext();
  if (link && next) {
    link.href = page + "?next=" + encodeURIComponent(next)
  }
}
keepAccountNext("signup-link", "signup.html");
keepAccountNext("login-link", "account.html");

const accountPage = document.getElementById("account-forms");
if (accountPage) {
  const loginForm = document.getElementById("login-form"),
  current = getCurrentAccount();
  if (current) {
    if (!goAccountNext()) {
      showAccount(current)
    }
  }
  if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const username = document.getElementById("login-username").value.trim().toLowerCase(),
      password = document.getElementById("login-password").value,
      accounts = readAccounts();
      if (username === "staff" && password === "staff") {
        try {
          if (signInStaff(username, password)) {
            window.location.href = "admin.html";
            return
          }
        }
        catch (err) {
          accountMessage("login-msg", "Staff sign-in needs browser storage. Open this site with VS Code Live Server and try again.");
          return
        }
      }
      let match = null;
      for (let i = 0; i < accounts.length; i++) {
        if (accounts[i].username === username && accounts[i].password === password) {
          match = accounts[i];
          break
        }
      }
      if (!match) {
        accountMessage("login-msg", "Username or password is incorrect. Please sign up first if you do not have an account.");
        return
      }
      try {
        localStorage.setItem(loginKey, match.email);
        if (!goAccountNext()) {
          showAccount(match)
        }
      }
      catch (err) {
        accountMessage("login-msg", "Local storage is unavailable. Open the page with Live Server and try again.")
      }
    })
  }
  const logout = document.getElementById("logout-btn");
  if (logout) {
    logout.addEventListener("click", function() {
      try {
        localStorage.removeItem(loginKey);
        window.location.href = "account.html"
      }
      catch (err) {
      }
    })
  }
}

const cancelBookingsList = document.getElementById("account-bookings-list"),
cancelModal = document.getElementById("cancel-modal"),
cancelYes = document.getElementById("cancel-yes"),
cancelNo = document.getElementById("cancel-no");
let pendingCancelReference = "", lastCancelButton = null;
if (cancelBookingsList) {
  cancelBookingsList.addEventListener("click", function(e) {
    const target = e.target;
    if (target && target.getAttribute("data-pay-reference")) {
      const reference = target.getAttribute("data-pay-reference"), bookings = readBookings();
      let booking = null;
      for (let i = 0; i < bookings.length; i++) if (bookings[i].reference === reference) booking = bookings[i];
      if (!booking || !booking.billIssued || booking.paid) return;
      if (!window.confirm("Record payment of " + money(bookingTotal(booking)) + " for this assignment bill?")) return;
      booking.paid = true; booking.paidAmount = bookingTotal(booking);
      saveBookings(bookings);
      const user = getCurrentAccount();
      if (user) showAccountReservation(user);
      accountMessage("cancel-msg", "Payment recorded in the assignment prototype.");
      return
    }
    if (target && target.getAttribute("data-appeal-toggle")) {
      const reference = target.getAttribute("data-appeal-toggle"), forms = cancelBookingsList.querySelectorAll("form[data-appeal-form]");
      for (let i = 0; i < forms.length; i++) forms[i].hidden = forms[i].getAttribute("data-appeal-form") !== reference;
      const form = cancelBookingsList.querySelector('form[data-appeal-form="' + reference + '"]');
      if (form) form.querySelector("textarea").focus()
    }
  });
  cancelBookingsList.addEventListener("submit", function(e) {
    const form = e.target, reference = form.getAttribute("data-appeal-form");
    if (!reference) return;
    e.preventDefault();
    const reason = form.querySelector("textarea").value.trim(), bookings = readBookings();
    if (!reason) return;
    for (let i = 0; i < bookings.length; i++) {
      if (bookings[i].reference === reference && bookings[i].billIssued) {
        bookings[i].appeal = reason;
        bookings[i].appealSubmittedAt = new Date().toISOString();
        saveBookings(bookings);
        const user = getCurrentAccount();
        if (user) showAccountReservation(user);
        accountMessage("cancel-msg", "Your appeal was submitted and saved.");
        return
      }
    }
  })
}
if (cancelBookingsList && cancelModal) {
  cancelBookingsList.addEventListener("click", function(e) {
    const button = e.target;
    if (!button || button.tagName !== "BUTTON" || !button.getAttribute("data-cancel-reference")) return;
    pendingCancelReference = button.getAttribute("data-cancel-reference");
    lastCancelButton = button;
    cancelModal.hidden = false;
    if (cancelYes) cancelYes.focus()
  })
}
if (cancelNo && cancelModal) {
  cancelNo.addEventListener("click", function() {
    cancelModal.hidden = true;
    pendingCancelReference = "";
    if (lastCancelButton) lastCancelButton.focus()
  })
}
if (cancelYes && cancelModal) {
  cancelYes.addEventListener("click", function() {
    const user = getCurrentAccount();
    try {
      const bookings = readBookings();
      let index = -1;
      for (let i = 0; i < bookings.length; i++) {
        if (bookings[i].reference === pendingCancelReference && user && bookings[i].email === user.email && bookingStatus(bookings[i]) === "reserved") {
          index = i;
          break
        }
      }
      if (index < 0) {
        cancelModal.hidden = true;
        accountMessage("cancel-msg", "No cancellable reservation was found for this account.");
        return
      }
      bookings.splice(index, 1);
      saveBookings(bookings);
      localStorage.removeItem(reservationDraftKey);
      cancelModal.hidden = true;
      pendingCancelReference = "";
      showAccountReservation(user);
      accountMessage("cancel-msg", "Reservation cancelled. The car is available again.")
    }
    catch (err) {
      cancelModal.hidden = true;
      accountMessage("cancel-msg", "The reservation could not be cancelled. Check that browser storage is enabled and try again.")
    }
  })
}
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape" && cancelModal && !cancelModal.hidden) {
    cancelModal.hidden = true;
    pendingCancelReference = "";
    if (lastCancelButton) lastCancelButton.focus()
  }
});

const signupForm = document.getElementById("signup-form");
if (signupForm) {
  const current = getCurrentAccount();
  if (current && !goAccountNext()) {
    window.location.replace("account.html")
  }
  signupForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const name = document.getElementById("signup-name").value.trim(),
    username = document.getElementById("signup-username").value.trim().toLowerCase(),
    email = document.getElementById("signup-email").value.trim().toLowerCase(),
    password = document.getElementById("signup-password").value,
    accounts = readAccounts();
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i].email === email) {
        accountMessage("signup-msg", "An account already uses this email. Please sign in.");
        return
      }
      if (accounts[i].username === username) {
        accountMessage("signup-msg", "That username is already taken. Please choose another.");
        return
      }
    }
    const user = {
      name: name, username: username, email: email, password: password
    };
    try {
      accounts.push(user);
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
      localStorage.setItem(loginKey, email);
      if (!goAccountNext()) {
        window.location.href = "account.html"
      }
    }
    catch (err) {
      accountMessage("signup-msg", "Local storage is unavailable. Open the page with Live Server and try again.")
    }
  })
}
function money(n) {
  return "S$" + Number(n).toFixed(2)
}
function show(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value
  }
}
function pickupLocation(branch) {
  const value = String(branch || "").toLowerCase();
  if (value.indexOf("east") >= 0 || value.indexOf("changi") >= 0) {
    return "Changi Airport Terminal 1 Car Park, AZoom collection bay"
  }
  return "Woodlands Checkpoint, designated AZoom collection bay"
}
function validCardNumber(value) {
  if (!/^[0-9 ]+$/.test(value)) {
    return false
  }
  const digits = value.replace(/ /g, "");
  if (!/^[0-9]{16}$/.test(digits)) {
    return false
  }
  let total = 0,
  doubleNext = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let number = Number(digits.charAt(i));
    if (doubleNext) {
      number = number * 2;
      if (number > 9) {
        number = number - 9
      }
    }
    total = total + number;
    doubleNext = !doubleNext
  }
  return total % 10 === 0
}
function drawCode39(id, value) {
  const svg = document.getElementById(id);
  if (!svg) return;
  const patterns = {
    "0": "nnnwwnwnn",
    "1": "wnnwnnnnw",
    "2": "nnwwnnnnw",
    "3": "wnwwnnnnn",
    "4": "nnnwwnnnw",
    "5": "wnnwwnnnn",
    "6": "nnwwwnnnn",
    "7": "nnnwnnwnw",
    "8": "wnnwnnwnn",
    "9": "nnwwnnwnn",
    "A": "wnnnnwnnw",
    "Z": "nwwnwnnnn",
    "-": "nwnnnnwnw",
    "*": "nwnnwnwnn"
  };
  const chars = "*" + String(value).toUpperCase() + "*";
  let x = 10;
  const bars = [];
  for (let i = 0; i < chars.length; i++) {
    const pattern = patterns[chars.charAt(i)];
    if (!pattern) return;
    for (let j = 0; j < pattern.length; j++) {
      const width = pattern.charAt(j) === "w" ? 3 : 1;
      if (j % 2 === 0) {
        bars.push( {
          x: x, width: width
        })
      }
      x = x + width
    }
    x = x + 1
  }
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild)
  }
  svg.setAttribute("viewBox", "0 0 " + (x + 10) + " 52");
  svg.setAttribute("aria-label", "Pickup barcode for receipt " + value);
  for (let i = 0; i < bars.length; i++) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", bars[i].x);
    rect.setAttribute("y", "2");
    rect.setAttribute("width", bars[i].width);
    rect.setAttribute("height", "48");
    rect.setAttribute("fill", "#102548");
    svg.appendChild(rect)
  }
}
function readFleetStatuses() {
  try {
    const saved = JSON.parse(localStorage.getItem(fleetStatusKey) || "{}");
    return saved && typeof saved === "object" ? saved : {}
  }
  catch (err) {
    return {}
  }
}
function carStatus(carId) {
  const booking = getBookingForCar(carId);
  return booking ? bookingStatus(booking) : "available"
}
function markBookedCar() {
  const cards = document.querySelectorAll(".car");
  if (!cards.length) return;
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i],
    status = card.querySelector(".status"),
    link = card.querySelector(".price a"),
    href = link ? link.getAttribute("href") || "" : "",
    marker = href.indexOf("?car="),
    carId = marker >= 0 ? href.substring(marker + 5) : "";
    if (!status || !carId) continue;
    const state = carStatus(carId);
    status.className = "status " + state;
    status.textContent = state === "rented" ? "Rented out" : state === "reserved" ? "Reserved" : state === "returned" ? "Returned" : "Available";
    if (link) {
      if (!link.getAttribute("data-available-label")) link.setAttribute("data-available-label", link.textContent);
      if (state !== "available") {
        link.setAttribute("aria-disabled", "true");
        link.textContent = status.textContent
      }
      else {
        link.removeAttribute("aria-disabled");
        link.textContent = link.getAttribute("data-available-label")
      }
    }
  }
}
markBookedCar();
const carLinks = document.querySelectorAll(".price a[href]");
for (let i = 0; i < carLinks.length; i++) {
  carLinks[i].addEventListener("click", function(e) {
    const href = carLinks[i].getAttribute("href") || "",
        marker = href.indexOf("?car=");
    if (carLinks[i].getAttribute("aria-disabled") === "true") {
      e.preventDefault();
      return
    }
    if (marker < 0) return;
    let request = null,
    currentDraft = readReservationDraft();
    try {
      request = JSON.parse(localStorage.getItem(searchKey) || "null")
    }
    catch (err) {
    }
    const source = currentDraft || request || {},
    draft = {
      carId: href.substring(marker + 5),
      pickupBranch: source.pickupBranch || "east",
      pickupDate: source.pickupDate || "",
      returnDate: source.returnDate || ""
    };
    try {
      localStorage.setItem(reservationDraftKey, JSON.stringify(draft))
    }
    catch (err) {
    }
  })
}
const home = document.getElementById("home-form");
if (home) {
  const homeStart = document.getElementById("home-start-date"),
  homeEnd = document.getElementById("home-end-date");
  homeStart.addEventListener("change", function() {
    homeEnd.min = homeStart.value; if (homeEnd.value && homeEnd.value < homeStart.value) {
      homeEnd.value = ""
    }
  });
  home.addEventListener("submit", function(e) {
    e.preventDefault(); if (!homeStart.value || !homeEnd.value || homeEnd.value < homeStart.value) {
      alert("Choose a return date on or after the pickup date."); return
    }
    const request = {
      category: document.getElementById("home-car").value, pickupBranch: document.getElementById("home-branch").value, pickupDate: homeStart.value, returnDate: homeEnd.value
    };
    const draft = {
      carId: "",
      pickupBranch: request.pickupBranch,
      pickupDate: request.pickupDate,
      returnDate: request.returnDate
    };
    try {
      localStorage.setItem(searchKey, JSON.stringify(request));
      localStorage.setItem(reservationDraftKey, JSON.stringify(draft));
      window.location.href = "cars.html?search=1"
    }
    catch (err) {
      alert("Use VS Code Live Server to search and save your booking details.")
    }
  })
}
const adminContent = document.getElementById("admin-content");
const adminRows = document.getElementById("admin-car-rows");
const staffKey = "azoomStaffAccount";
function getStaffAccount() {
  let staff = null;
  try {
    staff = JSON.parse(localStorage.getItem(staffKey))
  }
  catch (err) {
  }
  if (!staff || typeof staff !== "object") {
    staff = {
      dataReset: false
    }
  }
  staff.username = "staff";
  staff.email = "staff@gmail.com";
  staff.password = "staff";
  if (typeof staff.dataReset !== "boolean") {
    staff.dataReset = false
  }
  try {
    localStorage.setItem(staffKey, JSON.stringify(staff))
  }
  catch (err) {
  }
  return staff;
}
function clearOldAzoomData() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.indexOf("azoom") === 0 && key !== staffKey) {
      localStorage.removeItem(key)
    }
  }
}
function signInStaff(username, password) {
  const staffAccount = getStaffAccount();
  if (username !== staffAccount.username || password !== staffAccount.password) {
    return false
  }
  if (!staffAccount.dataReset) {
    clearOldAzoomData();
    staffAccount.dataReset = true;
    localStorage.setItem(staffKey, JSON.stringify(staffAccount))
  }
  localStorage.setItem(staffLoginKey, "yes");
  return true
}
function addAdminActionButton(cell, carId, action, label, disabled, reference) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn alt fleet-action";
  button.textContent = label;
  button.setAttribute("data-admin-action", action);
  button.setAttribute("data-car-id", carId);
  if (reference) button.setAttribute("data-booking-reference", reference);
  button.disabled = disabled;
  cell.appendChild(button)
}
function renderAdminDashboard() {
  if (!adminRows) return;
  while (adminRows.firstChild) adminRows.removeChild(adminRows.firstChild);
  const bookings = readBookings();
  let available = 0, reserved = 0, rented = 0, returned = 0;
  for (const id in vehicle) {
    const car = vehicle[id];
    let booking = null;
    for (let i = bookings.length - 1; i >= 0; i--) {
      if (bookings[i].carId === id) {
        booking = bookings[i];
        break
      }
    }
    const state = booking ? bookingStatus(booking) : "available";
    if (state === "available") available++;
    if (state === "reserved") reserved++;
    if (state === "rented") rented++;
    if (state === "returned") returned++;
    const row = document.createElement("tr"),
    name = document.createElement("td"),
    category = document.createElement("td"),
    rate = document.createElement("td"),
    statusCell = document.createElement("td"),
    customerCell = document.createElement("td"),
    dateCell = document.createElement("td"),
    actionCell = document.createElement("td"),
    badge = document.createElement("span");
    name.textContent = car.name;
    category.textContent = car.cat;
    rate.textContent = money(car.rate) + " / day";
    badge.className = "status " + state;
    badge.textContent = state === "rented" ? "Rented out" : state === "reserved" ? "Reserved" : state === "returned" ? "Returned" : "Available";
    statusCell.appendChild(badge);
    if (booking) {
      const email = document.createElement("span"), receipt = document.createElement("small");
      email.textContent = booking.email;
      receipt.textContent = "Receipt: " + booking.reference;
      customerCell.appendChild(email);
      customerCell.appendChild(document.createElement("br"));
      customerCell.appendChild(receipt);
      dateCell.textContent = booking.pickupDate + " to " + booking.returnDate
    }
    else {
      customerCell.textContent = "—";
      dateCell.textContent = "—"
    }
    actionCell.className = "admin-actions";
    if (state === "reserved") {
      addAdminActionButton(actionCell, id, "rent", "Rented out", false, booking.reference);
      addAdminActionButton(actionCell, id, "cancel", "Cancel reservation", false, booking.reference)
    }
    else if (state === "rented") {
      addAdminActionButton(actionCell, id, "return", "Returned", false, booking.reference)
    }
    else if (state === "returned" && !booking.billIssued) {
      addAdminActionButton(actionCell, id, "inspect", "Inspection", false, booking.reference)
    }
    else if (state === "returned" && booking.billIssued) {
      actionCell.textContent = "Bill issued"
    }
    row.appendChild(name); row.appendChild(category); row.appendChild(rate); row.appendChild(statusCell); row.appendChild(customerCell); row.appendChild(dateCell); row.appendChild(actionCell);
    adminRows.appendChild(row)
  }
  show("admin-available", available);
  show("admin-reserved", reserved);
  show("admin-rented", rented);
  show("admin-returned", returned);
  let rentTotal = 0, damageTotal = 0, paidTotal = 0, outstandingTotal = 0;
  for (let i = 0; i < bookings.length; i++) {
    const booking = bookings[i],
    rent = Number(booking.dailyRate || 0) * Number(booking.rentalDays || 0),
    damage = bookingDamageTotal(booking),
    total = rent + damage,
    paid = booking.paid ? Math.min(total, Number(booking.paidAmount || total)) : 0;
    rentTotal += rent;
    damageTotal += damage;
    paidTotal += paid;
    outstandingTotal += Math.max(0, total - paid)
  }
  show("admin-booking-car", bookings.length ? bookings.length + " saved reservation(s)" : "No saved reservations");
  show("admin-booking-state", bookings.length ? "Fleet: " + reserved + " reserved, " + rented + " rented out, " + returned + " returned" : "No current bookings");
  show("admin-rent", money(rentTotal));
  show("admin-damage", money(damageTotal));
  show("admin-total", money(rentTotal + damageTotal));
  show("admin-paid", money(paidTotal));
  show("admin-outstanding", money(outstandingTotal));
  show("admin-cost-note", "Cost totals across " + bookings.length + " saved reservation(s). Sample cars without a booking have no transaction record.")
}
const adminActionModal = document.getElementById("admin-action-modal"),
adminActionTitle = document.getElementById("admin-action-title"),
adminActionLabel = document.getElementById("admin-action-label"),
adminActionCopy = document.getElementById("admin-action-copy"),
adminActionConfirm = document.getElementById("admin-action-confirm"),
adminActionCancel = document.getElementById("admin-action-cancel"),
inspectionModal = document.getElementById("inspection-modal"),
inspectionForm = document.getElementById("inspection-form"),
inspectionChecklist = document.getElementById("inspection-checklist");
let pendingAdminAction = null,
lastAdminActionButton = null,
pendingInspectionReference = "";
const inspectionItems = [
  "Exterior and bodywork",
  "Windscreen and glass",
  "Tyres and wheels",
  "Lights and mirrors",
  "Interior and charging cable"
];
function showInspectionMessage(message) {
  const el = document.getElementById("inspection-message");
  if (el) {
    el.textContent = message;
    el.hidden = false
  }
}
function buildInspectionChecklist() {
  while (inspectionChecklist.firstChild) inspectionChecklist.removeChild(inspectionChecklist.firstChild);
  for (let i = 0; i < inspectionItems.length; i++) {
    const group = document.createElement("fieldset"),
    legend = document.createElement("legend"),
    choices = document.createElement("div"),
    goodLabel = document.createElement("label"),
    repairLabel = document.createElement("label"),
    goodRadio = document.createElement("input"),
    repairRadio = document.createElement("input"),
    costField = document.createElement("div"),
    costLabel = document.createElement("label"),
    costInput = document.createElement("input"),
    commentField = document.createElement("div"),
    commentLabel = document.createElement("label"),
    commentInput = document.createElement("textarea"),
    photoField = document.createElement("div"),
    photoLabel = document.createElement("label"),
    photoInput = document.createElement("input");
    group.className = "inspection-item";
    legend.textContent = inspectionItems[i];
    choices.className = "inspection-choices";
    goodRadio.type = "radio"; goodRadio.name = "inspection-condition-" + i; goodRadio.value = "good"; goodRadio.required = true;
    goodLabel.appendChild(goodRadio); goodLabel.appendChild(document.createTextNode(" Good condition"));
    repairRadio.type = "radio"; repairRadio.name = "inspection-condition-" + i; repairRadio.value = "repair"; repairRadio.required = true;
    repairLabel.appendChild(repairRadio); repairLabel.appendChild(document.createTextNode(" Needs repair"));
    choices.appendChild(goodLabel); choices.appendChild(repairLabel);
    costField.className = "field inspection-cost"; costField.hidden = true;
    costLabel.htmlFor = "inspection-cost-" + i; costLabel.textContent = "Repair cost (S$)";
    costInput.id = "inspection-cost-" + i; costInput.type = "number"; costInput.min = "0"; costInput.step = "0.01"; costInput.value = "0";
    costField.appendChild(costLabel); costField.appendChild(costInput);
    commentField.className = "field inspection-comment";
    commentLabel.htmlFor = "inspection-comment-" + i; commentLabel.textContent = "Staff comment";
    commentInput.id = "inspection-comment-" + i; commentInput.rows = 2; commentInput.maxLength = 500;
    commentField.appendChild(commentLabel); commentField.appendChild(commentInput);
    photoField.className = "field inspection-photo";
    photoLabel.htmlFor = "inspection-photo-" + i; photoLabel.textContent = "Attach photo (optional)";
    photoInput.id = "inspection-photo-" + i; photoInput.type = "file"; photoInput.accept = "image/*";
    photoField.appendChild(photoLabel); photoField.appendChild(photoInput);
    function toggleCost() {
      const needsRepair = repairRadio.checked;
      costField.hidden = !needsRepair;
      costInput.required = needsRepair
    }
    goodRadio.addEventListener("change", toggleCost);
    repairRadio.addEventListener("change", toggleCost);
    group.appendChild(legend); group.appendChild(choices); group.appendChild(costField); group.appendChild(commentField); group.appendChild(photoField);
    inspectionChecklist.appendChild(group)
  }
}
function openInspection(reference) {
  const booking = findBooking(reference);
  if (!booking || bookingStatus(booking) !== "returned" || booking.billIssued) return;
  pendingInspectionReference = reference;
  const details = document.getElementById("inspection-booking-info");
  if (details) details.textContent = booking.carName + " · " + booking.email + " · Receipt " + booking.reference;
  const general = document.getElementById("inspection-general-comment"), message = document.getElementById("inspection-message");
  if (general) general.value = "";
  if (message) { message.hidden = true; message.textContent = "" }
  buildInspectionChecklist();
  inspectionModal.hidden = false;
  const firstChoice = inspectionChecklist.querySelector("input[type=radio]");
  if (firstChoice) firstChoice.focus()
}
function readInspectionPhotos(files, index, photos, done) {
  if (index >= files.length) { done(photos); return }
  const reader = new FileReader();
  reader.onload = function() {
    photos.push({ itemIndex: files[index].itemIndex, name: files[index].file.name, data: reader.result });
    readInspectionPhotos(files, index + 1, photos, done)
  };
  reader.onerror = function() { done(null) };
  reader.readAsDataURL(files[index].file)
}
if (inspectionForm) {
  inspectionForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const booking = findBooking(pendingInspectionReference);
    if (!booking || bookingStatus(booking) !== "returned" || booking.billIssued) {
      showInspectionMessage("This returned booking is no longer waiting for inspection.");
      return
    }
    const photoFiles = [];
    let totalPhotoBytes = 0;
    for (let i = 0; i < inspectionItems.length; i++) {
      const input = document.getElementById("inspection-photo-" + i);
      if (input.files.length > 1) {
        showInspectionMessage("Attach no more than one photo to each checklist item.");
        return
      }
      if (input.files.length) {
        totalPhotoBytes += input.files[0].size;
        photoFiles.push({ itemIndex: i, file: input.files[0] })
      }
    }
    if (totalPhotoBytes > 1000000) {
      showInspectionMessage("Please keep all attached photos under 1 MB total for browser storage.");
      return
    }
    const items = [];
    for (let i = 0; i < inspectionItems.length; i++) {
      const selected = document.querySelector('input[name="inspection-condition-' + i + '"]:checked'),
      needsRepair = selected.value === "repair";
      items.push({
        label: inspectionItems[i],
        condition: needsRepair ? "Needs repair" : "Good condition",
        repairCost: needsRepair ? Number(document.getElementById("inspection-cost-" + i).value) : 0,
        comment: document.getElementById("inspection-comment-" + i).value.trim(),
        images: []
      })
    }
    readInspectionPhotos(photoFiles, 0, [], function(photos) {
      if (!photos) {
        showInspectionMessage("A photo could not be read. Please choose it again.");
        return
      }
      for (let i = 0; i < photos.length; i++) items[photos[i].itemIndex].images.push({ name: photos[i].name, data: photos[i].data });
      const savedBookings = readBookings();
      let bookingIndex = -1;
      for (let i = 0; i < savedBookings.length; i++) {
        if (savedBookings[i].reference === pendingInspectionReference) { bookingIndex = i; break }
      }
      if (bookingIndex < 0) {
        showInspectionMessage("The reservation could not be found. Close this window and refresh the staff page.");
        return
      }
      savedBookings[bookingIndex].inspection = {
        items: items,
        comment: document.getElementById("inspection-general-comment").value.trim(),
        completedAt: new Date().toISOString()
      };
      savedBookings[bookingIndex].billIssued = true;
      savedBookings[bookingIndex].status = "available";
      try {
        saveBookings(savedBookings);
        inspectionModal.hidden = true;
        pendingInspectionReference = "";
        renderAdminDashboard();
        accountMessage("admin-action-msg", "Final bill created and added to the customer’s account. The car is available again.");
        const message = document.getElementById("admin-action-msg");
        if (message) message.className = "msg success"
      }
      catch (err) {
        showInspectionMessage("The bill could not be saved. Use VS Code Live Server and try again.")
      }
    })
  })
}
const inspectionClose = document.getElementById("inspection-close");
if (inspectionClose && inspectionModal) {
  inspectionClose.addEventListener("click", function() {
    inspectionModal.hidden = true;
    pendingInspectionReference = ""
  })
}
if (adminRows && adminActionModal) {
  adminRows.addEventListener("click", function(e) {
    const button = e.target;
    if (!button || button.tagName !== "BUTTON" || button.disabled) return;
    const action = button.getAttribute("data-admin-action"),
    carId = button.getAttribute("data-car-id"),
    reference = button.getAttribute("data-booking-reference");
    if (!action || !carId || !reference) return;
    lastAdminActionButton = button;
    if (action === "inspect") {
      openInspection(reference);
      return
    }
    pendingAdminAction = { action: action, carId: carId, reference: reference };
    adminActionLabel.textContent = action === "rent" ? "CAR HANDOVER" : action === "return" ? "CAR RETURN" : "CANCEL RESERVATION";
    adminActionTitle.textContent = action === "rent" ? "Mark this car as rented out?" : action === "return" ? "Mark this car as returned?" : "Cancel this reservation?";
    adminActionCopy.textContent = action === "rent" ? "Confirm that the customer has collected the car. Its status will change from Reserved to Rented out." : action === "return" ? "Confirm that the customer has returned this car. An inspection action will then appear." : "This will remove the reservation and make the car available again for customers.";
    adminActionConfirm.textContent = action === "rent" ? "Yes, mark rented out" : action === "return" ? "Yes, mark returned" : "Yes, cancel reservation";
    adminActionModal.hidden = false;
    adminActionConfirm.focus()
  })
}
if (adminActionCancel && adminActionModal) {
  adminActionCancel.addEventListener("click", function() {
    adminActionModal.hidden = true;
    pendingAdminAction = null;
    if (lastAdminActionButton) lastAdminActionButton.focus()
  })
}
if (adminActionConfirm && adminActionModal) {
  adminActionConfirm.addEventListener("click", function() {
    if (!pendingAdminAction) { adminActionModal.hidden = true; return }
    try {
      const bookings = readBookings(), action = pendingAdminAction.action, reference = pendingAdminAction.reference;
      let index = -1;
      for (let i = 0; i < bookings.length; i++) {
        if (bookings[i].reference === reference && bookings[i].carId === pendingAdminAction.carId) { index = i; break }
      }
      const booking = index >= 0 ? bookings[index] : null,
      state = booking ? bookingStatus(booking) : "available";
      if (!booking || action === "rent" && state !== "reserved" || action === "return" && state !== "rented" || action === "cancel" && state !== "reserved") {
        throw new Error("This reservation status has changed. Refresh the fleet and try again.")
      }
      if (action === "rent") booking.status = "rented";
      else if (action === "return") booking.status = "returned";
      else bookings.splice(index, 1);
      saveBookings(bookings);
      adminActionModal.hidden = true;
      pendingAdminAction = null;
      renderAdminDashboard();
      accountMessage("admin-action-msg", action === "rent" ? "Car marked as rented out." : action === "return" ? "Car marked as returned. The inspection action is now available." : "Reservation cancelled. The car is now available.");
      const message = document.getElementById("admin-action-msg");
      if (message) message.className = "msg success"
    }
    catch (err) {
      adminActionModal.hidden = true;
      pendingAdminAction = null;
      accountMessage("admin-action-msg", err && err.message ? err.message : "The fleet status could not be saved. Please try again.");
      const message = document.getElementById("admin-action-msg");
      if (message) message.className = "msg"
    }
  })
}
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape" && adminActionModal && !adminActionModal.hidden) {
    adminActionModal.hidden = true;
    pendingAdminAction = null;
    if (lastAdminActionButton) lastAdminActionButton.focus()
  }
  if (e.key === "Escape" && inspectionModal && !inspectionModal.hidden) {
    inspectionModal.hidden = true;
    pendingInspectionReference = ""
  }
});
if (adminRows) {
  renderAdminDashboard()
}
const adminLoginRequired = document.getElementById("admin-login-required");
if (adminContent) {
  let staffSignedIn = false;
  try {
    staffSignedIn = localStorage.getItem(staffLoginKey) === "yes"
  }
  catch (err) {
  }
  if (staffSignedIn) {
    if (adminLoginRequired) {
      adminLoginRequired.hidden = true
    }
    adminContent.hidden = false;
    renderAdminDashboard()
  }
  else {
    adminContent.hidden = true;
    if (adminLoginRequired) {
      adminLoginRequired.hidden = false
    }
  }
}
const staffLogout = document.getElementById("staff-logout");
if (staffLogout) {
  staffLogout.addEventListener("click", function() {
    adminContent.hidden = true;
    if (adminLoginRequired) {
      adminLoginRequired.hidden = false
    }
    try {
      localStorage.removeItem(staffLoginKey)
    }
    catch (err) {
    }
    updateAccountLink()
  });
}
const summary = document.getElementById("search-summary");
if (summary && window.location.search.indexOf("?search=1") === 0) {
  try {
    const request = JSON.parse(localStorage.getItem(searchKey) || "null");
    if (request) {
      const groups = document.querySelectorAll(".group");
      let shown = 0;
      for (let i = 0; i < groups.length; i++) {
        const cards = groups[i].querySelectorAll(".car");
        let groupShown = 0;
        for (let j = 0; j < cards.length; j++) {
          const status = cards[j].querySelector(".status"),
          available = status && status.className.indexOf("available") >= 0;
          cards[j].hidden = !(groups[i].id === request.category && available);
          if (!cards[j].hidden) {
            groupShown++;
            shown++
          }
        }
        groups[i].hidden = groupShown === 0
      }
      const category = request.category === "city-ev" ? "City EV" : request.category === "family-ev" ? "Family EV" : "Premium EV",
      branch = request.pickupBranch === "east" ? "East - Changi Airport" : "West branch";
      summary.textContent = shown ? "Showing " + shown + " available " + category + " car(s) for " + request.pickupDate + " to " + request.returnDate + ", pickup at " + branch + "." : "No available " + category + " cars match this search. Try another category or change your dates.";
      summary.hidden = false
    }
  }
  catch (err) {
    summary.textContent = "Search details could not be loaded. Please search again.";
    summary.hidden = false
  }
}
const form = document.getElementById("reserve-form");
if (form) {
  const customer = getCurrentAccount(),
  select = document.getElementById("car-choice"),
  start = document.getElementById("start-date"),
  end = document.getElementById("end-date"),
  branch = document.getElementById("pickup-branch"),
  cardNumber = document.getElementById("card-number"),
  cardExpiry = document.getElementById("card-expiry"),
  cardSecurity = document.getElementById("card-security"),
  cardError = document.getElementById("card-error"),
  confirmModal = document.getElementById("confirm-modal"),
  confirmYes = document.getElementById("confirm-yes"),
  confirmLater = document.getElementById("confirm-later");
  let pendingBooking = null,
  draft = readReservationDraft(),
  request = null;
  try {
    request = JSON.parse(localStorage.getItem(searchKey) || "null")
  }
  catch (err) {
  }
  if (window.location.search.indexOf("?car=") === 0) {
    select.value = window.location.search.substring(5)
  }
  else if (draft && draft.carId) {
    select.value = draft.carId
  }
  if (draft && draft.pickupBranch) {
    branch.value = draft.pickupBranch
  }
  else if (request && request.pickupBranch) {
    branch.value = request.pickupBranch
  }
  start.value = draft && draft.pickupDate ? draft.pickupDate : request && request.pickupDate ? request.pickupDate : "";
  end.value = draft && draft.returnDate ? draft.returnDate : request && request.returnDate ? request.returnDate : "";
  end.min = start.value;

  if (customer) {
    document.getElementById("customer-name").value = customer.name;
    document.getElementById("customer-email").value = customer.email
  }

  function saveReservationDraft() {
    const saved = {
      carId: select.value,
      pickupBranch: branch.value,
      pickupDate: start.value,
      returnDate: end.value
    };
    try {
      localStorage.setItem(reservationDraftKey, JSON.stringify(saved))
    }
    catch (err) {
    }
  }

  function currentCarStatus(carId) {
    return carStatus(carId)
  }

  function updateCarOptions() {
    for (let i = 0; i < select.options.length; i++) {
      const option = select.options[i], car = vehicle[option.value];
      if (!car) continue;
      if (!option.getAttribute("data-original-label")) option.setAttribute("data-original-label", option.textContent);
      const state = currentCarStatus(option.value), unavailable = state !== "available";
      option.textContent = option.getAttribute("data-original-label") + (unavailable ? " (Not available)" : "");
      option.disabled = unavailable && option.value !== select.value
    }
  }

  function showCarAvailability(carId) {
    const message = document.getElementById("availability-msg");
    if (!message || !carId) {
      if (message) message.hidden = true;
      return true
    }
    const state = currentCarStatus(carId);
    if (state === "available") {
      message.hidden = true;
      return true
    }
    const label = state === "reserved" ? "reserved" : state === "returned" ? "returned and awaiting inspection" : "rented out";
    message.textContent = (vehicle[carId] ? vehicle[carId].name : "This car") + " is not available; it is currently " + label + ". Please choose another car.";
    message.hidden = false;
    return false
  }
  function updateBookingSummary() {
    const car = vehicle[select.value],
    summary = document.getElementById("booking-summary");
    if (!summary) return;
    if (!select.value && !start.value && !end.value) {
      summary.hidden = true;
      return
    }
    summary.hidden = false;
    show("draft-car", car ? car.name : "Select a car");
    show("draft-category", car ? car.cat : "Select a car");
    show("draft-pickup", start.value || "Not selected");
    show("draft-return", end.value || "Not selected");
    show("draft-branch", branch.options[branch.selectedIndex].textContent)
  }

  function saveAndUpdateDraft() {
    saveReservationDraft();
    updateBookingSummary()
  }

  select.addEventListener("change", function() {
    updateCarOptions();
    showCarAvailability(select.value);
    saveAndUpdateDraft()
  });
  branch.addEventListener("change", saveAndUpdateDraft);
  start.addEventListener("change", function() {
    end.min = start.value;
    if (end.value && end.value < start.value) {
      end.value = ""
    }
    saveAndUpdateDraft()
  });
  end.addEventListener("change", saveAndUpdateDraft);
  const browseCarsLink = document.getElementById("browse-cars-link");
  if (browseCarsLink) {
    browseCarsLink.addEventListener("click", saveReservationDraft)
  }
  updateBookingSummary();
  updateCarOptions();
  showCarAvailability(select.value);
  window.addEventListener("storage", function(e) {
    if (!e.key || e.key === bookingsKey || e.key === bookingKey || e.key === fleetStatusKey || e.key === "azoomPaid") {
      updateCarOptions();
      showCarAvailability(select.value)
    }
  });

  if (!customer) {
    saveReservationDraft();
    const next = "reservation.html" + window.location.search;
    window.location.replace("account.html?next=" + encodeURIComponent(next))
  }

  function closeReservationConfirm() {
    if (confirmModal) {
      confirmModal.hidden = true
    }
    pendingBooking = null;
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.focus()
    }
  }

  function saveConfirmedReservation() {
    if (!pendingBooking) return;
    const carId = pendingBooking.carId;
    if (!showCarAvailability(carId)) {
      select.value = carId;
      updateCarOptions();
      showCarAvailability(carId);
      pendingBooking = null;
      if (confirmModal) confirmModal.hidden = true;
      select.focus();
      return
    }
    try {
      const bookings = readBookings();
      for (let i = 0; i < bookings.length; i++) {
        if (bookings[i].carId === carId) {
          alert("This car has just become unavailable. Please choose another car.");
          updateCarOptions();
          showCarAvailability(carId);
          pendingBooking = null;
          if (confirmModal) confirmModal.hidden = true;
          return
        }
      }
      pendingBooking.status = "reserved";
      pendingBooking.paid = false;
      pendingBooking.paidAmount = 0;
      pendingBooking.inspection = null;
      bookings.push(pendingBooking);
      saveBookings(bookings);
      localStorage.removeItem(reservationDraftKey);
      cardNumber.value = "";
      cardExpiry.value = "";
      cardSecurity.value = "";
      window.location.href = "confirmation.html?ref=" + encodeURIComponent(pendingBooking.reference)
    }
    catch (err) {
      alert("Use VS Code Live Server to save the reservation.")
    }
  }

  if (confirmYes) {
    confirmYes.addEventListener("click", saveConfirmedReservation)
  }
  if (confirmLater) {
    confirmLater.addEventListener("click", closeReservationConfirm)
  }
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && confirmModal && !confirmModal.hidden) {
      closeReservationConfirm()
    }
  });

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    const activeCustomer = getCurrentAccount();
    if (!activeCustomer) {
      saveReservationDraft();
      window.location.href = "account.html?next=" + encodeURIComponent("reservation.html" + window.location.search);
      return
    }
    const car = vehicle[select.value];
    if (!showCarAvailability(select.value)) {
      updateCarOptions();
      return
    }
    let days = Math.ceil((new Date(end.value) - new Date(start.value)) / 86400000);
    if (!car || !start.value || !end.value || end.value < start.value) {
      alert("Choose a return date on or after the pickup date.");
      return
    }
    days = Math.max(1, days);
    if (!validCardNumber(cardNumber.value.trim())) {
      cardError.textContent = "Enter a valid 16-digit card number.";
      cardError.hidden = false;
      return
    }
    const today = new Date(),
    month = today.getMonth() + 1,
    currentMonth = today.getFullYear() + "-" + (month < 10 ? "0" : "") + month;
    if (!cardExpiry.value || cardExpiry.value < currentMonth) {
      cardError.textContent = "Choose an expiry date that has not passed.";
      cardError.hidden = false;
      return
    }
    if (!/^[0-9]{3,4}$/.test(cardSecurity.value.trim())) {
      cardError.textContent = "Enter a 3- or 4-digit security code.";
      cardError.hidden = false;
      return
    }
    cardError.hidden = true;
    const branchLabel = branch.options[branch.selectedIndex].textContent,
    booking = {
      reference: "AZ-" + String(Date.now()),
      customerName: document.getElementById("customer-name").value,
      email: document.getElementById("customer-email").value,
      phone: document.getElementById("customer-phone").value,
      carId: select.value,
      carName: car.name,
      category: car.cat,
      dailyRate: car.rate,
      pickupBranch: branchLabel,
      pickupLocation: pickupLocation(branchLabel),
      pickupDate: start.value,
      returnDate: end.value,
      rentalDays: days,
      estimatedTotal: car.rate * days
    };
    pendingBooking = booking;
    if (confirmModal) {
      confirmModal.hidden = false
    }
    if (confirmYes) {
      confirmYes.focus()
    }
  })
}
const empty = document.getElementById("no-booking"),
box = document.getElementById("confirm-box");
if (empty && box) {
  const booking = latestBooking();
  if (booking) {
    empty.hidden = true;
    box.hidden = false;
    show("confirm-ref", booking.reference);
    show("confirm-name", booking.customerName);
    show("confirm-email", booking.email);
    show("confirm-phone", booking.phone);
    show("confirm-car", booking.carName);
    show("confirm-category", booking.category);
    show("confirm-branch", booking.pickupBranch);
    show("confirm-location", booking.pickupLocation || pickupLocation(booking.pickupBranch));
    show("barcode-text", booking.reference);
    drawCode39("pickup-barcode", booking.reference);
    show("confirm-days", booking.rentalDays + (booking.rentalDays === 1 ? " day" : " days"));
    show("confirm-pickup", booking.pickupDate);
    show("confirm-return", booking.returnDate);
    show("confirm-rate", money(booking.dailyRate) + " per day");
    show("confirm-total", money(booking.estimatedTotal));
    const receipt = "AZoom Car Rental - Reservation Confirmation\nReceipt number: " + booking.reference + "\nCustomer: " + booking.customerName + "\nEmail: " + booking.email + "\nPhone: " + booking.phone + "\nVehicle: " + booking.carName + " (" + booking.category + ")\nPickup: " + booking.pickupBranch + "\nPickup location: " + (booking.pickupLocation || pickupLocation(booking.pickupBranch)) + "\nBarcode value: " + booking.reference + "\nPickup date: " + booking.pickupDate + "\nReturn date: " + booking.returnDate + "\nDays: " + booking.rentalDays + "\nRate: " + money(booking.dailyRate) + "\nEstimated amount: " + money(booking.estimatedTotal),
    blob = new Blob([receipt], { type: "text/plain" }),
    link = document.getElementById("download-link");
    if (link) {
      link.href = URL.createObjectURL(blob);
      link.download = "AZoom-" + booking.reference + ".txt"
    }
  }
  else {
    box.hidden = true;
    empty.hidden = false
  }
}
const print = document.getElementById("print-btn");
if (print) {
  print.addEventListener("click", function() {
    window.print()
  })
}
const inspect = document.getElementById("inspect-form");
if (inspect) {
  const referenceInput = document.getElementById("inspect-ref"),
  carInput = document.getElementById("inspect-car"),
  firstBooking = latestBooking();
  if (firstBooking && !referenceInput.value) referenceInput.value = firstBooking.reference;
  function updateInspectionCar() {
    const booking = findBooking(referenceInput.value.trim());
    carInput.value = booking ? booking.carName : ""
  }
  updateInspectionCar();
  referenceInput.addEventListener("change", updateInspectionCar);
  inspect.addEventListener("submit", function(e) {
    e.preventDefault();
    const bookings = readBookings(), reference = referenceInput.value.trim();
    let index = -1;
    for (let i = 0; i < bookings.length; i++) {
      if (bookings[i].reference === reference) { index = i; break }
    }
    if (index < 0) {
      show("inspect-msg", "No reservation matches that booking reference.");
      return
    }
    const choice = document.querySelector('input[name="damage"]:checked'),
    damage = choice && choice.value === "yes",
    record = {
      reference: reference,
      vehicle: bookings[index].carName,
      returnTime: document.getElementById("inspect-time").value,
      odometer: document.getElementById("inspect-odo").value,
      damage: damage,
      damageCost: damage ? Number(document.getElementById("damage-cost").value) : 0,
      employee: document.getElementById("employee").value
    };
    try {
      bookings[index].inspection = record;
      saveBookings(bookings);
      show("inspect-msg", "Inspection saved. You can now open the final bill.");
      const billLink = document.getElementById("inspection-bill-link");
      if (billLink) billLink.href = "final-bill.html?ref=" + encodeURIComponent(reference)
    }
    catch (err) {
      show("inspect-msg", "Use VS Code Live Server to save the inspection.")
    }
  })
}
const billSelect = document.getElementById("bill-booking-select");
let initialBillReference = queryValue("ref");
function renderBill() {
  if (!document.getElementById("bill-total")) return;
  const bookings = readBookings();
  if (!billSelect) return;
  const previousReference = billSelect.value;
  while (billSelect.firstChild) billSelect.removeChild(billSelect.firstChild);
  for (let i = 0; i < bookings.length; i++) {
    const option = document.createElement("option");
    option.value = bookings[i].reference;
    option.textContent = bookings[i].reference + " - " + bookings[i].customerName + " - " + bookings[i].carName;
    billSelect.appendChild(option)
  }
  if (initialBillReference) billSelect.value = initialBillReference;
  else if (previousReference) billSelect.value = previousReference;
  if (!billSelect.value && billSelect.options.length) billSelect.selectedIndex = billSelect.options.length - 1;
  initialBillReference = "";
  billSelect.disabled = bookings.length === 0;
  const booking = findBooking(billSelect.value);
  if (!booking) {
    show("bill-ref", "No saved booking");
    show("bill-customer", "-"); show("bill-car", "-"); show("bill-days", "-");
    show("bill-inspection", "No inspection saved");
    show("bill-rent-calc", "-"); show("bill-rent", money(0));
    show("bill-damage-calc", "-"); show("bill-damage", money(0)); show("bill-total", money(0));
    const payButton = document.getElementById("pay-btn");
    if (payButton) payButton.disabled = true;
    return
  }
  const rent = Number(booking.dailyRate) * Number(booking.rentalDays),
  inspection = booking.inspection,
  damage = bookingDamageTotal(booking),
  label = inspection ? damage ? "Repair costs recorded" : "Inspection complete; no repair costs" : "No inspection saved";
  show("bill-ref", booking.reference);
  show("bill-customer", booking.customerName);
  show("bill-car", booking.carName);
  show("bill-days", booking.rentalDays);
  show("bill-inspection", label);
  show("bill-rent-calc", money(booking.dailyRate) + " x " + booking.rentalDays + " days");
  show("bill-rent", money(rent));
  show("bill-damage-calc", damage ? "Recorded after inspection" : "No damage charge");
  show("bill-damage", money(damage));
  show("bill-total", money(rent + damage));
  const payButton = document.getElementById("pay-btn");
  if (payButton) payButton.disabled = !!booking.paid
}
if (billSelect) {
  billSelect.addEventListener("change", renderBill);
  renderBill()
}
const pay = document.getElementById("pay-btn");
if (pay) {
  pay.addEventListener("click", function() {
    const bookings = readBookings(), reference = billSelect ? billSelect.value : queryValue("ref");
    let booking = null;
    for (let i = 0; i < bookings.length; i++) {
      if (bookings[i].reference === reference) { booking = bookings[i]; break }
    }
    if (!booking) {
      show("pay-msg", "Choose a saved booking before recording payment.");
      return
    }
    const amount = Number(document.getElementById("bill-total").textContent.replace(/[^0-9.]/g, ""));
    booking.paid = true;
    booking.paidAmount = amount;
    if (bookingStatus(booking) === "reserved") booking.status = "rented";
    try {
      saveBookings(bookings);
      show("pay-msg", "Payment marked paid in this assignment prototype.");
      pay.disabled = true
    }
    catch (err) {
      show("pay-msg", "Payment could not be saved. Use VS Code Live Server and try again.")
    }
  })
}

window.addEventListener("storage", function(e) {
  if (!e.key || e.key === bookingsKey || e.key === bookingKey || e.key === fleetStatusKey || e.key === "azoomPaid" || e.key === "azoomPaidAmount" || e.key === inspectKey) {
    if (document.getElementById("search-summary") && window.location.search.indexOf("?search=1") === 0) {
      window.location.reload();
      return
    }
    markBookedCar();
    if (adminRows) {
      renderAdminDashboard()
    }
    if (billSelect) renderBill();
    const current = getCurrentAccount();
    if (current && document.getElementById("account-state")) {
      showAccountReservation(current)
    }
  }
});