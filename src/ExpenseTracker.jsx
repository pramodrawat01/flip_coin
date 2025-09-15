
import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { IoWallet } from "react-icons/io5";
import logo from './assets/logo.png'

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

  //  Generate PDF with grouped items
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

    //  Add Grand Total
    doc.setFontSize(16);
    doc.text(`Grand Total: ₹${grandTotal}`, 14, yPos + 10);

    doc.save(`Expense_Report_${monthName}_${year}.pdf`);
  };

  //  Summary grouped by date
  const groupedSummary = expenses.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  return (
  <div className="min-h-screen bg-gray-950 text-gray-200 flex items-start justify-center p-6">
    <div className="w-full max-w-3xl bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-800">

      <header className="flex items-center justify-between mb-6 bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-2xl shadow-lg">

        {/* Left: Logo + Title */}
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">

          {/* Logo */}
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-full shadow-md">

            <img src={logo} alt="logo" className="h-10 w-10 sm:h-18 sm:w-18 object-contain"/>
            
          </div>

          {/* Title + Tagline */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins bg-gradient-to-l from-emerald-400 via-orange-400 to-teal-500 bg-clip-text text-transparent tracking-wide">
              flipCoin
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 italic">
              Your Expense Buddy
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500">
              Keep spending within limits
            </p>
          </div>
        </div>

        {/* Right: Budget + Balance */}
        <div className="text-right">
          <div className="text-[10px] sm:text-xs text-gray-400">Remaining Purse</div>
          <div
            className={`text-lg sm:text-xl font-bold ${
              balance < 0 ? "text-rose-500" : "text-emerald-400"
            }`}
          >
            ₹{balance}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">Budget: ₹{budget}</div>
        </div>
      </header>



      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <label className="text-sm text-gray-300">Item</label>
          <input
            name="item"
            value={form.item}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 text-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. Milk, Shampoo"
          />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-300">Price (₹)</label>
              <input
                name="price"
                value={form.price}
                onChange={handleInputChange}
                type="number"
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 text-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="100"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 text-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between mt-4 gap-2">
            <div className="flex flex-col gap-4">
              <button
                onClick={addExpense}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md shadow hover:bg-emerald-700"
              >
                Add Item
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
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700"
              >
                Set Purse
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={generateMonthlyPDF}
                className="px-3 py-2 bg-emerald-600 text-white rounded-md shadow hover:bg-emerald-700"
              >
                Download PDF
              </button>

              <button
                onClick={resetMonth}
                className="px-3 py-2 border border-rose-600 text-rose-400 rounded-md hover:bg-rose-600 hover:text-white"
              >
                Reset Month
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300">Summary</h3>
          <div className="mt-3 space-y-2 text-sm text-gray-400">
            <div>Total items: {expenses.length}</div>
            <div>
              Spent: ₹{expenses.reduce((s, e) => s + Number(e.price), 0)}
            </div>
            <div>Budget left: ₹{balance}</div>
          </div>

          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-400">By Date</h4>
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
          <div className="p-6 text-center text-gray-500">
            No expenses yet — add your first expense.
          </div>
        ) : (
          <ul className="space-y-3">
            {expenses.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-3 shadow"
              >
                <div>
                  <div className="font-medium">{e.item}</div>
                  <div className="text-xs text-gray-400">
                    {e.category} · {e.date}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold">₹{e.price}</div>
                  <button
                    onClick={() => openEdit(e)}
                    className="text-xs px-3 py-1 border border-gray-700 rounded hover:bg-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeExpense(e.id)}
                    className="text-xs px-3 py-1 border border-rose-600 text-rose-400 rounded hover:bg-rose-600 hover:text-white"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 text-gray-200 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold mb-3">Edit Expense</h3>

            <label className="text-sm text-gray-300">Item</label>
            <input
              name="item"
              value={form.item}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 p-2"
            />

            <label className="text-sm text-gray-300 mt-3 block">Price</label>
            <input
              name="price"
              value={form.price}
              onChange={handleInputChange}
              type="number"
              className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 p-2"
            />

            <label className="text-sm text-gray-300 mt-3 block">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 p-2"
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
                className="px-4 py-2 border border-gray-700 rounded hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
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









