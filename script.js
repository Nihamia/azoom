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
  if (booking.status === "available" || booking.status === "returned" || booking.status === "repairing") return booking.status;
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
function bookingBaseTotal(booking) {
  return Number(booking && booking.dailyRate || 0) * Number(booking && booking.rentalDays || 0) + bookingDamageTotal(booking)
}
function bookingTotal(booking) {
  const base = bookingBaseTotal(booking),
  deduction = booking && booking.appealResolved ? Number(booking.appealDeduction || 0) : 0;
  return Math.max(0, base - deduction)
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
  let staffSignedIn = false;
  try {
    staffSignedIn = localStorage.getItem(staffLoginKey) === "yes"
  }
  catch (err) {
  }
  const staffLinks = document.querySelectorAll(".staff-only-link");
  for (let i = 0; i < staffLinks.length; i++) {
    staffLinks[i].hidden = !staffSignedIn
  }
  const link = document.getElementById("account-link");
  if (!link) return;
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
    link.textContent = "My Account";
    link.href = "account.html";
    link.onclick = null
  }
  else {
    link.textContent = "Login / Signup";
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
  payment = document.createElement("p"),
  received = !!(booking.billReceived || booking.paid),
  submitted = !!booking.paymentSubmitted && !received;
  bill.className = "account-bill";
  heading.textContent = "Final bill · " + booking.reference;
  bill.appendChild(heading);
  addBillLine(bill, "Customer", booking.email || "-");
  addBillLine(bill, "Car", booking.carName || "-");
  addBillLine(bill, "Pickup branch", booking.pickupBranch || "-");
  addBillLine(bill, "Collection point", booking.pickupLocation || pickupLocation(booking.pickupBranch));
  addBillLine(bill, "Rental dates", (booking.pickupDate || "-") + " to " + (booking.returnDate || "-"));
  addBillLine(bill, "Rental", money(Number(booking.dailyRate) * Number(booking.rentalDays)) + " (" + booking.rentalDays + " day(s) x " + money(booking.dailyRate) + ")");
  const inspection = booking.inspection || {}, items = inspection.items || [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i], row = document.createElement("div"), detail = document.createElement("p");
    row.className = "bill-item";
    detail.textContent = item.label + " — " + item.condition + (item.condition === "Needs repair" ? " · Repair: " + money(item.repairCost) : " · " + money(0));
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
  if (booking.appeal) {
    addBillLine(bill, "Appeal receipt", booking.appealReference || "AP-" + booking.reference);
    addBillLine(bill, "Appeal submitted", booking.appeal);
    if (booking.appealResolved) {
      addBillLine(bill, "Staff reply", booking.appealReply || "-");
      addBillLine(bill, "Original bill", money(bookingBaseTotal(booking)));
      addBillLine(bill, "Appeal deduction", "−" + money(booking.appealDeduction));
    }
  }
  total.className = "account-bill-total";
  total.textContent = "Final amount due: " + money(bookingTotal(booking));
  bill.appendChild(total);
  payment.className = received ? "msg success" : "note";
  payment.textContent = received ? "Payment received: " + money(booking.paidAmount || bookingTotal(booking)) : submitted ? "Payment submitted. Staff will confirm receipt." : booking.appeal && !booking.appealResolved ? "Your appeal is being reviewed. Payment will be available after staff sends the revised final bill." : booking.appealResolved ? "Staff sent the revised final bill. Please pay the updated amount below." : "Payment is outstanding. Pay or appeal this bill below.";
  bill.appendChild(payment);
  actions.className = "tools";
  if (!received && !submitted && !(booking.appeal && !booking.appealResolved)) {
    const pay = document.createElement("button");
    pay.className = "btn"; pay.type = "button"; pay.textContent = "Pay bill";
    pay.setAttribute("data-pay-reference", booking.reference);
    actions.appendChild(pay)
  }
  else if (received || submitted) {
    const paid = document.createElement("span");
    paid.className = "status " + (received ? "available" : "reserved");
    paid.textContent = received ? "Received" : "Submitted";
    actions.appendChild(paid)
  }
  else {
    const underReview = document.createElement("span");
    underReview.className = "status reserved";
    underReview.textContent = "Appeal under review";
    actions.appendChild(underReview)
  }
  if (!booking.appeal && !received && !submitted) {
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
  note.className = "small"; note.textContent = "Assignment prototype: payment submission, staff receipt confirmation and appeals are saved in this browser.";
  bill.appendChild(note);
  return bill
}
function showAccountReservation(user) {
  const list = document.getElementById("account-bookings-list"),
  empty = document.getElementById("account-no-booking"),
  historyList = document.getElementById("account-booking-history-list"),
  historyEmpty = document.getElementById("account-no-history");
  if (!list || !empty || !historyList || !historyEmpty) return;
  while (list.firstChild) list.removeChild(list.firstChild);
  while (historyList.firstChild) historyList.removeChild(historyList.firstChild);
  const bookings = readBookings();
  let activeCount = 0, historyCount = 0;
  for (let i = bookings.length - 1; i >= 0; i--) {
    const booking = bookings[i];
    if (booking.email !== user.email) continue;
    const state = bookingStatus(booking), isHistory = !!(booking.billReceived || booking.paid);
    if (isHistory) historyCount++;
    else activeCount++;
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
    const badge = document.createElement("span");
    badge.className = "status " + state;
    badge.textContent = state === "repairing" ? "Under repair" : booking.billIssued ? booking.billReceived || booking.paid ? "Bill received" : "Bill issued" : state === "rented" ? "Rented out" : state === "returned" ? "Returned" : state === "available" ? "Available" : "Reserved";
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
    card.appendChild(heading); card.appendChild(status);
    const bookingDetails = document.createElement("div");
    bookingDetails.className = "account-booking-details";
    bookingDetails.appendChild(pickup); bookingDetails.appendChild(returning);
    bookingDetails.appendChild(branch); bookingDetails.appendChild(location); bookingDetails.appendChild(receipt); bookingDetails.appendChild(tools);
    if (booking.billIssued) bookingDetails.appendChild(createAccountBill(booking));
    const collapseDetails = isHistory || booking.billIssued && (booking.billReceived || booking.paid);
    if (collapseDetails) {
      const toggle = document.createElement("button"), showLabel = isHistory ? "Show booking history details" : "Show booking and paid bill details";
      bookingDetails.id = "account-booking-details-" + booking.reference;
      bookingDetails.hidden = true;
      toggle.className = "btn alt account-booking-toggle";
      toggle.type = "button";
      toggle.textContent = showLabel;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", bookingDetails.id);
      toggle.addEventListener("click", function() {
        bookingDetails.hidden = !bookingDetails.hidden;
        const expanded = !bookingDetails.hidden;
        toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
        toggle.textContent = expanded ? showLabel.replace("Show", "Hide") : showLabel
      });
      card.appendChild(toggle)
    }
    card.appendChild(bookingDetails);
    (isHistory ? historyList : list).appendChild(card)
  }
  empty.hidden = activeCount > 0;
  list.hidden = activeCount === 0;
  historyEmpty.hidden = historyCount > 0;
  historyList.hidden = historyCount === 0
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

const accountHistoryToggle = document.getElementById("account-history-toggle"),
accountHistoryPanel = document.getElementById("account-history-panel"),
cancelBookingsList = document.getElementById("account-bookings-list"),
accountBookingsArea = document.getElementById("account-state"),
cancelModal = document.getElementById("cancel-modal"),
cancelYes = document.getElementById("cancel-yes"),
cancelNo = document.getElementById("cancel-no");
let pendingCancelReference = "", lastCancelButton = null;
if (accountHistoryToggle && accountHistoryPanel) {
  accountHistoryToggle.addEventListener("click", function() {
    accountHistoryPanel.hidden = !accountHistoryPanel.hidden;
    const expanded = !accountHistoryPanel.hidden;
    accountHistoryToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    accountHistoryToggle.textContent = expanded ? "HIDE BOOKING HISTORY" : "OPEN BOOKING HISTORY"
  })
}
if (accountBookingsArea) {
  accountBookingsArea.addEventListener("click", function(e) {
    const target = e.target;
    if (target && target.getAttribute("data-pay-reference")) {
      const reference = target.getAttribute("data-pay-reference"), bookings = readBookings();
      let booking = null;
      for (let i = 0; i < bookings.length; i++) if (bookings[i].reference === reference) booking = bookings[i];
      if (!booking || !booking.billIssued || booking.paid || booking.billReceived || booking.paymentSubmitted) return;
      if (!window.confirm("Submit payment of " + money(bookingTotal(booking)) + " for this assignment bill? Staff will confirm receipt.")) return;
      booking.paymentSubmitted = true; booking.paymentSubmittedAmount = bookingTotal(booking);
      saveBookings(bookings);
      const user = getCurrentAccount();
      if (user) showAccountReservation(user);
      accountMessage("cancel-msg", "Payment submitted. Staff will confirm receipt.");
      return
    }
    if (target && target.getAttribute("data-appeal-toggle")) {
      const reference = target.getAttribute("data-appeal-toggle"), forms = accountBookingsArea.querySelectorAll("form[data-appeal-form]");
      for (let i = 0; i < forms.length; i++) forms[i].hidden = forms[i].getAttribute("data-appeal-form") !== reference;
      const form = accountBookingsArea.querySelector('form[data-appeal-form="' + reference + '"]');
      if (form) form.querySelector("textarea").focus()
    }
  });
  accountBookingsArea.addEventListener("submit", function(e) {
    const form = e.target, reference = form.getAttribute("data-appeal-form");
    if (!reference) return;
    e.preventDefault();
    const reason = form.querySelector("textarea").value.trim(), bookings = readBookings();
    if (!reason) return;
    for (let i = 0; i < bookings.length; i++) {
      if (bookings[i].reference === reference && bookings[i].billIssued && !bookings[i].paid && !bookings[i].billReceived && !bookings[i].paymentSubmitted && !bookings[i].appeal) {
        bookings[i].appeal = reason;
        bookings[i].appealReference = "AP-" + bookings[i].reference;
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
  return /^[0-9]{16}$/.test(value)
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
    const customerState = state === "available" ? "available" : state === "rented" || state === "returned" ? "rented" : "not-available";
    status.className = "status " + customerState;
    status.textContent = customerState === "available" ? "Available" : customerState === "rented" ? "Rented out" : "Not available";
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
  if (action === "receive-bill" && disabled) button.title = "Available after the customer submits payment.";
  button.disabled = disabled;
  cell.appendChild(button)
}
function renderAdminDashboard() {
  if (!adminRows) return;
  while (adminRows.firstChild) adminRows.removeChild(adminRows.firstChild);
  const bookings = readBookings(),
  paidHistoryRows = document.getElementById("admin-paid-history-rows"),
  paidHistoryEmpty = document.getElementById("admin-paid-history-empty"),
  paidHistoryTable = document.getElementById("admin-paid-history-table");
  let available = 0, reserved = 0, rented = 0, returned = 0, repairing = 0;
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
    if (state === "repairing") repairing++;
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
    badge.textContent = state === "rented" ? "Rented out" : state === "reserved" ? "Reserved" : state === "returned" ? "Returned" : state === "repairing" ? "Under repair" : "Available";
    statusCell.appendChild(badge);
    if (booking) {
      if (booking.billReceived || booking.paid) {
        customerCell.textContent = "—";
        dateCell.textContent = "—"
      }
      else {
        const email = document.createElement("span"), receipt = document.createElement("small");
        email.textContent = booking.email;
        receipt.textContent = "Receipt: " + booking.reference;
        customerCell.appendChild(email);
        customerCell.appendChild(document.createElement("br"));
        customerCell.appendChild(receipt);
        dateCell.textContent = booking.pickupDate + " to " + booking.returnDate
      }
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
    else if (booking && booking.billIssued) {
      if (state === "returned") {
        addAdminActionButton(actionCell, id, "make-available", "Make available", false, booking.reference);
        addAdminActionButton(actionCell, id, "repair", "Repair", false, booking.reference)
      }
      else if (state === "repairing") addAdminActionButton(actionCell, id, "make-available", "Make available", false, booking.reference);
      if (!booking.billReceived && !booking.paid) addAdminActionButton(actionCell, id, "receive-bill", "Received bill", !booking.paymentSubmitted, booking.reference)
    }
    for (let i = 0; i < bookings.length; i++) {
      const appealBooking = bookings[i];
      if (appealBooking.carId === id && appealBooking.appeal && !appealBooking.appealResolved && !appealBooking.billReceived && !appealBooking.paid) {
        addAdminActionButton(actionCell, id, "appeal", "Review appeal", false, appealBooking.reference)
      }
    }
    row.appendChild(name); row.appendChild(category); row.appendChild(rate); row.appendChild(statusCell); row.appendChild(customerCell); row.appendChild(dateCell); row.appendChild(actionCell);
    adminRows.appendChild(row)
  }
  show("admin-available", available);
  show("admin-reserved", reserved);
  show("admin-rented", rented);
  show("admin-returned", returned);
  show("admin-repairing", repairing);
  let rentTotal = 0, damageTotal = 0, totalDue = 0, paidTotal = 0, outstandingTotal = 0;
  for (let i = 0; i < bookings.length; i++) {
    const booking = bookings[i],
    rent = Number(booking.dailyRate || 0) * Number(booking.rentalDays || 0),
    damage = bookingDamageTotal(booking),
    total = bookingTotal(booking),
    received = booking.billReceived || booking.paid,
    paid = received ? Math.min(total, Number(booking.paidAmount || total)) : 0;
    rentTotal += rent;
    damageTotal += damage;
    totalDue += total;
    paidTotal += paid;
    outstandingTotal += Math.max(0, total - paid)
  }
  if (paidHistoryRows) {
    while (paidHistoryRows.firstChild) paidHistoryRows.removeChild(paidHistoryRows.firstChild);
    let paidHistoryCount = 0;
    for (let i = bookings.length - 1; i >= 0; i--) {
      const booking = bookings[i];
      if (!(booking.billReceived || booking.paid)) continue;
      const row = document.createElement("tr"),
      carCell = document.createElement("td"),
      customerCell = document.createElement("td"),
      datesCell = document.createElement("td"),
      amountCell = document.createElement("td"),
      car = vehicle[booking.carId] || {};
      carCell.textContent = (booking.carName || car.name || "Car") + (car.cat ? " (" + car.cat + ")" : "");
      customerCell.textContent = booking.email || "-";
      datesCell.textContent = (booking.pickupDate || "-") + " to " + (booking.returnDate || "-");
      amountCell.textContent = money(booking.paidAmount !== undefined && booking.paidAmount !== null ? booking.paidAmount : bookingTotal(booking));
      row.appendChild(carCell); row.appendChild(customerCell); row.appendChild(datesCell); row.appendChild(amountCell);
      paidHistoryRows.appendChild(row);
      paidHistoryCount++
    }
    if (paidHistoryEmpty) paidHistoryEmpty.hidden = paidHistoryCount > 0;
    if (paidHistoryTable) paidHistoryTable.hidden = paidHistoryCount === 0
  }
  show("admin-booking-car", bookings.length ? bookings.length + " saved reservation(s)" : "No saved reservation");
  show("admin-booking-state", bookings.length ? "Fleet: " + reserved + " reserved, " + rented + " rented out, " + returned + " returned, " + repairing + " under repair" : "No current bookings");
  show("admin-rent", money(rentTotal));
  show("admin-damage", money(damageTotal));
  show("admin-total", money(totalDue));
  show("admin-paid", money(paidTotal));
  show("admin-outstanding", money(outstandingTotal));
  show("admin-cost-note", "Total due and paid amounts include any appeal deductions. Customer payment submissions remain pending until staff confirms receipt.")
}
const adminActionModal = document.getElementById("admin-action-modal"),
adminActionTitle = document.getElementById("admin-action-title"),
adminActionLabel = document.getElementById("admin-action-label"),
adminActionCopy = document.getElementById("admin-action-copy"),
adminActionConfirm = document.getElementById("admin-action-confirm"),
adminActionCancel = document.getElementById("admin-action-cancel"),
inspectionModal = document.getElementById("inspection-modal"),
inspectionForm = document.getElementById("inspection-form"),
inspectionChecklist = document.getElementById("inspection-checklist"),
inspectionEntry = document.getElementById("inspection-entry"),
inspectionBillPreview = document.getElementById("inspection-bill-preview"),
inspectionBillDetails = document.getElementById("inspection-bill-details"),
inspectionBillTotal = document.getElementById("inspection-bill-total"),
inspectionProceed = document.getElementById("inspection-proceed"),
inspectionBack = document.getElementById("inspection-back");
const appealModal = document.getElementById("appeal-modal"),
appealForm = document.getElementById("appeal-form"),
appealInfo = document.getElementById("appeal-booking-info"),
appealReceiptDetails = document.getElementById("appeal-receipt-details"),
appealCustomerMessage = document.getElementById("appeal-customer-message"),
appealReply = document.getElementById("appeal-reply"),
appealDeduction = document.getElementById("appeal-deduction"),
appealPreview = document.getElementById("appeal-cost-preview"),
appealMessage = document.getElementById("appeal-form-message"),
appealClose = document.getElementById("appeal-close");
let pendingAdminAction = null,
lastAdminActionButton = null,
pendingInspectionReference = "",
pendingAppealReference = "",
pendingInspection = null;
function updateAppealCostPreview() {
  const booking = findBooking(pendingAppealReference);
  if (!booking || !appealDeduction || !appealPreview) return;
  let deduction = Number(appealDeduction.value);
  if (isNaN(deduction) || deduction < 0) deduction = 0;
  if (deduction > bookingBaseTotal(booking)) deduction = bookingBaseTotal(booking);
  appealPreview.textContent = "Original bill: " + money(bookingBaseTotal(booking)) + " · Deduction: " + money(deduction) + " · Revised total: " + money(Math.max(0, bookingBaseTotal(booking) - deduction))
}
function openAppeal(reference) {
  const booking = findBooking(reference);
  if (!appealModal || !booking || !booking.appeal || booking.appealResolved || booking.billReceived || booking.paid) return;
  while (appealReceiptDetails.firstChild) appealReceiptDetails.removeChild(appealReceiptDetails.firstChild);
  addBillLine(appealReceiptDetails, "Appeal receipt", booking.appealReference || "AP-" + booking.reference);
  addBillLine(appealReceiptDetails, "Booking receipt", booking.reference);
  if (booking.appealSubmittedAt) addBillLine(appealReceiptDetails, "Appeal submitted", new Date(booking.appealSubmittedAt).toLocaleString());
  addBillLine(appealReceiptDetails, "Customer", booking.email || "-");
  addBillLine(appealReceiptDetails, "Car", booking.carName || "-");
  addBillLine(appealReceiptDetails, "Rental dates", (booking.pickupDate || "-") + " to " + (booking.returnDate || "-"));
  addBillLine(appealReceiptDetails, "Pickup branch", booking.pickupBranch || "-");
  addBillLine(appealReceiptDetails, "Rental charge", money(Number(booking.dailyRate || 0) * Number(booking.rentalDays || 0)));
  const items = booking.inspection && booking.inspection.items ? booking.inspection.items : [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    addBillLine(appealReceiptDetails, item.label, item.condition + (item.condition === "Needs repair" ? " · Repair: " + money(item.repairCost) : " · " + money(0)));
    if (item.comment) addBillLine(appealReceiptDetails, "Staff comment", item.comment);
  }
  if (booking.inspection && booking.inspection.comment) addBillLine(appealReceiptDetails, "Staff summary", booking.inspection.comment);
  addBillLine(appealReceiptDetails, "Original final bill", money(bookingBaseTotal(booking)));
  appealInfo.textContent = (booking.carName || "Car") + " · " + (booking.email || "") + " · " + booking.reference;
  appealCustomerMessage.textContent = booking.appeal;
  appealReply.value = "";
  appealDeduction.value = "0";
  appealDeduction.max = String(bookingBaseTotal(booking));
  appealMessage.hidden = true;
  appealMessage.textContent = "";
  pendingAppealReference = reference;
  updateAppealCostPreview();
  appealModal.hidden = false;
  appealReply.focus()
}
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
    costField.className = "field inspection-cost";
    costLabel.htmlFor = "inspection-cost-" + i; costLabel.textContent = "Repair cost (S$)";
    costInput.id = "inspection-cost-" + i; costInput.type = "number"; costInput.min = "0"; costInput.step = "0.01"; costInput.value = ""; costInput.inputMode = "decimal"; costInput.disabled = true;
    costField.appendChild(costLabel); costField.appendChild(costInput);
    choices.appendChild(costField);
    commentField.className = "field inspection-comment";
    commentLabel.htmlFor = "inspection-comment-" + i; commentLabel.textContent = "Staff comment";
    commentInput.id = "inspection-comment-" + i; commentInput.rows = 2; commentInput.maxLength = 500;
    commentField.appendChild(commentLabel); commentField.appendChild(commentInput);
    photoField.className = "field inspection-photo";
    photoLabel.htmlFor = "inspection-photo-" + i; photoLabel.textContent = "Attach photo (optional)";
    photoInput.id = "inspection-photo-" + i; photoInput.type = "file"; photoInput.accept = "image/*";
    const photoRemoveButton = document.createElement("button");
    photoRemoveButton.type = "button"; photoRemoveButton.className = "btn alt inspection-photo-remove"; photoRemoveButton.textContent = "Remove photo"; photoRemoveButton.hidden = true;
    photoField.appendChild(photoLabel); photoField.appendChild(photoInput); photoField.appendChild(photoRemoveButton);
    photoInput.addEventListener("change", function() { photoRemoveButton.hidden = photoInput.files.length === 0 });
    photoRemoveButton.addEventListener("click", function() { photoInput.value = ""; photoRemoveButton.hidden = true; photoInput.focus() });
    function toggleCost() {
      const needsRepair = repairRadio.checked;
      costInput.disabled = !needsRepair;
      costInput.required = needsRepair
    }
    goodRadio.addEventListener("change", toggleCost);
    repairRadio.addEventListener("change", toggleCost);
    group.appendChild(legend); group.appendChild(choices); group.appendChild(commentField); group.appendChild(photoField);
    inspectionChecklist.appendChild(group)
  }
}
function renderInspectionBillPreview(booking, inspection) {
  while (inspectionBillDetails.firstChild) inspectionBillDetails.removeChild(inspectionBillDetails.firstChild);
  addBillLine(inspectionBillDetails, "Customer", booking.customerName + " · " + booking.email);
  addBillLine(inspectionBillDetails, "Car", booking.carName);
  addBillLine(inspectionBillDetails, "Receipt", booking.reference);
  addBillLine(inspectionBillDetails, "Pickup branch", booking.pickupBranch || "-");
  addBillLine(inspectionBillDetails, "Collection point", booking.pickupLocation || pickupLocation(booking.pickupBranch));
  addBillLine(inspectionBillDetails, "Rental dates", (booking.pickupDate || "-") + " to " + (booking.returnDate || "-"));
  const rent = Number(booking.dailyRate || 0) * Number(booking.rentalDays || 0);
  addBillLine(inspectionBillDetails, "Rental charge", money(booking.dailyRate) + " x " + booking.rentalDays + " day(s) = " + money(rent));
  let repairTotal = 0;
  for (let i = 0; i < inspection.items.length; i++) {
    const item = inspection.items[i], row = document.createElement("div"), detail = document.createElement("p");
    row.className = "bill-item";
    detail.textContent = item.label + " — " + item.condition + " — " + money(item.repairCost);
    row.appendChild(detail);
    if (item.comment) {
      const comment = document.createElement("p");
      comment.className = "bill-comment"; comment.textContent = "Staff comment: " + item.comment; row.appendChild(comment)
    }
    inspectionBillDetails.appendChild(row);
    repairTotal += Number(item.repairCost || 0)
  }
  if (inspection.comment) addBillLine(inspectionBillDetails, "Staff summary", inspection.comment);
  addBillLine(inspectionBillDetails, "Repair total", money(repairTotal));
  inspectionBillTotal.textContent = "Staff total cost: " + money(rent + repairTotal)
}
function openInspection(reference) {
  const booking = findBooking(reference);
  if (!booking || bookingStatus(booking) !== "returned" || booking.billIssued) return;
  pendingInspectionReference = reference;
  pendingInspection = null;
  const details = document.getElementById("inspection-booking-info"),
  general = document.getElementById("inspection-general-comment"),
  message = document.getElementById("inspection-message");
  if (details) details.textContent = booking.carName + " · " + booking.email + " · Receipt " + booking.reference;
  if (general) general.value = "";
  if (message) { message.hidden = true; message.textContent = "" }
  inspectionEntry.hidden = false;
  inspectionBillPreview.hidden = true;
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
      const selected = document.querySelector('input[name="inspection-condition-' + i + '"]:checked');
      if (!selected) {
        showInspectionMessage("Choose a condition for every checklist item.");
        return
      }
      const needsRepair = selected.value === "repair";
      items.push({
        label: inspectionItems[i],
        condition: needsRepair ? "Needs repair" : "Good condition",
        repairCost: needsRepair ? Number(document.getElementById("inspection-cost-" + i).value) : 0,
        comment: document.getElementById("inspection-comment-" + i).value.trim(),
        images: []
      })
    }
    const inspection = {
      items: items,
      comment: document.getElementById("inspection-general-comment").value.trim(),
      completedAt: new Date().toISOString()
    };
    pendingInspection = { reference: pendingInspectionReference, inspection: inspection, photos: photoFiles };
    renderInspectionBillPreview(booking, inspection);
    inspectionEntry.hidden = true;
    inspectionBillPreview.hidden = false;
    inspectionProceed.focus()
  })
}
if (inspectionBack && inspectionBillPreview && inspectionEntry) {
  inspectionBack.addEventListener("click", function() {
    inspectionBillPreview.hidden = true;
    inspectionEntry.hidden = false;
    if (pendingInspection) pendingInspection = null;
    const button = document.getElementById("inspection-final-bill");
    if (button) button.focus()
  })
}
if (inspectionProceed && inspectionBillPreview) {
  inspectionProceed.addEventListener("click", function() {
    if (!pendingInspection) return;
    const booking = findBooking(pendingInspection.reference);
    if (!booking || bookingStatus(booking) !== "returned" || booking.billIssued) {
      inspectionBillPreview.hidden = true;
      inspectionEntry.hidden = false;
      showInspectionMessage("This returned booking is no longer waiting for inspection.");
      return
    }
    readInspectionPhotos(pendingInspection.photos, 0, [], function(photos) {
      if (!photos) {
        inspectionBillPreview.hidden = true;
        inspectionEntry.hidden = false;
        showInspectionMessage("A photo could not be read. Choose it again and review the bill.");
        return
      }
      for (let i = 0; i < photos.length; i++) pendingInspection.inspection.items[photos[i].itemIndex].images.push({ name: photos[i].name, data: photos[i].data });
      const savedBookings = readBookings();
      let bookingIndex = -1;
      for (let i = 0; i < savedBookings.length; i++) {
        if (savedBookings[i].reference === pendingInspection.reference) { bookingIndex = i; break }
      }
      if (bookingIndex < 0) {
        inspectionBillPreview.hidden = true;
        inspectionEntry.hidden = false;
        showInspectionMessage("The reservation could not be found. Close this window and refresh the staff page.");
        return
      }
      savedBookings[bookingIndex].inspection = pendingInspection.inspection;
      savedBookings[bookingIndex].billIssued = true;
      savedBookings[bookingIndex].billReceived = false;
      savedBookings[bookingIndex].paymentSubmitted = false;
      savedBookings[bookingIndex].status = "returned";
      try {
        saveBookings(savedBookings);
        inspectionModal.hidden = true;
        pendingInspectionReference = "";
        pendingInspection = null;
        renderAdminDashboard();
        accountMessage("admin-action-msg", "Final bill issued. Use Make available when the car is ready, and Received bill to record payment.");
        const message = document.getElementById("admin-action-msg");
        if (message) message.className = "msg success"
      }
      catch (err) {
        inspectionBillPreview.hidden = true;
        inspectionEntry.hidden = false;
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
if (appealDeduction) appealDeduction.addEventListener("input", updateAppealCostPreview);
if (appealClose && appealModal) {
  appealClose.addEventListener("click", function() {
    appealModal.hidden = true;
    pendingAppealReference = ""
  })
}
if (appealForm) {
  appealForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const reply = appealReply.value.trim(),
    rawDeduction = appealDeduction.value,
    deduction = Number(rawDeduction),
    bookings = readBookings();
    let index = -1;
    for (let i = 0; i < bookings.length; i++) if (bookings[i].reference === pendingAppealReference) { index = i; break }
    const booking = index >= 0 ? bookings[index] : null;
    if (!booking || !booking.appeal || booking.appealResolved || booking.billReceived || booking.paid) {
      appealMessage.textContent = "This appeal is no longer waiting for a staff response.";
      appealMessage.hidden = false;
      return
    }
    if (!reply || rawDeduction === "" || isNaN(deduction) || deduction < 0 || deduction > bookingBaseTotal(booking)) {
      appealMessage.textContent = "Enter a reply and a deduction from zero up to the original bill total.";
      appealMessage.hidden = false;
      return
    }
    booking.appealReply = reply;
    booking.appealDeduction = deduction;
    booking.appealResolved = true;
    booking.appealRespondedAt = new Date().toISOString();
    booking.billReceived = false;
    booking.paid = false;
    booking.paidAmount = 0;
    booking.paymentSubmitted = false;
    booking.paymentSubmittedAmount = 0;
    try {
      saveBookings(bookings);
      appealModal.hidden = true;
      pendingAppealReference = "";
      renderAdminDashboard();
      accountMessage("admin-action-msg", "Revised final bill sent. The customer can now pay the updated amount from My Account.");
      const message = document.getElementById("admin-action-msg");
      if (message) message.className = "msg success"
    }
    catch (err) {
      appealMessage.textContent = "The revised final bill could not be saved. Please try again.";
      appealMessage.hidden = false
    }
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
    if (action === "appeal") {
      openAppeal(reference);
      return
    }
    if (action === "inspect") {
      openInspection(reference);
      return
    }
    pendingAdminAction = { action: action, carId: carId, reference: reference };
    adminActionLabel.textContent = action === "rent" ? "CAR HANDOVER" : action === "return" ? "CAR RETURN" : action === "cancel" ? "CANCEL RESERVATION" : action === "make-available" || action === "repair" ? "FLEET STATUS" : "BILL RECEIPT";
    adminActionTitle.textContent = action === "rent" ? "Mark this car as rented out?" : action === "return" ? "Mark this car as returned?" : action === "cancel" ? "Cancel this reservation?" : action === "make-available" ? "Make this car available?" : action === "repair" ? "Mark this car under repair?" : "Confirm the bill was received?";
    adminActionCopy.textContent = action === "rent" ? "Confirm that the customer has collected the car. Its status will change from Reserved to Rented out." : action === "return" ? "Confirm that the customer has returned this car. An inspection action will then appear." : action === "cancel" ? "This will remove the reservation and make the car available again for customers." : action === "make-available" ? "The car will become available for new customer bookings." : action === "repair" ? "The car will remain unavailable to customers while staff completes the repair. Use Make available when it is ready." : "This records the full bill as received and adds it to the paid total in the cost report.";
    adminActionConfirm.textContent = action === "rent" ? "Yes, mark rented out" : action === "return" ? "Yes, mark returned" : action === "cancel" ? "Yes, cancel reservation" : action === "make-available" ? "Yes, make available" : action === "repair" ? "Yes, mark under repair" : "Yes, received bill";
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
      state = booking ? bookingStatus(booking) : "available",
      validAction = booking && (action === "rent" && state === "reserved" || action === "return" && state === "rented" || action === "cancel" && state === "reserved" || action === "make-available" && (state === "returned" || state === "repairing") && booking.billIssued || action === "repair" && state === "returned" && booking.billIssued || action === "receive-bill" && booking.billIssued && booking.paymentSubmitted && !booking.billReceived && !booking.paid);
      if (!validAction) {
        throw new Error("This reservation status has changed. Refresh the fleet and try again.")
      }
      if (action === "rent") booking.status = "rented";
      else if (action === "return") booking.status = "returned";
      else if (action === "make-available") booking.status = "available";
      else if (action === "repair") booking.status = "repairing";
      else if (action === "receive-bill") {
        booking.billReceived = true;
        booking.paid = true;
        booking.paidAmount = bookingTotal(booking)
      }
      else bookings.splice(index, 1);
      saveBookings(bookings);
      adminActionModal.hidden = true;
      pendingAdminAction = null;
      renderAdminDashboard();
      accountMessage("admin-action-msg", action === "rent" ? "Car marked as rented out." : action === "return" ? "Car marked as returned. The inspection action is now available." : action === "cancel" ? "Reservation cancelled. The car is now available." : action === "make-available" ? "Car is now available for customer bookings." : action === "repair" ? "Car marked under repair and unavailable for new bookings." : "Bill receipt recorded and added to the paid total.");
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
  if (e.key === "Escape" && appealModal && !appealModal.hidden) {
    appealModal.hidden = true;
    pendingAppealReference = ""
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
  if (cardNumber) {
    cardNumber.addEventListener('input', function() {
      cardNumber.value = cardNumber.value.replace(/[^0-9]/g, '').slice(0, 16)
    })
  }
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
    const label = state === "reserved" ? "reserved" : state === "repairing" ? "under repair" : state === "returned" ? "returned and awaiting inspection" : "rented out";
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
    if (!validCardNumber(cardNumber.value)) {
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
  if (payButton) payButton.disabled = !!(booking.paid || booking.billReceived || booking.paymentSubmitted)
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
    booking.paymentSubmitted = true;
    booking.paymentSubmittedAmount = amount;
    try {
      saveBookings(bookings);
      show("pay-msg", "Payment submitted. Staff will confirm receipt.");
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