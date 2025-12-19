const API_BASE = "https://se-clinic-appointment.onrender.com";

let editingDoctorId = null;

/* ACTIVE NAV */
function highlightActiveNav() {
  const links = document.querySelectorAll(".nav-links a");
  const currentPage = location.pathname.split("/").pop();

  links.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === currentPage);
  });
}

/* SEARCH */
function setupSearchFilters() {
  const input = document.querySelector(".search-box input");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase();
    document
      .querySelectorAll("tbody tr, .doctor-card, .appointment-card")
      .forEach((el) => {
        el.style.display = el.innerText.toLowerCase().includes(q) ? "" : "none";
      });
  });
}

/* MODALS */
function setupModal(openId, modalId, closeId, cancelId) {
  const open = document.getElementById(openId);
  const modal = document.getElementById(modalId);
  const close = document.getElementById(closeId);
  const cancel = document.getElementById(cancelId);

  if (!open || !modal) return;

  open.onclick = () => modal.classList.add("active");
  close && (close.onclick = () => modal.classList.remove("active"));
  cancel && (cancel.onclick = () => modal.classList.remove("active"));

  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove("active");
  };
}

/* PATIENTS */
async function loadPatients() {
  try {
    const res = await fetch(`${API_BASE}/patients`);
    if (!res.ok) throw new Error("Failed to load patients");

    const data = await res.json();
    const patients = Array.isArray(data) ? data : data.items || [];

    const tbody = document.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    patients.forEach((p) => {
      tbody.innerHTML += `
        <tr>
          <td>${p.name}</td>
          <td>${
            p.birthDate ? new Date(p.birthDate).toLocaleDateString() : "-"
          }</td>
          <td class="muted">${p.email || "-"}</td>
          <td class="muted">${p.phone || "-"}</td>
          <td>
            <div class="table-actions">
              <i class="fa-solid fa-pen edit" data-id="${p._id}"></i>
              <i class="fa-solid fa-trash delete" data-id="${p._id}"></i>
            </div>
          </td>
        </tr>`;
    });

    setupPatientActions();
  } catch (err) {
    console.error(err);
  }
}

function setupPatientActions() {
  document.querySelectorAll(".edit").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const patientRes = await fetch(`${API_BASE}/patients/${id}`);
      const patient = await patientRes.json();

      const modal = document.getElementById("patientModal");
      modal.classList.add("active");

      const form = modal.querySelector("form");

      modal.querySelector("h2").textContent = "Edit Patient";
      form.querySelector('button[type="submit"]').textContent = "Update Patient";
      form.querySelector('input[name="name"]').value = patient.name;
      form.querySelector('input[name="birthDate"]').value =
        patient.birthDate?.split("T")[0] || "";
      form.querySelector('input[name="email"]').value = patient.email || "";
      form.querySelector('input[name="phone"]').value = patient.phone || "";

      form.onsubmit = null; // remove previous handler
      form.onsubmit = async (e) => {
        e.preventDefault();

        const name = form.querySelector('input[name="name"]').value;
        const birthDate = form.querySelector('input[name="birthDate"]').value;
        const email = form.querySelector('input[name="email"]').value;
        const phone = form.querySelector('input[name="phone"]').value;

        try {
          const res = await fetch(`${API_BASE}/patients/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, birthDate, email, phone }),
          });

          if (!res.ok) throw new Error("Failed to update patient");

          await loadPatients();
          modal.classList.remove("active");
          form.reset();
        } catch (err) {
          console.error(err);
          alert("Failed to update patient");
        }
      };
    };
  });

  document.querySelectorAll(".delete").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Are you sure you want to delete this patient?")) return;
      const id = btn.dataset.id;
      try {
        const res = await fetch(`${API_BASE}/patients/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete patient");
        await loadPatients();
      } catch (err) {
        console.error(err);
        alert("Failed to delete patient");
      }
    };
  });
}

function setupAddPatient() {
  const form = document.querySelector("#patientModal form");
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();

    const name = form.querySelector('input[name="name"]').value;
    const birthDate = form.querySelector('input[name="birthDate"]').value;
    const email = form.querySelector('input[name="email"]').value;
    const phone = form.querySelector('input[name="phone"]').value;

    try {
      const res = await fetch(`${API_BASE}/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, birthDate, email, phone }),
      });

      if (!res.ok) throw new Error("Failed to add patient");

      await loadPatients();
      document.getElementById("patientModal").classList.remove("active");
      form.reset();
    } catch (err) {
      console.error(err);
      alert("Failed to add patient");
    }
  };
}

/* DOCTORS */
async function loadDoctors() {
  try {
    const res = await fetch(`${API_BASE}/doctors`);
    if (!res.ok) throw new Error("Failed to load doctors");

    const data = await res.json();
    const doctors = Array.isArray(data) ? data : data.items || [];

    const grid = document.querySelector(".doctor-grid");
    if (!grid) return;
    grid.innerHTML = "";

    doctors.forEach((d) => {
      grid.innerHTML += `
        <div class="doctor-card">
          <div class="doctor-icon">
            <i class="fa-solid fa-user-doctor"></i>
          </div>
          <h3>${d.name}</h3>
          <p class="muted">${d.specialty || ""}</p>
          <div class="card-actions">
            <i class="fa-solid fa-pen edit" data-id="${d._id}"></i>
            <i class="fa-solid fa-trash delete" data-id="${d._id}"></i>
          </div>
        </div>`;
    });

    setupDoctorActions();
  } catch (err) {
    console.error(err);
  }
}

function setupDoctorActions() {
  // Edit buttons
  document.querySelectorAll(".doctor-card .edit").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id; // ✅ get the correct id
      editingDoctorId = id;

      const doctorRes = await fetch(`${API_BASE}/doctors/${id}`);
      const doctor = await doctorRes.json();

      const modal = document.getElementById("doctorModal");
      modal.classList.add("active");  

      const form = modal.querySelector("form");
      modal.querySelector("h2").textContent = "Edit Doctor";
      form.querySelector('button[type="submit"]').textContent = "Update Doctor";
      form.querySelector('input[name="name"]').value = doctor.name;
      form.querySelector('input[name="specialty"]').value = doctor.specialty || "";

      form.onsubmit = async (e) => {
        e.preventDefault();

        const name = form.querySelector('input[name="name"]').value;
        const specialty = form.querySelector('input[name="specialty"]').value;

        try {
          const res = await fetch(`${API_BASE}/doctors/${editingDoctorId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, specialty }),
          });

          if (!res.ok) throw new Error("Failed to update doctor");

          editingDoctorId = null; // reset
          await loadDoctors();
          modal.classList.remove("active");
          form.reset();
        } catch (err) {
          console.error(err);
          alert("Failed to update doctor");
        }
      };
    };
  });

  // Delete buttons
  document.querySelectorAll(".doctor-card .delete").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id; // ✅ get correct id
      if (!confirm("Are you sure you want to delete this doctor?")) return;

      try {
        const res = await fetch(`${API_BASE}/doctors/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete doctor");
        await loadDoctors();
      } catch (err) {
        console.error(err);
        alert("Failed to delete doctor");
      }
    };
  });
}


function setupAddDoctor() {
  const form = document.querySelector("#doctorModal form");
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();

    if (editingDoctorId) return;

    const name = form.querySelector('input[name="name"]').value;
    const specialty = form.querySelector('input[name="specialty"]').value;

    try {
      const res = await fetch(`${API_BASE}/doctors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, specialty }),
      });
      if (!res.ok) throw new Error("Failed to add doctor");

      await loadDoctors();
      document.getElementById("doctorModal").classList.remove("active");
      form.reset();
    } catch (err) {
      console.error(err);
      alert("Failed to add doctor");
    }
  };
}

/* APPOINTMENTS */
async function loadAppointments() {
  try {
    const res = await fetch(`${API_BASE}/appointments`);
    if (!res.ok) throw new Error("Failed to load appointments");

    const data = await res.json();
    const apps = Array.isArray(data) ? data : data.items || [];

    const list = document.querySelector(".appointment-list");
    if (!list) return;
    list.innerHTML = "";

    apps.forEach((a) => {
      const date = a.startAt ? new Date(a.startAt) : new Date();
      list.innerHTML += `
        <div class="appointment-card">
          <div class="date-badge">
            <span class="date">${date.getDate()}</span>
            <span class="label">${date.toLocaleString("en", {
              month: "short",
            })}</span>
          </div>
          <div class="appointment-info">
            <h3>${a.doctorId?.name || "Doctor"}</h3>
            <p class="muted">Patient: ${a.patientId?.name || "Patient"}</p>
            <p class="muted">Reason: ${a.notes || "-"}</p>
            <div class="card-actions">
              <i class="fa-solid fa-pen edit" data-id="${a._id}"></i>
              <i class="fa-solid fa-trash delete" data-id="${a._id}"></i>
            </div>
          </div>
        </div>`;
    });

    setupAppointmentActions();
  } catch (err) {
    console.error(err);
  }
}

function setupAppointmentActions() {
  document.querySelectorAll(".appointment-card .edit").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const res = await fetch(`${API_BASE}/appointments/${id}`);
      const app = await res.json();

      const modal = document.getElementById("appointmentModal");
      modal.classList.add("active");

      await populateAppointmentDropdowns();

      const form = modal.querySelector("form");
      form.querySelector('select[name="patient"]').value =
        app.patientId?._id || "";
      form.querySelector('select[name="doctor"]').value =
        app.doctorId?._id || "";
      form.querySelector('input[name="startAt"]').value = app.startAt || "";
      form.querySelector('input[name="endAt"]').value = app.endAt || "";
      form.querySelector('textarea[name="notes"]').value = app.notes || "";

      form.onsubmit = async (e) => {
        e.preventDefault();
        const patientId = form.querySelector('select[name="patient"]').value;
        const doctorId = form.querySelector('select[name="doctor"]').value;
        const startAt = form.querySelector('input[name="startAt"]').value;
        const endAt = form.querySelector('input[name="endAt"]').value;
        const notes = form.querySelector('textarea[name="notes"]').value;

        try {
          const res = await fetch(`${API_BASE}/appointments/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientId,
              doctorId,
              startAt,
              endAt,
              notes,
            }),
          });
          if (!res.ok) throw new Error("Failed to update appointment");
          await loadAppointments();
          modal.classList.remove("active");
        } catch (err) {
          console.error(err);
          alert("Failed to update appointment");
        }
      };
    };
  });

  document.querySelectorAll(".appointment-card .delete").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Are you sure you want to delete this appointment?")) return;
      const id = btn.dataset.id;
      try {
        const res = await fetch(`${API_BASE}/appointments/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete appointment");
        await loadAppointments();
      } catch (err) {
        console.error(err);
        alert("Failed to delete appointment");
      }
    };
  });
}

/* ADD NEW APPOINTMENT */
function setupAddAppointment() {
  const form = document.querySelector("#appointmentModal form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const patientId = form.querySelector('select[name="patient"]').value;
    const doctorId = form.querySelector('select[name="doctor"]').value;
    const startAt = form.querySelector('input[name="startAt"]').value;
    const endAt = form.querySelector('input[name="endAt"]').value;
    const notes = form.querySelector('textarea[name="notes"]').value;

    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, doctorId, startAt, endAt, notes }),
      });
      if (!res.ok) throw new Error("Failed to schedule appointment");

      await loadAppointments();
      document.getElementById("appointmentModal").classList.remove("active");
      form.reset();
    } catch (err) {
      console.error(err);
      alert("Failed to schedule appointment");
    }
  });
}

/* POPULATE DROPDOWNS */
async function populateAppointmentDropdowns() {
  const patientSelect = document.querySelector(
    '#appointmentModal select[name="patient"]'
  );
  const doctorSelect = document.querySelector(
    '#appointmentModal select[name="doctor"]'
  );

  if (!patientSelect || !doctorSelect) return;

  // Patients
  const patientRes = await fetch(`${API_BASE}/patients`);
  const patients = await patientRes.json();
  patientSelect.innerHTML = '<option value="">Select Patient</option>';
  patients.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p._id;
    opt.textContent = p.name;
    patientSelect.appendChild(opt);
  });

  // Doctors
  const doctorRes = await fetch(`${API_BASE}/doctors`);
  const data = await doctorRes.json();
  const doctors = Array.isArray(data) ? data : data.items || [];
  doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
  doctors.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d._id;
    opt.textContent = d.name;
    doctorSelect.appendChild(opt);
  });
}


/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  highlightActiveNav();
  setupSearchFilters();

  setupModal(
    "openPatientModal",
    "patientModal",
    "closePatientModal",
    "cancelPatientModal"
  );
  setupModal(
    "openDoctorModal",
    "doctorModal",
    "closeDoctorModal",
    "cancelDoctorModal"
  );
  setupModal(
    "openAppointmentModal",
    "appointmentModal",
    "closeAppointmentModal",
    "cancelAppointmentModal"
  );

  const openPatientBtn = document.getElementById("openPatientModal");

if (openPatientBtn) {
  openPatientBtn.onclick = () => {
    const modal = document.getElementById("patientModal");
    const form = modal.querySelector("form");

    modal.classList.add("active");
    modal.querySelector("h2").textContent = "Add New Patient";
    form.querySelector('button[type="submit"]').textContent = "Add Patient";

    form.reset();
  };
}


  if (document.body.classList.contains("patients-page")) {
    loadPatients();
    setupAddPatient();
  }
  if (document.body.classList.contains("doctors-page")) {
    loadDoctors();
    setupAddDoctor();
  }
  if (document.body.classList.contains("appointments-page")) {
    loadAppointments();
    setupAddAppointment();
    document.getElementById("openAppointmentModal").onclick = () => {
      populateAppointmentDropdowns();
      document.getElementById("appointmentModal").classList.add("active");
    };
  }
});
