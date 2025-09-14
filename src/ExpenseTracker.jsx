
import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

import autoTable from "jspdf-autotable";

export default function ExpenseTracker() {
  const [budget, setBudget] = useState(() => {
    const fromStorage = localStorage.getItem("budget");
    return fromStorage ? Number(fromStorage) : 5000;
  });

  const [balance, setBalance] = useState(budget);
  const [expenses, setExpenses] = useState(() => {
    const fromStorage = localStorage.getItem("expenses");
    return fromStorage ? JSON.parse(fromStorage) : [];
  });

  const [form, setForm] = useState({
    item: "",
    price: "",
    category: "Groceries",
  });
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Recompute balance whenever budget or expenses change
    const spent = expenses.reduce((s, e) => s + Number(e.price), 0);
    setBalance(Number(budget) - spent);

    localStorage.setItem("budget", String(budget));
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [budget, expenses]);

  const categories = ["Groceries", "Vegetables", "Home", "Transport", "Other"];

  function handleInputChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function addExpense() {
    if (!form.item.trim() || !form.price)
      return alert("Please enter item and price");
    if (Number(form.price) <= 0) return alert("Price must be greater than 0");

    const newExp = {
      id: Date.now(),
      item: form.item.trim(),
      price: Number(form.price),
      category: form.category,
      date: new Date().toLocaleDateString(),
    };

    setExpenses((prev) => [newExp, ...prev]);
    setForm({ item: "", price: "", category: "Groceries" });
  }

  function removeExpense(id) {
    const toRemove = expenses.find((e) => e.id === id);
    if (!toRemove) return;
    if (!confirm(`Delete '${toRemove.item}' of ₹${toRemove.price}?`)) return;
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function openEdit(exp) {
    setEditingId(exp.id);
    setForm({
      item: exp.item,
      price: String(exp.price),
      category: exp.category,
    });
    setShowEditModal(true);
  }

  function saveEdit() {
    if (!form.item.trim() || !form.price)
      return alert("Please enter item and price");
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === editingId
          ? {
              ...e,
              item: form.item.trim(),
              price: Number(form.price),
              category: form.category,
            }
          : e
      )
    );
    setEditingId(null);
    setShowEditModal(false);
    setForm({ item: "", price: "", category: "Groceries" });
  }

  function resetMonth() {
    if (!confirm("Reset budget and clear all expenses for the month?")) return;
    setExpenses([]);
    setBudget(0);
  }

  // ✅ Generate PDF with grouped items
  const generateMonthlyPDF = () => {
    const allExpenses = JSON.parse(localStorage.getItem("expenses")) || [];

    if (allExpenses.length === 0) {
      alert("No expenses available for this month!");
      return;
    }

    const doc = new jsPDF();
    const monthName = new Date().toLocaleString("default", { month: "long" });
    const year = new Date().getFullYear();

    doc.setFontSize(18);
    doc.text(`Expense Report - ${monthName} ${year}`, 14, 20);

    // Group by date
    const grouped = allExpenses.reduce((acc, exp) => {
      if (!acc[exp.date]) acc[exp.date] = [];
      acc[exp.date].push(exp);
      return acc;
    }, {});

    let grandTotal = 0;
    let yPos = 30;

    Object.keys(grouped).forEach((date) => {
      const dayItems = grouped[date];
      const dayTotal = dayItems.reduce((sum, item) => sum + (item.price || 0), 0);
      grandTotal += dayTotal;

      doc.setFontSize(14);
      doc.text(`${date} (Total: ₹${dayTotal})`, 14, yPos);
      yPos += 6;

      const rows = dayItems.map((item) => [
        item.item || "Unnamed",
        item.category || "Misc",
        `₹${item.price || 0}`,
      ]);

      autoTable(doc, {
        head: [["Item", "Category", "Amount"]],
        body: rows,
        startY: yPos,
        theme: "striped",
        styles: { fontSize: 12 },
      });

yPos = doc.lastAutoTable.finalY + 10;
    });

    // ✅ Add Grand Total
    doc.setFontSize(16);
    doc.text(`Grand Total: ₹${grandTotal}`, 14, yPos + 10);

    doc.save(`Expense_Report_${monthName}_${year}.pdf`);
  };

  // ✅ Summary grouped by date
  const groupedSummary = expenses.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6">
        <header className="flex items-center justify-between mb-6 ">
          <div>
            <h1 className="text-4xl text-red-700 font-semibold border-b-2">capita...</h1>
            <p className="text-sm text-slate-500">your expense buddy</p>
            <p className="text-sm text-slate-500">
              Keep spending within limits
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">Remaining Purse</div>
            <div
              className={`text-xl font-bold ${
                balance < 0 ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              ₹{balance}
            </div>
            <div className="text-sm text-slate-400">Budget: ₹{budget}</div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 bg-slate-50 rounded-lg p-4">
            <label className="text-sm text-slate-600">Item</label>
            <input
              name="item"
              value={form.item}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-slate-200 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="e.g. Milk, Shampoo"
            />

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-600">Price (₹)</label>
                <input
                  name="price"
                  value={form.price}
                  onChange={handleInputChange}
                  type="number"
                  className="mt-1 block w-full rounded-md border border-slate-200 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-slate-200 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <div className="flex flex-col gap-4">
                <button
                onClick={addExpense}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700"
              >
                Add Expense
              </button>

              <button
                onClick={() => {
                  const val = prompt(
                    "Set monthly purse amount (₹)",
                    String(budget)
                  );
                  if (val === null) return;
                  const num = Number(val);
                  if (isNaN(num)) return alert("Enter a number");
                  setBudget(num);
                }}
                className="px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-slate-50"
              >
                Set Purse
              </button>
              </div>

             <div className="flex flex-col gap-4">
              

              <button
                onClick={generateMonthlyPDF}
                className="px-3 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700"
              >
                Download PDF
              </button>


               <button
                onClick={resetMonth}
                className="px-3 py-2 border rounded-md text-sm text-rose-600 hover:bg-rose-50"
              >
                Reset Month
              </button>
             </div>
            </div>


          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700">Summary</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <div>Total items: {expenses.length}</div>
              <div>
                Spent: ₹{expenses.reduce((s, e) => s + Number(e.price), 0)}
              </div>
              <div>Budget left: ₹{balance}</div>
            </div>

            {/* Per-day totals */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-500">By Date</h4>
              <ul className="mt-2 space-y-1 text-xs">
                {Object.keys(groupedSummary).map((date) => {
                  const total = groupedSummary[date].reduce(
                    (s, e) => s + e.price,
                    0
                  );
                  return (
                    <li key={date} className="flex justify-between">
                      <span>{date}</span>
                      <span>₹{total}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Expenses</h2>

          {expenses.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              No expenses yet — add your first expense.
            </div>
          ) : (
            <ul className="space-y-3">
              {expenses.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between bg-white border rounded-lg p-3 shadow-sm"
                >
                  <div>
                    <div className="font-medium">{e.item}</div>
                    <div className="text-xs text-slate-500">
                      {e.category} · {e.date}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold">₹{e.price}</div>
                    <button
                      onClick={() => openEdit(e)}
                      className="text-xs px-3 py-1 border rounded hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeExpense(e.id)}
                      className="text-xs px-3 py-1 border rounded text-rose-600 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-3">Edit Expense</h3>

              <label className="text-sm text-slate-600">Item</label>
              <input
                name="item"
                value={form.item}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border p-2"
              />

              <label className="text-sm text-slate-600 mt-3 block">Price</label>
              <input
                name="price"
                value={form.price}
                onChange={handleInputChange}
                type="number"
                className="mt-1 block w-full rounded-md border p-2"
              />

              <label className="text-sm text-slate-600 mt-3 block">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border p-2"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingId(null);
                    setForm({ item: "", price: "", category: "Groceries" });
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}











// import React, { useEffect, useState } from "react";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import { motion, AnimatePresence } from "framer-motion";

// export default function ExpenseTracker() {
//   const [budget, setBudget] = useState(() => {
//     const fromStorage = localStorage.getItem("budget");
//     return fromStorage ? Number(fromStorage) : 5000;
//   });

//   const [balance, setBalance] = useState(budget);
//   const [expenses, setExpenses] = useState(() => {
//     const fromStorage = localStorage.getItem("expenses");
//     return fromStorage ? JSON.parse(fromStorage) : [];
//   });

//   const [form, setForm] = useState({
//     item: "",
//     price: "",
//     category: "Groceries",
//   });
//   const [editingId, setEditingId] = useState(null);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [darkMode, setDarkMode] = useState(() => {
//     return localStorage.getItem("theme") === "dark";
//   });

//   useEffect(() => {
//     const spent = expenses.reduce((s, e) => s + Number(e.price), 0);
//     setBalance(Number(budget) - spent);

//     localStorage.setItem("budget", String(budget));
//     localStorage.setItem("expenses", JSON.stringify(expenses));
//     localStorage.setItem("theme", darkMode ? "dark" : "light");
//   }, [budget, expenses, darkMode]);

//   const categories = ["Groceries", "Vegetables", "Home", "Transport", "Other"];

//   function handleInputChange(e) {
//     const { name, value } = e.target;
//     setForm((s) => ({ ...s, [name]: value }));
//   }

//   function addExpense() {
//     if (!form.item.trim() || !form.price) return alert("Please enter item and price");
//     if (Number(form.price) <= 0) return alert("Price must be greater than 0");

//     const newExp = {
//       id: Date.now(),
//       item: form.item.trim(),
//       price: Number(form.price),
//       category: form.category,
//       date: new Date().toLocaleDateString(),
//     };

//     setExpenses((prev) => [newExp, ...prev]);
//     setForm({ item: "", price: "", category: "Groceries" });
//   }

//   function removeExpense(id) {
//     const toRemove = expenses.find((e) => e.id === id);
//     if (!toRemove) return;
//     if (!confirm(`Delete '${toRemove.item}' of ₹${toRemove.price}?`)) return;
//     setExpenses((prev) => prev.filter((e) => e.id !== id));
//   }

//   function openEdit(exp) {
//     setEditingId(exp.id);
//     setForm({
//       item: exp.item,
//       price: String(exp.price),
//       category: exp.category,
//     });
//     setShowEditModal(true);
//   }

//   function saveEdit() {
//     if (!form.item.trim() || !form.price) return alert("Please enter item and price");
//     setExpenses((prev) =>
//       prev.map((e) =>
//         e.id === editingId
//           ? {
//               ...e,
//               item: form.item.trim(),
//               price: Number(form.price),
//               category: form.category,
//             }
//           : e
//       )
//     );
//     setEditingId(null);
//     setShowEditModal(false);
//     setForm({ item: "", price: "", category: "Groceries" });
//   }

//   function resetMonth() {
//     if (!confirm("Reset budget and clear all expenses for the month?")) return;
//     setExpenses([]);
//     setBudget(0);
//   }

//   const generateMonthlyPDF = () => {
//     const allExpenses = JSON.parse(localStorage.getItem("expenses")) || [];
//     if (allExpenses.length === 0) {
//       alert("No expenses available for this month!");
//       return;
//     }

//     const doc = new jsPDF();
//     const monthName = new Date().toLocaleString("default", { month: "long" });
//     const year = new Date().getFullYear();

//     doc.setFontSize(18);
//     doc.text(`Expense Report - ${monthName} ${year}`, 14, 20);

//     const grouped = allExpenses.reduce((acc, exp) => {
//       if (!acc[exp.date]) acc[exp.date] = [];
//       acc[exp.date].push(exp);
//       return acc;
//     }, {});

//     let grandTotal = 0;
//     let yPos = 30;

//     Object.keys(grouped).forEach((date) => {
//       const dayItems = grouped[date];
//       const dayTotal = dayItems.reduce((sum, item) => sum + (item.price || 0), 0);
//       grandTotal += dayTotal;

//       doc.setFontSize(14);
//       doc.text(`${date} (Total: ₹${dayTotal})`, 14, yPos);
//       yPos += 6;

//       const rows = dayItems.map((item) => [item.item || "Unnamed", item.category || "Misc", `₹${item.price || 0}`]);

//       autoTable(doc, {
//         head: [["Item", "Category", "Amount"]],
//         body: rows,
//         startY: yPos,
//         theme: "striped",
//         styles: { fontSize: 12 },
//       });

//       yPos = doc.lastAutoTable.finalY + 10;
//     });

//     doc.setFontSize(16);
//     doc.text(`Grand Total: ₹${grandTotal}`, 14, yPos + 10);

//     doc.save(`Expense_Report_${monthName}_${year}.pdf`);
//   };

//   return (
//     <div className={`${darkMode ? "dark" : ""}`}>
//       <div className="min-h-screen bg-slate-100 dark:bg-gray-900 flex items-start justify-center p-4 md:p-6 transition-colors duration-500">
//         <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6">
//           {/* Header */}
//           <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between mb-6">
//             <div>
//               <h1 className="text-3xl md:text-4xl text-green-700 dark:text-green-400 font-bold">...capita...</h1>
//               <p className="text-sm text-slate-500 dark:text-slate-400">Keep spending within limits</p>
//             </div>
//             <div className="text-right">
//               <div className="text-xs text-slate-500 dark:text-slate-400">Remaining Purse</div>
//               <div className={`text-xl font-bold ${balance < 0 ? "text-rose-500" : "text-emerald-500"}`}>₹{balance}</div>
//               <div className="text-sm text-slate-400 dark:text-slate-500">Budget: ₹{budget}</div>
//               <button onClick={() => setDarkMode(!darkMode)} className="mt-2 px-3 py-1 text-xs rounded bg-slate-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-slate-300 dark:hover:bg-gray-600 transition">
//                 Toggle {darkMode ? "Light" : "Dark"}
//               </button>
//             </div>
//           </motion.header>

//           {/* Budget Input */}
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="mb-6 flex flex-col gap-2 items-end">
//             <input
//               type="number"
//               placeholder="Set Budget"
//               value={budget}
//               onChange={(e) => setBudget(Number(e.target.value))}
//               className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
//             />
//             <div className="">
//               <button onClick={resetMonth} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition mr-4 ">Reset Month</button>
//             <button onClick={generateMonthlyPDF} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">Download PDF</button>
//             </div>
//           </motion.div>

          

//           {/* Expense Form */}
//           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6 flex gap-2 flex-wrap">
//             <input
//               type="text"
//               placeholder="Item"
//               name="item"
//               value={form.item}
//               onChange={handleInputChange}
//               className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
//             />
//             <input
//               type="number"
//               placeholder="Price"
//               name="price"
//               value={form.price}
//               onChange={handleInputChange}
//               className="w-28 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
//             />
//             <select name="category" value={form.category} onChange={handleInputChange} className="px-3 py-2 border rounded dark:bg-gray-700 dark:text-white">
//               {categories.map((cat) => (
//                 <option key={cat} value={cat}>{cat}</option>
//               ))}
//             </select>
//             {editingId ? (
//               <button onClick={saveEdit} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">Save</button>
//             ) : (
//               <button onClick={addExpense} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">Add</button>
//             )}
//           </motion.div>

//           {/* Expense List */}
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
//             <AnimatePresence>
//               {expenses.map((exp) => (
//                 <motion.div key={exp.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="flex justify-between items-center bg-slate-50 dark:bg-gray-700 rounded p-2 mb-2">
//                   <div>
//                     <div className="font-semibold text-gray-800 dark:text-white">{exp.item}</div>
//                     <div className="text-sm text-gray-500 dark:text-gray-300">{exp.category} • {exp.date}</div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <div className="font-bold text-gray-900 dark:text-white">₹{exp.price}</div>
//                     <button onClick={() => openEdit(exp)} className="px-2 py-1 text-xs bg-yellow-500 rounded hover:bg-yellow-600 transition">Edit</button>
//                     <button onClick={() => removeExpense(exp.id)} className="px-2 py-1 text-xs bg-red-500 rounded hover:bg-red-600 transition">Delete</button>
//                   </div>
//                 </motion.div>
//               ))}
//             </AnimatePresence>
//           </motion.div>
//         </div>
//       </div>
//     </div>
//   );
// }
