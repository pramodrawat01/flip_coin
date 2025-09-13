import React, { useEffect, useState } from "react";

// Tailwind-styled Expense Tracker
// Single-file React component. Default export.

export default function ExpenseTracker() {
  const [budget, setBudget] = useState(() => {
    const fromStorage = localStorage.getItem("et_budget");
    return fromStorage ? Number(fromStorage) : 5000;
  });

  const [balance, setBalance] = useState(budget);
  const [expenses, setExpenses] = useState(() => {
    const fromStorage = localStorage.getItem("et_expenses");
    return fromStorage ? JSON.parse(fromStorage) : [];
  });

  const [form, setForm] = useState({ item: "", price: "", category: "Groceries" });
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Recompute balance whenever budget or expenses change
    const spent = expenses.reduce((s, e) => s + Number(e.price), 0);
    setBalance(Number(budget) - spent);

    localStorage.setItem("et_budget", String(budget));
    localStorage.setItem("et_expenses", JSON.stringify(expenses));
  }, [budget, expenses]);

  const categories = ["Groceries", "Vegetables", "Home", "Transport", "Other"];

  function handleInputChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function addExpense() {
    if (!form.item.trim() || !form.price) return alert("Please enter item and price");
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
    setForm({ item: exp.item, price: String(exp.price), category: exp.category });
    setShowEditModal(true);
  }

  function saveEdit() {
    if (!form.item.trim() || !form.price) return alert("Please enter item and price");
    setExpenses((prev) =>
      prev.map((e) => (e.id === editingId ? { ...e, item: form.item.trim(), price: Number(form.price), category: form.category } : e))
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl text-green-700 font-semibold">Use Buddy</h1>
            <p className="text-sm text-slate-500">Keep spending within limits</p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">Remaining Purse</div>
            <div className={`text-xl font-bold ${balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{balance}</div>
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
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={addExpense}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700"
              >
                Add Expense
              </button>

              <button
                onClick={() => {
                  const val = prompt("Set monthly purse amount (₹)", String(budget));
                  if (val === null) return;
                  const num = Number(val);
                  if (isNaN(num)) return alert("Enter a number");
                  setBudget(num);
                }}
                className="px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-slate-50"
              >
                Set Purse
              </button>

              <button
                onClick={resetMonth}
                className="px-3 py-2 border rounded-md text-sm text-rose-600 hover:bg-rose-50"
              >
                Reset Month
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700">Summary</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <div>Total items: {expenses.length}</div>
              <div>Spent: ₹{expenses.reduce((s, e) => s + Number(e.price), 0)}</div>
              <div>Budget left: ₹{balance}</div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs text-slate-500">Quick Filters</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button key={c} className="text-xs px-2 py-1 rounded-lg border">{c}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Expenses</h2>

          {expenses.length === 0 ? (
            <div className="p-6 text-center text-slate-400">No expenses yet — add your first expense.</div>
          ) : (
            <ul className="space-y-3">
              {expenses.map((e) => (
                <li key={e.id} className="flex items-center justify-between bg-white border rounded-lg p-3 shadow-sm">
                  <div>
                    <div className="font-medium">{e.item}</div>
                    <div className="text-xs text-slate-500">{e.category} · {e.date}</div>
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
              <input name="item" value={form.item} onChange={handleInputChange} className="mt-1 block w-full rounded-md border p-2" />

              <label className="text-sm text-slate-600 mt-3 block">Price</label>
              <input name="price" value={form.price} onChange={handleInputChange} type="number" className="mt-1 block w-full rounded-md border p-2" />

              <label className="text-sm text-slate-600 mt-3 block">Category</label>
              <select name="category" value={form.category} onChange={handleInputChange} className="mt-1 block w-full rounded-md border p-2">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => { setShowEditModal(false); setEditingId(null); setForm({ item: "", price: "", category: "Groceries" }); }} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={saveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
