/* =======================================================================
   ⚙️ الإعدادات — رابط Google Apps Script
   ======================================================================= */
const SCRIPT_URL = "ضع_رابط_Apps_Script_هنا";

/* ============================ الحالة ============================ */
const state = { name: "", committee: "" };

/* ======================= أدوات مساعدة ======================= */
const $  = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

function showScreen(id) {
  $$(".screen").forEach(s => s.classList.remove("active"));
  $("#" + id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (id === "loginScreen") {
    $("#topbarBrand").style.display = "none";
  } else {
    $("#topbarBrand").style.display = "flex";
  }
}

showScreen("loginScreen");

/* ======================= بناء مقاييس 1-10 ======================= */
$$(".scale").forEach(box => {
  const name = box.dataset.name;
  for (let i = 1; i <= 10; i++) {
    const label = document.createElement("label");
    label.className = "chip";
    label.innerHTML = `<input type="radio" name="${name}" value="${i}"><span>${i}</span>`;
    box.appendChild(label);
  }
});

/* ======================= صفوف الأشخاص ======================= */
function scoreOptions() {
  let html = '<option value="">—</option>';
  for (let i = 1; i <= 10; i++) html += `<option value="${i}">${i}</option>`;
  return html;
}

function addPersonRow(listEl, emptyEl, namePlaceholder) {
  emptyEl.style.display = "none";
  const row = document.createElement("div");
  row.className = "person-row";
  row.innerHTML = `
    <input type="text" class="p-name" placeholder="${namePlaceholder}">
    <select class="p-score">${scoreOptions()}</select>
    <input type="text" class="p-note" placeholder="ملاحظات (إن وجدت)">
    <button type="button" class="remove-btn" title="حذف">✕</button>`;
  row.querySelector(".remove-btn").onclick = () => {
    row.remove();
    if (!listEl.children.length) emptyEl.style.display = "block";
  };
  listEl.appendChild(row);
  row.querySelector(".p-name").focus();
}

$("#addMemberBtn").onclick = () =>
  addPersonRow($("#membersList"), $("#membersEmpty"), "اسم العضو");

$("#addLeaderBtn").onclick = () =>
  addPersonRow($("#leadersList"), $("#leadersEmpty"), "اسم القائد / النائب");

/* ======================= شاشة الدخول ======================= */
$("#enterBtn").onclick = () => {
  const name = $("#userName").value.trim();
  const committee = $("#committee").value;

  if (!name)                return alert("الرجاء إدخال الاسم الثلاثي للمتابعة");
  if (!committee)           return alert("الرجاء اختيار الفريق الخاص بك");

  state.name = name;
  state.committee = committee;

  $("#barName").textContent = name;
  $("#barCommittee").textContent = committee;

  showScreen("formScreen");
};

$("#logoutBtn").onclick = () => {
  if (confirm("هل أنت متأكد من رغبتك في تسجيل الخروج وإلغاء النموذج الحالي؟")) {
    $("#evalForm").reset();
    $("#membersList").innerHTML = "";
    $("#leadersList").innerHTML = "";
    $("#membersEmpty").style.display = "block";
    $("#leadersEmpty").style.display = "block";
    showScreen("loginScreen");
  }
};

/* ======================= جمع البيانات ======================= */
function collectPeople(listId) {
  return $$("#" + listId + " .person-row").map(row => ({
    name:  row.querySelector(".p-name").value.trim(),
    score: row.querySelector(".p-score").value,
    note:  row.querySelector(".p-note").value.trim()
  })).filter(p => p.name || p.score || p.note);
}

/* ======================= الإرسال الفعلي لقاعدة البيانات ======================= */
$("#evalForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const errEl = $("#errorMsg");
  errEl.style.display = "none";

  const fd = new FormData(e.target);
  const val = n => (fd.get(n) || "").toString().trim();

  if (!val("q1") || !val("q2") || !val("q3") || !val("q4")) {
    errEl.textContent = "الرجاء إكمال التقييم الرقمي للبنود الأربعة الأولى (1 - 4) قبل الإرسال.";
    errEl.style.display = "block";
    errEl.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  
  if (!val("final_members") || !val("final_leaders") || !val("final_committee")) {
    errEl.textContent = "الرجاء تعبئة جميع خانات (التقييم النهائي) في أسفل النموذج.";
    errEl.style.display = "block";
    errEl.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const payload = {
    name:       state.name,
    committee:  state.committee,
    q1: val("q1"), q1_notes: val("q1_notes"),
    q2: val("q2"), q2_notes: val("q2_notes"),
    q3: val("q3"), q3_notes: val("q3_notes"),
    q4: val("q4"), q4_notes: val("q4_notes"),
    challenges:  val("challenges"),
    how_handled: val("how_handled"),
    solutions:   val("solutions"),
    suggestions: val("suggestions"),
    final_members: val("final_members"),
    final_leaders: val("final_leaders"),
    final_committee: val("final_committee"),
    members: collectPeople("membersList"),
    leaders: collectPeople("leadersList")
  };

  const btn = $("#submitBtn");
  btn.classList.add("loading");
  btn.disabled = true;

  try {
    if (SCRIPT_URL.includes("ضع_رابط")) {
      throw new Error("لم يتم ربط الموقع بقاعدة البيانات بعد. الرجاء وضع رابط Apps Script في المتغير SCRIPT_URL.");
    }

    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const out = await res.json().catch(() => ({ ok: true }));
    if (out && out.ok === false) throw new Error(out.error || "حدث خطأ أثناء حفظ البيانات");

    showScreen("successScreen");

  } catch (err) {
    errEl.textContent = "⚠️ " + err.message;
    errEl.style.display = "block";
    errEl.scrollIntoView({ behavior: "smooth", block: "center" });
  } finally {
    btn.classList.remove("loading");
    btn.disabled = false;
  }
});

/* ======================= نموذج جديد ======================= */
$("#newFormBtn").onclick = () => {
  $("#evalForm").reset();
  $("#membersList").innerHTML = "";
  $("#leadersList").innerHTML = "";
  $("#membersEmpty").style.display = "block";
  $("#leadersEmpty").style.display = "block";
  showScreen("loginScreen");
};
