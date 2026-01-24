let currentCustomer = null;

function show(el, on = true) { el.style.display = on ? "" : "none"; }

function setResult(el, html, kind = "") {
  el.innerHTML = html;
  el.className = "result " + kind;
  show(el, true);
}

function mapsUrl(address) {
  // Apple Maps works everywhere on iOS; on desktop, it still opens a maps.apple.com page.
  // Google Maps fallback is also fine. We'll use Apple Maps primarily.
  const q = encodeURIComponent(address);
  return `https://maps.apple.com/?q=${q}`;
}

document.addEventListener("DOMContentLoaded", () => {
  // IMPORTANT: Service workers require http(s), not file://
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  const lookupPhone = document.getElementById("lookupPhone");
  const lookupOut = document.getElementById("lookupOut");
  const btnLookup = document.getElementById("btnLookup");
  const btnNavigate = document.getElementById("btnNavigate");
  const btnDelete = document.getElementById("btnDelete");

  const phone = document.getElementById("phone");
  const name = document.getElementById("name");
  const address = document.getElementById("address");
  const notes = document.getElementById("notes");
  const btnSave = document.getElementById("btnSave");
  const saveOut = document.getElementById("saveOut");

  btnLookup.addEventListener("click", async () => {
    currentCustomer = null;
    show(btnNavigate, false);
    show(btnDelete, false);
    show(lookupOut, false);

    const p = lookupPhone.value.trim();
    const c = await getCustomerByPhone(p);

    if (!c) {
      setResult(lookupOut, "No customer found for that number.", "danger");
      return;
    }

    currentCustomer = c;

    setResult(
      lookupOut,
      `<b>${c.name || "Unknown"}</b><br/>
       <span class="muted">${c.phone}</span><br/><br/>
       <b>Address:</b> ${c.address}<br/>
       <b>Notes:</b> ${c.notes ? c.notes : "<span class='muted'>None</span>"}`,
      "ok"
    );

    show(btnNavigate, true);
    show(btnDelete, true);

    // Auto-fill save form so edits are quick
    phone.value = c.phone;
    name.value = c.name || "";
    address.value = c.address || "";
    notes.value = c.notes || "";
  });

  btnNavigate.addEventListener("click", () => {
    if (!currentCustomer || !currentCustomer.address) return;
    window.open(mapsUrl(currentCustomer.address), "_blank");
  });

  btnDelete.addEventListener("click", async () => {
    if (!currentCustomer) return;
    await deleteCustomerByPhone(currentCustomer.phone);
    currentCustomer = null;
    setResult(lookupOut, "Deleted customer.", "danger");
    show(btnNavigate, false);
    show(btnDelete, false);
  });

  btnSave.addEventListener("click", async () => {
    const p = normalizePhone(phone.value.trim());
    const n = name.value.trim();
    const a = address.value.trim();
    const no = notes.value.trim();

    if (!p || p.length < 10) {
      setResult(saveOut, "Phone number must have at least 10 digits.", "danger");
      return;
    }
    if (!a) {
      setResult(saveOut, "Address is required.", "danger");
      return;
    }

    await putCustomer({
      phone: p,
      name: n || "Unknown",
      address: a,
      notes: no,
      updatedAt: Date.now()
    });

    setResult(saveOut, `Saved customer for <b>${p}</b>.`, "ok");
  });
});
