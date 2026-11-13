const API_URL = "https://student-management-backend-2564.onrender.com/api/students";
const pages = {
    dashboard: document.getElementById("dashboardPage"),
    students: document.getElementById("studentsPage"),
    form: document.getElementById("studentFormPage"),
    details: document.getElementById("studentDetailsPage")
};

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const breadcrumbTitle = document.getElementById("breadcrumbTitle");
const currentDate = document.getElementById("currentDate");

const addStudentButton = document.getElementById("addStudentButton");
const addStudentButton2 = document.getElementById("addStudentButton2");
const studentForm = document.getElementById("studentForm");
const cancelFormButton = document.getElementById("cancelFormButton");
const backToStudentsButton = document.getElementById("backToStudentsButton");
const studentSearch = document.getElementById("studentSearch");
const studentsTable = document.getElementById("studentsTable");
const recentStudentsTable = document.getElementById("recentStudentsTable");
const studentCount = document.getElementById("studentCount");
const formPageTitle = document.getElementById("formPageTitle");
const formMessage = document.getElementById("formMessage");
const saveStudentButton = document.getElementById("saveStudentButton");
const studentDetailsContent = document.getElementById("studentDetailsContent");
const toast = document.getElementById("toast");

let students = [];
let editingStudentId = null;
let toastTimeout;

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function capitalizeName(name) {
    if (!name) return "";

    return String(name).charAt(0).toUpperCase() + String(name).slice(1);
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function refreshIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

function showPage(pageName) {
    Object.values(pages).forEach(page => {
        page.classList.remove("active");
    });

    if (!pages[pageName]) return;

    pages[pageName].classList.add("active");

    document.querySelectorAll("[data-page]").forEach(link => {
        const isActive = link.dataset.page === pageName;

        link.classList.toggle("active", isActive);
    });

    const titles = {
        dashboard: "Dashboard",
        students: "All Students",
        form: editingStudentId ? "Edit Student" : "Add Student",
        details: "Student Details"
    };

    breadcrumbTitle.textContent = titles[pageName];

    sidebar.classList.remove("open");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    refreshIcons();
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong. Please try again.");
    }

    return data;
}

function formatDate(dateValue) {
    if (!dateValue) return "Not provided";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function getStudentName(student) {
    return `${capitalizeName(student.first_name)} ${capitalizeName(student.last_name)}`.trim();
}

function updateDashboard() {
    const departments = new Set(
        students
            .map(student => student.department?.trim())
            .filter(Boolean)
    );

    const courses = new Set(
        students
            .map(student => student.course?.trim())
            .filter(Boolean)
    );

    document.getElementById("totalStudents").textContent = students.length;
    document.getElementById("totalDepartments").textContent = departments.size;
    document.getElementById("totalCourses").textContent = courses.size;

    renderRecentStudents();
}

function renderRecentStudents() {
    const recentStudents = students.slice(0, 5);

    if (recentStudents.length === 0) {
        recentStudentsTable.innerHTML = `
            <tr>
                <td colspan="5" class="table-message">No student records found.</td>
            </tr>
        `;
        return;
    }

    recentStudentsTable.innerHTML = recentStudents.map(student => `
        <tr>
            <td>${escapeHTML(getStudentName(student))}</td>
            <td>${escapeHTML(student.student_id)}</td>
            <td>${escapeHTML(student.department || "—")}</td>
            <td>${escapeHTML(student.level ? `${student.level} Level` : "—")}</td>
            <td>${escapeHTML(student.email)}</td>
        </tr>
    `).join("");
}

function renderStudents(searchTerm = "") {
    const search = searchTerm.trim().toLowerCase();

    const filteredStudents = students.filter(student => {
        const searchableValues = [
            student.first_name,
            student.last_name,
            student.student_id,
            student.email,
            student.phone,
            student.department,
            student.course,
            student.level
        ];

        return searchableValues.some(value =>
            String(value ?? "").toLowerCase().includes(search)
        );
    });

    studentCount.textContent = `${filteredStudents.length} ${filteredStudents.length === 1 ? "student" : "students"} found`;

    if (filteredStudents.length === 0) {
        studentsTable.innerHTML = `
            <tr>
                <td colspan="6" class="table-message">
                    ${students.length === 0 ? "No student records found." : "No matching students found."}
                </td>
            </tr>
        `;
        return;
    }

    studentsTable.innerHTML = filteredStudents.map(student => `
        <tr>
            <td>${escapeHTML(getStudentName(student))}</td>
            <td>${escapeHTML(student.student_id)}</td>
            <td>${escapeHTML(student.department || "—")}</td>
            <td>${escapeHTML(student.course || "—")}</td>
            <td>${escapeHTML(student.level ? `${student.level} Level` : "—")}</td>
            <td>
                <div class="action-buttons">
                    <button type="button" class="icon-button" data-action="view" data-id="${escapeHTML(student.id)}" title="View student">
                        <i data-lucide="eye"></i>
                        <span>View</span>
                    </button>

                    <button type="button" class="icon-button" data-action="edit" data-id="${escapeHTML(student.id)}" title="Edit student">
                        <i data-lucide="pencil"></i>
                        <span>Edit</span>
                    </button>

                    <button type="button" class="icon-button delete" data-action="delete" data-id="${escapeHTML(student.id)}" title="Delete student">
                        <i data-lucide="trash-2"></i>
                        <span>Delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    refreshIcons();
}

async function loadStudents() {
    studentsTable.innerHTML = `
        <tr>
            <td colspan="6" class="table-message">Loading student records...</td>
        </tr>
    `;

    recentStudentsTable.innerHTML = `
        <tr>
            <td colspan="5" class="table-message">Loading student records...</td>
        </tr>
    `;

    try {
        const data = await apiRequest(API_URL);

        students = Array.isArray(data.students) ? data.students : [];

        updateDashboard();
        renderStudents(studentSearch.value);
    } catch (error) {
        studentsTable.innerHTML = `
            <tr>
                <td colspan="6" class="table-message">${escapeHTML(error.message)}</td>
            </tr>
        `;

        recentStudentsTable.innerHTML = `
            <tr>
                <td colspan="5" class="table-message">${escapeHTML(error.message)}</td>
            </tr>
        `;

        studentCount.textContent = "Unable to load records";
        showToast(error.message);
    }
}

function resetStudentForm() {
    studentForm.reset();
    editingStudentId = null;
    formPageTitle.textContent = "Add Student";
    saveStudentButton.textContent = "Save Student";
    formMessage.textContent = "";
    formMessage.className = "form-message";
}

function openAddStudentForm() {
    resetStudentForm();
    showPage("form");
}

function fillStudentForm(student) {
    document.getElementById("student_id").value = student.student_id || "";
    document.getElementById("first_name").value = student.first_name || "";
    document.getElementById("last_name").value = student.last_name || "";
    document.getElementById("email").value = student.email || "";
    document.getElementById("phone").value = student.phone || "";
    document.getElementById("gender").value = student.gender || "";
    document.getElementById("date_of_birth").value = student.date_of_birth
        ? String(student.date_of_birth).slice(0, 10)
        : "";
    document.getElementById("department").value = student.department || "";
    document.getElementById("course").value = student.course || "";
    document.getElementById("level").value = student.level || "";
}

async function openEditStudentForm(id) {
    try {
        const data = await apiRequest(`${API_URL}/${encodeURIComponent(id)}`);
        const student = data.student;

        if (!student) {
            throw new Error("Student record not found.");
        }

        editingStudentId = student.id;
        fillStudentForm(student);

        formPageTitle.textContent = "Edit Student";
        saveStudentButton.textContent = "Update Student";
        formMessage.textContent = "";

        showPage("form");
    } catch (error) {
        showToast(error.message);
    }
}

async function viewStudent(id) {
    try {
        const data = await apiRequest(`${API_URL}/${encodeURIComponent(id)}`);
        const student = data.student;

        if (!student) {
            throw new Error("Student record not found.");
        }

        studentDetailsContent.innerHTML = `
            <div class="form-section-heading">
                <h2>${escapeHTML(getStudentName(student))}</h2>
                <p>Student ID: ${escapeHTML(student.student_id)}</p>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label>First Name</label>
                    <p>${escapeHTML(capitalizeName(student.first_name) || "Not provided")}</p>
                </div>

                <div class="form-group">
                    <label>Last Name</label>
                    <p>${escapeHTML(capitalizeName(student.last_name) || "Not provided")}</p>
                </div>

                <div class="form-group">
                    <label>Student ID</label>
                    <p>${escapeHTML(student.student_id || "Not provided")}</p>
                </div>

                <div class="form-group">
                    <label>Email Address</label>
                    <p>${escapeHTML(student.email || "Not provided")}</p>
                </div>

                <div class="form-group">
                    <label>Phone Number</label>
                    <p>${escapeHTML(student.phone || "Not provided")}</p>
                </div>

                <div class="form-group">
                    <label>Gender</label>
                    <p>${escapeHTML(student.gender || "Not provided")}</p>
                </div>

                <div class="form-group">
                    <label>Date of Birth</label>
                    <p>${escapeHTML(formatDate(student.date_of_birth))}</p>
                </div>

                <div class="form-group">
                    <label>Department</label>
                    <p>${escapeHTML(student.department || "Not provided")}</p>
                </div>

                <div class="form-group">
                    <label>Course</label>
                    <p>${escapeHTML(student.course || "Not provided")}</p>
                </div>

                <div class="form-group">
                    <label>Level</label>
                    <p>${escapeHTML(student.level ? `${student.level} Level` : "Not provided")}</p>
                </div>
            </div>
        `;

        showPage("details");
    } catch (error) {
        showToast(error.message);
    }
}

async function deleteStudent(id) {
    const student = students.find(item => String(item.id) === String(id));

    if (!student) {
        showToast("Student record not found.");
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to delete ${getStudentName(student)}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
        const data = await apiRequest(`${API_URL}/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });

        showToast(data.message || "Student deleted successfully.");

        await loadStudents();
    } catch (error) {
        showToast(error.message);
    }
}

async function handleStudentSubmit(event) {
    event.preventDefault();

    const formData = new FormData(studentForm);
    const studentData = Object.fromEntries(formData.entries());

    saveStudentButton.disabled = true;
    saveStudentButton.textContent = editingStudentId ? "Updating..." : "Saving...";

    try {
        const isEditing = editingStudentId !== null;

        const data = await apiRequest(
            isEditing ? `${API_URL}/${encodeURIComponent(editingStudentId)}` : API_URL,
            {
                method: isEditing ? "PUT" : "POST",
                body: JSON.stringify(studentData)
            }
        );

        showToast(data.message || (isEditing
            ? "Student updated successfully."
            : "Student added successfully."
        ));

        resetStudentForm();
        await loadStudents();
        showPage("students");
    } catch (error) {
        formMessage.textContent = error.message;
        formMessage.style.color = "#A96F4D";
        showToast(error.message);
    } finally {
        saveStudentButton.disabled = false;
        saveStudentButton.textContent = editingStudentId ? "Update Student" : "Save Student";
    }
}

document.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();

        const pageName = link.dataset.page;

        if (pageName === "students") {
            loadStudents();
        }

        showPage(pageName);
    });
});

addStudentButton.addEventListener("click", openAddStudentForm);
addStudentButton2.addEventListener("click", openAddStudentForm);

studentForm.addEventListener("submit", handleStudentSubmit);

cancelFormButton.addEventListener("click", () => {
    resetStudentForm();
    loadStudents();
    showPage("students");
});

backToStudentsButton.addEventListener("click", () => {
    loadStudents();
    showPage("students");
});

studentSearch.addEventListener("input", () => {
    renderStudents(studentSearch.value);
});

studentsTable.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const { action, id } = button.dataset;

    if (action === "view") {
        viewStudent(id);
    }

    if (action === "edit") {
        openEditStudentForm(id);
    }

    if (action === "delete") {
        deleteStudent(id);
    }
});

menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});

document.addEventListener("click", event => {
    if (
        window.innerWidth <= 760 &&
        sidebar.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        !menuToggle.contains(event.target)
    ) {
        sidebar.classList.remove("open");
    }
});

currentDate.textContent = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
});

refreshIcons();
loadStudents();