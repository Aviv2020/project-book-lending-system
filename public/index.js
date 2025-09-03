let currentEditIndex = null;
let clusters = []; // מערך שמכיל את כל הסטים
let selectedBookIdsForCluster = new Set(); // הספרים שנבחרו בסט החדש
let selectedBookIdsRealtime = [];
let selectedBooks = new Set();

function editStudent(index) {
  currentEditIndex = index;
  const student = students[index];
  if (!student) return alert("התלמיד לא נמצא");

  document.getElementById('editStudentName').value = student.name;
  document.getElementById('editStudentID').value = student.id;
  document.getElementById('editStudentSchool').value = student.school || 'קציר א';
  document.getElementById('editStudentClass').value = student.classroom || '';
  document.getElementById('editStudentInLoanProject').value = student.inLoanProject ? 'true' : 'false';
  document.getElementById('editNote').value = student.note || ''; // ⬅️ נוספה שורה זו

  document.getElementById('editStudentModal').style.display = 'flex';
}


const availableGrades = ['ז', 'ח', 'ט', 'י', 'יא', 'יב'];

const clusterGradeTags = document.getElementById('clusterGradeTags');
const clusterGradeInput = document.getElementById('clusterGradeInput');

let selectedGrades = [];

function renderGradeTags() {
  // נקה תגיות ישנות (חוץ מה-input)
  clusterGradeTags.querySelectorAll('.tag').forEach(tag => tag.remove());

  selectedGrades.forEach(grade => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = grade;
    tag.style.cssText = `
      background: #007bff;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      user-select: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
    `;

    // כפתור סגירה לתגית
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      line-height: 1;
      padding: 0;
    `;
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      removeGrade(grade);
    };

    tag.appendChild(closeBtn);
    clusterGradeTags.insertBefore(tag, clusterGradeInput);
  });
}

function removeGrade(grade) {
  selectedGrades = selectedGrades.filter(g => g !== grade);
  renderGradeTags();
}

clusterGradeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const inputVal = clusterGradeInput.value.trim();

    // בדיקה שהערך תקין וטרם נבחר
    if (availableGrades.includes(inputVal) && !selectedGrades.includes(inputVal)) {
      selectedGrades.push(inputVal);
      renderGradeTags();
      clusterGradeInput.value = '';
    }
  } else if (e.key === 'Backspace' && clusterGradeInput.value === '') {
    // מחיקת תגית אחרונה בלחיצה על Backspace כשהקלט ריק
    selectedGrades.pop();
    renderGradeTags();
  }
});

// אתחול הצגה ריקה
renderGradeTags();


function closeEditStudentModal() {
  currentEditIndex = null;
  document.getElementById('editStudentModal').style.display = 'none';
}

async function saveEditedStudent() {
  if (currentEditIndex === null) return;

  const student = students[currentEditIndex];
  const updated = {
    ...student,
    name: document.getElementById('editStudentName').value.trim(),
    school: document.getElementById('editStudentSchool').value,
    classroom: document.getElementById('editStudentClass').value.trim(),
    inLoanProject: document.getElementById('editStudentInLoanProject').value === 'true',
    note: document.getElementById('editNote').value.trim()
  };

  try {
    const res = await fetch(`/api/2026/students/${student.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...userIdHeader },
      body: JSON.stringify(updated)
    });

    if (!res.ok) throw new Error("שגיאה בעדכון בשרת");

    const saved = await res.json();
    students[currentEditIndex] = saved; // עדכון מקומי
    renderStudentTable();
    showSuccess("✔️ פרטי התלמיד עודכנו");
    closeEditStudentModal();
    filterStudents();
  } catch (err) {
    console.error(err);
    alert("שגיאה בעדכון תלמיד");
  }
}


let currentEditBookIndex = null;

const editTags = new Set();

function addEditGradeTag() {
  const input = document.getElementById('editGradeTagInput');
  const value = input.value.trim();
  if (value && !editTags.has(value)) {
    editTags.add(value);
    input.value = '';
    renderEditTags();
  }
}

function renderEditTags() {
  const container = document.getElementById('editGradeTags');
  container.innerHTML = '';

  editTags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.innerHTML = `
      <button onclick="removeEditGradeTag('${tag}')">✕</button>
      ${tag}
    `;
    container.appendChild(span);
  });

  // עדכון השדה הנסתר
  document.getElementById('editBookGrade').value = Array.from(editTags).join(', ');
}

function removeEditGradeTag(tag) {
  editTags.delete(tag);
  renderEditTags();
}



function editBook(index) {
  currentEditBookIndex = index;
  const book = books[index];
  if (!book) return alert("הספר לא נמצא");

  document.getElementById('editBookName').value = book.name || '';
  document.getElementById('editBookSubject').value = book.subject || '';

  // עדכון שדה גיל מוסתר
  document.getElementById('editBookGrade').value = book.grade || '';

  // רענון תגיות שכבת גיל (אם יש tags)
  editTags.clear();
  if (book.grade) {
    book.grade.split(',').map(g => g.trim()).forEach(tag => editTags.add(tag));
  }
  renderEditTags();

  document.getElementById('editBookLevel').value = book.level || 'כללי';
  document.getElementById('editBookVolume').value = book.volume || 'יחיד';
  document.getElementById('editBookPublisher').value = book.publisher || '';
  document.getElementById('editBookType').value = book.type || 'ספר';
  document.getElementById('editBookPrice').value = book.price || '';
  document.getElementById('editBookNote').value = book.note || '';

  // ✅ תמיכה בכמות עותקים במלאי
  document.getElementById('editBookStockCount').value = book.stockCount ?? '';

  document.getElementById('editBookModal').style.display = 'flex';
}

function closeEditBookModal() {
  currentEditBookIndex = null;
  document.getElementById('editBookModal').style.display = 'none';
}

async function saveEditedBook() {
  if (currentEditBookIndex === null) return;

  const book = books[currentEditBookIndex];
  if (!book) return;

  const updated = {
    ...book,
    name: document.getElementById('editBookName').value.trim(),
    subject: document.getElementById('editBookSubject').value.trim(),
    grade: document.getElementById('editBookGrade').value.trim(),
    level: document.getElementById('editBookLevel').value,
    volume: document.getElementById('editBookVolume').value,
    publisher: document.getElementById('editBookPublisher').value.trim(),
    type: document.getElementById('editBookType').value,
    price: document.getElementById('editBookPrice').value.trim(),
    note: document.getElementById('editBookNote').value.trim(),
    stockCount: parseInt(document.getElementById('editBookStockCount').value.trim() || 0, 10)
  };

  try {
    const res = await fetch(`/api/2026/books/${book.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...userIdHeader },
      body: JSON.stringify(updated)
    });

    if (!res.ok) throw new Error("שגיאה בעדכון ספר");

    const saved = await res.json();
    books[currentEditBookIndex] = saved;
    renderBookTable();
    showSuccess("✔️ פרטי הספר עודכנו");
    closeEditBookModal();
    filterBooks();
  } catch (err) {
    console.error(err);
    alert("שגיאה בעדכון ספר");
  }
}


window.addEventListener('DOMContentLoaded', () => {
  const yearInput = document.getElementById('yearSelect');  // שדה הקלט מסוג number
  const yearDisplay = document.getElementById('currentYearDisplay');
  const minYear = 2026;

  // טען את השנה מ־localStorage, או הגדר מינימום
  let selectedYear = parseInt(localStorage.getItem('selectedYear'), 10);
  if (isNaN(selectedYear) || selectedYear < minYear) {
    selectedYear = minYear;
    localStorage.setItem('selectedYear', selectedYear.toString());
  }

  // עדכן את שדה הקלט והתצוגה
  yearInput.value = selectedYear;
  yearDisplay.textContent = selectedYear;

  // מאזין לשינויים בקלט (input) – רק אם הערך חוקי
  yearInput.addEventListener('input', () => {
    let val = parseInt(yearInput.value, 10);

    if (isNaN(val) || val < minYear) {
      yearDisplay.textContent = 'ערך לא חוקי';
      return;
    }

    localStorage.setItem('selectedYear', val.toString());
    yearDisplay.textContent = val;

    loadDataForYear(val);  // טען מחדש את הנתונים לפי השנה
  });

  // טען את הנתונים בתחילה לפי השנה שהוגדרה
  loadDataForYear(selectedYear);
});

function loadDataForYear(year) {
  console.log("טוען נתונים לשנה", year);
  loadData(); // פונקציה קיימת שמטענת את הנתונים שלך
}

function yearKey(file) {
  const minYear = 2026;
  const maxYear = new Date().getFullYear() + 1;
  let year = parseInt(localStorage.getItem('selectedYear'), 10);

  if (isNaN(year) || year < minYear) year = minYear;
  if (year > maxYear) year = maxYear;

  return `/api/${year}/${file}`;
}


document.getElementById('borrowerTypeSelect').addEventListener('change', e => {
  const val = e.target.value;
  const nameInputLabel = document.getElementById('borrowerNameInput').parentElement;
  if (val === 'student') {
    nameInputLabel.style.display = 'none';
    document.getElementById('borrowerNameInput').value = '';
  } else {
    nameInputLabel.style.display = 'block';
  }
});

function showPurchaseReceipt(student, purchasedBooks, signatureDataUrl, date) {
  const receiptContainer = document.getElementById('receiptHTMLArea');

  const booksHTML = purchasedBooks.map(b => {
    const price = parseFloat(b.price || '50');
    return `<li>${b.name} (${b.subject}, שכבת ${b.grade}${b.level ? `, רמה ${b.level}` : ''}) – ${price} ₪</li>`;
  }).join('');

  const total = purchasedBooks.reduce((sum, b) => sum + parseFloat(b.price || '50'), 0);

  const html = `
    <h2 style="text-align:center;">אישור רכישת ספרים</h2>
    <p><strong>שם התלמיד:</strong> ${student.name}</p>
    <p><strong>תעודת זהות:</strong> ${student.id}</p>
    <p><strong>כיתה:</strong> ${student.classroom}</p>
    <p><strong>בית ספר:</strong> ${student.school}</p>
    <p><strong>תאריך רכישה:</strong> ${new Date(date).toLocaleDateString('he-IL')}</p>
    <p><strong>רשימת ספרים שנרכשו:</strong></p>
    <ul>${booksHTML}</ul>
    <p><strong>סה"כ לתשלום:</strong> ${total} ₪</p>
    <p><strong>חתימה:</strong></p>
    <img src="${signatureDataUrl}" alt="חתימה" style="max-width:300px; border:1px solid #ccc;" />
  `;

  receiptContainer.innerHTML = html;
  document.getElementById('purchaseReceiptModal').style.display = 'flex';
}

function closePurchaseReceipt() {
  document.getElementById('purchaseReceiptModal').style.display = 'none';
}

function printReceipt() {
  const content = document.getElementById('receiptHTMLArea').innerHTML;

  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(`
    <html>
      <head>
        <title>אישור רכישה</title>
        <style>
          body { direction: rtl; font-family: Arial, sans-serif; padding: 20px; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);
  printWindow.document.close();

  // המתן שהחלון יסיים לטעון ואז הדפס
  printWindow.onload = function () {
    printWindow.focus();
    printWindow.print();
  };
}

// סינון תלמידים בלשונית החזרה

const ITEMS_PER_PAGE = 50;

let currentStudentPage = 1;
let currentBookPage = 1;

function filterStudentsReturn() {
  const levelSelect = document.getElementById('levelFilterReturn');
  const searchInput = document.getElementById('searchStudentInputReturn');
  const select = document.getElementById('filteredStudentsSelectReturn');
  const container = document.getElementById('returnBooksSelect');

  if (!levelSelect || !select || !searchInput) {
    console.warn("Missing required elements");
    return;
  }

  const levelFilter = levelSelect.value.trim();
  const searchFilter = searchInput.value.trim().toLowerCase();
  select.innerHTML = '';

  const levelGroups = {
    "הקבצה א": ["הקבצה א", "הקבצה א מואצת", "הקבצה א ו-א מואצת"],
    "הקבצה א מואצת": ["הקבצה א מואצת", "הקבצה א ו-א מואצת"],
    "הקבצה א ו-א מואצת": ["הקבצה א", "הקבצה א מואצת", "הקבצה א ו-א מואצת"]
  };

  const selectedGroup = levelGroups[levelFilter] || [levelFilter];

  const relevantBorrowed = borrowed.filter(b =>
    Array.isArray(b.bookIds) &&
    Array.isArray(b.returned) &&
    b.bookIds.some((bookId, idx) => {
      const book = books.find(bk => bk.id === bookId);
      if (!book) return false;
      const level = (book.level || '').trim();

      const isReturned = b.returned[idx]; // ✅ נבדוק אם הספר הזה *הוחזר*
      return !isReturned && (!levelFilter || selectedGroup.includes(level));
    })
  );

  const uniqueStudentIds = [...new Set(relevantBorrowed.map(b => b.studentId))];

  const matchedStudents = uniqueStudentIds
    .map(id => students.find(s => s.id === id))
    .filter(Boolean)
    .filter(student => student.name.toLowerCase().includes(searchFilter));

  matchedStudents.forEach(student => {
    const index = students.findIndex(s => s.id === student.id);
    if (index !== -1) {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = student.name;
      select.appendChild(option);
    }
  });

  if (select.options.length > 0) {
    updateReturnBooks(select.value);
  } else {
    if (container) container.innerHTML = '<p>אין ספרים להחזרה</p>';
  }
}



document.getElementById('searchStudentInputReturn').addEventListener('input', filterStudentsReturn);

document.getElementById('filteredStudentsSelectReturn').addEventListener('change', (e) => {
  updateReturnBooks(e.target.value);
});

document.getElementById('searchBookInputReturn').addEventListener('input', () => {
  const select = document.getElementById('filteredStudentsSelectReturn');
  updateReturnBooks(select.value);
});

document.getElementById('levelFilterReturn').addEventListener('change', () => {
  const select = document.getElementById('filteredStudentsSelectReturn');
  updateReturnBooks(select.value);
});




// פונקציה לבחירת כל תיבות הסימון
function selectAllCheckboxes(containerId, checked) {
  const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]`);
  checkboxes.forEach(cb => cb.checked = checked);
}

let students = [];
let books = [];
let borrowed = [];
let returned = [];
let returnToChargeMode = false;


function selectAllFilteredBulkBooks() {
  const checkboxes = document.querySelectorAll('#bulkBooksSelect input[type=checkbox]');
  checkboxes.forEach(cb => {
    cb.checked = true;
    selectedBulkBookIds.add(cb.value);
  });
}


window.addEventListener("DOMContentLoaded", () => {
  loadData().then(() => {
    console.log("✅ כל הנתונים נטענו");
    renderStudentTable();  // 🟢 רק כאן מותר
    renderBookTable();
  });
});


let bulkCanvas, bulkCtx;


function openBulkLendModal() {
  selectedBulkBookIds = new Set();
  document.getElementById('bulkLendModal').style.display = 'flex';
  setTimeout(() => {
    bulkCanvas = document.getElementById('bulkSignaturePad');
    bulkCtx = bulkCanvas.getContext('2d');
    bulkCanvas.width = bulkCanvas.offsetWidth;
    bulkCanvas.height = bulkCanvas.offsetHeight;

    bulkCtx.clearRect(0, 0, bulkCanvas.width, bulkCanvas.height);
    bulkCtx.beginPath();

    bulkCanvas.addEventListener('pointerdown', e => {
      bulkCtx.moveTo(e.offsetX, e.offsetY);
      bulkCanvas.setPointerCapture(e.pointerId);
      bulkCanvas.isDrawing = true;
    });

    bulkCanvas.addEventListener('pointermove', e => {
      if (bulkCanvas.isDrawing) {
        bulkCtx.lineTo(e.offsetX, e.offsetY);
        bulkCtx.stroke();
      }
    });

    ['pointerup', 'pointerleave'].forEach(evt =>
      bulkCanvas.addEventListener(evt, () => (bulkCanvas.isDrawing = false))
    );

    filterBulkBooks();
  }, 100);
}

function clearBulkSignature() {
  if (bulkCtx) {
    bulkCtx.clearRect(0, 0, bulkCanvas.width, bulkCanvas.height);
    bulkCtx.beginPath(); // מוסיף איפוס אמיתי
  }
}

function isBulkSignatureEmpty() {
  const blank = document.createElement('canvas');
  blank.width = bulkCanvas.width;
  blank.height = bulkCanvas.height;
  return bulkCanvas.toDataURL() === blank.toDataURL();
}



function openConfirmModal(actionType) {
  const modal = document.getElementById('confirmBorrowModal');
  const title = modal.querySelector('h3');
  const confirmBtn = modal.querySelector('button[onclick="finalizeBorrow()"]');

  // שינוי הטקסטים לפי הפעולה
  if (actionType === 'השאלה') {
    title.textContent = '📋 אישור השאלה';
    confirmBtn.textContent = '✔️ אשר';
  } else if (actionType === 'רכישה') {
    title.textContent = '📋 אישור הרכישה';
    confirmBtn.textContent = '✔️ אשר רכישה';
  }

  modal.style.display = 'flex';
  window.currentActionType = actionType;
}

function resetBorrowModalState() {
  // ניקוי השם שנבחר
  document.getElementById('filteredStudentsSelect').selectedIndex = -1;

  // ביטול בחירת כל הצ'קבוקסים של הספרים
  document.querySelectorAll('#filteredBooksSelect input[type=checkbox]:checked').forEach(cb => {
    cb.checked = false;
  });

  // איפוס רשימת הספרים במודל
  document.getElementById('borrowBookList').innerHTML = '';

  // איפוס הצהרה
  document.getElementById('confirmBorrowCheckbox').checked = false;

  // איפוס חתימה
  clearSignature();

  // (אופציונלי) איפוס שדה שם הורה/צוות
  const borrowerNameInput = document.getElementById('borrowerNameInput');
  if (borrowerNameInput) borrowerNameInput.value = '';

  // (אופציונלי) איפוס בחירת סוג שואל
  const borrowerTypeSelect = document.getElementById('borrowerTypeSelect');
  if (borrowerTypeSelect) borrowerTypeSelect.selectedIndex = 0;
}


function filterBulkBooks() {
  const container = document.getElementById('bulkBooksSelect');
  container.innerHTML = '';

  const search = document.getElementById('bulkSearchBookInput').value.toLowerCase();
  const subject = document.getElementById('bulkSubjectFilter').value.toLowerCase();
  const level = document.getElementById('bulkLevelFilter').value;
  const grade = document.getElementById('bulkGradeFilter').value;

  books.forEach((b, i) => {
    const nameMatch = !search || (b.name || '').toLowerCase().includes(search);
    const subjectMatch = !subject || (b.subject || '').toLowerCase().includes(subject);
    const levelMatch = !level || b.level === level;
    const gradeMatch = !grade || b.grade === grade;

    if (nameMatch && subjectMatch && levelMatch && gradeMatch) {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = b.id; // שימוש ב־id במקום index
      checkbox.id = 'bulk_' + b.id;
      checkbox.checked = selectedBulkBookIds.has(b.id); // שמירת סימון

      checkbox.addEventListener('change', e => {
        if (e.target.checked) {
          selectedBulkBookIds.add(b.id);
        } else {
          selectedBulkBookIds.delete(b.id);
        }
      });

      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.textContent = `${b.name} (${b.subject}, שכבת ${b.grade})`;
      label.prepend(checkbox);

      container.appendChild(label);
    }
  });
}


function printStudentCard(index) {
  const student = students[index];
  if (!student) return;

  const studentCharges = charges.filter(c => c.studentId === student.id);
  const studentUnpaidCharges = studentCharges.filter(c => !c.paid);
  const chargedIds = new Set(studentCharges.map(c => c.borrowId).filter(Boolean));

  // --- טיימליין Borrow/Return ---
  let events = [];

  borrowed
    .filter(b => b.studentId === student.id && !chargedIds.has(b.id))
    .forEach(b => {
      b.bookIds.forEach(bookId => {
        const book = books.find(bk => bk.id === bookId);
        if (!book) return;
        events.push({ type: "borrow", book, date: new Date(b.date), borrowId: b.id });
      });
    });

  returned
    .filter(r => (r.student?.id === student.id || r.studentId === student.id))
    .forEach(r => {
      let bookObj = r.book;
      if (!bookObj?.id && (r.bookId || typeof bookObj === "string")) {
        const bookId = r.bookId || bookObj;
        bookObj = books.find(bk => bk.id === bookId) || {};
      }
      events.push({ type: "return", book: bookObj, date: new Date(r.returnDate), borrowId: r.id });
    });

  events.sort((a, b) => a.date - b.date);

  // --- מצב אחרון של כל ספר ---
  const activeBorrows = new Map();
  events.forEach(ev => {
    const bookId = ev.book?.id;
    if (!bookId) return;
    if (ev.type === "borrow") {
      activeBorrows.set(bookId, ev);
    } else if (ev.type === "return") {
      if (activeBorrows.has(bookId)) {
        activeBorrows.delete(bookId);
      }
    }
  });

  const booksStillBorrowed = Array.from(activeBorrows.values()).map(ev =>
    `${ev.book.name} (${ev.book.subject}, כרך ${ev.book.volume || '---'})`
  );

  // --- יצירת התוכן להדפסה ---
  const logoPath = 'katzir-logo.jpeg';
  const content = `
    <div style="font-family: Arial; direction: rtl; padding: 20px; text-align: center;">
      <img src="${logoPath}" alt="סמל בית ספר" style="width: 100px;">
      <h2 style="margin: 5px 0;">כרטיס תלמיד</h2>
      <p><b>שם:</b> ${student.name}</p>
      <p><b>ת"ז:</b> ${student.id}</p>
      <p><b>כיתה:</b> ${student.classroom} | <b>בי"ס:</b> ${student.school}</p>

      ${(booksStillBorrowed.length > 0 || studentUnpaidCharges.length > 0)
      ? `
          ${booksStillBorrowed.length > 0 ? `
            <h4 style="margin-top: 15px;">ספרים שטרם הוחזרו:</h4>
            <ul style="text-align: right; font-size: 14px;">
              ${booksStillBorrowed.map(txt => `<li>${txt}</li>`).join('')}
            </ul>
          ` : ''}
          ${studentUnpaidCharges.length > 0 ? `
            <h4 style="margin-top: 15px;">ספרים שחויבו (לא שולם):</h4>
            <ul style="text-align: right; font-size: 14px; color:red;">
              ${studentUnpaidCharges.map(c => `<li>${c.bookName} (${c.type || '---'})</li>`).join('')}
            </ul>
          ` : ''}
        `
      : `<p style="margin-top: 15px; font-size: 16px; color: green;"><b>החזיר/ה הכל</b></p>`
    }
    </div>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>כרטיס תלמיד</title>
      <style>
        @media print {
          body { width: 105mm; height: 148mm; margin: 0; } /* A6 */
        }
      </style>
    </head>
    <body>
      ${content}
      <script>
        window.onload = () => window.print();
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}



async function confirmBulkLend() {
  if (!document.getElementById('bulkConfirmCheckbox').checked)
    return alert("יש לאשר את ההצהרה");

  if (isBulkSignatureEmpty())
    return alert("חתימה נדרשת");

  const selectedBooksArr = Array.from(document.querySelectorAll('#bulkBooksSelect input[type=checkbox]:checked'))
    .map(cb => books.find(b => b.id === cb.value))
    .filter(Boolean);

  if (selectedBooksArr.length === 0) return alert("בחר לפחות ספר אחד");

  const now = new Date().toISOString();
  const signatureData = bulkCanvas.toDataURL();
  let totalAdded = 0;

  for (const student of students) {
    const studentId = String(student.id);
    const booksToAdd = [];

    for (const book of selectedBooksArr) {
      const alreadyBorrowed = borrowed.some(b =>
        b.studentId === studentId &&
        b.bookIds.includes(book.id) &&
        !b.returned[b.bookIds.indexOf(book.id)]
      );
      if (!alreadyBorrowed) booksToAdd.push(book);
    }

    if (booksToAdd.length === 0) continue;

    const newBorrow = {
      id: crypto.randomUUID(),
      student: { ...student },
      studentId,
      bookIds: booksToAdd.map(b => String(b.id)),
      returned: booksToAdd.map(() => false),
      date: now,
      signature: signatureData,
      isBulk: true
    };

    try {
      const res = await fetch('/api/2026/borrowed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...userIdHeader },
        body: JSON.stringify(newBorrow)
      });

      if (!res.ok) throw new Error("שגיאה ביצירת רשומת השאלה מרובה");

      const savedBorrow = await res.json();
      borrowed.push(savedBorrow); // מוסיפים את מה שנשמר בפועל
      totalAdded += booksToAdd.length;
    } catch (err) {
      console.error("❌ confirmBulkLend:", err);
      alert("שגיאה ביצירת השאלה מרובה לשרת");
    }
  }

  if (totalAdded > 0) {
    showSuccess(`הושאלו ${totalAdded} ספרים לתלמידים`);
    document.getElementById('bulkLendModal').style.display = 'none';
    filterBooks();
    renderBookTable();
    renderStudentTable();
    checkLowStock();
  } else {
    alert("לא הושאלו ספרים. ייתכן שכל התלמידים כבר קיבלו את הספרים שנבחרו.");
  }
}



function selectAllCheckboxes(containerId, checked) {
  const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]`);
  checkboxes.forEach(cb => cb.checked = checked);
}
async function deleteFilteredVolunteers() {
  const filtered = getFilteredVolunteers();
  if (filtered.length === 0) {
    alert('לא נמצאו מתנדבים למחיקה');
    return;
  }

  const confirmDelete = confirm(`האם אתה בטוח שברצונך למחוק ${filtered.length} מתנדבים מהמסנן הנוכחי?`);
  if (!confirmDelete) return;

  const idsToDelete = filtered.map(v => v.id).filter(Boolean);

  try {
    const res = await fetch(`/api/2026/volunteers`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...userIdHeader },
      body: JSON.stringify({ ids: idsToDelete }),
    });

    const result = await res.json();
    if (result.success) {
      volunteers = volunteers.filter(v => !idsToDelete.includes(v.id));
      renderVolunteerTable();
      showSuccess(`${result.deletedCount} מתנדבים נמחקו מהשרת בהצלחה`);
    } else {
      throw new Error(result.error || 'שגיאה לא מזוהה');
    }
  } catch (err) {
    console.error('❌ deleteFilteredVolunteers:', err);
    alert('אירעה שגיאה במחיקה');
  }
}


function createExpandableText(fullText, limit = 100) {
  if (!fullText || fullText.length <= limit) return `${fullText}`;

  const sanitizedFullText = fullText.replace(/\n/g, '<br>').replace(/\s+/g, ' ').trim(); // המרה לשורות במקום שורות פיזיות
  const sanitizedShortText = sanitizedFullText.slice(0, limit);

  const id = 'txt_' + crypto.randomUUID();

  return `
    <div style="display: inline;">
      <span id="${id}_short">
        ${sanitizedShortText}...
        <span class="toggle-link" data-id="${id}" data-full="${sanitizedFullText.replace(/"/g, '&quot;')}" onclick="toggleExpandFromElement(this)">הצג עוד</span>
      </span>
      <span id="${id}_full" style="display:none;">
        ${sanitizedFullText}
        <span class="toggle-link" data-id="${id}" onclick="toggleCollapseFromElement(this)">הסתר</span>
      </span>
    </div>
  `;
}

function toggleExpandFromElement(el) {
  const id = el.dataset.id;
  document.getElementById(id + '_short').style.display = 'none';
  document.getElementById(id + '_full').style.display = 'inline';
}

function toggleCollapseFromElement(el) {
  const id = el.dataset.id;
  document.getElementById(id + '_short').style.display = 'inline';
  document.getElementById(id + '_full').style.display = 'none';
}


function toggleExpand(el) {
  const container = el.closest('.expandable-text');
  container.querySelector('.short-text')?.classList.remove('visible');
  container.querySelector('.full-text')?.classList.add('visible');
}

function toggleCollapse(el) {
  const container = el.closest('.expandable-text');
  container.querySelector('.full-text')?.classList.remove('visible');
  container.querySelector('.short-text')?.classList.add('visible');
}

function renderStudentTable(page = currentStudentPage) {
  currentStudentPage = page;

  const tbody = document.querySelector('#studentTable tbody');
  tbody.innerHTML = '';

  const filteredStudents = getFilteredStudents();
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  if (page > totalPages) currentStudentPage = 1;

  const pagedStudents = filteredStudents.slice((currentStudentPage - 1) * ITEMS_PER_PAGE, currentStudentPage * ITEMS_PER_PAGE);

  pagedStudents.forEach((s) => {
    // --- בונים טיימליין ---
    let events = [];

    borrowed
      .filter(b => b.studentId === s.id)
      .forEach(b => {
        b.bookIds.forEach((bookId) => {
          const book = books.find(bk => bk.id === bookId);
          if (!book) return;
          events.push({
            type: "borrow",
            book,
            date: new Date(b.date),
            borrowId: b.id
          });
        });
      });

    returned
      .filter(r => (r.student?.id === s.id || r.studentId === s.id))
      .forEach(r => {
        let bookObj = r.book;
        if (!bookObj?.id && (r.bookId || typeof bookObj === "string")) {
          const bookId = r.bookId || bookObj;
          bookObj = books.find(bk => bk.id === bookId) || {};
        }
        events.push({
          type: "return",
          book: bookObj,
          date: new Date(r.returnDate),
          borrowId: r.id
        });
      });

    events.sort((a, b) => a.date - b.date);

    // --- קובעים סטטוס אחרון של כל ספר ---
    const activeBorrows = new Map();

    events.forEach(ev => {
      const bookId = ev.book?.id;
      if (!bookId) return;

      if (ev.type === "borrow") {
        activeBorrows.set(bookId, ev); // מושאל כעת
      } else if (ev.type === "return") {
        if (activeBorrows.has(bookId)) {
          activeBorrows.delete(bookId); // הוחזר → כבר לא פעיל
        }
      }
    });

    // --- רשימת הספרים המושאלים כרגע ---
    const borrowedBooks = Array.from(activeBorrows.values()).map(ev => {
      return `${ev.book.name} (${ev.book.subject}, כרך ${ev.book.volume})`;
    });

    const borrowedListText = borrowedBooks.length > 0
      ? borrowedBooks.join('\n')
      : "החזיר הכל";
    const borrowedListHTML = createExpandableText(borrowedListText, 50);

    const nameStyleColor = s.inLoanProject ? 'green' : 'red';

    // זמנים של השאלות
    const seenBulkIds = new Set();
    const borrowTimes = borrowed
      .filter(b => b.studentId === s.id)
      .filter(b => {
        if (b.bulkId && seenBulkIds.has(b.bulkId)) return false;
        if (b.bulkId) {
          seenBulkIds.add(b.bulkId);
          return true;
        }
        return true;
      })
      .map(b => new Date(b.date).toLocaleString('he-IL'));

    const borrowTimesText = borrowTimes.length > 0 ? borrowTimes.join('<br>') : 'אין השאלות';

    // זמנים של החזרות
    const seenReturnBulkIds = new Set();
    const returnTimes = returned
      .filter(r => (r.student?.id === s.id || r.studentId === s.id))
      .filter(r => {
        if (r.bulkId && seenReturnBulkIds.has(r.bulkId)) return false;
        if (r.bulkId) {
          seenReturnBulkIds.add(r.bulkId);
          return true;
        }
        return true;
      })
      .map(r => r.returnDate ? new Date(r.returnDate).toLocaleString('he-IL') : '---');

    const returnTimesText = returnTimes.length > 0 ? returnTimes.join('<br>') : 'אין החזרות';

    const studentCharges = charges.filter(c => c.studentId === s.id);
    const unpaidCharges = studentCharges.filter(c => !c.paid);
    const totalDebt = unpaidCharges.length * 50;

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #ddd';

    tr.innerHTML = `
  <td style="padding: 10px; max-width: 180px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${nameStyleColor}; vertical-align: top;" title="${s.name}">${s.name}</td>
  <td style="padding: 10px; min-width: 100px; text-align: center; vertical-align: top;">${s.id}</td>
  <td style="padding: 10px; min-width: 60px; text-align: center; vertical-align: top;">${s.classroom}</td>
  <td style="padding: 10px; min-width: 100px; text-align: center; vertical-align: top;">${s.school}</td>
  <td style="padding: 10px; min-width: 80px; text-align: center; vertical-align: top;">${totalDebt > 0 ? totalDebt + ' ש"ח' : 'ללא'}</td>
  <td class="borrowed-books-cell" style="vertical-align: top; padding: 10px; text-align: center;">
    ${borrowedListHTML}
  </td>
  <td style="padding: 10px; min-width: 180px; text-align: center; vertical-align: top;">${borrowTimesText}</td>
  <td style="padding: 10px; min-width: 180px; text-align: center; vertical-align: top;">${returnTimesText}</td>
  <td class="notes-column" style="vertical-align: top; padding: 10px; text-align: center;">
    ${s.note ? createExpandableText(s.note, 19) : ''}
  </td>
  <td class="actions-column" style="padding: 0; text-align: center; vertical-align: middle;">
    <div class="actions-container">
      <button onclick="editStudentById('${s.id}');" title="עריכת פרטי תלמיד"><i class="fas fa-pencil"></i></button>
      <button onclick="exportStudentById('${s.id}')" title="ייצא פרטי תלמיד"><i class="fas fa-download"></i></button>
      <button onclick="viewStudentById('${s.id}')" title="צפייה בפרטי התלמיד"><i class="fas fa-eye"></i></button>
      ${totalDebt > 0 ? `<button onclick="clearStudentDebtById('${s.id}')" title="ניקוי חוב התלמיד"><i class="fas fa-dollar-sign"></i></button>` : ''}
      <button class="deleteBtn" onclick="deleteStudentById('${s.id}')" title="מחק תלמיד"><i class="fas fa-trash"></i></button>
    </div>
  </td>
`;

    tbody.appendChild(tr);
  });

  renderStudentPagination(totalPages);

  const countElement = document.getElementById('studentTableCount');
  if (countElement) {
    countElement.textContent = `סך הכל: ${filteredStudents.length} תלמידים`;
  }
}


let selectedBooksTags = new Set();

function renderBookTags() {
  const container = document.getElementById('bookTagsContainer');
  const searchValue = document.getElementById('bookFilterInput').value.toLowerCase();
  container.innerHTML = '';

  // תגית "החזיר הכל"
  const returnedAllTag = document.createElement('div');
  returnedAllTag.textContent = 'החזיר הכל';
  returnedAllTag.className = 'book-tag';
  returnedAllTag.style = `
    padding: 5px 10px;
    border-radius: 15px;
    border: 1px solid ${selectedBooksTags.has('החזיר הכל') ? '#dc3545' : '#ccc'};
    background: ${selectedBooksTags.has('החזיר הכל') ? '#dc3545' : '#f8f9fa'};
    color: ${selectedBooksTags.has('החזיר הכל') ? 'white' : 'black'};
    font-weight: bold;
    cursor: pointer;
  `;

  // הוספת אירוע לחיצה
  returnedAllTag.onclick = () => {
    if (selectedBooksTags.has('החזיר הכל')) {
      selectedBooksTags.delete('החזיר הכל');
    } else {
      // בוחרים רק את 'החזיר הכל' - מנקים תגיות אחרות
      selectedBooksTags.clear();
      selectedBooksTags.add('החזיר הכל');
    }
    renderBookTags();
    renderStudentTable();
  };

  container.appendChild(returnedAllTag);

  // תגיות רגילות
  books
    .filter(book => (book.name || '').toLowerCase().includes(searchValue))
    .forEach(book => {
      const label = `${book.name} (${book.subject}, כרך ${book.volume})`;
      const tag = document.createElement('div');
      tag.textContent = label;
      tag.className = 'book-tag';
      tag.style = `
        padding: 5px 10px;
        border-radius: 15px;
        border: 1px solid ${selectedBooksTags.has(label) ? '#007bff' : '#ccc'};
        background: ${selectedBooksTags.has(label) ? '#007bff' : '#f1f1f1'};
        color: ${selectedBooksTags.has(label) ? 'white' : 'black'};
        cursor: pointer;
      `;
      tag.onclick = () => {
        if (selectedBooksTags.has(label)) {
          selectedBooksTags.delete(label);
        } else {
          selectedBooksTags.delete('החזיר הכל'); // אם בוחרים תגית רגילה, מבטלים 'החזיר הכל'
          selectedBooksTags.add(label);
        }
        renderBookTags();
        renderStudentTable();
      };
      container.appendChild(tag);
    });
}




document.getElementById('bookFilterInput').addEventListener('input', renderBookTags);

// קריאה ראשונית
renderBookTags();

function getFilteredStudents() {
  const search = document.getElementById('studentTableSearch').value.toLowerCase().trim();
  const searchWords = search.split(/\s+/).filter(Boolean);
  const majorSearch = document.getElementById('majorSearch')?.value.toLowerCase().trim() || '';
  const filterGrade = document.getElementById('filterGrade').value;
  const filterClassroom = document.getElementById('filterClassroom').value.toLowerCase();
  const filterSubject = document.getElementById('filterSubject').value.toLowerCase();
  const filterLevel = document.getElementById('filterLevel').value;
  const filterInLoanProject = document.getElementById('filterInLoanProject')?.value || '';

  const knownMajors = [
    'כימיה', 'פיזיקה', 'ביולוגיה', 'מדעי המחשב', 'הנדסת תוכנה',
    'מוזיקה', 'היסטוריה מוגבר', 'תנ"ך מוגבר', 'סוציולוגיה',
    'גיאוגרפיה', 'חשבונאות', 'ניהול עסקי', 'ערבית (מגמה)', 'דיפלומטיה',
    'עמ"ט', 'מב"ר', 'נחשון', 'חינוך מיוחד'
  ];

  return students.filter(s => {
    const values = [s.name, s.id, s.classroom, s.school, s.note].map(v => (v || '').toLowerCase());

    const passSearch = searchWords.length === 0 || searchWords.every(word =>
      values.some(v => v.includes(word))
    );

    const passGrade = !filterGrade || (() => {
      if (!s.classroom) return false;
      const regex = new RegExp(`^${filterGrade}[0-9]*$`, 'i');
      return regex.test(s.classroom);
    })();

    const passClassroom = !filterClassroom || (s.classroom || '').toLowerCase() === filterClassroom;

    const hasMatchingBook = borrowed.some(b => {
      if (!b || b.studentId !== s.id || !Array.isArray(b.bookIds) || !Array.isArray(b.returned)) return false;

      return b.bookIds.some((bookId, idx) => {
        const isReturned = b.returned[idx];
        const isPaidCharge = charges.some(c =>
          c.studentId === s.id && c.bookId === bookId && c.borrowId === b.id && c.paid
        );
        if (isReturned || isPaidCharge) return false;

        const book = books.find(bk => bk.id === bookId);
        if (!book) return false;

        const subjectMatch = !filterSubject || (book.subject || '').toLowerCase().includes(filterSubject);
        const normalize = str => (str || '').trim();

        const levelGroups = {
          "הקבצה א": ["הקבצה א", "הקבצה א ו-א מואצת"],
          "הקבצה א מואצת": ["הקבצה א מואצת", "הקבצה א ו-א מואצת"],
          "הקבצה א ו-א מואצת": ["הקבצה א", "הקבצה א מואצת", "הקבצה א ו-א מואצת"]
        };

        let levelMatch = true;
        if (filterLevel !== '') {
          const selectedGroup = levelGroups[normalize(filterLevel)] || [normalize(filterLevel)];
          levelMatch = selectedGroup.includes(normalize(book.level));
        }

        return subjectMatch && levelMatch;
      });
    });

    const passSubjectAndLevel = (!filterSubject && !filterLevel) || hasMatchingBook;

    const passInLoanProject =
      filterInLoanProject === '' ||
      (filterInLoanProject === 'true' && s.inLoanProject === true) ||
      (filterInLoanProject === 'false' && s.inLoanProject === false);

    const passMajorSearch =
      majorSearch === '' ||
      knownMajors.some(major =>
        major.toLowerCase().includes(majorSearch) &&
        (s.note || '').toLowerCase().includes(major.toLowerCase())
      );

    // ✨ תמיכה בתגיות ספרים
    const passSelectedBooks = selectedBooksTags.size === 0 || (() => {
      // אם נבחרה תגית 'החזיר הכל' בלבד
      if (selectedBooksTags.has('החזיר הכל') && selectedBooksTags.size === 1) {
        const studentBorrows = borrowed.filter(b => b.studentId === s.id);

        if (studentBorrows.length === 0) return true;

        const allReturnedOrPaid = studentBorrows.every(b => {
          if (!Array.isArray(b.bookIds) || b.bookIds.length === 0) return true;

          return b.bookIds.every((bookId, idx) => {
            const isReturned = Array.isArray(b.returned) ? b.returned[idx] : false;
            const isPaid = charges.some(c =>
              c.studentId === s.id &&
              c.bookId === bookId &&
              c.borrowId === b.id &&
              c.paid
            );
            return isReturned || isPaid;
          });
        });

        return allReturnedOrPaid;
      }

      // אחרת – סינון לפי תגיות ספרים רגילות
      const activeBookNames = borrowed
        .filter(b => b.studentId === s.id)
        .flatMap(b =>
          b.bookIds?.map((bookId, idx) => {
            const isReturned = b.returned?.[idx];
            const isCharged = charges.some(c =>
              c.studentId === s.id && c.bookId === bookId && c.borrowId === b.id
            );
            const isPaid = charges.some(c =>
              c.studentId === s.id && c.bookId === bookId && c.borrowId === b.id && c.paid
            );
            if (isReturned || isCharged || isPaid) return null;

            const book = books.find(bk => bk.id === bookId);
            if (!book) return null;

            return `${book.name} (${book.subject}, כרך ${book.volume})`;
          }).filter(Boolean) || []
        );

      return [...selectedBooksTags].every(tag => activeBookNames.includes(tag));
    })();

    return (
      passSearch &&
      passGrade &&
      passClassroom &&
      passSubjectAndLevel &&
      passInLoanProject &&
      passMajorSearch &&
      passSelectedBooks
    );
  });
}




function editStudentById(id) {
  const index = students.findIndex(s => s.id === id);
  if (index !== -1) editStudent(index);
}
function deleteStudentById(id) {
  const index = students.findIndex(s => s.id === id);
  if (index === -1) {
    console.error(`❌ לא נמצא תלמיד עם ת"ז ${id}`);
    return;
  }
  deleteStudentFromTable(index);
}

function exportFilteredStudents() {
  const year = localStorage.getItem("selectedYear") || 2026;
  const filtered = getFilteredStudents();

  // שולחים רק מזהים לשרת
  const ids = filtered.map(s => s.id);

  fetch(`/api/exportStudents/${year}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  })
    .then(response => {
      if (!response.ok) throw new Error("שגיאה ביצוא התלמידים");
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filtered-students-${year}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => alert(err.message));
}


function exportStudentById(id) {
  const index = students.findIndex(s => s.id === id);
  if (index !== -1) exportSingleStudent(index);
}
function viewStudentById(id) {
  const index = students.findIndex(s => s.id === id);
  if (index !== -1) viewStudentDetails(index);
}
function clearStudentDebtById(id) {
  const student = students.find(s => s.id === id);
  if (student) clearStudentDebt(student.id);
}


let currentVolunteerPage = 1;

function renderVolunteerTable(page = 1) {
  currentVolunteerPage = page || 1;

  const tbody = document.querySelector('#volunteersTable tbody');
  tbody.innerHTML = '';

  const filteredVolunteers = getFilteredVolunteers();

  const totalPages = Math.ceil(filteredVolunteers.length / ITEMS_PER_PAGE);
  if (page > totalPages) currentVolunteerPage = 1;

  const pagedVolunteers = filteredVolunteers.slice(
    (currentVolunteerPage - 1) * ITEMS_PER_PAGE,
    currentVolunteerPage * ITEMS_PER_PAGE
  );

  pagedVolunteers.forEach(v => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #ddd';

    const dates = (v.dates || []).join('<br>');
    const hours = v.totalHours?.toFixed(2) || '0';

    tr.innerHTML = `
      <td style="padding: 10px; text-align: right;">${v.name}</td>
      <td style="padding: 10px; text-align: center;">${v.class}</td>
      <td style="padding: 10px; text-align: center;">${v.school}</td>
      <td style="padding: 10px; text-align: center;">${dates}</td>
      <td style="padding: 10px; text-align: center;">${hours}</td>
      <td style="padding: 10px; text-align: right;">${v.notes || ''}</td>
    `;

    tbody.appendChild(tr);
  });

  renderVolunteerPagination(totalPages);

  const countElement = document.getElementById('volunteersTableCount');
  if (countElement) {
    countElement.textContent = `סך הכל: ${filteredVolunteers.length} מתנדבים`;
  }
}


function getFilteredVolunteers() {
  return volunteers
}

function renderVolunteerPagination(totalPages) {
  let container = document.getElementById('volunteerPagination');
  if (!container) {
    container = document.createElement('div');
    container.id = 'volunteerPagination';
    container.style.marginTop = '10px';
    container.style.textAlign = 'center';
    document.getElementById('volunteersTable').parentNode.insertBefore(container, document.getElementById('volunteersTable').nextSibling);
  }
  container.innerHTML = '';

  const createButton = (text, page, disabled = false, active = false) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.disabled = disabled;
    btn.classList.toggle('active', active);
    btn.style.margin = '0 3px';
    btn.style.minWidth = '30px';
    btn.style.cursor = disabled ? 'default' : 'pointer';
    if (!disabled) {
      btn.onclick = () => renderVolunteerTable(page);
    }
    return btn;
  };

  const createDots = () => {
    const span = document.createElement('span');
    span.textContent = '...';
    span.style.margin = '0 5px';
    span.style.userSelect = 'none';
    return span;
  };

  const maxVisible = 11;
  let start = Math.max(1, currentVolunteerPage - 5);
  let end = Math.min(totalPages, currentVolunteerPage + 5);

  if (currentVolunteerPage <= 6) {
    start = 1;
    end = Math.min(totalPages, maxVisible);
  } else if (currentVolunteerPage + 5 >= totalPages) {
    start = Math.max(1, totalPages - maxVisible + 1);
    end = totalPages;
  }

  container.appendChild(createButton('<<', 1, currentVolunteerPage === 1));

  if (start > 2) {
    container.appendChild(createButton('1', 1));
    container.appendChild(createDots());
  } else if (start === 2) {
    container.appendChild(createButton('1', 1));
  }

  for (let i = start; i <= end; i++) {
    container.appendChild(createButton(i, i, i === currentVolunteerPage, i === currentVolunteerPage));
  }

  if (end < totalPages - 1) {
    container.appendChild(createDots());
    container.appendChild(createButton(totalPages, totalPages));
  } else if (end === totalPages - 1) {
    container.appendChild(createButton(totalPages, totalPages));
  }

  container.appendChild(createButton('>>', totalPages, currentVolunteerPage === totalPages));
}

function renderStudentPagination(totalPages) {
  let paginationContainer = document.getElementById('studentPagination');
  if (!paginationContainer) {
    paginationContainer = document.createElement('div');
    paginationContainer.id = 'studentPagination';
    paginationContainer.style.marginTop = '10px';
    paginationContainer.style.textAlign = 'center';
    document.getElementById('studentTable').parentNode.insertBefore(paginationContainer, document.getElementById('studentTable').nextSibling);
  }
  paginationContainer.innerHTML = '';

  const createButton = (text, page, disabled = false, active = false) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.disabled = disabled;
    btn.classList.toggle('active', active);
    btn.style.margin = '0 3px';
    btn.style.minWidth = '30px';
    btn.style.cursor = disabled ? 'default' : 'pointer';
    if (!disabled) {
      btn.onclick = () => renderStudentTable(page);
    }
    return btn;
  };

  // עזר לחצנים של נקודות ...
  const createDots = () => {
    const span = document.createElement('span');
    span.textContent = '...';
    span.style.margin = '0 5px';
    span.style.userSelect = 'none';
    return span;
  };

  const maxVisibleButtons = 11; // מקסימום כפתורים שיוצגו כולל הראשון והאחרון
  let startPage = Math.max(1, currentStudentPage - 5);
  let endPage = Math.min(totalPages, currentStudentPage + 5);

  // התאם את הטווח אם אנחנו קרובים להתחלה או לסוף
  if (currentStudentPage <= 6) {
    startPage = 1;
    endPage = Math.min(totalPages, maxVisibleButtons);
  } else if (currentStudentPage + 5 >= totalPages) {
    startPage = Math.max(1, totalPages - maxVisibleButtons + 1);
    endPage = totalPages;
  }

  // כפתור לראשון
  paginationContainer.appendChild(createButton('<<', 1, currentStudentPage === 1));

  // נקודות לפני הטווח אם צריך
  if (startPage > 2) {
    paginationContainer.appendChild(createButton('1', 1));
    paginationContainer.appendChild(createDots());
  } else if (startPage === 2) {
    paginationContainer.appendChild(createButton('1', 1));
  }

  // כפתורים לטווח הדינמי
  for (let i = startPage; i <= endPage; i++) {
    paginationContainer.appendChild(createButton(i, i, i === currentStudentPage, i === currentStudentPage));
  }

  // נקודות אחרי הטווח אם צריך
  if (endPage < totalPages - 1) {
    paginationContainer.appendChild(createDots());
    paginationContainer.appendChild(createButton(totalPages, totalPages));
  } else if (endPage === totalPages - 1) {
    paginationContainer.appendChild(createButton(totalPages, totalPages));
  }

  // כפתור לאחרון
  paginationContainer.appendChild(createButton('>>', totalPages, currentStudentPage === totalPages));
}



const tbody = document.querySelector('#studentTable tbody');
const search = document.getElementById('studentTableSearch').value.toLowerCase();
tbody.innerHTML = '';

const filterGrade = document.getElementById('filterGrade').value;
const filterClassroom = document.getElementById('filterClassroom').value.toLowerCase();
const filterSubject = document.getElementById('filterSubject').value.toLowerCase();
const filterLevel = document.getElementById('filterLevel').value;

students.forEach((s, i) => {
  const values = [s.name, s.id, s.classroom, s.school];

  const hasMatchingBook = borrowed.some(b => {
    if (b.student.id !== s.id) return false;

    const subjectMatch = !filterSubject || (b.book.subject || '').toLowerCase().trim().includes(filterSubject.trim());
    const levelMatch =
      !filterLevel ||
      b.book.level === filterLevel ||
      (!b.book.level && filterLevel === '') ||
      (b.book.level === 'כללי' && filterLevel === '');

    return subjectMatch && levelMatch;
  });

  const passSearch = values.some(v => (v || '').toLowerCase().includes(search)) || search === '';
  const passGrade = !filterGrade || s.classroom?.startsWith(filterGrade);
  const passClassroom = !filterClassroom || (s.classroom || '').toLowerCase() === filterClassroom;
  const passSubjectAndLevel = (!filterSubject && !filterLevel) || hasMatchingBook;

  if (passSearch && passGrade && passClassroom && passSubjectAndLevel) {
    const tr = document.createElement('tr');

    const borrowedBooks = borrowed
      .filter(b => b.student.id === s.id && !returned.some(r => r.id === b.id))
      .map(b => `${b.book.name} (${b.book.subject})`);

    const borrowedText = borrowedBooks.length > 0 ? borrowedBooks.join(', ') : "החזיר הכל";

    // ✅ תיקון: לא מציגים תאריכים כפולים באותה השאלה מרוכזת (bulkId)
    const seenBulkIds = new Set();
    const borrowTimes = borrowed
      .filter(b => b.student.id === s.id)
      .filter(b => {
        if (b.bulkId && seenBulkIds.has(b.bulkId)) return false;
        if (b.bulkId) {
          seenBulkIds.add(b.bulkId);
          return true;
        }
        return true; // הצג גם אם אין bulkId
      })
      .map(b => new Date(b.date).toLocaleString('he-IL'));

    const borrowTimesText = borrowTimes.length > 0 ? borrowTimes.join('<br>') : 'אין השאלות';

    const seenReturnBulkIds = new Set();
    const returnTimes = returned
      .filter(r => r.student.id === s.id)
      .filter(r => {
        if (r.bulkId && seenReturnBulkIds.has(r.bulkId)) return false;
        if (r.bulkId) {
          seenReturnBulkIds.add(r.bulkId);
          return true;
        }
        return true; // הצג גם אם אין bulkId
      })
      .map(r => new Date(r.returnDate).toLocaleString('he-IL'));


    const returnTimesText = returnTimes.length > 0 ? returnTimes.join('<br>') : 'אין החזרות';

    tr.innerHTML = `
<td style="padding: 10px; max-width: 180px; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${s.name}">${s.name}</td>
<td style="padding: 10px; min-width: 100px; text-align: center;">${s.id}</td>
<td style="padding: 10px; min-width: 60px; text-align: center;">${s.classroom}</td>
<td style="padding: 10px; min-width: 100px; text-align: center;">${s.school}</td>
<td style="padding: 10px; max-width: 200px; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${borrowedText}">${borrowedText}</td>
<td style="padding: 10px; min-width: 180px; text-align: center;">${borrowTimesText}</td>
<td style="padding: 10px; min-width: 180px; text-align: center;">${returnTimesText}</td>
<td style="padding: 10px; text-align: center;">
  <button onclick="selectStudent(${i}); scrollToSection('borrowSection')">השאל</button>
  <button onclick="selectStudent(${i}); scrollToSection('borrowSection')">החזר</button>
  <button onclick="deleteStudentFromTable(${i})">מחק</button>
  <button onclick="exportSingleStudent(${i})">ייצא</button>
  <button onclick="viewStudentDetails(${i})">צפייה</button>
</td>
      `;
    tr.style.borderBottom = '1px solid #ddd';
    tbody.appendChild(tr);
  }
});
function exportSingleStudent(index) {
  //
  const student = students[index];
  if (!student) return;

  // ספרים שחויבו ולא שולמו
  const unpaidCharges = charges.filter(c => c.studentId === student.id && !c.paid);
  const chargedBorrowIds = new Set(unpaidCharges.map(c => c.borrowId));
  const totalDebt = unpaidCharges.length * 50;

  // ספרים מושאלים (לא הוחזרו ולא חויבו)
  const borrowedBooks = borrowed
    .filter(b => b.studentId === student.id && Array.isArray(b.bookIds) && Array.isArray(b.returned))
    .flatMap(b =>
      b.bookIds.map((bookId, idx) => {
        if (b.returned[idx]) return null;              // כבר הוחזר
        if (chargedBorrowIds.has(b.id)) return null;  // חויב → לא נחשב "מושאל"
        const book = books.find(bk => bk.id === bookId);
        if (!book) return null;
        return `${book.name} (${book.subject})`;
      }).filter(Boolean)
    ).join(', ') || "אין";

  // ספרים שחויבו
  const chargedBooks = unpaidCharges.map(c => `${c.bookName} (${c.type})`).join(', ') || "אין";

  // כותרות
  const headers = [
    "שם מלא",
    "תעודת זהות",
    "בית ספר",
    "כיתה",
    "משתתף בפרויקט השאלת ספרים",
    "ספרים מושאלים",
    "ספרים שחויבו",
    "חוב כולל (₪)"
  ];

  // שורה אחת עם כל הנתונים
  const row = [
    student.name,
    student.id,
    student.school,
    student.classroom,
    student.inLoanProject ? "כן" : "לא",
    borrowedBooks,
    chargedBooks,
    totalDebt > 0 ? totalDebt : "0"
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, row]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'תלמיד');
  XLSX.writeFile(wb, `student_${student.id}.xlsx`);
}


function exportStyledBooksToExcel() {
  const filteredBooks = getFilteredBooks(); // ספרים מסוננים לפי הפילטרים בטבלה
  const ws_data = [
    ["שם", "מקצוע", "שכבה", "רמה", "כרך", "הוצאה", "סוג", "מחיר", "הערות"]
  ];

  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  filteredBooks.forEach((book, i) => {
    const rowIndex = i + 1;
    const row = [
      book.name,
      book.subject,
      book.grade || '',
      book.level,
      book.volume,
      book.publisher,
      book.type,
      book.price || '',
      book.note || ''
    ];

    XLSX.utils.sheet_add_aoa(ws, [row], { origin: -1 });

    // צבע רקע צהוב לתא הערות אם יש הערה
    if (book.note) {
      const cellRef = `I${rowIndex + 1}`;
      if (!ws[cellRef]) ws[cellRef] = { t: "s", v: book.note };
      ws[cellRef].s = {
        fill: { fgColor: { rgb: "FFFACD" } }, // light yellow
      };

      // הוספת הערה לתא
      ws[cellRef].c = [{ a: "המערכת", t: book.note }];
    }
  });

  // גבולות פשוטים לעמודות הראשיות (כותרת + שורות)
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = { r: R, c: C };
      const cell_ref = XLSX.utils.encode_cell(cell_address);
      if (!ws[cell_ref]) continue;
      if (!ws[cell_ref].s) ws[cell_ref].s = {};
      ws[cell_ref].s.border = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ספרים מסוננים");

  XLSX.writeFile(wb, "ספרים.xlsx", { bookType: "xlsx", cellStyles: true });
}


function exportFilteredBooks() {
  const search = document.getElementById('bookTableSearch').value.trim();
  const selectedLevel = document.getElementById('bookLevelFilter').value;
  const selectedVolume = document.getElementById('bookVolumeFilter').value;
  const selectedPublisher = document.getElementById('bookPublisherFilter').value.trim();
  const selectedType = document.getElementById('bookTypeFilter').value;
  const selectedGrade = document.getElementById('gradeFilter')?.value || '';

  const stockMinRaw = document.getElementById('stockMinInput')?.value;
  const stockMaxRaw = document.getElementById('stockMaxInput')?.value;
  const stockMin = stockMinRaw !== '' ? stockMinRaw : undefined;
  const stockMax = stockMaxRaw !== '' ? stockMaxRaw : undefined;

  const params = new URLSearchParams({
    year: 2026, // או לקרוא לפונקציה שמחזירה את השנה הנבחרת
    search,
    level: selectedLevel,
    volume: selectedVolume,
    publisher: selectedPublisher,
    type: selectedType,
    grade: selectedGrade
  });

  // נצרף גם את stockMin ו-stockMax אם קיימים
  if (stockMin !== undefined) params.append('stockMin', stockMin);
  if (stockMax !== undefined) params.append('stockMax', stockMax);

  window.open(`/api/exportBooks?${params.toString()}`);
}



function renderBookTable(page) {

  if (page !== undefined) {
    currentBookPage = page;
  }

  const table = document.getElementById('bookTable');
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');

  const search = document.getElementById('bookTableSearch').value.toLowerCase();
  const selectedLevel = document.getElementById('bookLevelFilter').value;
  const selectedVolume = document.getElementById('bookVolumeFilter').value;
  const selectedPublisher = document.getElementById('bookPublisherFilter').value.toLowerCase();
  const selectedType = document.getElementById('bookTypeFilter').value;
  const selectedGrade = document.getElementById('gradeFilter')?.value || '';

  const stockMinRaw = document.getElementById('stockMinInput')?.value;
  const stockMaxRaw = document.getElementById('stockMaxInput')?.value;
  const stockMin = stockMinRaw !== '' ? parseInt(stockMinRaw, 10) : null;
  const stockMax = stockMaxRaw !== '' ? parseInt(stockMaxRaw, 10) : null;

  const normalize = str => (str || '').trim();

  const levelGroups = {
    "הקבצה א": ["הקבצה א", "הקבצה א ו-א מואצת"],
    "הקבצה א מואצת": ["הקבצה א מואצת", "הקבצה א ו-א מואצת"],
    "הקבצה א ו-א מואצת": ["הקבצה א", "הקבצה א מואצת", "הקבצה א ו-א מואצת"]
  };

  const gradeGroups = {
    high: ["י", "יא", "יב"],
    mid: ["ז", "ח", "ט"]
  };

  thead.innerHTML = `
    <tr>
      <th>שם הספר</th>
      <th>מקצוע</th>
      <th>שכבת גיל</th>
      <th>רמת לימוד</th>
      <th>כרך</th>
      <th>שם הוצאה</th>
      <th>סוג</th>
      <th>הערות</th>
      <th>מחיר</th>
      <th>כמות במלאי</th>
      <th>פעולות</th>
    </tr>
  `;

  tbody.innerHTML = '';

  const filteredBooks = books.filter(b => {
    const values = [
      b.name,
      b.subject,
      b.grade,
      b.level,
      b.volume,
      b.publisher,
      b.type,
      b.note,
      b.price
    ].map(x => (x || '').toLowerCase());

    const matchesSearch = values.some(v => v.includes(search)) || search === '';

    let matchesLevel = true;
    if (selectedLevel !== '') {
      const selectedGroup = levelGroups[normalize(selectedLevel)] || [normalize(selectedLevel)];
      matchesLevel = selectedGroup.includes(normalize(b.level));
    }

    const matchesVolume = !selectedVolume || b.volume === selectedVolume;
    const matchesPublisher = !selectedPublisher || (b.publisher || '').toLowerCase().includes(selectedPublisher);
    const matchesType = !selectedType || b.type === selectedType;

    let matchesGrade = true;
    if (selectedGrade && selectedGrade !== 'all') {
      const allowedGrades = gradeGroups[selectedGrade] || [selectedGrade];
      const bookGrades = (b.grade || '')
        .split(',')
        .map(g => g.trim().replace(/[״"׳']/g, ''));
      matchesGrade = bookGrades.some(g => allowedGrades.includes(g));
    }

    const stockCount = parseInt(b.stockCount || '0');
    let matchesStock = true;
    if (stockMin !== null && stockMax !== null) {
      matchesStock = stockCount >= stockMin && stockCount <= stockMax;
    } else if (stockMin !== null) {
      matchesStock = stockCount >= stockMin;
    } else if (stockMax !== null) {
      matchesStock = stockCount <= stockMax;
    }

    return matchesSearch && matchesLevel && matchesVolume && matchesPublisher && matchesType && matchesGrade && matchesStock;
  });

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
  if (page > totalPages) currentBookPage = 1;

  const pagedBooks = filteredBooks.slice((currentBookPage - 1) * ITEMS_PER_PAGE, currentBookPage * ITEMS_PER_PAGE);

  pagedBooks.forEach(b => {
    const tr = document.createElement('tr');
    const originalIndex = books.findIndex(book => book.id === b.id);

    const stockCount = parseInt(b.stockCount || '0');
    const lowStockClass = stockCount <= 10 ? 'low-stock' : '';

    tr.innerHTML = `
      <td style="padding: 8px; text-align: right; max-width: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        <span class="${lowStockClass}">${b.name}</span>
      </td>
      <td style="padding: 8px; text-align: center; max-width: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.subject}</td>
      <td style="padding: 8px; text-align: center; max-width: 60px;">${b.grade}</td>
      <td style="padding: 8px; text-align: center; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.level || 'כללי'}</td>
      <td style="padding: 8px; text-align: center; max-width: 40px;">${b.volume}</td>
      <td style="padding: 8px; text-align: center; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.publisher}</td>
      <td style="padding: 8px; text-align: center; max-width: 80px;">${b.type}</td>
      <td style="padding: 10px; text-align: center;">
        ${b.note ? createExpandableText(b.note, 100) : ''}
      </td>
      <td style="padding: 8px; text-align: center; max-width: 60px;">${b.price || '50'}</td>
      <td style="padding: 8px; text-align: center; max-width: 60px;">${stockCount}</td>
      <td style="justify-content: center; padding: 8px; text-align: center; display: flex; gap:10px;">
        <button onclick="editBook(${originalIndex})" title="ערוך ספר"><i class="fas fa-pencil"></i></button>
        <button onclick="openAddCopiesModal(${originalIndex})" title="הוסף עותקים לספר"><i class="fas fa-plus"></i></button>
        <button class="deleteBtn" onclick="deleteBookFromTable(${originalIndex})" title="מחק ספר"><i class="fas fa-trash"></i></button>
      </td>
    `;

    tr.style.borderBottom = '1px solid #ddd';
    tbody.appendChild(tr);
  });

  const countElement = document.getElementById('bookTableCount');
  if (countElement) {
    countElement.textContent = `סך הכל: ${filteredBooks.length} ספרים`;
  }

  renderBookPagination(totalPages);
}

function getFilteredBooks() {
  const search = document.getElementById('bookTableSearch').value.toLowerCase();
  const selectedLevel = document.getElementById('bookLevelFilter').value;
  const selectedVolume = document.getElementById('bookVolumeFilter').value;
  const selectedPublisher = document.getElementById('bookPublisherFilter').value.toLowerCase();
  const selectedType = document.getElementById('bookTypeFilter').value;
  const selectedGrade = document.getElementById('gradeFilter')?.value || '';

  const stockMinRaw = document.getElementById('stockMinInput')?.value;
  const stockMaxRaw = document.getElementById('stockMaxInput')?.value;
  const stockMin = stockMinRaw !== '' ? parseInt(stockMinRaw, 10) : null;
  const stockMax = stockMaxRaw !== '' ? parseInt(stockMaxRaw, 10) : null;

  const normalize = str => (str || '').trim();

  const levelGroups = {
    "הקבצה א": ["הקבצה א", "הקבצה א ו-א מואצת"],
    "הקבצה א מואצת": ["הקבצה א מואצת", "הקבצה א ו-א מואצת"],
    "הקבצה א ו-א מואצת": ["הקבצה א", "הקבצה א מואצת", "הקבצה א ו-א מואצת"]
  };

  const gradeGroups = {
    high: ["י", "יא", "יב"],
    mid: ["ז", "ח", "ט"]
  };

  return books.filter(b => {
    const values = [
      b.name,
      b.subject,
      b.grade,
      b.level,
      b.volume,
      b.publisher,
      b.type,
      b.note,
      b.price
    ].map(x => (x || '').toLowerCase());

    const matchesSearch = values.some(v => v.includes(search)) || search === '';

    let matchesLevel = true;
    if (selectedLevel !== '') {
      const selectedGroup = levelGroups[normalize(selectedLevel)] || [normalize(selectedLevel)];
      matchesLevel = selectedGroup.includes(normalize(b.level));
    }

    const matchesVolume = !selectedVolume || b.volume === selectedVolume;
    const matchesPublisher = !selectedPublisher || (b.publisher || '').toLowerCase().includes(selectedPublisher);
    const matchesType = !selectedType || b.type === selectedType;

    let matchesGrade = true;
    if (selectedGrade && selectedGrade !== 'all') {
      const allowedGrades = gradeGroups[selectedGrade] || [selectedGrade];
      const bookGrades = (b.grade || '')
        .split(',')
        .map(g => g.trim().replace(/[״"׳']/g, ''));
      matchesGrade = bookGrades.some(g => allowedGrades.includes(g));
    }

    const stockCount = parseInt(b.stockCount || '0');
    let matchesStock = true;
    if (stockMin !== null && stockMax !== null) {
      matchesStock = stockCount >= stockMin && stockCount <= stockMax;
    } else if (stockMin !== null) {
      matchesStock = stockCount >= stockMin;
    } else if (stockMax !== null) {
      matchesStock = stockCount <= stockMax;
    }

    return matchesSearch && matchesLevel && matchesVolume && matchesPublisher && matchesType && matchesGrade && matchesStock;
  });
}


function renderBookPagination(totalPages) {
  let paginationContainer = document.getElementById('bookPagination');
  if (!paginationContainer) {
    paginationContainer = document.createElement('div');
    paginationContainer.id = 'bookPagination';
    document.getElementById('bookTable').parentNode.insertBefore(paginationContainer, document.getElementById('bookTable').nextSibling);
  }
  paginationContainer.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.classList.toggle('active', i === currentBookPage);
    btn.disabled = (i === currentBookPage);
    btn.onclick = () => renderBookTable(i);
    paginationContainer.appendChild(btn);
  }
}


const toggleBtn = document.getElementById('toggleDarkModeBtn');
toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  toggleBtn.textContent = document.body.classList.contains('dark-mode') ? '☀️ מצב רגיל' : '🌙 מצב כהה';
});


let currentAddCopiesIndex = null;

function openAddCopiesModal(index) {
  currentAddCopiesIndex = index;
  const book = books[index];
  if (!book) return;

  const stock = parseInt(book.stockCount || '0');
  document.getElementById('addCopiesBookName').textContent = `ספר: "${book.name}"`;
  document.getElementById('addCopiesCurrentStock').textContent = `עותקים קיימים במלאי: ${stock}`;
  document.getElementById('addCopiesInput').value = '';
  document.getElementById('addCopiesModal').style.display = 'flex';
}


function closeAddCopiesModal() {
  currentAddCopiesIndex = null;
  document.getElementById('addCopiesModal').style.display = 'none';
}

async function confirmAddCopies() {
  const input = document.getElementById('addCopiesInput');
  const countToAdd = parseInt(input.value, 10);

  if (isNaN(countToAdd) || countToAdd <= 0) {
    alert('נא להזין מספר תקף של עותקים');
    return;
  }

  const book = books[currentAddCopiesIndex];
  if (!book) return alert("❌ לא נמצא ספר לעדכון");

  const currentStock = parseInt(book.stockCount || '0', 10);
  const newStock = currentStock + countToAdd;

  try {
    // ✅ עדכון בשרת
    const res = await fetch(`/api/2026/books/${book.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...userIdHeader },
      body: JSON.stringify({ ...book, stockCount: newStock })
    });

    if (!res.ok) throw new Error("שגיאה בעדכון מלאי בשרת");

    const updatedBook = await res.json();

    // ✅ עדכון מקומי
    books[currentAddCopiesIndex] = updatedBook;

    renderBookTable(currentBookPage);
    closeAddCopiesModal();
    showSuccess(`✔️ נוספו ${countToAdd} עותקים לספר "${book.name}"`);
  } catch (err) {
    console.error("❌ confirmAddCopies:", err);
    alert("אירעה שגיאה בעדכון המלאי");
  }
}


function toggleStockFilter() {
  const container = document.getElementById('stockFilterContainer');
  const button = document.getElementById('toggleStockFilterBtn');

  if (container.style.display === 'none' || container.style.display === '') {
    container.style.display = 'flex';
    button.textContent = '❌ הסתר סינון לפי מלאי';
  } else {
    container.style.display = 'none';
    button.textContent = 'סינון לפי מספר עותקים במלאי';
    document.getElementById('stockMinInput').value = '';
    document.getElementById('stockMaxInput').value = '';
    renderBookTable();
  }
}


function debounce(func, wait = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function initBookTableFilters() {
  const changeFilters = [
    'bookLevelFilter',
    'bookVolumeFilter',
    'bookTypeFilter',
    'gradeFilter'
  ];

  changeFilters.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => renderBookTable(1));
  });

  const searchInput = document.getElementById('bookTableSearch');
  const publisherInput = document.getElementById('bookPublisherFilter');

  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => renderBookTable(1), 300));
  }

  if (publisherInput) {
    publisherInput.addEventListener('input', debounce(() => renderBookTable(1), 300));
  }
}

// קרא לזה לאחר טעינת העמוד או ב-window.onload
window.addEventListener('DOMContentLoaded', initBookTableFilters);

async function deleteBookFromTable(index) {
  if (index < 0 || !books[index]) return;
  const book = books[index];
  if (!confirm(`האם למחוק את הספר "${book.name}"?`)) return;

  try {
    const res = await fetch(`/api/2026/books/${book.id}`, {
      method: 'DELETE',
      headers: { ...userIdHeader }
    });

    if (!res.ok) throw new Error("שגיאה במחיקת ספר");

    books.splice(index, 1);
    borrowed = borrowed.filter(b => !b.bookIds?.includes(book.id));
    returned = returned.filter(r => r.bookId !== book.id);
    charges = charges.filter(c => c.bookId !== book.id);

    renderBookTable();
    filterBooks();
    showSuccess("✔️ ספר נמחק");
  } catch (err) {
    console.error(err);
    alert("שגיאה במחיקת ספר");
  }
}


function selectStudent(index) {
  const sel = document.getElementById('filteredStudentsSelect');
  sel.value = index;
  filterBooks();
  updateReturnBooks(index);
}

function scrollToSection(anchor) {
  const target = document.getElementById('filteredStudentsSelect');
  if (target) {
    const offset = target.getBoundingClientRect().top + window.pageYOffset - 100;
    window.scrollTo({ top: offset, behavior: 'smooth' });
    target.classList.add('blink-highlight');
    setTimeout(() => target.classList.remove('blink-highlight'), 1000);
  }
}

document.getElementById('studentTableSearch').addEventListener('input', renderStudentTable);
document.getElementById('bookTableSearch').addEventListener('input', renderBookTable);

window.addEventListener("DOMContentLoaded", () => {
  loadData().then(() => {
    console.log("✅ נתונים נטענו – מוכן לשימוש");
    // אל תקרא ל-saveData() כאן!
  });
});
renderStudentTable();
renderBookTable();

const userIdHeader = { 'x-user-id': 'some-user-id' };

async function loadData() {
  const loading = document.getElementById('globalLoading');
  loading.style.display = 'flex';
  try {
    // ✅ טען את הסטים מהשרת
    clusters = await fetch(yearKey('clusters'), { headers: userIdHeader }).then(res => res.json());

    // שאר הנתונים כרגיל
    students = await fetch(yearKey('students'), { headers: userIdHeader }).then(res => res.json());
    books = await fetch(yearKey('books'), { headers: userIdHeader }).then(res => res.json());
    borrowed = await fetch(yearKey('borrowed'), { headers: userIdHeader }).then(res => res.json());
    returned = await fetch(yearKey('returned'), { headers: userIdHeader }).then(res => res.json());
    charges = await fetch(yearKey('charges'), { headers: userIdHeader }).then(res => res.json());
    volunteers = await fetch(yearKey('volunteers'), { headers: userIdHeader }).then(res => res.json());

    filterStudents();
    filterBooks();
    renderVolunteerTable?.(); // עם בדיקה שהפונקציה קיימת
    renderClusterTable?.();   // ✅ רנדר של טבלת הסטים אם היא קיימת
  } catch (error) {
    console.error("Error loading data:", error);
  }
  loading.style.display = 'none';
}

async function saveData() {

  if (
    !students.length &&
    !books.length &&
    !borrowed.length &&
    !returned.length &&
    !charges.length &&
    !volunteers.length &&
    !clusters.length // ✅ גם clusters
  ) return;

  try {
    await Promise.all([
      fetch(yearKey('students'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...userIdHeader },
        body: JSON.stringify(students),
      }),
      fetch(yearKey('books'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...userIdHeader },
        body: JSON.stringify(books),
      }),
      fetch(yearKey('borrowed'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...userIdHeader },
        body: JSON.stringify(borrowed),
      }),
      fetch(yearKey('returned'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...userIdHeader },
        body: JSON.stringify(returned),
      }),
      fetch(yearKey('charges'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...userIdHeader },
        body: JSON.stringify(charges),
      }),
      fetch(yearKey('volunteers'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...userIdHeader },
        body: JSON.stringify(volunteers),
      }),
      // ✅ הוספת שמירת clusters
      fetch('/api/2026/clusters', {
        method: 'PUT',  // לא POST
        headers: { 'Content-Type': 'application/json', ...userIdHeader },
        body: JSON.stringify(clusters),
      }),

    ]);
  } catch (error) {
    console.error("Error saving data:", error);
  }
}


function showSuccess(msg) {
  const el = document.getElementById('successMsg');
  el.textContent = "✅ " + msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3000);
}

function isValidIsraeliID(id) {
  // הסרת רווחים ותווים לא מספריים
  id = id.trim();
  if (!/^\d{5,9}$/.test(id)) return false; // חייב להיות בין 5 ל-9 ספרות

  // הוספת אפסים מובילים עד 9 ספרות
  id = id.padStart(9, '0');

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(id.charAt(i), 10);
    let factor = (i % 2) + 1; // 1 או 2 לסירוגין החל מהספרה הראשונה

    let multiplied = digit * factor;
    // אם המכפלה דו-ספרתית, חיבור הספרות (לדוגמה 12 => 1 + 2 = 3)
    if (multiplied > 9) multiplied -= 9;

    sum += multiplied;
  }

  // אם סכום הספרות מתחלק ב-10, התעודה תקינה
  return sum % 10 === 0;
}

async function addStudent() {
  const name = document.getElementById('studentName').value.trim();
  const id = document.getElementById('studentID').value.trim();
  const school = document.getElementById('studentSchool').value;
  const classroom = document.getElementById('studentClass').value.trim();
  let email = document.getElementById('emailField').value.trim();
  const inLoanProjectValue = document.getElementById('studentInLoanProject').value;
  const note = document.getElementById('addNote').value.trim();

  if (!name || !id || !classroom || inLoanProjectValue === '') {
    return alert('נא למלא את כל השדות כולל כתובת דוא"ל והאם משתתף בפרויקט');
  }
  if (!email.includes('@')) email = "non";
  if (!isValidIsraeliID(id)) return alert('תעודת זהות לא תקינה');
  if (students.some(s => s.id === id)) return alert("תלמיד עם תעודת זהות זו כבר קיים במערכת");

  const newStudent = { name, id, school, classroom, email, inLoanProject: inLoanProjectValue === 'true', note };

  try {
    const res = await fetch('/api/2026/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...userIdHeader },
      body: JSON.stringify(newStudent)
    });

    if (!res.ok) throw new Error("שגיאה בהוספה לשרת");

    const saved = await res.json();
    students.push(saved); // עדכון מקומי אחרי הצלחה
    renderStudentTable();
    showSuccess("✔️ תלמיד נוסף");
    filterStudents();
  } catch (err) {
    console.error(err);
    alert("שגיאה בהוספת תלמיד");
  }

  // איפוס טופס
  document.getElementById('studentName').value = '';
  document.getElementById('studentID').value = '';
  document.getElementById('studentClass').value = '';
  document.getElementById('studentInLoanProject').value = '';
  document.getElementById('emailField').value = '';
  document.getElementById('addNote').value = '';
}



function generateRandomIsraeliID() {
  let tries = 0;
  let id;

  do {
    id = String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0');
    tries++;
    if (tries > 1000) {
      alert("לא נמצאה תעודת זהות פנויה אחרי 1000 ניסיונות");
      return;
    }
  } while (!isValidIsraeliID(id) || students.some(s => s.id === id));

  document.getElementById('studentID').value = id;
}


async function loadVolunteers() {
  const year = 2026;
  const res = await fetch(`/api/${year}/volunteers`);
  volunteers = await res.json();
  renderVolunteerTable();
}

async function saveVolunteers() {
  const year = 2026;
  await fetch(`/api/${year}/volunteers`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(volunteers, null, 2),
  });
}

let volunteers = []; // משתנה גלובלי שנשמר בו כל המתנדבים (בדומה ל-students)

async function addVolunteer() {
  const name = document.getElementById('voluneerName').value.trim();
  const school = document.getElementById('volunteerSchool').value;
  const classroom = document.getElementById('volunteerClass').value.trim();
  const date = document.getElementById('voluneerDate').value;
  const start = document.getElementById('volunteerStart').value;
  const end = document.getElementById('volunteerEnd').value;

  if (!name || !classroom || !date || !start || !end) {
    return alert('נא למלא את כל השדות');
  }

  const hours = calculateHours(start, end);
  if (hours <= 0) {
    return alert('שעת התחלה חייבת להיות לפני שעת סיום');
  }

  let volunteer = volunteers.find(v =>
    v.name === name && v.school === school && v.class === classroom
  );

  try {
    if (volunteer) {
      // מתנדב קיים – עדכון בשרת
      volunteer.dates.push(date);
      volunteer.timeRanges.push(`${start} - ${end}`);
      volunteer.totalHours = (volunteer.totalHours || 0) + hours;

      const res = await fetch(`/api/2026/volunteers/${volunteer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...userIdHeader },
        body: JSON.stringify(volunteer)
      });
      if (!res.ok) throw new Error("שגיאה בעדכון מתנדב");
    } else {
      // יצירת מתנדב חדש
      const matchedStudent = students.find(s =>
        s.name === name && s.school === school && s.class === classroom
      );

      const newVolunteer = {
        name,
        school,
        class: classroom,
        dates: [date],
        timeRanges: [`${start} - ${end}`],
        totalHours: hours,
        notes: '',
        id: matchedStudent?.id || crypto.randomUUID()
      };

      const res = await fetch(`/api/2026/volunteers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...userIdHeader },
        body: JSON.stringify(newVolunteer)
      });

      if (!res.ok) throw new Error("שגיאה בהוספת מתנדב");
      const savedVolunteer = await res.json();
      volunteers.push(savedVolunteer);
    }

    renderVolunteerTable();
    showSuccess('תיעוד התנדבות נוסף בהצלחה');

    // איפוס הטופס
    document.getElementById('voluneerName').value = '';
    document.getElementById('volunteerClass').value = '';
    document.getElementById('voluneerDate').value = '';
    document.getElementById('volunteerStart').value = '';
    document.getElementById('volunteerEnd').value = '';

  } catch (err) {
    console.error("❌ addVolunteer:", err);
    alert("שגיאה בשמירת המתנדב בשרת");
  }
}

function calculateHours(start, end) {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const startTime = new Date(0, 0, 0, startH, startM);
  const endTime = new Date(0, 0, 0, endH, endM);

  const diff = (endTime - startTime) / (1000 * 60 * 60); // בשעות
  return Math.max(0, diff);
}

// סט לשמירת ה-IDs של ספרים שכבר התראת עליהם
const alertedBooks = new Set();

function checkLowStock() {
  const lowStockBooks = books.filter(book => book.stockCount <= 10);

  // סינון ספרים שעדיין לא התרעננו עליהם
  const newAlerts = lowStockBooks.filter(book => !alertedBooks.has(book.id));

  if (newAlerts.length > 0) {
    const names = newAlerts.map(b => b.name).join(', ');
    alert(`כמות העותקים של הספרים הבאים נמוכה או שווה ל-10: ${names}`);

    // מסמנים את הספרים האלו כהתרעננו עליהם
    newAlerts.forEach(book => alertedBooks.add(book.id));
  }

  // אופציונלי: אפשר להסיר מהסט ספרים שכעת אין להם עוד כמות נמוכה,
  // כדי לאפשר התרעה מחדש אם המלאי ירד שוב בעתיד:
  alertedBooks.forEach(id => {
    const book = books.find(b => b.id === id);
    if (!book || book.stockCount > 10) {
      alertedBooks.delete(id);
    }
  });
}

async function addBook() {
  const name = document.getElementById('bookName').value.trim();
  const subject = document.getElementById('bookSubject').value.trim();
  const grade = document.getElementById('bookGrade').value.trim();
  const level = document.getElementById('bookLevel').value;
  const volume = document.getElementById('bookVolume').value;
  const publisher = document.getElementById('bookPublisher').value.trim();
  const type = document.getElementById('bookType').value;
  const note = document.getElementById('bookNote')?.value.trim() || '';
  const rawPrice = document.getElementById('bookPrice')?.value.trim() || "50";
  const stockCount = parseInt(document.getElementById('qtySelect')?.value || '1', 10);

  if (!name || !subject || !grade || !level || !volume || !publisher || !type) {
    return alert('נא למלא את כל השדות חובה לספר');
  }
  if (isNaN(stockCount) || stockCount < 1) {
    return alert('כמות המלאי חייבת להיות מספר תקין');
  }

  const newBook = {
    name, subject, grade, level, volume, publisher, type, note,
    price: rawPrice, stockCount
  };

  try {
    const res = await fetch('/api/2026/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...userIdHeader },
      body: JSON.stringify(newBook)
    });

    if (!res.ok) throw new Error("שגיאה בהוספה לשרת");

    const saved = await res.json();
    books.push(saved); // עדכון מקומי
    renderBookTable();
    showSuccess("✔️ ספר נוסף");
    filterBooks();
  } catch (err) {
    console.error(err);
    alert("שגיאה בהוספת ספר");
  }

  // איפוס טופס
  document.getElementById('bookName').value = '';
  document.getElementById('bookSubject').value = '';
  document.getElementById('bookGrade').value = '';
  document.getElementById('bookLevel').value = 'כללי';
  document.getElementById('bookVolume').value = '';
  document.getElementById('bookPublisher').value = '';
  document.getElementById('bookType').value = '';
  document.getElementById('bookNote').value = '';
  document.getElementById('bookPrice').value = '';
  document.getElementById('qtySelect').value = '1';
  document.getElementById('priceWrapper').style.display = 'none';
  tags.clear();
  renderTags();
}


// הצגת שדה המחיר רק כשנבחרה חוברת פנימית
document.getElementById('bookType').addEventListener('change', function () {
  const type = this.value;
  const priceWrapper = document.getElementById('priceWrapper');

  if (type === 'חוברת פנימית') {
    priceWrapper.style.display = 'block';
  } else {
    priceWrapper.style.display = 'none';
    document.getElementById('bookPrice').value = '';
  }
});

function filterStudents() {
  const search = document.getElementById('searchStudentInput').value.toLowerCase().trim();
  const searchWords = search.split(/\s+/).filter(Boolean);
  const select = document.getElementById('filteredStudentsSelect');
  select.innerHTML = '';

  students.forEach((s, i) => {
    const name = (s.name || '').toLowerCase();
    const id = (s.id || '').toLowerCase();
    const classroom = (s.classroom || '').toLowerCase();
    const school = (s.school || '').toLowerCase();
    const note = (s.note || '').toLowerCase();

    let match = false;

    if (!search) {
      match = true;
    } else if (/^[אבגדהוזחטיכלמנסעפצקרשת]+\d?$/.test(search)) {
      if (
        classroom === search ||
        (classroom.startsWith(search) &&
          (classroom.length === search.length || /\d/.test(classroom.charAt(search.length))))
      ) {
        match = true;
      }
    } else {
      match = searchWords.every(word =>
        name.includes(word) ||
        id.includes(word) ||
        school.includes(word) ||
        classroom.includes(word) ||
        note.includes(word)
      );
    }

    if (match) {
      const option = document.createElement('option');
      option.value = i;

      if (s.inLoanProject === false) {
        option.textContent = `❗ ${s.name} - התלמיד אינו בתוכנית ההשאלה!`;
        option.style.backgroundColor = 'red';
      } else if ((s.note || '').includes('לא החזיר ספרים תשפ"ה')) {
        option.textContent = `⚠️ ${s.name} - התלמיד טרם החזיר את כל ספרי תשפ"ה`;
        option.style.backgroundColor = 'orange';
      } else {
        option.textContent = s.name;
      }

      select.appendChild(option);
    }
  });

  if (select.options.length > 0) {
    select.selectedIndex = 0;
  }

  // מאזין לשינוי תלמיד: מאפס את רשימת הספרים שנבחרו ומרענן תצוגה
  select.onchange = () => {
    selectedBooks.clear();
    renderSelectedBooksPreview();
  };

  updateBorrowPurchaseButtons();
  filterBooksBorrow();
}


window.onscroll = function () {
  const btn = document.getElementById('scrollTopBtn');
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
  }
};

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// פונקציה לעדכון כפתורי "השאל" ו"רכישה" לפי סטטוס השתתפות בפרויקט
function updateBorrowPurchaseButtons() {
  const select = document.getElementById('filteredStudentsSelect');
  const selectedIndex = select.value;
  const student = students[selectedIndex];

  const btnBorrow = document.getElementById('btnBorrow');
  const btnPurchase = document.getElementById('btnPurchase');

  if (student && student.inLoanProject) {
    btnBorrow.style.display = 'inline-block';
    btnPurchase.style.display = 'none';
  } else {
    btnBorrow.style.display = 'none';
    btnPurchase.style.display = 'inline-block';
  }
}

// מאזין לשינוי הבחירה ב־select, יעדכן את הכפתורים בזמן אמת
document.getElementById('filteredStudentsSelect').addEventListener('change', () => {
  updateBorrowPurchaseButtons();
  selectedBooks.clear();           // איפוס רשימת הספרים שנבחרו
  renderSelectedBooksPreview();
  filterBooksBorrow();
});

function filterBooks() {
  const search = document.getElementById('searchBookInput').value.toLowerCase();
  const selectedLevel = document.getElementById('levelFilter').value.trim();
  const selectedVolume = document.getElementById('volumeFilter').value.trim();
  const selectedPublisher = document.getElementById('publisherFilter').value.toLowerCase().trim();
  const selectedType = document.getElementById('typeFilter').value.trim();
  const selectedGrade = document.getElementById('gradeFilter')?.value.trim() || '';
  const studentIdx = document.getElementById('filteredStudentsSelect').value;
  const container = document.getElementById('filteredBooksSelect');
  container.innerHTML = '';

  if (studentIdx === '') return;

  const student = students[studentIdx];
  const studentGrade = student?.classroom?.match(/^(יב|יא|י|ט|ח|ז)/)?.[0] || '';

  // 🧠 שמור ספרים שנבחרו קודם
  const previouslyChecked = new Set();
  document.querySelectorAll('#filteredBooksSelect input[type="checkbox"]:checked')
    .forEach(cb => previouslyChecked.add(cb.value));

  const normalize = str => (str || '').trim();
  const normalizeHebrewGrade = g =>
    (g || '').replace(/[״"׳']/g, '').replace(/\s+/g, '').trim();

  const levelGroups = {
    "הקבצה א": ["הקבצה א", "הקבצה א ו-א מואצת"],
    "הקבצה א מואצת": ["הקבצה א מואצת", "הקבצה א ו-א מואצת"],
    "הקבצה א ו-א מואצת": ["הקבצה א", "הקבצה א מואצת", "הקבצה א ו-א מואצת"]
  };

  const normalizedStudentGrade = normalizeHebrewGrade(studentGrade);
  const normalizedSelectedGrade = normalizeHebrewGrade(selectedGrade);

  books.forEach((b, i) => {
    const isAlreadyBorrowed = borrowed.some(br =>
      br.studentId === student.id &&
      br.bookIds?.some((id, idx) => id === b.id && !br.returned?.[idx])
    );

    const matchesSearch = [
      b.name,
      b.subject,
      b.grade,
      b.volume,
      b.publisher,
      b.type,
      b.note
    ].some(field =>
      (field || '').toLowerCase().includes(search)
    );

    const matchesLevel = selectedLevel === '' ||
      (levelGroups[selectedLevel] || [selectedLevel]).includes(normalize(b.level));

    const matchesVolume = selectedVolume === '' || normalize(b.volume) === selectedVolume;
    const matchesPublisher = selectedPublisher === '' || (b.publisher || '').toLowerCase().includes(selectedPublisher);
    const matchesType = selectedType === '' || normalize(b.type) === selectedType;

    const bookGrades = normalizeHebrewGrade(b.grade).split(',').map(g => g.trim());
    const matchesStudentGrade = bookGrades.includes(normalizedStudentGrade);
    const matchesGradeFilter = selectedGrade === '' || bookGrades.includes(normalizedSelectedGrade);

    if (
      matchesStudentGrade &&
      matchesLevel &&
      matchesVolume &&
      matchesPublisher &&
      matchesType &&
      matchesSearch &&
      matchesGradeFilter &&
      !isAlreadyBorrowed
    ) {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = b.id;
      checkbox.setAttribute('data-book-id', b.id);
      checkbox.id = 'book_' + b.id;

      // ✅ שחזר מצב בחירה קודם
      if (previouslyChecked.has(b.id.toString())) checkbox.checked = true;

      const label = document.createElement('label');
      label.htmlFor = checkbox.id;

      const labelText = `${b.name} (${b.subject}, שכבת ${b.grade}${b.level ? `, רמה ${b.level}` : ''})`;
      const noteText = b.note ? ` - ${b.note}` : '';

      label.textContent = labelText + noteText;
      label.prepend(checkbox);

      container.appendChild(label);
    }
  });

  updateReturnBooks(studentIdx);
}

let pendingChargeStudent = null;
let charges = [];

function openChargeModal() {
  const select = document.getElementById('filteredStudentsSelectReturn');
  const studentIdx = select.value;
  if (studentIdx === '') {
    alert("בחר תלמיד");
    return;
  }

  const student = students[studentIdx];
  if (!student) {
    alert("תלמיד לא נמצא");
    return;
  }

  pendingChargeStudent = student;

  const container = document.getElementById('chargeBooksList');
  container.innerHTML = '';

  const stillBorrowed = [];

  borrowed.forEach(entry => {
    const entryStudentId = entry.student?.id || entry.studentId;
    if (entryStudentId !== student.id) return;

    entry.bookIds.forEach((bookId, idx) => {
      const wasReturned = entry.returned?.[idx] || returned.some(r =>
        r.borrowId === entry.id && r.bookId === bookId
      );

      const alreadyCharged = charges.some(c =>
        c.studentId === student.id &&
        c.borrowId === entry.id &&
        c.bookId === bookId
      );

      if (!wasReturned && !alreadyCharged) {
        stillBorrowed.push({ entry, bookId, index: idx });
      }
    });
  });

  if (stillBorrowed.length === 0) {
    container.innerHTML = '<p>אין ספרים לחיוב</p>';
  } else {
    stillBorrowed.forEach(({ entry, bookId }) => {
      const book = books.find(b => b.id === bookId);
      if (!book) return;

      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '10px';

      const label = document.createElement('label');
      label.textContent = `${book.name} (${book.subject})`;

      const select = document.createElement('select');
      select.dataset.borrowId = entry.id;
      select.dataset.bookId = bookId;
      select.innerHTML = `
  <option value="">ללא חיוב</option>
  <option value="lost">אבד</option>
  <option value="damaged">בלאי</option>
  <option value="other">אחר</option>
`;


      wrapper.appendChild(label);
      wrapper.appendChild(select);
      container.appendChild(wrapper);
    });
  }

  document.getElementById('chargeModal').style.display = 'flex';
}

async function confirmCharge() {
  const selects = document.querySelectorAll('#chargeBooksList select');
  let count = 0;
  const newCharges = [];

  selects.forEach(sel => {
    const type = sel.value; // הערך כבר באנגלית: lost/damaged/other
    if (!type || !pendingChargeStudent) return;

    const borrowId = sel.dataset.borrowId;
    const bookId = sel.dataset.bookId;

    const bookEntry = borrowed.find(b =>
      b.id === borrowId &&
      (b.student?.id === pendingChargeStudent.id || b.studentId === pendingChargeStudent.id)
    );

    if (bookEntry) {
      const charge = {
        studentId: pendingChargeStudent.id,
        bookId,
        bookName: (books.find(b => b.id === bookId) || {}).name || '',
        type,
        date: new Date().toISOString(),
        paid: false,
        borrowId
      };
      charges.push(charge);
      newCharges.push(charge);
      count++;
    }
  });

  if (count === 0) {
    alert("לא נבחרו ספרים לחיוב");
    return;
  }

  const confirmed = confirm("האם את\\ה בטוח\\ה שסיימת לחייב את כל הספרים הנדרשים?");
  if (!confirmed) return;

  try {
    for (const charge of newCharges) {
      const res = await fetch(`/api/2026/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...userIdHeader },
        body: JSON.stringify(charge)
      });
      if (!res.ok) throw new Error("שגיאה בשמירת החיוב");

      const saved = await res.json();
      charge.id = saved.id; // ✅ שמירה של id מהשרת לעדכון עתידי
    }

    showSuccess(`${count} ספרים חויבו`);
    document.getElementById('chargeModal').style.display = 'none';

    const idx = students.findIndex(s => s.id === pendingChargeStudent?.id);
    if (idx !== -1) {
      viewStudentDetails(idx);
      updateReturnBooks(idx);
      filterBooks();
    }

    renderStudentTable();
    pendingChargeStudent = null;
  } catch (err) {
    console.error("❌ confirmCharge:", err);
    alert("שגיאה בשמירת החיוב בשרת");
  }
}

async function deleteFilteredStudents() {
  if (!confirm('האם למחוק את כל התלמידים המופיעים בתצוגה?')) return;

  const studentsToDelete = getFilteredStudents();
  if (studentsToDelete.length === 0) return alert('אין תלמידים למחיקה');

  const ids = studentsToDelete.map(s => s.id);

  try {
    const res = await fetch(`/api/2026/students`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...userIdHeader },
      body: JSON.stringify({ ids })
    });

    if (!res.ok) throw new Error("שגיאה במחיקה מרובה");

    const result = await res.json();
    students = students.filter(s => !ids.includes(s.id));
    borrowed = borrowed.filter(b => !ids.includes(b.studentId));
    returned = returned.filter(r => !ids.includes(r.studentId));
    charges = charges.filter(c => !ids.includes(c.studentId));

    renderStudentTable();
    filterStudents();
    showSuccess(`✔️ נמחקו ${result.deletedCount} תלמידים`);
  } catch (err) {
    console.error(err);
    alert("שגיאה במחיקת תלמידים");
  }
}


window.addEventListener('DOMContentLoaded', () => {
  filterStudents();
  document.getElementById('deepSearchCheckbox').addEventListener('change', filterBooksBorrow);

});


async function deleteFilteredBooks() {
  if (!confirm('האם למחוק את כל הספרים המסוננים?')) return;

  const booksToDelete = getFilteredBooks();
  if (booksToDelete.length === 0) return alert('אין ספרים למחיקה');

  const ids = booksToDelete.map(b => b.id);

  try {
    const res = await fetch('/api/2026/books', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...userIdHeader },
      body: JSON.stringify({ ids })
    });

    if (!res.ok) throw new Error("שגיאה במחיקה מרובה");

    const result = await res.json();
    books = books.filter(b => !ids.includes(b.id));
    borrowed = borrowed.filter(b => !b.bookIds?.some(id => ids.includes(id)));
    returned = returned.filter(r => !ids.includes(r.bookId));
    charges = charges.filter(c => !ids.includes(c.bookId));

    renderBookTable();
    filterBooks();
    showSuccess(`✔️ נמחקו ${result.deletedCount} ספרים`);
  } catch (err) {
    console.error(err);
    alert("שגיאה במחיקת ספרים");
  }
}

async function clearStudentDebt(studentId) {
  const now = new Date().toISOString();
  const unpaidCharges = charges.filter(c => c.studentId === studentId && !c.paid);
  const currentYear = 2026; 

  for (const c of unpaidCharges) {
    c.paid = true;
    c.paidDate = now;

    const borrowEntry = borrowed.find(b => b.id === c.borrowId);
    const book = books.find(bk => bk.id === c.bookId);
    const student = students.find(s => s.id === studentId);

    // ✨ יוצרים רשומת החזרה במידה וצריך
    if (borrowEntry && book && student && !returned.some(r => r.id === borrowEntry.id)) {
      const returnEntry = {
        year: currentYear,
        id: crypto.randomUUID(),
        student: {
          id: student.id,
          name: student.name,
          school: student.school || '',
          classroom: student.classroom || '',
          inLoanProject: !!student.inLoanProject
        },
        book: {
          id: book.id,
          name: book.name,
          subject: book.subject || '',
          grade: book.grade || '',
          level: book.level || '',
          volume: book.volume || '',
          publisher: book.publisher || '',
          type: book.type || '',
          note: book.note || '',
          price: book.price || ''
        },
        returnDate: now,
        returnedByDebtClearance: true
      };

      returned.push(returnEntry);

      try {
        const res = await fetch(`/api/${currentYear}/returned`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...userIdHeader },
          body: JSON.stringify(returnEntry)
        });
        if (!res.ok) throw new Error("שגיאה בשמירת החזרה");
      } catch (err) {
        console.error("❌ clearStudentDebt (return):", err);
      }
    }

    // ✨ עדכון/יצירת חיוב
    try {
      if (c.id || c._id) {
        // עדכון חיוב קיים לפי id או _id
        const identifier = c.id || c._id;
        const res = await fetch(`/api/${currentYear}/charges/${identifier}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...userIdHeader },
          body: JSON.stringify(c)
        });
        if (!res.ok) throw new Error("שגיאה בעדכון חיוב");
      } else {
        // חיוב חדש → שולחים גוף נקי בלי _id
        const chargeData = {
          studentId: c.studentId,
          bookId: c.bookId,
          bookName: c.bookName || '',
          type: c.type || 'other', // חובה לפי הסכמה
          paid: c.paid,
          paidDate: c.paidDate,
          borrowId: c.borrowId
        };

        const res = await fetch(`/api/${currentYear}/charges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...userIdHeader },
          body: JSON.stringify(chargeData)
        });
        if (!res.ok) throw new Error("שגיאה בשמירת חיוב חדש");
        const saved = await res.json();
        c.id = saved.id; // ✅ נשמור את ה־UUID ששרת יצר להבא
      }
    } catch (err) {
      console.error("❌ clearStudentDebt (charge):", err);
      alert("שגיאה בעדכון החוב בשרת");
    }
  }

  showSuccess("החוב סומן כמשולם והספרים הוחזרו");

  const idx = students.findIndex(s => s.id === studentId);
  if (idx !== -1) {
    updateReturnBooks(idx);
    filterBooks();
    viewStudentDetails(idx);
    renderStudentTable();
  }
}


function returnToCharge() {
  returnToChargeMode = false;
  document.getElementById('studentDetailModal').style.display = 'none';
  if (pendingChargeStudent) {
    openChargeModal(pendingChargeStudent.id);
  }
}



function renderSelectedBooksPreview() {
  const container = document.getElementById('selectedBooksPreview');
  container.innerHTML = '';

  if (!selectedBooks || selectedBooks.size === 0) {
    container.innerHTML = '<i>לא נבחרו ספרים</i>';
    return;
  }

  const list = document.createElement('ul');
  list.style.listStyle = 'disc';
  list.style.paddingInlineStart = '20px';

  selectedBooks.forEach(bookId => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    const li = document.createElement('li');
    li.textContent = `${book.name} (${book.subject}, שכבת ${book.grade}${book.level ? `, רמה ${book.level}` : ''})`;
    list.appendChild(li);
  });

  container.appendChild(list);
}

function toggleBookList() {
  const bookList = document.getElementById('filteredBooksSelect');
  const input = document.getElementById('bookFilterInput');
  const button = document.getElementById('toggleBookListBtn');

  const isCollapsed = bookList.classList.toggle('collapsed');
  input.classList.toggle('collapsed', isCollapsed);
  button.textContent = isCollapsed ? '▼' : '▲';
}





document.querySelectorAll('input[type=checkbox][data-book-id]').forEach(cb => {
  cb.addEventListener('change', (e) => {
    const bookId = e.target.dataset.bookId;
    if (e.target.checked) {
      if (!selectedBookIdsRealtime.includes(bookId)) {
        selectedBookIdsRealtime.push(bookId);
      }
    } else {
      selectedBookIdsRealtime = selectedBookIdsRealtime.filter(id => id !== bookId);
    }
    renderSelectedBooksPreview();
  });
});

function purchaseBook() {
  selectedBookIdsRealtime = [];
  renderSelectedBooksPreview();

  const studentIdx = document.getElementById('filteredStudentsSelect').value;
  if (studentIdx === '') return alert("בחר תלמיד");
  const student = students[studentIdx];

  const checkboxes = document.querySelectorAll('#filteredBooksSelect input[type=checkbox]:checked');
  if (checkboxes.length === 0) return alert("בחר לפחות ספר אחד לרכישה");

  const list = document.getElementById('borrowBookList');
  list.innerHTML = '';
  checkboxes.forEach(cb => {
    const b = books[cb.value];
    const li = document.createElement('li');
    li.textContent = `${b.name} (${b.subject}, שכבת ${b.grade}${b.level ? `, רמה ${b.level}` : ''})`;
    list.appendChild(li);
  });

  document.getElementById('confirmBorrowCheckbox').checked = false;

  // פותח את המודל עם טקסטים של רכישה
  openConfirmModal('רכישה');
}
function borrowBook() {
  selectedBookIdsRealtime = [];
  renderSelectedBooksPreview();

  const studentIdx = document.getElementById('filteredStudentsSelect').value;
  if (studentIdx === '') return alert("בחר תלמיד");
  const student = students[studentIdx];

  const checkboxes = document.querySelectorAll('#filteredBooksSelect input[type=checkbox]:checked');
  if (checkboxes.length === 0) return alert("בחר לפחות ספר אחד להשאלה");

  const list = document.getElementById('borrowBookList');
  list.innerHTML = '';
  checkboxes.forEach(cb => {
    const b = books[cb.value];
    const li = document.createElement('li');
    li.textContent = `${b.name} (${b.subject}, שכבת ${b.grade}${b.level ? `, רמה ${b.level}` : ''})`;
    list.appendChild(li);
  });

  document.getElementById('confirmBorrowCheckbox').checked = false;

  // פותח את המודל עם טקסטים של השאלה
  openConfirmModal('השאלה');
}

function showStudentChart(type) {
  // החבא את שניהם
  document.getElementById("studentsByClassChart").style.display = "none";
  document.getElementById("studentsBySchoolChart").style.display = "none";

  if (type === "class") {
    document.getElementById("studentsByClassChart").style.display = "block";
    drawStudentsByClass();
  } else if (type === "school") {
    document.getElementById("studentsBySchoolChart").style.display = "block";
    drawStudentsBySchool();
  }
}

function showBookChart(type) {
  // החבא את שניהם
  document.getElementById("booksBySubjectChart").style.display = "none";
  document.getElementById("booksByTypeChart").style.display = "none";

  if (type === "subject") {
    document.getElementById("booksBySubjectChart").style.display = "block";
    drawBooksBySubject();
  } else if (type === "type") {
    document.getElementById("booksByTypeChart").style.display = "block";
    drawBooksByType();
  }
}


// === כלי עזר Tooltip ===
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "chart-tooltip")
  .style("position", "absolute")
  .style("background", "#fff")
  .style("border", "1px solid #ccc")
  .style("padding", "6px 10px")
  .style("border-radius", "5px")
  .style("font-size", "13px")
  .style("pointer-events", "none")
  .style("opacity", 0);

async function fetchStats(type) {
  const year = localStorage.getItem("selectedYear") || 2026;
  const res = await fetch(`/api/${year}/stats/${type}`, { headers: userIdHeader });
  return res.json();
}

async function drawStudentsByClass() {
  const data = await fetchStats("studentsByClass");

  // סכום לכל שכבה (י, יא, יב)
  const layers = d3.rollups(
    data,
    v => d3.sum(v, d => d.count),
    d => d._id.replace(/[0-9]/g, "")
  ).map(([layer, total]) => ({ layer, total }));

  const width = 700, height = 400;
  const svg = d3.select("#studentsByClassChart")
    .html("")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleBand()
    .domain(layers.map(d => d.layer))
    .range([80, width - 50])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(layers, d => d.total)])
    .nice()
    .range([height - 50, 50]);

  // ציר X
  svg.append("g")
    .attr("transform", `translate(0,${height - 50})`)
    .call(d3.axisBottom(x));

  // ציר Y עם מספרים שלמים בלבד, בלי חזרות
  svg.append("g")
    .attr("transform", `translate(80,0)`)
    .call(
      d3.axisLeft(y)
        .ticks(Math.min(d3.max(layers, d => d.total), 10))
        .tickFormat(d3.format("d"))
    );

  // ציור העמודות
  svg.selectAll("rect")
    .data(layers)
    .enter()
    .append("rect")
    .attr("x", d => x(d.layer))
    .attr("y", y(0))
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", "#007bff")
    .transition()
    .duration(1000)
    .attr("y", d => y(d.total))
    .attr("height", d => height - 50 - y(d.total));

  // תוויות מעל העמודות
  svg.selectAll("text.bar-label")
    .data(layers)
    .enter()
    .append("text")
    .attr("class", "bar-label")
    .attr("x", d => x(d.layer) + x.bandwidth() / 2)
    .attr("y", d => y(d.total) - 5)
    .attr("text-anchor", "middle")
    .text(d => d.total)
    .style("font-size", "12px")
    .style("fill", "#333");
}

// === תלמידים לפי בית ספר ===
async function drawStudentsBySchool() {
  const data = await fetchStats("studentsBySchool");

  const width = 650, height = 400;

  const svg = d3.select("#studentsBySchoolChart")
    .html("")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleBand()
    .domain(data.map(d => d._id))
    .range([60, width - 50])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count)])
    .nice()
    .range([height - 50, 50]);

  // ציר X
  svg.append("g")
    .attr("transform", `translate(0,${height - 50})`)
    .call(d3.axisBottom(x));

  // ציר Y – ללא חזרות
  svg.append("g")
    .attr("transform", `translate(60,0)`)
    .call(
      d3.axisLeft(y)
        .ticks(Math.min(d3.max(data, d => d.count), 10)) // מקסימום 10
        .tickFormat(d3.format("d"))
    );

  // ציור עמודות
  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d._id))
    .attr("y", height - 50)
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", "seagreen")
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("y", y(d.count) - 10)
        .attr("height", (height - 50) - y(d.count) + 10);

      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`<b>${d._id}</b><br>כמות: ${d.count}`)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("y", y(d.count))
        .attr("height", (height - 50) - y(d.count));

      tooltip.transition().duration(200).style("opacity", 0);
    })
    .transition()
    .duration(1000)
    .attr("y", d => y(d.count))
    .attr("height", d => (height - 50) - y(d.count));
}

// === ספרים לפי מקצוע (Pie Chart) ===
// === ספרים לפי מקצוע (Pie Chart) ===
async function drawBooksBySubject() {
  const data = await fetchStats("booksBySubject");

  const width = 700, height = 450, radius = Math.min(width, height) / 2 - 50;

  const svg = d3.select("#booksBySubjectChart")
    .html("")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const chartGroup = svg.append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);


  const color = d3.scaleOrdinal(d3.schemeTableau10);

  const pie = d3.pie().value(d => d.count);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  chartGroup.selectAll("path")
    .data(pie(data))
    .enter()
    .append("path")
    .attr("fill", d => color(d.data._id))
    .each(function (d) { this._current = d; })
    .on("mouseover", function (event, d) {
      d3.select(this)
        .interrupt() // ✅ עצירה של transition קודם
        .transition()
        .duration(200)
        .attr("transform", "scale(1.05)");

      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`<b>${d.data._id}</b><br>כמות: ${d.data.count}`)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .interrupt() // ✅ עצירה של transition קודם
        .transition()
        .duration(200)
        .attr("transform", "scale(1)");

      tooltip.transition().duration(200).style("opacity", 0);
    })
    .transition()
    .duration(1000)
    .attrTween("d", function (d) {
      const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return t => arc(i(t));
    });
}

// === ספרים לפי סוג (Pie Chart) ===
async function drawBooksByType() {
  const data = await fetchStats("booksByType");

  const width = 700, height = 450, radius = Math.min(width, height) / 2 - 50;

  const svg = d3.select("#booksByTypeChart")
    .html("")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const chartGroup = svg.append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);


  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const pie = d3.pie().value(d => d.count);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  chartGroup.selectAll("path")
    .data(pie(data))
    .enter()
    .append("path")
    .attr("fill", d => color(d.data._id))
    .attr("d", arc)
    .each(function (d) { this._current = d; })
    .on("mouseover", function (event, d) {
      d3.select(this)
        .interrupt() // ✅ עוצר כל transition קיים
        .transition()
        .duration(200)
        .attr("transform", "scale(1.05)");

      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`<b>${d.data._id}</b><br>כמות: ${d.data.count}`)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .interrupt() // ✅ עוצר כל transition קיים
        .transition()
        .duration(200)
        .attr("transform", "scale(1)");

      tooltip.transition().duration(200).style("opacity", 0);
    })
    .transition()
    .duration(1000)
    .attrTween("d", function (d) {
      const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return t => arc(i(t));
    });
}


document.addEventListener("DOMContentLoaded", () => {
  drawStudentsByClass();
  drawStudentsBySchool();
  drawBooksBySubject();
  drawBooksByType();
});



async function finalizeBorrow() {
  loading = document.getElementById('globalLoading');
  loading.style.display = 'flex';
  const studentIdx = document.getElementById('filteredStudentsSelect').value;
  if (studentIdx === '') return alert("בחר תלמיד");
  const student = students[studentIdx];

  if ((student.note || '').includes("לא החזיר ספרים תשפ\"ה")) {
    return alert("⚠️ שים לב: התלמיד טרם החזיר את כל ספרי תשפ\"ה!");
  }

  if (!document.getElementById('confirmBorrowCheckbox').checked)
    return alert("יש לאשר את הצהרת קבלת הספרים התקינים");

  if (isSignatureEmpty())
    return alert("נדרשת חתימה לפני השלמת הפעולה");

  const borrowerType = document.getElementById('borrowerTypeSelect').value;
  const borrowerName = document.getElementById('borrowerNameInput').value.trim();

  if ((borrowerType === 'parent' || borrowerType === 'staff') && !borrowerName) {
    return alert("נא למלא שם מלא עבור הורה או בעל תפקיד");
  }

  const selectedBookIds = Array.from(selectedBooks);
  if (selectedBookIds.length === 0) return alert("בחר לפחות ספר אחד");

  const filteredBookIds = selectedBookIds.filter(bookId => {
    const alreadyBorrowed = borrowed.some(b =>
      b.studentId === student.id &&
      Array.isArray(b.bookIds) &&
      Array.isArray(b.returned) &&
      b.bookIds.includes(bookId) &&
      !b.returned[b.bookIds.indexOf(bookId)]
    );
    return !alreadyBorrowed;
  });

  if (filteredBookIds.length === 0) {
    return alert("כל הספרים שנבחרו כבר הושאלו");
  }

  const signatureData = getSignatureImage();
  const now = new Date().toISOString();
  const bulkId = crypto.randomUUID();

  const newBorrow = {
    id: crypto.randomUUID(),
    student,
    studentId: student.id,
    bookIds: filteredBookIds,
    returned: filteredBookIds.map(() => false),
    date: now,
    signature: signatureData,
    bulkId,
    borrowerType,
    borrowerName: borrowerType === 'student' ? student.name : borrowerName,
    purchase: window.currentActionType === 'רכישה',
    isBulk: false
  };

  try {
    const res = await fetch('/api/2026/borrowed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...userIdHeader },
      body: JSON.stringify(newBorrow)
    });

    if (!res.ok) throw new Error("שגיאה ביצירת ההשאלה");

    const savedBorrow = await res.json();
    borrowed.push(savedBorrow);

    if (window.currentActionType === 'השאלה') {
      showSuccess(`הושאלו ${filteredBookIds.length} ספרים`);
    } else {
      showSuccess(`נרכשו ${filteredBookIds.length} ספרים`);
      const filteredBooks = filteredBookIds.map(id => books.find(b => b.id === id)).filter(Boolean);
      showPurchaseReceipt(student, filteredBooks, signatureData, now);
    }

    // ✅ שליחת מייל בהתאם לסוג ההשאלה
    // ✅ שליחת מייל בהתאם לסוג ההשאלה
    if (student.email && student.email !== "non") {
      const isFirstBorrow = !borrowed.some(
        b => b.studentId === student.id && b.id !== savedBorrow.id
      );

      // רשימת כל הספרים המושאלים כרגע לסטודנט
      const activeBooks = borrowed
        .filter(b => b.studentId === student.id)
        .flatMap(b =>
          b.bookIds
            .map((id, idx) => (!b.returned[idx] ? books.find(bk => bk.id === id)?.name : null))
            .filter(Boolean)
        );

      try {
        if (isFirstBorrow) {
          // מייל השאלה ראשונה
          await fetch('/api/email/sendFirstBorrow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...userIdHeader },
            body: JSON.stringify({
              email: student.email,
              name: student.name,
              date: new Date(savedBorrow.date).toLocaleDateString('he-IL'),
              books: activeBooks   // ✅ כל הספרים המושאלים כרגע
            })
          });
        } else {
          // מייל עדכון
          await fetch('/api/email/sendFollowUpBorrow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...userIdHeader },
            body: JSON.stringify({
              email: student.email,
              name: student.name,
              books: activeBooks   // ✅ כל הספרים המושאלים כרגע
            })
          });
        }
      } catch (mailErr) {
        console.error("❌ שליחת מייל נכשלה:", mailErr);
      }
    }

  } catch (err) {
    console.error("❌ finalizeBorrow:", err);
    return alert("שגיאה: ההשאלה לא נשמרה בשרת");
  }

  renderBookTable();
  renderStudentTable();
  filterBooks();
  closeBorrowModal();
  checkLowStock();
  resetBorrowModalState();
  selectedBooks.clear();
  renderSelectedBooksPreview();
  loading.style.display = 'none';
}



function getAllCurrentlyBorrowedBooks(studentId) {
  const booksInHand = [];

  borrowed.forEach(entry => {
    if (entry.studentId === studentId && !entry.purchase) {
      entry.bookIds.forEach((bookId, idx) => {
        if (!entry.returned[idx]) {
          const book = books.find(b => b.id === bookId);
          if (book) booksInHand.push(book.name || book.title || 'ללא שם');
        }
      });
    }
  });

  return booksInHand;
}

function filterBooksBorrow() {
  const search = document.getElementById('searchBookInput').value.toLowerCase();
  const selectedLevel = document.getElementById('levelFilter').value;
  const selectedVolume = document.getElementById('volumeFilter').value;
  const selectedPublisher = document.getElementById('publisherFilter').value.toLowerCase();
  const selectedType = document.getElementById('typeFilter').value;
  const studentIdx = document.getElementById('filteredStudentsSelect').value;
  const deepSearchEnabled = document.getElementById('deepSearchCheckbox').checked;
  const container = document.getElementById('filteredBooksSelect');
  container.innerHTML = '';

  if (studentIdx === '') {
    console.log('אין תלמיד נבחר');
    return;
  }

  const student = students[studentIdx];
  const classroom = (student?.classroom || '').trim();
  const gradeMatch = classroom.match(/^(יב|יא|י|ט|ח|ז)/);
  const normalizedGrade = gradeMatch ? gradeMatch[0] : '';
  console.log('שכבת התלמיד:', normalizedGrade);

  const levelGroups = {
    "הקבצה א": ["הקבצה א", "הקבצה א ו-א מואצת"],
    "הקבצה א מואצת": ["הקבצה א מואצת", "הקבצה א ו-א מואצת"],
    "הקבצה א ו-א מואצת": ["הקבצה א", "הקבצה א מואצת", "הקבצה א ו-א מואצת"]
  };

  // -------- סטים --------
  if (Array.isArray(clusters)) {
    clusters.forEach(cluster => {
      const clusterGrades = (cluster.grades || []).map(g => g.trim());
      if (!deepSearchEnabled && !clusterGrades.includes(normalizedGrade)) return;

      const hasMatchingBook = (cluster.bookIds || []).some(bookId => {
        const book = books.find(b => b.id === bookId);
        if (!book) return false;

        const matchesSearch = [book.name, book.subject, book.grade, book.volume, book.publisher, book.type, book.note]
          .some(f => (f || '').toLowerCase().includes(search));

        const matchesLevel = selectedLevel === '' ||
          (levelGroups[selectedLevel] || [selectedLevel]).includes(book.level);
        const matchesVolume = selectedVolume === '' || book.volume === selectedVolume;
        const matchesPublisher = selectedPublisher === '' || (book.publisher || '').toLowerCase().includes(selectedPublisher);
        const matchesType = selectedType === '' || book.type === selectedType;

        return matchesLevel && matchesVolume && matchesPublisher && matchesType && matchesSearch;
      });

      if (hasMatchingBook) {
        const allBooksBorrowed = cluster.bookIds.every(bookId =>
          borrowed.some(b => {
            if (b.studentId !== student.id) return false;
            if (!Array.isArray(b.bookIds) || !Array.isArray(b.returned)) return false;
            if (b.bookIds.length !== b.returned.length) return false;

            return b.bookIds.some((id, idx) =>
              id === bookId && b.returned[idx] === false
            );
          })
        );

        if (!allBooksBorrowed) appendClusterCheckbox(cluster);
      }
    });
  }

  // -------- ספרים בודדים --------
  const bookCopiesMap = new Map();

  books.forEach((b, i) => {
    const alreadyBorrowedAndNotReturned = borrowed.some(br =>
      br.studentId === student.id &&
      Array.isArray(br.bookIds) &&
      Array.isArray(br.returned) &&
      br.bookIds.length === br.returned.length &&
      br.bookIds.some((id, idx) => id === b.id && br.returned[idx] === false)
    );

    const matchesSearch = [b.name, b.subject, b.grade, b.volume, b.publisher, b.type, b.note]
      .some(f => (f || '').toLowerCase().includes(search));

    const matchesLevel = selectedLevel === '' ||
      (levelGroups[selectedLevel] || [selectedLevel]).includes(b.level);
    const matchesVolume = selectedVolume === '' || b.volume === selectedVolume;
    const matchesPublisher = selectedPublisher === '' || (b.publisher || '').toLowerCase().includes(selectedPublisher);
    const matchesType = selectedType === '' || b.type === selectedType;

    if (matchesSearch && matchesLevel && matchesVolume && matchesPublisher && matchesType && !alreadyBorrowedAndNotReturned) {
      if (!bookCopiesMap.has(b.id)) bookCopiesMap.set(b.id, []);
      bookCopiesMap.get(b.id).push({ book: b, index: i });
    }
  });

  bookCopiesMap.forEach(copies => {
    let chosenCopy = null;

    if (deepSearchEnabled) {
      chosenCopy = copies[0];
    } else {
      chosenCopy = copies.find(({ book }) =>
        (book.grade || '').split(',').map(g => g.trim()).includes(normalizedGrade)
      );
    }

    if (chosenCopy) appendBookCheckbox(chosenCopy.book);

  });

  updateReturnBooks(studentIdx);
}


let canvas, ctx, drawing = false;

window.onload = () => {
  // התחלת החתימה
  canvas = document.getElementById('signaturePad');
  ctx = canvas.getContext('2d');
  canvas.addEventListener('pointerdown', e => {
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', e => {
    if (!drawing) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach(event =>
    canvas.addEventListener(event, () => (drawing = false))
  );

  ['touchstart', 'touchmove', 'touchend', 'gesturestart'].forEach(evt =>
    canvas.addEventListener(evt, e => e.preventDefault(), { passive: false })
  );

  // נטענת רק אחרי טעינת הדף המלאה:
  window.addEventListener("DOMContentLoaded", () => {
    loadData().then(() => {
      console.log("✅ נתונים נטענו – מוכן לשימוש");
      // אל תקרא ל-saveData() כאן!
    });
  });
  filterStudents();
  filterBooks();
  renderStudentTable();
  renderBookTable();
};

function viewStudentDetails(index) {
  const student = students[index];
  if (!student) return;

  const studentCharges = charges.filter(c => c.studentId === student.id);
  const studentPaidCharges = studentCharges.filter(c => c.paid);
  const studentUnpaidCharges = studentCharges.filter(c => !c.paid);
  const chargedIds = new Set(studentCharges.map(c => c.borrowId).filter(Boolean));

  // --- טיימליין Borrow/Return ---
  let events = [];

  borrowed
    .filter(b => b.studentId === student.id && !chargedIds.has(b.id))
    .forEach(b => {
      b.bookIds.forEach((bookId) => {
        const book = books.find(bk => bk.id === bookId);
        if (!book) return;
        events.push({ type: "borrow", book, date: new Date(b.date), borrowId: b.id });
      });
    });

  returned
    .filter(r => (r.student?.id === student.id || r.studentId === student.id))
    .forEach(r => {
      let bookObj = r.book;
      if (!bookObj?.id && (r.bookId || typeof bookObj === "string")) {
        const bookId = r.bookId || bookObj;
        bookObj = books.find(bk => bk.id === bookId) || {};
      }
      events.push({ type: "return", book: bookObj, date: new Date(r.returnDate), borrowId: r.id });
    });

  events.sort((a, b) => a.date - b.date);

  // --- מצב אחרון של כל ספר ---
  const activeBorrows = new Map();
  const booksReturned = [];

  events.forEach(ev => {
    const bookId = ev.book?.id;
    if (!bookId) return;

    if (ev.type === "borrow") {
      activeBorrows.set(bookId, ev);
    } else if (ev.type === "return") {
      if (activeBorrows.has(bookId)) {
        activeBorrows.delete(bookId);
      }
      booksReturned.push({
        book: ev.book,
        returnDate: ev.date
      });
    }
  });

  const booksStillBorrowed = Array.from(activeBorrows.values()).map(ev => ({
    book: ev.book,
    date: ev.date
  }));

  // --- HTML ---
  const totalDebt = studentUnpaidCharges.length * 50;
  const totalPaid = studentPaidCharges.length * 50;

  let html = `
    <h4>${student.name}</h4>
    <p>תעודת זהות: ${student.id}</p>
    <p>כיתה: ${student.classroom}</p>
    <p>בית ספר: ${student.school}</p>
  `;

  if (totalDebt > 0) {
    html += `<p><b style="color: red;">חוב:</b> ${totalDebt} ש"ח</p><ul>`;
    studentUnpaidCharges.forEach(c => {
      const chargedAt = c.date ? new Date(c.date).toLocaleString('he-IL') : '---';
      html += `<li style="color:red">${c.bookName} (${c.type}) - חויב ב־${chargedAt}</li>`;
    });
    html += `</ul>`;
  }

  if (totalPaid > 0) {
    html += `<p><b style="color: green;">שולם:</b> ${totalPaid} ש"ח</p><ul>`;
    studentPaidCharges.forEach(c => {
      const chargedAt = c.date ? new Date(c.date).toLocaleString('he-IL') : '---';
      const paidAt = c.paidDate ? new Date(c.paidDate).toLocaleString('he-IL') : '---';
      html += `<li style="color:green">${c.bookName} (${c.type}) - חויב ב־${chargedAt}, שולם ב־${paidAt}</li>`;
    });
    html += `</ul>`;
  }

  if (booksStillBorrowed.length > 0) {
    html += `<p><b>ספרים שטרם הוחזרו:</b><ul>`;
    booksStillBorrowed.forEach(entry => {
      html += `<li>${entry.book.name} (${entry.book.subject}) - הושאל ב־${new Date(entry.date).toLocaleString('he-IL')}</li>`;
    });
    html += `</ul>`;
  }

  if (booksReturned.length > 0) {
    html += `<p><b>ספרים שהוחזרו:</b><ul>`;
    booksReturned.forEach(r => {
      const bookName = r.book?.name || '---';
      const subject = r.book?.subject || '---';
      const dateStr = r.returnDate ? new Date(r.returnDate).toLocaleString('he-IL') : '---';
      html += `<li>${bookName} (${subject}) - הוחזר ב־${dateStr}</li>`;
    });
    html += `</ul>`;
  }

  // --- החזרת החתימות (נלקחות מה־borrowed) ---
  const groupedBySignature = {};
  borrowed
    .filter(b => b.studentId === student.id)
    .forEach(b => {
      const key = b.bulkId + '|' + b.date;
      if (!groupedBySignature[key]) {
        groupedBySignature[key] = { date: b.date, signature: b.signature };
      }
    });

  const groupedEntries = Object.values(groupedBySignature);
  if (groupedEntries.length > 0) {
    html += `<p><b>חתימות על השאלות:</b></p>`;
    groupedEntries.forEach(g => {
      const dateStr = new Date(g.date).toLocaleString('he-IL');
      html += `
        <div style="margin:10px 0;">
          <p style="margin:0;"><b>${dateStr}:</b></p>
          <img src="${g.signature}" alt="חתימה" style="border:1px solid #ccc; max-width:100%; height:auto; margin-top:5px;" />
        </div>`;
    });
  }

  html += `<button onclick="printStudentCard(${index})">🖨️ הדפס כרטיס</button>`;

  document.getElementById('studentDetailContent').innerHTML = html;
  document.getElementById('studentDetailModal').style.display = 'flex';
}


function closeStudentModal() {
  document.getElementById('studentDetailModal').style.display = 'none';
}


function fixCanvasDPI() {
  const dpi = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpi;
  canvas.height = rect.height * dpi;
  ctx.scale(dpi, dpi);
}

function openBorrowModal() {
  const modal = document.getElementById('confirmBorrowModal');
  modal.style.display = 'flex';

  setTimeout(() => {
    canvas = document.getElementById('signaturePad');
    ctx = canvas.getContext('2d');
    fixCanvasDPI();

    canvas.addEventListener('pointerdown', e => {
      drawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', e => {
      if (!drawing) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(event =>
      canvas.addEventListener(event, () => (drawing = false))
    );

  }, 100); // מחכה טיפה אחרי שהמודל מוצג
}


function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function getSignatureImage() {
  return canvas.toDataURL(); // מחזיר את החתימה כתמונה בפורמט base64
}


function clearSignature() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function isSignatureEmpty() {
  const blank = document.createElement('canvas');
  blank.width = canvas.width;
  blank.height = canvas.height;
  return canvas.toDataURL() === blank.toDataURL();
}

window.addEventListener('DOMContentLoaded', () => {
  const deepSearchCheckbox = document.getElementById('deepSearchCheckbox');

  deepSearchCheckbox.addEventListener('change', e => {
    filterBooksBorrow();
  });

  filterBooksBorrow();
});


function appendClusterCheckbox(cluster) {
  const container = document.getElementById('filteredBooksSelect');
  const div = document.createElement('div');
  div.className = 'cluster-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.dataset.clusterId = cluster.id;

  const label = document.createElement('label');
  label.textContent = `📦 סט: ${cluster.name}`;

  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = '⬇️ הצג ספרים';
  toggleBtn.style.marginRight = '10px';
  toggleBtn.onclick = () => toggleClusterBooks(cluster.id, toggleBtn);

  const booksContainer = document.createElement('div');
  booksContainer.className = 'cluster-books hidden';
  booksContainer.id = `cluster-books-${cluster.id}`;

  const studentIdx = document.getElementById('filteredStudentsSelect').value;
  const student = students[studentIdx];

  cluster.bookIds.forEach(bookId => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const alreadyBorrowed = borrowed.some(br => {
      if (br.studentId !== student.id) return false;
      if (!Array.isArray(br.bookIds) || !Array.isArray(br.returned)) return false;
      return br.bookIds.some((id, idx) => id === bookId && br.returned[idx] === false);
    });

    const bookDiv = document.createElement('div');
    bookDiv.className = 'book-item';
    bookDiv.style.backgroundColor = '#f9f9f9';
    bookDiv.style.display = 'flex';

    const bookCheckbox = document.createElement('input');
    bookCheckbox.type = 'checkbox';
    bookCheckbox.dataset.bookId = book.id;
    bookCheckbox.disabled = alreadyBorrowed;
    bookCheckbox.checked = selectedBooks.has(book.id);

    bookCheckbox.addEventListener('change', () => {
      if (bookCheckbox.checked) selectedBooks.add(book.id);
      else selectedBooks.delete(book.id);
      renderSelectedBooksPreview(); // ✅ החלק שנשכח
    });

    const bookLabel = document.createElement('label');
    bookLabel.textContent = `${book.name} (${book.subject}, שכבת ${book.grade}${book.level ? `, רמה ${book.level}` : ''})`;
    if (alreadyBorrowed) {
      bookLabel.style.textDecoration = 'line-through';
      bookLabel.style.opacity = '0.6';
    }

    bookDiv.appendChild(bookCheckbox);
    bookDiv.appendChild(bookLabel);
    booksContainer.appendChild(bookDiv);
  });

  // סנכרון checkbox של הסט כולו
  checkbox.addEventListener('change', e => {
    const checked = e.target.checked;
    booksContainer.querySelectorAll('input[type=checkbox]').forEach(input => {
      if (input.disabled) return;
      input.checked = checked;
      const bookId = input.dataset.bookId;
      if (checked) selectedBooks.add(bookId);
      else selectedBooks.delete(bookId);
    });
    renderSelectedBooksPreview(); // ✅ כבר קיים - טוב מאוד
  });

  div.appendChild(checkbox);
  div.appendChild(label);
  div.appendChild(toggleBtn);
  div.appendChild(booksContainer);
  container.appendChild(div);
}




toggleBtn.onclick = () => {
  if (getCurrentTabId() !== 'borrowTab') return;
  toggleClusterBooks(cluster.id);
  toggleBtn.textContent = booksContainer.classList.contains('hidden') ? '⬇️ הצג ספרים' : '⬆️ הסתר ספרים';
};


function toggleClusterBooks(clusterId, btn = null) {
  const el = document.getElementById(`cluster-books-${clusterId}`);
  if (!el) return;
  el.classList.toggle('hidden');

  if (btn) {
    btn.textContent = el.classList.contains('hidden') ? '⬇️ הצג ספרים' : '⬆️ הסתר ספרים';
  }
}


function appendBookCheckbox(b) {
  const container = document.getElementById('filteredBooksSelect');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = b.id;
  checkbox.id = 'book_' + b.id;
  checkbox.dataset.bookId = b.id; // ✅ שימוש עקבי עם finalizeBorrow
  checkbox.checked = selectedBooks.has(b.id);

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      selectedBooks.add(b.id);
    } else {
      selectedBooks.delete(b.id);
    }
    renderSelectedBooksPreview(); // ✅ הצגת הספרים שנבחרו בזמן אמת
  });

  const label = document.createElement('label');
  label.htmlFor = checkbox.id;

  const labelText = `${b.name} (${b.subject}, שכבת ${b.grade || '?'}${b.level ? `, רמה ${b.level}` : ''})`;
  const noteText = b.note ? ` - ${b.note}` : '';

  label.textContent = labelText + noteText;
  label.prepend(checkbox);

  container.appendChild(label);
}


const input = document.getElementById('gradeTagsInput');
const container = document.getElementById('gradeTagsContainer');
const hidden = document.getElementById('bookGrade');
const tags = new Set();

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const raw = input.value.trim().replace(/[״"׳']/g, '');
    const tag = raw.replace(/\s+/g, '');

    if (tag && !tags.has(tag)) {
      tags.add(tag);
      renderTags();
    }

    input.value = '';
  }
});

function renderTags() {
  container.innerHTML = '';
  tags.forEach(tag => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.innerHTML = `${tag} <span class="remove">×</span>`;
    el.querySelector('.remove').addEventListener('click', () => {
      tags.delete(tag);
      renderTags();
    });
    container.appendChild(el);
  });

  // שמירה לשדה הסמוי בפורמט CSV
  hidden.value = Array.from(tags).join(', ');
}

async function returnBook() {
  const selectedPairs = Array.from(document.querySelectorAll('#returnBooksSelect input[type="checkbox"]:checked'))
    .map(cb => cb.value.split('|'))
    .filter(arr => arr.length === 2);

  if (selectedPairs.length === 0) {
    showError("בחר ספרים להחזרה");
    return;
  }

  loading = document.getElementById('globalLoading');

  const returnDate = new Date().toISOString();
  const bulkId = `return-${Date.now()}`;
  const year = 2026;

  for (const [borrowId, bookId] of selectedPairs) {
    const entry = borrowed.find(b => b.id === borrowId);
    if (!entry) continue;

    const bookIdx = entry.bookIds.findIndex((id, idx) => id === bookId && entry.returned[idx] === false);
    if (bookIdx === -1) continue;

    // עדכון לוגי
    entry.returned[bookIdx] = true;

    const book = books.find(bk => bk.id === bookId);
    if (!book) continue;
    const student = students.find(st => st.id === entry.studentId);

    const returnRecord = {
      year,
      id: entry.id,
      student: {
        id: student.id,
        name: student.name,
        school: student.school,
        classroom: student.classroom,
        inLoanProject: student.inLoanProject
      },
      studentId: student.id,
      book: {
        id: book.id,
        name: book.name,
        subject: book.subject,
        grade: book.grade,
        level: book.level,
        volume: book.volume,
        publisher: book.publisher,
        type: book.type,
        note: book.note,
        price: book.price
      },
      bookId: book.id,
      returnDate,
      bulkId,
      borrowerType: 'student',
      borrowerName: student.name
    };

    const alreadyReturned = returned.some(r => r.id === entry.id && r.book?.id === bookId);
    if (!alreadyReturned) {
      returned.push(returnRecord);

      // ✅ שליחה גם לשרת
      try {
        const res = await fetch(`/api/${year}/returned`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...userIdHeader },
          body: JSON.stringify(returnRecord)
        });
        if (!res.ok) throw new Error("שגיאה בשמירת החזרה לשרת");
      } catch (err) {
        console.error("❌ שגיאה בשמירת החזרה לשרת:", err);
        alert("שגיאה בשמירת החזרה לשרת");
      }
    }

    // עדכון מלאי
    book.stockCount = (Number(book.stockCount) || 0) + 1;

    // עדכון Borrowed בשרת
    try {
      const res = await fetch(`/api/${year}/borrowed/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...userIdHeader },
        body: JSON.stringify(entry)
      });
      if (!res.ok) throw new Error("שגיאה בעדכון Borrowed");
    } catch (err) {
      console.error("❌ שגיאה בעדכון Borrowed:", err);
      alert("שגיאה בעדכון Borrowed");
    }
  }

  showSuccess("הספרים הוחזרו בהצלחה");
  renderBookTable();
  renderStudentTable();
  filterStudentsReturn();
  loading.style.display = 'none';
}



function showError(msg) {
  console.error(msg);
  alert(`❌ ${msg}`);
}



function closeBorrowModal() {
  document.getElementById('confirmBorrowModal').style.display = 'none';
}

async function deleteStudentFromTable(index) {
  if (index < 0 || !students[index]) return;

  const student = students[index];
  if (!confirm(`האם למחוק את התלמיד ${student.name}?`)) return;

  try {
    const res = await fetch(`/api/2026/students/${student.id}`, {
      method: 'DELETE',
      headers: { ...userIdHeader }
    });

    if (!res.ok) throw new Error("שגיאה במחיקה");

    students.splice(index, 1);
    borrowed = borrowed.filter(b => b?.studentId !== student.id);
    returned = returned.filter(r => r?.studentId !== student.id);
    charges = charges.filter(c => c?.studentId !== student.id);

    renderStudentTable();
    filterStudents();
    showSuccess("✔️ התלמיד נמחק");
  } catch (err) {
    console.error(err);
    alert("שגיאה במחיקת תלמיד");
  }
}


function deleteSelectedBook() {
  const idx = document.getElementById('filteredBooksSelect').value;
  if (idx === '') return alert("בחר ספר למחיקה");
  if (!confirm("האם אתה בטוח שברצונך למחוק את הספר?")) return;
  books.splice(idx, 1);
  saveData();
  showSuccess("ספר נמחק");
  filterBooks();
}


let selectedBulkBookIds = new Set(); // 🧠 משתנה גלובלי לזכירת ספרים שנבחרו

function selectAllFilteredBulkBooks() {
  const checkboxes = document.querySelectorAll('#bulkBooksSelect input[type=checkbox]');
  checkboxes.forEach(cb => {
    cb.checked = true;
    selectedBulkBookIds.add(cb.value);
  });
}

function deselectAllFilteredBulkBooks() {
  const checkboxes = document.querySelectorAll('#bulkBooksSelect input[type=checkbox]');
  checkboxes.forEach(cb => {
    cb.checked = false;
    selectedBulkBookIds.delete(cb.value);
  });
}

function initializeCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const dpi = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpi;
  canvas.height = rect.height * dpi;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpi, dpi);

  // מניעת מחוות swipe וגלילה
  canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchend', e => e.preventDefault(), { passive: false });
}

function enableFullscreenOnCanvas(canvasId, containerId) {
  const container = document.getElementById(containerId);
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  canvas.addEventListener('mousedown', async () => {
    if (document.fullscreenElement) return;

    container.classList.add('fullscreen-signature');
    try {
      await container.requestFullscreen();
      setTimeout(() => resizeCanvasForFullscreen(canvas, ctx), 100);
    } catch (err) {
      console.warn('מסך מלא נכשל:', err);
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      container.classList.remove('fullscreen-signature');
      resizeCanvasToDefault(canvas, ctx);
    }
  });

  function resizeCanvasForFullscreen(canvas, ctx) {
    const dpi = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpi;
    canvas.height = window.innerHeight * 0.6 * dpi;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpi, dpi);
  }

  function resizeCanvasToDefault(canvas, ctx) {
    const dataURL = canvas.toDataURL();
    const img = new Image();
    img.onload = () => {
      const rect = canvas.getBoundingClientRect();
      const dpi = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpi;
      canvas.height = rect.height * dpi;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpi, dpi);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = dataURL;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (students && students.length) {
    filterStudents();
  } else {
    setTimeout(() => {
      if (students && students.length) filterStudents();
    }, 500);
  }

  const studentSelect = document.getElementById('filteredStudentsSelect');
  studentSelect.addEventListener('change', () => {
    updateBorrowPurchaseButtons();
    filterBooksBorrow();
  });
});


window.addEventListener('DOMContentLoaded', () => {
  initializeCanvas('signaturePad');
  initializeCanvas('bulkSignaturePad');
  enableFullscreenOnCanvas('signaturePad', 'signatureContainer');
  enableFullscreenOnCanvas('bulkSignaturePad', 'bulkSignatureContainer');
});

document.getElementById('filteredStudentsSelect').addEventListener('change', (e) => {
  const index = e.target.value;
  filterBooks();           // לעדכון רשימת ספרים להשאלה
  updateReturnBooks(index); // לעדכון רשימת ספרים להחזרה
});

const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const tabId = button.getAttribute('data-tab');

    // שמירת הלשונית הנבחרת ב-localStorage
    localStorage.setItem('activeTabId', tabId);

    // הסתרת כל הטאבים
    tabContents.forEach(tc => tc.classList.remove('active'));
    // ביטול סלקטיב של כל הכפתורים
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });

    // הצגת הטאב שנבחר
    document.getElementById(tabId).classList.add('active');
    button.classList.add('active');
    button.setAttribute('aria-selected', 'true');
  });
});

function getCurrentTabId() {
  return localStorage.getItem('activeTabId');
}

// טעינת הטאב הפעיל מ-localStorage בעת טעינת הדף
window.addEventListener('DOMContentLoaded', () => {
  const savedTabId = localStorage.getItem('activeTabId');
  if (savedTabId && document.getElementById(savedTabId)) {
    // הסרת ה-active מכל הטאבים והכפתורים
    tabContents.forEach(tc => tc.classList.remove('active'));
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });

    // הפעלת הטאב השמור
    document.getElementById(savedTabId).classList.add('active');
    const btn = Array.from(tabButtons).find(b => b.getAttribute('data-tab') === savedTabId);
    if (btn) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    }
  } else {
    // אין טאב שמור, הפעל את הראשון כברירת מחדל
    tabButtons[0].click();
  }
});

function importExcel(event, type) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const headers = rows[0];
    const dataRows = rows.slice(1);

    if (type === 'students') {
      const idx = {
        name: headers.indexOf("שם מלא"),
        id: headers.indexOf("תעודת זהות"),
        school: headers.indexOf("בית ספר"),
        classroom: headers.indexOf("כיתה"),
        inLoanProject: headers.indexOf("משתתף בפרויקט השאלת ספרים"),
        note: headers.indexOf("הערות")
      };

      let addedCount = 0;
      let updatedCount = 0;

      dataRows.forEach(row => {
        const name = idx.name !== -1 ? row[idx.name]?.toString().trim() || "" : "";
        const id = idx.id !== -1 ? row[idx.id]?.toString().trim() || "" : "";
        const school = idx.school !== -1 ? row[idx.school]?.toString().trim() || null : null;
        const classroom = idx.classroom !== -1 ? row[idx.classroom]?.toString().trim() || "" : "";
        const note = idx.note !== -1 ? row[idx.note]?.toString().trim() || null : null;
        const inLoanProjectRaw = idx.inLoanProject !== -1 ? row[idx.inLoanProject]?.toString().trim() : null;
        const inLoanProject = inLoanProjectRaw === 'כן' || inLoanProjectRaw === 'true';

        // שדות חובה: שם, ת"ז, כיתה
        if (name && id && classroom) {
          const existingStudent = students.find(s => s.id === id);
          if (existingStudent) {
            if (name) existingStudent.name = name;
            if (school) existingStudent.school = school;
            if (classroom) existingStudent.classroom = classroom;
            if (note) existingStudent.note = note;
            if (inLoanProjectRaw !== null) {
              existingStudent.inLoanProject = inLoanProject;
            }
            updatedCount++;
          } else {
            students.push({
              id,
              name,
              school: school || "",
              classroom,
              inLoanProject,
              note: note || "",
              email: "",
              borrowedBooks: []
            });
            addedCount++;
          }
        }
      });

      showSuccess(`ייבוא תלמידים הצליח ✅ נוספו ${addedCount}, עודכנו ${updatedCount}.`);
    }

    else if (type === 'books') {
      const idx = {
        name: headers.indexOf("שם הספר"),
        subject: headers.indexOf("מקצוע"),
        grade: headers.indexOf("שכבת גיל"),
        level: headers.indexOf("רמת לימוד"),
        volume: headers.indexOf("כרך"),
        publisher: headers.indexOf("שם הוצאה"),
        type: headers.indexOf("סוג ספר"),
        note: headers.indexOf("הערות"),
        price: headers.indexOf("עלות"),
        stockCount: headers.indexOf("כמות במלאי") // ✅ חדש
      };

      let addedBooks = 0;

      dataRows.forEach(row => {
        const name = idx.name !== -1 ? row[idx.name]?.toString().trim() || "" : "";
        const subject = idx.subject !== -1 ? row[idx.subject]?.toString().trim() || "" : "";
        const grade = idx.grade !== -1 ? row[idx.grade]?.toString().trim() || "" : "";
        const level = idx.level !== -1 ? row[idx.level]?.toString().trim() || "כללי" : "כללי";
        const volume = idx.volume !== -1 ? row[idx.volume]?.toString().trim() || "" : "";
        const publisher = idx.publisher !== -1 ? row[idx.publisher]?.toString().trim() || "" : "";
        const typeValue = idx.type !== -1 ? row[idx.type]?.toString().trim() || "" : "";
        const note = idx.note !== -1 ? row[idx.note]?.toString().trim() || "" : "";

        // מחיר
        const priceRaw = idx.price !== -1 ? row[idx.price] : null;
        const price = priceRaw !== null && priceRaw !== undefined && priceRaw !== ""
          ? parseFloat(priceRaw)
          : null;

        // ✅ כמות במלאי
        const stockRaw = idx.stockCount !== -1 ? row[idx.stockCount] : null;
        const stockCount = stockRaw !== null && stockRaw !== undefined && stockRaw !== ""
          ? parseInt(stockRaw, 10)
          : 0;

        const alreadyExists = books.some(b =>
          b.name === name &&
          b.subject === subject &&
          b.grade === grade &&
          b.level === level &&
          b.volume === volume &&
          b.publisher === publisher &&
          b.type === typeValue
        );

        if (name && subject && grade && !alreadyExists) {
          books.push({
            id: crypto.randomUUID(),
            name,
            subject,
            grade,
            level,
            volume,
            publisher,
            type: typeValue,
            note,
            price,
            stockCount   // ✅ שמירה
          });
          addedBooks++;
        }
      });

      showSuccess(`ייבוא ספרים הצליח ✅ נוספו ${addedBooks} ספרים חדשים.`);
      filterBooks();
      renderBookTable(1); // ריענון מיידי
    }

    saveData();
    filterStudents();
    filterBooks();
    renderBookTable(1);
  };

  reader.readAsArrayBuffer(event.target.files[0]);
}



function updateReturnBooks(studentIdx) {
  const container = document.getElementById('returnBooksSelect');
  container.innerHTML = '';

  if (!studentIdx) return;
  const student = students[studentIdx];
  if (!student) return;

  const search = document.getElementById('searchBookInputReturn')?.value.toLowerCase() || '';
  const levelFilter = document.getElementById('levelFilterReturn')?.value || '';

  const normalize = str => (str || '').trim();

  const levelGroups = {
    "הקבצה א": ["הקבצה א", "הקבצה א ו-א מואצת"],
    "הקבצה א מואצת": ["הקבצה א מואצת", "הקבצה א ו-א מואצת"],
    "הקבצה א ו-א מואצת": ["הקבצה א", "הקבצה א מואצת", "הקבצה א ו-א מואצת"]
  };

  let results = [];

  borrowed.forEach(b => {
    if (b.studentId !== student.id) return;

    b.bookIds.forEach((bookId, idx) => {
      // דילוג אם הספר כבר הוחזר לפי אחד מהמנגנונים
      if (b.returned[idx]) return;
      if (returned.some(r => r.id === b.id && r.bookId === bookId)) return;
      if (charges.some(c => c.studentId === student.id && c.borrowId === b.id && c.bookId === bookId)) return;

      const book = books.find(bk => bk.id === bookId);
      if (!book) return;

      const name = book.name?.toLowerCase() || '';
      const subject = book.subject?.toLowerCase() || '';
      const publisher = book.publisher?.toLowerCase() || '';
      const note = book.note?.toLowerCase() || '';
      const level = book.level || '';

      const matchSearch =
        name.includes(search) ||
        subject.includes(search) ||
        publisher.includes(search) ||
        note.includes(search);

      let matchLevel = true;
      if (levelFilter !== '') {
        const selectedGroup = levelGroups[normalize(levelFilter)] || [normalize(levelFilter)];
        matchLevel = selectedGroup.includes(normalize(level));
      }

      if (matchSearch && matchLevel) {
        results.push({ borrowId: b.id, bookId, book });
      }
    });
  });

  if (results.length === 0) {
    container.innerHTML = '<p>אין ספרים להחזרה</p>';
    return;
  }

  results.forEach((entry, i) => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = `${entry.borrowId}|${entry.bookId}`;
    checkbox.id = 'return_' + i;

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = `${entry.book.name} (${entry.book.subject}) - רמה: ${entry.book.level || 'כללי'}${entry.book.note ? ` – ${entry.book.note}` : ''}`;
    label.prepend(checkbox);

    container.appendChild(label);
  });
}

async function createCluster() {
  const name = document.getElementById('clusterNameInput').value.trim();

  if (!name || selectedGrades.length === 0 || selectedBookIdsForCluster.size === 0) {
    alert("יש למלא את כל השדות ולבחור ספרים");
    return;
  }

  const newCluster = {
    name,
    grades: [...selectedGrades],
    bookIds: Array.from(selectedBookIdsForCluster)
  };

  try {
    const res = await fetch('/api/2026/clusters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...userIdHeader },
      body: JSON.stringify(newCluster)
    });
    if (!res.ok) throw new Error("שגיאה ביצירת סט חדש");

    const savedCluster = await res.json();
    clusters.push(savedCluster);
    renderClusterTable();
    showSuccess("✔️ סט חדש נוצר");

    // איפוס
    document.getElementById('clusterNameInput').value = '';
    selectedGrades = [];
    renderGradeTags();
    selectedBookIdsForCluster.clear();
    renderFloatingBookTags();

  } catch (err) {
    console.error("❌ createCluster:", err);
    alert("שגיאה ביצירת סט בשרת");
  }
}

function loadClustersFromServer() {
  fetch('/api/2026/clusters')
    .then(r => {
      if (!r.ok) throw new Error('שגיאה בטעינת הסטים');
      return r.json();
    })
    .then(data => {
      clusters.length = 0;
      clusters.push(...data);
      renderClusterTable();
    })
    .catch(err => {
      console.error(err);
      alert('❌ שגיאה בטעינת הסטים מהשרת');
    });
}


function renderFloatingBookTags() {
  const container = document.getElementById('floatingBookTagContainer');
  const search = document.getElementById('clusterBookSearch').value.toLowerCase();
  container.innerHTML = '';

  const filtered = books.filter(b => {
    if (!search) return true;
    return [b.name, b.subject, b.grade, b.level, b.publisher, b.type]
      .some(x => (x || '').toLowerCase().includes(search));
  });

  filtered.forEach(b => {
    const tag = document.createElement('span');
    const selected = selectedBookIdsForCluster.has(b.id);

    tag.textContent = b.name;
    tag.style.padding = '5px 10px';
    tag.style.border = '1px solid #aaa';
    tag.style.borderRadius = '10px';
    tag.style.cursor = 'pointer';
    tag.style.backgroundColor = selected ? '#d0f0d0' : '#f0f0f0';

    tag.onclick = () => {
      if (selected) selectedBookIdsForCluster.delete(b.id);
      else selectedBookIdsForCluster.add(b.id);
      renderFloatingBookTags();
    };

    container.appendChild(tag);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderFloatingBookTags();
});


function renderClusterTable() {
  const table = document.getElementById('clusterTable');
  const tbody = table.querySelector('tbody');

  // ניקוי הטבלה
  tbody.innerHTML = '';

  // סינון לפי חיפוש (אפשר להוסיף לפי הצורך)
  const search = document.getElementById('clusterTableSearch').value.toLowerCase();

  // סינון הסטים לפי שם הסט או שמות הספרים
  const filteredClusters = clusters.filter(cluster => {
    const clusterName = (cluster.name || '').toLowerCase();
    const bookNames = cluster.bookIds
      .map(id => {
        const book = books.find(b => b.id === id);
        return book ? book.name.toLowerCase() : '';
      })
      .join(' ');
    return clusterName.includes(search) || bookNames.includes(search);
  });

  // ✅ תוספת: לעדכן לכל סט את שכבות הגיל של הספרים שבו (אם חסר)
  filteredClusters.forEach(cluster => {
    fillClusterGradesFromBooks(cluster);
  });

  filteredClusters.forEach(cluster => {
    const tr = document.createElement('tr');

    // חיבור שמות הספרים לשרשור, מגביל להצגה ל-3 ספרים עם נקודות רלימיט
    const bookNamesList = cluster.bookIds
      .map(id => {
        const book = books.find(b => b.id === id);
        return book ? book.name : '';
      })
      .filter(n => n !== '');

    let displayedBooks = bookNamesList.slice(0, 3).join(', ');
    if (bookNamesList.length > 3) {
      displayedBooks += ', ...';
    }

    // שכבות גיל מצורפות במחרוזת עם פסיקים
    const gradesStr = (cluster.grades || []).join(', ');

    tr.innerHTML = `
      <td style="padding: 8px; text-align: center; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cluster.name}</td>
      <td style="padding: 8px; text-align: center; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${gradesStr}</td>
      <td style="padding: 8px; text-align: center; max-width: 60px;">${cluster.bookIds.length}</td>
      <td style="padding: 8px; text-align: center; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayedBooks}</td>
      <td style="justify-content: center; padding: 8px; text-align: center; display: flex; gap:10px;">
<button onclick="openEditClusterModal('${cluster.id}')" title="ערוך סט"><i class="fas fa-pencil"></i></button>
    <button onclick="openAddBooksModal('${cluster.id}')" title="הוסף ספרים לסט"><i class="fas fa-plus"></i></button>
    <button class="deleteBtn" onclick="openRemoveBooksModal('${cluster.id}')" title="הסר ספרים מהסט"><i class="fas fa-minus"></i></button>
    <button onclick="deleteCluster('${cluster.id}')" class="deleteBtn" title="מחק סט"><i class="fas fa-trash"></i></button>
      </td>
    `;

    tr.style.borderBottom = '1px solid #ddd';

    tbody.appendChild(tr);
  });

  // אפשר להוסיף כאן count / סטטוס אם תרצה, למשל:
  const countElement = document.getElementById('clusterTableCount');
  if (countElement) {
    countElement.textContent = `סך הכל: ${filteredClusters.length} סטים`;
  }
}

let editingClusterId2 = null;

function openAddBooksModal(clusterId) {
  editingClusterId2 = clusterId;
  document.getElementById('addBooksModal').style.display = 'flex';
  renderAddBooksList();
}

function closeAddBooksModal() {
  document.getElementById('addBooksModal').style.display = 'none';
}

function openRemoveBooksModal(clusterId) {
  editingClusterId2 = clusterId;
  document.getElementById('removeBooksModal').style.display = 'flex';
  renderRemoveBooksList();
}

function closeRemoveBooksModal() {
  document.getElementById('removeBooksModal').style.display = 'none';
}


// ✅ תוספת: פונקציה שמאחדת שכבות גיל מהספרים בסט
function fillClusterGradesFromBooks(cluster) {
  if (!cluster.grades) {
    cluster.grades = [];
  }
  cluster.bookIds.forEach(id => {
    const book = books.find(b => b.id === id);
    if (book && Array.isArray(book.grades)) {
      book.grades.forEach(grade => {
        if (!cluster.grades.includes(grade)) {
          cluster.grades.push(grade);
        }
      });
    }
  });
}

function renderAddBooksList() {
  const cluster = clusters.find(c => c.id === editingClusterId2);
  if (!cluster) return;

  const search = document.getElementById('addBooksSearch').value.toLowerCase();
  const listEl = document.getElementById('addBooksList');
  listEl.innerHTML = '';

  // ספרים שלא בסט
  const availableBooks = books.filter(b =>
    !cluster.bookIds.includes(b.id) &&
    (b.name.toLowerCase().includes(search) || (b.subject || '').toLowerCase().includes(search))
  );

  availableBooks.forEach(book => {
    const btn = document.createElement('button');
    btn.textContent = book.name;
    btn.style.cssText = 'margin:3px;padding:5px 10px;';
    btn.onclick = () => addBookToCluster(book.id);
    listEl.appendChild(btn);
  });
}

function renderRemoveBooksList() {
  const cluster = clusters.find(c => c.id === editingClusterId2);
  if (!cluster) return;

  const search = document.getElementById('removeBooksSearch').value.toLowerCase();
  const listEl = document.getElementById('removeBooksList');
  listEl.innerHTML = '';

  // ספרים שכבר בסט
  const includedBooks = cluster.bookIds
    .map(id => books.find(b => b.id === id))
    .filter(b => b && b.name.toLowerCase().includes(search));

  includedBooks.forEach(book => {
    const btn = document.createElement('button');
    btn.textContent = book.name;
    btn.style.cssText = 'margin:3px;padding:5px 10px;';
    btn.onclick = () => removeBookFromCluster(book.id);
    listEl.appendChild(btn);
  });
}

async function addBookToCluster(bookId) {
  const cluster = clusters.find(c => c.id === editingClusterId2);
  if (!cluster || cluster.bookIds.includes(bookId)) return;

  cluster.bookIds.push(bookId);
  fillClusterGradesFromBooks(cluster);

  try {
    await fetch(`/api/2026/clusters/${cluster.id}`, {   // 👈 במקום _id
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...userIdHeader },
      body: JSON.stringify(cluster)
    });

    renderClusterTable();
    renderAddBooksList();
  } catch (err) {
    console.error("❌ addBookToCluster:", err);
    alert("שגיאה בעדכון הסט");
  }
}

async function removeBookFromCluster(bookId) {
  const cluster = clusters.find(c => c.id === editingClusterId2);
  if (!cluster) return;

  cluster.bookIds = cluster.bookIds.filter(id => id !== bookId);

  try {
    await fetch(`/api/2026/clusters/${cluster.id}`, {   // 👈
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...userIdHeader },
      body: JSON.stringify(cluster)
    });

    renderClusterTable();
    renderRemoveBooksList();
  } catch (err) {
    console.error("❌ removeBookFromCluster:", err);
    alert("שגיאה בעדכון הסט");
  }
}


let editingClusterId = null; // מזהה הסט שאותו עורכים (יכול להיות ID או אינדקס)

function openEditClusterModal(clusterId) {
  // נמצא את הסט שרוצים לערוך לפי ה-id (תתאים למבנה הנתונים שלך)
  const cluster = clusters.find(c => c.id === clusterId);
  if (!cluster) return;

  editingClusterId = clusterId;

  document.getElementById('editClusterName').value = cluster.name;

  // נטען תגיות של שכבות גיל
  renderEditClusterGradeTags(cluster.grades);

  document.getElementById('editClusterModal').style.display = 'flex';
}

let currentEditClusterGrades = [];

function renderEditClusterGradeTags(initialGrades) {
  if (initialGrades) {
    currentEditClusterGrades = [...initialGrades];
  }
  // נקה תגיות ישנות (חוץ מה-input)
  editClusterGradeTags.querySelectorAll('.tag').forEach(tag => tag.remove());

  currentEditClusterGrades.forEach(grade => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = grade;
    tag.style.cssText = `
      background: #007bff;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      user-select: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
    `;

    // כפתור סגירה לתגית
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      line-height: 1;
      padding: 0;
    `;
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      removeEditGrade(grade);
    };

    tag.appendChild(closeBtn);
    editClusterGradeTags.insertBefore(tag, editClusterGradeInput);
  });
}

function removeEditGrade(grade) {
  currentEditClusterGrades = currentEditClusterGrades.filter(g => g !== grade);
  renderEditClusterGradeTags();
}

editClusterGradeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const value = e.target.value.trim();
    if (value && !currentEditClusterGrades.includes(value)) {
      currentEditClusterGrades.push(value);
      e.target.value = '';
      renderEditClusterGradeTags();
    }
    e.preventDefault();
  }
});

function closeEditClusterModal() {
  document.getElementById('editClusterModal').style.display = 'none';
  editingClusterId = null;
}

async function saveEditedCluster() {
  const newName = document.getElementById('editClusterName').value.trim();
  if (!newName) {
    alert("יש להזין שם סט");
    return;
  }

  const cluster = clusters.find(c => c.id === editingClusterId);
  if (!cluster) return;

  const updated = { ...cluster, name: newName, grades: currentEditClusterGrades };

  try {
    const res = await fetch(`/api/2026/clusters/${cluster.id}`, {   // 👈
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...userIdHeader },
      body: JSON.stringify(updated)
    });

    if (!res.ok) throw new Error("שגיאה בעדכון סט");

    const saved = await res.json();
    const idx = clusters.findIndex(c => c.id === editingClusterId);
    clusters[idx] = saved;

    renderClusterTable();
    closeEditClusterModal();
    showSuccess("✔️ הסט עודכן");

  } catch (err) {
    console.error("❌ saveEditedCluster:", err);
    alert("שגיאה בעדכון הסט");
  }
}

async function deleteCluster(clusterId) {
  if (!confirm("האם אתה בטוח שברצונך למחוק את הסט?")) return;

  const cluster = clusters.find(c => c.id === clusterId);
  if (!cluster) return alert("❌ לא נמצא הסט למחיקה");

  try {
    const res = await fetch(`/api/2026/clusters/${cluster.id}`, {   // 👈
      method: 'DELETE',
      headers: { ...userIdHeader }
    });

    if (!res.ok) throw new Error("שגיאה במחיקה");

    clusters = clusters.filter(c => c.id !== clusterId);
    renderClusterTable();
    showSuccess("✔️ הסט נמחק");

  } catch (err) {
    console.error("❌ deleteCluster:", err);
    alert("שגיאה במחיקת הסט מהשרת");
  }
}



// מאזינים לאירועים בלשונית החזרה – חשוב מאוד להאזין ל-SELECT הנכון!
document.getElementById('searchStudentInputReturn').addEventListener('input', () => {
  filterStudentsReturn();
});
document.getElementById('filteredStudentsSelectReturn').addEventListener('change', (e) => {
  updateReturnBooks(e.target.value);
});
document.getElementById('searchBookInputReturn').addEventListener('input', () => {
  // כאן נעדכן עם הפרמטר האחרון שנבחר ב-select
  const select = document.getElementById('filteredStudentsSelectReturn');
  updateReturnBooks(select ? select.value : '');
});
document.getElementById('levelFilterReturn').addEventListener('change', () => {
  const select = document.getElementById('filteredStudentsSelectReturn');
  updateReturnBooks(select ? select.value : '');
});

// קריאה ראשונית לטעינת התלמידים בלשונית החזרה
window.addEventListener('DOMContentLoaded', () => {
  loadData().then(() => {
    filterStudentsReturn();
  });
});


document.getElementById('studentTableSearch').addEventListener('input', () => renderStudentTable(1));
document.getElementById('filterGrade').addEventListener('change', () => renderStudentTable(1));
document.getElementById('filterClassroom').addEventListener('input', () => renderStudentTable(1));
document.getElementById('filterSubject').addEventListener('input', () => renderStudentTable(1));
document.getElementById('filterLevel').addEventListener('change', () => renderStudentTable(1));
document.getElementById('filterInLoanProject').addEventListener('change', () => renderStudentTable(1));

document.getElementById('bookTableSearch').addEventListener('input', () => renderBookTable(1));
document.getElementById('bookLevelFilter').addEventListener('change', () => renderBookTable(1));
document.getElementById('bookVolumeFilter').addEventListener('change', () => renderBookTable(1));
document.getElementById('bookPublisherFilter').addEventListener('input', () => renderBookTable(1));
document.getElementById('bookTypeFilter').addEventListener('change', () => renderBookTable(1));

// קריאות התחלתיות (אם יש)
renderStudentTable();
renderBookTable();

console.log("editBook loaded");

// js for the map
async function loadGoogleMapAPI() {
  const res = await fetch('/maps/getAPIKey');
  const data = await res.json();
  const googleApiKey = data.key;
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&callback=initMap&loading=async`;
  script.async = true;
  document.head.appendChild(script);
}

loadGoogleMapAPI();

let map, geocoder;
let markers = {}; // id -> marker

async function initMap() {
  geocoder = new google.maps.Geocoder();

  const defaultLocation = { lat: 31.89205, lng: 34.79928 };
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 16,
  });

  // טוען היסטוריית חיפושים מהשרת
  loadSearchHistory();
}

document.getElementById("addressInput").addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const address = e.target.value.trim();
    if (address) {
      await searchAddress(address);
      e.target.value = ""; // מנקה את התיבה אחרי חיפוש
    }
  }
});

async function searchAddress(address) {
  geocoder.geocode({ address }, async (results, status) => {
    if (status === "OK" && results[0]) {
      const location = results[0].geometry.location;
      map.setCenter(location);

      try {
        // שולחים לשרת לשמירה ומחכים לתשובה
        const saved = await saveAddress(address, location.lat(), location.lng());

        // מוסיפים מרקר אם הצליח
        if (saved && saved._id) {
          addMarker(saved._id, saved.title, saved.lat, saved.lng);
          loadSearchHistory(); // מרענן רשימה בצד
        }
      } catch (err) {
        console.error("❌ שגיאה בשמירת כתובת:", err);
      }
    } else {
      alert("לא נמצאה הכתובת, נסה שוב");
    }
  });
}

async function loadSearchHistory() {
  try {
    const res = await fetch("/api/addresses");
    const addresses = await res.json();
    const container = document.getElementById("searchHistory");
    container.innerHTML = "";

    addresses.forEach(addr => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span style="cursor:pointer; color:blue; text-decoration:underline;">
          ${addr.title}
        </span>
        <button onclick="deleteAddress('${addr._id}')">🗑</button>
      `;

      // בלחיצה על שם כתובת → מזיז את המפה
      li.querySelector("span").onclick = () => {
        if (markers[addr._id]) {
          map.panTo(markers[addr._id].getPosition());
          map.setZoom(17);
        }
      };

      container.appendChild(li);

      // אם אין כבר מרקר לכתובת – נוסיף
      if (!markers[addr._id]) {
        addMarker(addr._id, addr.title, addr.lat, addr.lng);
      }
    });
  } catch (err) {
    console.error("❌ loadSearchHistory error:", err);
  }
}

function addMarker(id, title, lat, lng) {
  const marker = new google.maps.Marker({
    map,
    position: { lat, lng },
    title,
  });
  markers[id] = marker;
}

async function saveAddress(title, lat, lng) {
  const res = await fetch("/api/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, lat, lng }),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

async function deleteAddress(id) {
  await fetch(`/api/addresses/${id}`, { method: "DELETE" });

  if (markers[id]) {
    markers[id].setMap(null);
    delete markers[id];
  }

  loadSearchHistory();
}



function openPopup() {
  document.getElementById("videoPopup").style.display = "flex";
}

function closePopup() {
  document.getElementById("videoPopup").style.display = "none";
}