/* ============================================================
   IC Portal — Live Projects access gate
   ------------------------------------------------------------
   Restricts whichever page includes this script to signed-in
   @iimrohtak.ac.in Google accounts. Paste your Firebase web
   app's config below (same values used in the test site).
   No other page on the site loads this file, so nothing else
   is affected.
   ============================================================ */

const IC_GATE_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBYD2pUNKCT8bo6zwJkmAmXD03cTPg1fG4",
  authDomain: "test-adi-43d9b.firebaseapp.com",
  projectId: "test-adi-43d9b",
};

const IC_GATE_ALLOWED_DOMAIN = "iimrohtak.ac.in";

(function () {
  firebase.initializeApp(IC_GATE_FIREBASE_CONFIG);
  const auth = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ hd: IC_GATE_ALLOWED_DOMAIN });

  const gate = document.getElementById("ic-gate");
  const btn = document.getElementById("ic-gate-signin");
  const status = document.getElementById("ic-gate-status");

  function setStatus(msg, isDenied) {
    status.textContent = msg || "";
    status.classList.toggle("is-denied", !!isDenied);
  }

  // Runs once on a successful sign-in: the gate opens at a moderate pace
  // (card lifts + dissolves, backdrop clears) instead of snapping away.
  // The 700ms delay must match the CSS transition duration in access-gate.css.
  function openGate() {
    gate.classList.add("is-opening");
    setTimeout(() => {
      gate.classList.add("is-hidden");
    }, 700);
  }

  btn.addEventListener("click", () => {
    setStatus("Opening Google sign-in…", false);
    auth.signInWithPopup(provider).catch((err) => {
      setStatus("Sign-in failed: " + err.message, true);
    });
  });

  auth.onAuthStateChanged((user) => {
    if (!user) {
      gate.classList.remove("is-hidden");
      return;
    }
    const email = user.email || "";
    const domain = email.split("@")[1];

    if (domain === IC_GATE_ALLOWED_DOMAIN) {
      openGate();
    } else {
      auth.signOut();
      setStatus(
        email + " is not an @" + IC_GATE_ALLOWED_DOMAIN + " account. Access denied.",
        true
      );
    }
  });
})();
