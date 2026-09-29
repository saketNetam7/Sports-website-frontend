(function () {
  "use strict";

  /* ==================== SETTINGS ==================== */
  // IMPORTANT: Enter the COLLEGE GMAIL of the admin on the line below.
  // Only this email address will be allowed to open the Admin section.
  // IMPORTANT: Enter the COLLEGE GMAILS of all admins below.
  // Put each email in double quotes, separated by commas. No comma after the last one.
  var ADMIN_EMAILS = [
    "saketweb7@gmail.com", // <-- PUT COLLEGE GMAIL HERE
    "painkrachiragsingh@gmail.com", // <-- another admin (optional)
  ];

  var SOLO = [
    "Badminton",
    "Chess",
    "Table Tennis",
    "Carrom",
    "100m Sprint",
    "Long Jump",
  ];
  var GROUP = [
    "Cricket",
    "Basketball",
    "Kabaddi",
    "Football",
    "Volleyball",
    "Relay Race",
  ];
  var KEY = "citSportsV2";

  /* ==================== HELPERS ==================== */
  var db = load(),
    role = null,
    email = "",
    otp = "",
    otpAt = 0;

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY));
      if (d) return d;
    } catch (e) {}
    return { events: [], profiles: {}, regs: [] };
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) {}
  }
  function $(s) {
    return document.querySelector(s);
  }
  function esc(t) {
    var d = document.createElement("div");
    d.textContent = t == null ? "" : t;
    return d.innerHTML;
  }
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function t12(t) {
    var p = t.split(":"),
      h = +p[0];
    return (h % 12 || 12) + ":" + p[1] + " " + (h < 12 ? "AM" : "PM");
  }
  function isoOf(d) {
    return (
      d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
    );
  }
  function toast(m) {
    var t = $("#toast");
    t.textContent = m;
    t.classList.add("show");
    clearTimeout(toast.h);
    toast.h = setTimeout(function () {
      t.classList.remove("show");
    }, 2400);
  }
  function show(id) {
    document.querySelectorAll(".page").forEach(function (p) {
      p.classList.add("hidden");
    });
    $("#" + id).classList.remove("hidden");
    $("#logout").classList.toggle("hidden", id === "pgHome");
    window.scrollTo(0, 0);
  }
  function options(list, first) {
    return (
      (first ? '<option value="">' + first + "</option>" : "") +
      list
        .map(function (s) {
          return "<option>" + s + "</option>";
        })
        .join("")
    );
  }

  /* ==================== CALENDAR (shared) ==================== */
  function Calendar(root) {
    var cur = new Date();
    cur.setDate(1);
    var picked = null;
    var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    function detail() {
      if (!picked)
        return '<p class="empty">Select a date to see the sport, timing and description.</p>';
      var evs = db.events
        .filter(function (e) {
          return e.date === picked;
        })
        .sort(function (a, b) {
          return a.time.localeCompare(b.time);
        });
      if (!evs.length)
        return '<p class="empty">No sport is scheduled on this day.</p>';
      return evs
        .map(function (e) {
          return (
            '<div class="ev"><b>' +
            esc(e.name) +
            "</b>" +
            '<div class="meta">' +
            esc(e.sport) +
            " | " +
            t12(e.time) +
            "</div>" +
            "<p>" +
            esc(e.desc || "No description added.") +
            "</p></div>"
          );
        })
        .join("");
    }
    function draw() {
      var y = cur.getFullYear(),
        m = cur.getMonth(),
        first = cur.getDay();
      var days = new Date(y, m + 1, 0).getDate(),
        today = isoOf(new Date());
      var h =
        '<div class="cal-head"><button type="button" class="btn ghost sm" data-n="-1" aria-label="Previous month">&lt;</button>' +
        "<b>" +
        cur.toLocaleString("en-IN", { month: "long", year: "numeric" }) +
        "</b>" +
        '<button type="button" class="btn ghost sm" data-n="1" aria-label="Next month">&gt;</button></div><div class="cal-grid">';
      DOW.forEach(function (d) {
        h += '<span class="dow">' + d + "</span>";
      });
      for (var i = 0; i < first; i++) h += "<span></span>";
      for (var d = 1; d <= days; d++) {
        var iso = y + "-" + pad(m + 1) + "-" + pad(d);
        var evs = db.events.filter(function (e) {
          return e.date === iso;
        });
        h +=
          '<button type="button" class="day' +
          (iso === today ? " today" : "") +
          (iso === picked ? " sel" : "") +
          '" data-d="' +
          iso +
          '"><i>' +
          d +
          "</i>" +
          evs
            .slice(0, 2)
            .map(function (e) {
              return "<em>" + esc(e.sport) + "</em>";
            })
            .join("") +
          "</button>";
      }
      root.innerHTML =
        h + '</div><div class="cal-detail">' + detail() + "</div>";
    }
    root.addEventListener("click", function (ev) {
      var n = ev.target.closest("[data-n]"),
        d = ev.target.closest("[data-d]");
      if (n) {
        cur.setMonth(cur.getMonth() + +n.dataset.n);
        draw();
      }
      if (d) {
        picked = d.dataset.d;
        draw();
      }
    });
    draw();
    return {
      draw: draw,
      goto: function (iso) {
        var p = iso.split("-");
        cur = new Date(+p[0], +p[1] - 1, 1);
        picked = iso;
        draw();
      },
    };
  }
  var calS = Calendar($("#calStudent")),
    calA = Calendar($("#calAdmin"));

  /* ==================== PAGE 1: choose section ==================== */
  document.querySelectorAll(".role").forEach(function (b) {
    b.addEventListener("click", function () {
      role = b.dataset.role;
      $("#loginTitle").textContent =
        (role === "admin" ? "Admin" : "Student") + " sign in";
      $("#email").placeholder =
        role === "admin" ? "college email (Gmail)" : "you@gmail.com";
      resetLogin();
      show("pgLogin");
    });
  });
  $("#logout").addEventListener("click", function () {
    role = null;
    email = "";
    otp = "";
    show("pgHome");
  });

  /* ==================== PAGE 2: Gmail + OTP ==================== */
  function resetLogin() {
    $("#emailForm").classList.remove("hidden");
    $("#otpForm").classList.add("hidden");
    $("#email").value = "";
    $("#otp").value = "";
    $("#loginErr").textContent = "";
  }
  $("#emailForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = $("#email").value.trim().toLowerCase(),
      err = $("#loginErr");
    if (!/^[^\s@]+@gmail\.com$/.test(v))
      return (err.textContent =
        "Enter a valid Gmail address ending in @gmail.com.");
    if (role === "admin" && v !== ADMIN_EMAIL.toLowerCase())
      return (err.textContent =
        "This email is not allowed to open the Admin section.");
    err.textContent = "";
    email = v;
    otp = String(Math.floor(100000 + Math.random() * 900000));
    otpAt = Date.now();
    // ---- DEMO MODE ----
    // A website cannot send email by itself. In the real project, call your backend here
    // so it emails the OTP to the user, and delete the "Demo OTP" text below.
    $("#otpInfo").textContent =
      "OTP sent to " + v + ". (Demo OTP: " + otp + ")";
    $("#emailForm").classList.add("hidden");
    $("#otpForm").classList.remove("hidden");
    $("#otp").focus();
  });
  $("#changeEmail").addEventListener("click", resetLogin);
  $("#otpForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("#loginErr"),
      v = $("#otp").value.trim();
    if (Date.now() - otpAt > 5 * 60 * 1000)
      return (err.textContent =
        "This OTP has expired. Go back and request a new one.");
    if (v !== otp)
      return (err.textContent = "Wrong OTP. Check the 6 digits and try again.");
    err.textContent = "";
    otp = "";
    if (role === "admin") return openAdmin();
    if (db.profiles[email]) return openStudent();
    $("#detailsForm").reset();
    show("pgDetails");
  });

  /* ==================== PAGE 3: student details ==================== */
  $("#detailsForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var n = $("#dName").value.trim(),
      d = $("#dDept").value,
      y = $("#dYear").value;
    if (!n || !d || !y)
      return ($("#detailsErr").textContent =
        "Enter your name and select department and year.");
    $("#detailsErr").textContent = "";
    db.profiles[email] = { name: n, dept: d, year: y };
    save();
    openStudent();
  });

  /* ==================== PAGE 4: student Event / Sports tab ==================== */
  function openStudent() {
    var p = db.profiles[email];
    $("#hello").textContent =
      "Hello, " + p.name.split(" ")[0] + " (" + p.dept + ", " + p.year + ")";
    $("#soloList").innerHTML = SOLO.map(function (s) {
      return (
        '<label class="chip"><input type="checkbox" value="' +
        s +
        '"><span>' +
        s +
        "</span></label>"
      );
    }).join("");
    $("#gSport").innerHTML = options(GROUP);
    calS.draw();
    myRegs();
    switchTab("tabCal");
    show("pgStudent");
  }
  function switchTab(id) {
    ["tabCal", "tabReg"].forEach(function (t) {
      $("#" + t).classList.toggle("hidden", t !== id);
    });
    document.querySelectorAll(".tab").forEach(function (b) {
      b.classList.toggle("on", b.dataset.tab === id);
    });
  }
  document.querySelectorAll(".tab").forEach(function (b) {
    b.addEventListener("click", function () {
      switchTab(b.dataset.tab);
    });
  });
  function has(type, sport, group) {
    return db.regs.some(function (r) {
      return (
        r.email === email &&
        r.sport === sport &&
        r.type === type &&
        r.group === group
      );
    });
  }
  function myRegs() {
    var mine = db.regs.filter(function (r) {
      return r.email === email;
    });
    $("#myRegs").innerHTML = mine.length
      ? mine
          .map(function (r) {
            return (
              "<li><span>" +
              esc(r.sport) +
              (r.type === "Group"
                ? "<small>Group: " + esc(r.group) + " (leader)</small>"
                : "<small>Solo</small>") +
              "</span></li>"
            );
          })
          .join("")
      : '<li class="empty">You have not registered for any sport yet.</li>';
  }
  $("#regSolo").addEventListener("click", function () {
    var picked = Array.prototype.slice.call(
        document.querySelectorAll("#soloList input:checked"),
      ),
      added = 0;
    picked.forEach(function (c) {
      if (!has("Solo", c.value, "")) {
        db.regs.push({ email: email, type: "Solo", sport: c.value, group: "" });
        added++;
      }
      c.checked = false;
    });
    if (!picked.length)
      return ($("#regMsg").textContent = "Select at least one solo sport.");
    $("#regMsg").textContent = "";
    save();
    myRegs();
    toast(
      added
        ? "Registered for " + added + " sport(s)"
        : "You are already registered for these",
    );
  });
  $("#regGroup").addEventListener("click", function () {
    var g = $("#gName").value.trim(),
      s = $("#gSport").value;
    if (!g) return ($("#regMsg").textContent = "Enter your group name.");
    if (has("Group", s, g))
      return ($("#regMsg").textContent =
        g + " is already registered for " + s + ".");
    $("#regMsg").textContent = "";
    db.regs.push({ email: email, type: "Group", sport: s, group: g });
    save();
    myRegs();
    $("#gName").value = "";
    toast("Group registered for " + s);
  });

  /* ==================== PAGE 5: admin ==================== */
  function openAdmin() {
    $("#eSport").innerHTML = options(SOLO.concat(GROUP), "Select sport");
    $("#eventForm").reset();
    adminList();
    calA.draw();
    show("pgAdmin");
  }
  function adminList() {
    var evs = db.events.slice().sort(function (a, b) {
      return (a.date + a.time).localeCompare(b.date + b.time);
    });
    $("#adminList").innerHTML = evs.length
      ? evs
          .map(function (e) {
            return (
              "<li><span>" +
              esc(e.name) +
              "<small>" +
              esc(e.sport) +
              " | " +
              e.date +
              " | " +
              t12(e.time) +
              "</small></span>" +
              '<button type="button" class="btn del sm" data-id="' +
              e.id +
              '">Delete</button></li>'
            );
          })
          .join("")
      : '<li class="empty">No events yet. Add the first one using the form.</li>';
  }
  $("#eventForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var ev = {
      id: Date.now(),
      name: $("#eName").value.trim(),
      date: $("#eDate").value,
      time: $("#eTime").value,
      sport: $("#eSport").value,
      desc: $("#eDesc").value.trim(),
    };
    if (!ev.name || !ev.date || !ev.time || !ev.sport)
      return ($("#eventErr").textContent =
        "Fill in event name, date, time and sport.");
    $("#eventErr").textContent = "";
    db.events.push(ev);
    save();
    adminList();
    calA.goto(ev.date);
    $("#eventForm").reset();
    toast("Event added to the calendar");
  });
  $("#emailForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = $("#email").value.trim().toLowerCase(),
      err = $("#loginErr");

    if (role === "admin") {
      var allowed = ADMIN_EMAILS.map(function (m) {
        return m.trim().toLowerCase();
      });
      if (allowed.indexOf(v) === -1)
        return (err.textContent =
          "This email is not allowed to open the Admin section.");
    } else if (!/^[^\s@]+@gmail\.com$/.test(v)) {
      return (err.textContent =
        "Enter a valid Gmail address ending in @gmail.com.");
    }

    err.textContent = "";
    email = v;
    otp = String(Math.floor(100000 + Math.random() * 900000));
    otpAt = Date.now();
    // ---- DEMO MODE ----
    // A website cannot send email by itself. In the real project, call your backend here
    // so it emails the OTP to the user, and delete the "Demo OTP" text below.
    $("#otpInfo").textContent =
      "OTP sent to " + v + ". (Demo OTP: " + otp + ")";
    $("#emailForm").classList.add("hidden");
    $("#otpForm").classList.remove("hidden");
    $("#otp").focus();
  });
})();
