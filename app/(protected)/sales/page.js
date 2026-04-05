"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Helper: parse pcs_per_case from unit string e.g. "3.8kgx4" → 4
function parsePcsPerCase(unitStr) {
  if (!unitStr) return null;
  const match = unitStr.match(/x\s*(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

export default function Sales() {
  const router = useRouter();

  const [products,  setProducts]  = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const [currentEmployee, setCurrentEmployee] = useState({ id: 1, name: "Markham Unionville" });

  const [step,               setStep]               = useState(1);
  const [selectedCustomer,   setSelectedCustomer]   = useState(null);
  const [searchCustomer,     setSearchCustomer]     = useState("");
  const [searchProduct,      setSearchProduct]      = useState("");
  const [orderItems,         setOrderItems]         = useState([]);

  // quantities stores { qty, price, unitType, remainder } per product_ID
  const [quantities, setQuantities] = useState({});

  const [paymentType,           setPaymentType]           = useState("Cash");
  const [paymentAmount,         setPaymentAmount]         = useState(0);
  const [orderNotes,            setOrderNotes]            = useState("");
  const [deliveryAddress,       setDeliveryAddress]       = useState("");
  const [showCustomerDropdown,  setShowCustomerDropdown]  = useState(false);
  const [isSubmitting,          setIsSubmitting]          = useState(false);

  const [siNumber,  setSiNumber]  = useState("");
  const [swsNumber, setSwsNumber] = useState("");

  const isStep1Complete = !!selectedCustomer;
  const isStep2Complete = orderItems.length > 0;
  const isStep3Complete = !!paymentType && paymentAmount >= 0;

  const DELIVERY_FEE = 0;

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setCurrentEmployee({ id: d.user.employee_ID, name: d.user.name });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isStep1Complete && step === 1) setStep(2);
  }, [selectedCustomer]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, custRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/client")
        ]);
        const prodData = await prodRes.json();
        const custData = await custRes.json();
        setProducts(Array.isArray(prodData) ? prodData : []);
        setCustomers(Array.isArray(custData) ? custData : []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── Quantity helpers 
  const getQty       = (pid) => quantities[pid]?.qty       ?? 1;
  const getRemainder = (pid) => quantities[pid]?.remainder ?? 0;
  const getUnitType  = (pid) => quantities[pid]?.unitType  ?? "Cases";
  const getPrice     = (pid, defaultPrice) => quantities[pid]?.price ?? defaultPrice;

  const setQty = (pid, val) =>
    setQuantities(q => ({ ...q, [pid]: { ...q[pid], qty: parseInt(val) || 1 } }));

  const setRemainder = (pid, val) =>
    setQuantities(q => ({ ...q, [pid]: { ...q[pid], remainder: parseInt(val) || 0 } }));

  const setUnitType = (pid, val, product) => {
    const defaultPrice = val === "Cases"
      ? (product.product_pricePerCase || product.product_unitPrice)
      : product.product_unitPrice;
    setQuantities(q => ({
      ...q,
      [pid]: { ...q[pid], unitType: val, price: defaultPrice }
    }));
  };

  const setPrice = (pid, val, defaultPrice) =>
    setQuantities(q => ({
      ...q,
      [pid]: { ...q[pid], price: parseFloat(val) || defaultPrice }
    }));

  // ─── Stock deduction preview 
  function calcPiecesPreview(qty, unitType, remainder, pcsPerCase) {
    if (unitType === "Pieces") return qty;
    if (!pcsPerCase) return qty;
    return (qty * pcsPerCase) + (remainder || 0);
  }

  // ─── Complete sale 
  const handleCompleteSale = async () => {
    if (!selectedCustomer) return alert("Please select a customer.");
    if (orderItems.length === 0) return alert("Order is empty.");
    if (!paymentType) return alert("Please select a payment type.");
    if (!siNumber.trim()) return alert("Please enter the SI Number (Sales Invoice).");
    if (isSubmitting) return;

    const salePayload = {
      client_ID:       selectedCustomer.client_ID,
      employee_ID:     currentEmployee.id,
      sales_notes:     orderNotes,
      sales_SINumber:  siNumber  || null,
      sales_SWSNumber: swsNumber || null,
      items: orderItems.map(item => ({
        productLine_ID: item.product_ID,
        quantity:       item.qty,
        unitPrice:      item.price,
        unitType:       item.unitType,
        remainder:      item.remainder || 0,
      })),
      payment: parseFloat(paymentAmount) > 0 ? {
        payment_amount: parseFloat(paymentAmount),
        payment_type:   paymentType,
        employee_ID:    currentEmployee.id,
      } : null,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(salePayload),
      });
      const result = await res.json();
      if (res.ok) {
        alert("Sale created successfully!");
        setSelectedCustomer(null);
        setSearchCustomer("");
        setOrderItems([]);
        setQuantities({});
        setPaymentAmount(0);
        setOrderNotes("");
        setSiNumber(""); setSwsNumber("");
        setStep(1);
        setIsSubmitting(false);
      } else {
        alert(`Error: ${result.error}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      alert("System error. Check console.");
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const getSectionClass = (sectionStep, isComplete) => {
    const base = "bg-white rounded-lg border-2 p-5 shadow-sm transition-all duration-300 ";
    if (step === sectionStep) return base + "border-blue-500 ring-4 ring-blue-50 shadow-md scale-[1.01]";
    if (isComplete) return base + "border-green-500 opacity-90";
    return base + "border-gray-200 opacity-50 grayscale-[0.5]";
  };

  const filteredCustomers = customers.filter((c) =>
    c.client_name?.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.product_name?.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.product_ID.toString().includes(searchProduct)
  );

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchCustomer(customer.client_name);
    setDeliveryAddress(customer.client_address || "");
    setShowCustomerDropdown(false);
  };

  const handleAddToOrder = (product) => {
    const qty       = getQty(product.product_ID);
    const price     = getPrice(product.product_ID, product.product_unitPrice);
    const unitType  = getUnitType(product.product_ID);
    const remainder = getRemainder(product.product_ID);
    const pcsPerCase = parsePcsPerCase(product.product_unit);
    const piecesNeeded = calcPiecesPreview(qty, unitType, remainder, pcsPerCase);

    if (piecesNeeded > product.product_stockQty) {
      alert(`Insufficient stock! Need ${piecesNeeded} pcs, only ${product.product_stockQty} available.`);
      return;
    }

    const existing = orderItems.find((i) => i.product_ID === product.product_ID && i.unitType === unitType);
    if (existing) {
      setOrderItems(orderItems.map((i) =>
        i.product_ID === product.product_ID && i.unitType === unitType
          ? { ...i, qty, price, unitType, remainder }
          : i
      ));
    } else {
      setOrderItems([...orderItems, {
        product_ID: product.product_ID,
        name:       product.product_name,
        unit:       product.product_unit,
        price,
        qty,
        unitType,
        remainder,
      }]);
    }
  };

  const handleRemoveItem = (product_ID, unitType) => {
    setOrderItems(orderItems.filter((i) => !(i.product_ID === product_ID && i.unitType === unitType)));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total    = subtotal + DELIVERY_FEE;
  const balance  = Math.max(0, total - parseFloat(paymentAmount || 0));

  const formatCurrency = (amount) =>
    `₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  const steps = [
    { num: 1, label: "1. Customer Info",    complete: isStep1Complete },
    { num: 2, label: "2. Select Products",  complete: isStep2Complete },
    { num: 3, label: "3. Review & Payment", complete: isStep3Complete },
  ];

  if (loading) return <div className="p-10 text-center text-gray-900 font-bold">Loading system data...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-900 overflow-x-hidden">
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-gray-900">Create New Sale / Order</h1>
        <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg shrink-0">
          <p className="text-xs text-blue-600 font-bold uppercase tracking-tight">System Operator</p>
          <p className="text-sm font-black text-blue-900">{currentEmployee.name} (ID: {currentEmployee.id})</p>
        </div>
      </div>

      {/* Step Indicator Bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {steps.map((s, idx) => (
          <div key={`step-${s.num}`} className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setStep(s.num)}
              className={`px-5 py-2.5 rounded-md text-sm font-bold border transition-all whitespace-nowrap ${
                step === s.num
                  ? "bg-blue-600 border-blue-700 text-white shadow-md"
                  : s.complete
                  ? "bg-green-100 border-green-400 text-green-800"
                  : "bg-white border-gray-300 text-gray-400"
              }`}
            >
              {s.label} {s.complete && "✓"}
            </button>
            {idx < steps.length - 1 && <span className="text-gray-300 text-lg">→</span>}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start min-w-0">
        <div className="flex-1 flex flex-col gap-5 min-w-0">

          {/* STEP 1: CUSTOMER INFO */}
          <div className={getSectionClass(1, isStep1Complete)} onClick={() => setStep(1)}>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              1. Customer Information {isStep1Complete && <span className="text-green-600">✓</span>}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-bold text-gray-800 mb-1">Select Customer *</label>
                <input
                  type="text"
                  value={searchCustomer}
                  onChange={(e) => {
                    setSearchCustomer(e.target.value);
                    setShowCustomerDropdown(true);
                    if (!e.target.value) setSelectedCustomer(null);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="w-full border border-gray-400 text-gray-900 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Search customer..."
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-20 bg-white border border-gray-300 rounded shadow-lg w-full mt-1 max-h-60 overflow-y-auto">
                    {filteredCustomers.map((c) => (
                      <div key={c.client_ID} onClick={() => handleSelectCustomer(c)}
                        className="px-3 py-2 text-sm text-gray-900 hover:bg-blue-600 hover:text-white cursor-pointer border-b last:border-0">
                        {c.client_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Contact Person</label>
                <input type="text" value={selectedCustomer?.contactPerson || ""} readOnly
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Contact Number</label>
                <input type="text" value={selectedCustomer?.client_contactNumber || ""} readOnly
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Outstanding Balance</label>
                <input type="text"
                  value={selectedCustomer ? formatCurrency(selectedCustomer.client_outstandingbalance || 0) : ""}
                  readOnly
                  className={`w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 font-bold ${
                    selectedCustomer?.client_outstandingbalance > 0 ? "text-red-600" : "text-green-700"
                  }`} />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-800 mb-1">Delivery Address</label>
              <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={2} className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  SI Number <span className="text-xs text-gray-500">(Sales Invoice) * </span>
                </label>
                <input type="text" placeholder="SI #" value={siNumber}
                  onChange={e => setSiNumber(e.target.value)}
                  className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  SWS Number <span className="text-xs text-gray-500">(optional)</span>
                </label>
                <input type="text" placeholder="SWS #" value={swsNumber}
                  onChange={e => setSwsNumber(e.target.value)}
                  className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* STEP 2: SELECT PRODUCTS */}
          <div className={getSectionClass(2, isStep2Complete)} onClick={() => setStep(2)}>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              2. Select Products {isStep2Complete && <span className="text-green-600">✓</span>}
            </h2>
            <input type="text" value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)}
              placeholder="Type product name or code..."
              className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map((product) => {
                const pid        = product.product_ID;
                const outOfStock = product.product_stockQty <= 0;
                const lowStock   = !outOfStock && product.product_stockQty <= (product.product_reorderPoint || 5);
                const cardPrice  = getPrice(pid, product.product_unitPrice);
                const cardQty    = getQty(pid);
                const cardUnit   = getUnitType(pid);
                const cardRem    = getRemainder(pid);
                const pcsPerCase = parsePcsPerCase(product.product_unit);
                const piecesPreview = calcPiecesPreview(cardQty, cardUnit, cardRem, pcsPerCase);
                const hasCasePrice  = !!product.product_pricePerCase;

                return (
                  <div key={pid}
                    className={`border-2 rounded-lg p-3 ${
                      outOfStock ? "border-red-200 bg-red-50"
                      : lowStock  ? "border-amber-200 bg-amber-50"
                      : "border-green-200 bg-green-50"
                    }`}>

                    <p className="text-sm font-bold text-gray-900 mb-1">{product.product_name}</p>
                    {product.product_unit && (
                      <p className="text-[10px] text-gray-400 mb-2 font-medium">{product.product_unit}</p>
                    )}

                    {/* Unit Type Toggle */}
                    <div className="flex gap-1 mb-2 bg-white rounded border border-gray-200 p-0.5">
                      {["Cases", "Pieces"].map(type => (
                        <button
                          key={type}
                          type="button"
                          disabled={outOfStock}
                          onClick={(e) => { e.stopPropagation(); setUnitType(pid, type, product); }}
                          className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${
                            cardUnit === type
                              ? "bg-blue-600 text-white"
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {/* Price display */}
                    <div className="mb-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">
                        {cardUnit === "Cases" ? "Case Price" : "Unit Price"} (editable)
                        {cardUnit === "Cases" && !hasCasePrice && (
                          <span className="ml-1 text-amber-500 normal-case font-normal">no case price set</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          value={cardPrice}
                          onChange={(e) => setPrice(pid, e.target.value, product.product_unitPrice)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full border border-blue-200 rounded pl-6 pr-2 py-1 text-sm font-black text-blue-700 bg-white focus:outline-none focus:border-blue-500"
                          disabled={outOfStock}
                        />
                      </div>
                      {hasCasePrice && (
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Default: ₱{Number(cardUnit === "Cases" ? product.product_pricePerCase : product.product_unitPrice).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Stock info */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs text-gray-500">Stock:</span>
                      <span className={`text-xs font-bold ${outOfStock ? "text-red-600" : lowStock ? "text-amber-600" : "text-green-700"}`}>
                        {product.product_stockQty} pcs
                        {pcsPerCase && ` (≈${Math.floor(product.product_stockQty / pcsPerCase)} cases)`}
                      </span>
                      {outOfStock && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Out</span>}
                      {lowStock   && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Low</span>}
                    </div>

                    {/* Qty + Remainder */}
                    <div className="flex gap-1 mb-1">
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase block mb-0.5">
                          {cardUnit === "Cases" ? "Cases" : "Pieces"}
                        </label>
                        <input
                          type="number" min={1}
                          value={cardQty}
                          onChange={(e) => { e.stopPropagation(); setQty(pid, e.target.value); }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full border border-gray-400 rounded px-2 py-1 text-sm font-bold"
                          disabled={outOfStock}
                        />
                      </div>
                    </div>

                    {/* Pieces preview */}
                    {pcsPerCase && !outOfStock && (
                      <p className="text-[10px] text-gray-400 mb-2">
                        = {piecesPreview} pcs will be deducted
                      </p>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddToOrder(product); }}
                      disabled={outOfStock}
                      className="w-full bg-green-700 text-white text-xs font-bold py-2 rounded hover:bg-green-800 uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed">
                      {outOfStock ? "Out of Stock" : "Add to Order"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* STEP 3: ORDER SUMMARY */}
        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <div className={`${getSectionClass(3, isStep3Complete)} lg:sticky lg:top-6`}>
            <h2 className="text-xl font-black text-gray-900 mb-4 border-b pb-2">Order Summary</h2>

            <div className="mb-3">
              <label className="block text-sm font-bold text-gray-800 mb-1">Payment Type *</label>
              <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}
                className="w-full border-2 border-gray-400 rounded px-3 py-2 text-sm font-bold text-gray-900 bg-white">
                <option value="">-- Select Type --</option>
                <option value="Cash">Cash</option>
                <option value="GCash">GCash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Check">Check</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-bold text-gray-800 mb-1">Amount Paid:</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-900 font-bold text-sm">₱</span>
                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border-2 border-gray-400 rounded pl-7 pr-3 py-2 text-sm font-bold text-gray-900" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-800 mb-1">Order Notes</label>
              <textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)}
                rows={2} placeholder="Optional notes..."
                className="w-full border-2 border-gray-300 rounded px-3 py-2 text-sm text-gray-900 resize-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="max-h-60 overflow-y-auto mb-4 space-y-3">
              {orderItems.map((item) => {
                const pcsPerCase = parsePcsPerCase(item.unit);
                const pieces = calcPiecesPreview(item.qty, item.unitType, item.remainder, pcsPerCase);
                return (
                  <div key={`summary-${item.product_ID}-${item.unitType}`}
                    className="flex justify-between items-start border-b border-gray-100 pb-2">
                    <div className="text-sm flex-1 min-w-0 pr-2">
                      <p className="font-bold text-gray-900 truncate">{item.name}</p>
                      <p className="text-gray-700 font-medium">
                        {item.qty} {item.unitType}
                        {item.unitType === "Cases" && item.remainder > 0 && ` + ${item.remainder} pcs`}
                        {" × "}{formatCurrency(item.price)}
                      </p>
                      {pcsPerCase && (
                        <p className="text-[10px] text-gray-400">{pieces} pcs deducted</p>
                      )}
                    </div>
                    <button onClick={() => handleRemoveItem(item.product_ID, item.unitType)}
                        className="text-red-600 font-bold text-xs hover:underline shrink-0">Remove</button>
                  </div>
                );
              })}
              {orderItems.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-4">No items added yet.</p>
              )}
            </div>

            <div className="space-y-2 border-t-2 border-gray-100 pt-3">
              <div className="flex justify-between text-gray-800 font-bold">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {parseFloat(paymentAmount) > 0 && (
                <>
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Amount Paid:</span>
                    <span className="font-semibold text-green-700">{formatCurrency(paymentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Balance:</span>
                    <span className={`font-bold ${balance > 0 ? "text-red-600" : "text-green-700"}`}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-green-700 font-black text-xl pt-2">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleCompleteSale}
                disabled={isSubmitting || !isStep1Complete || !isStep2Complete}
                className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:bg-gray-400 text-white py-3 rounded-lg font-black uppercase shadow-lg transition-all"
              >
                {isSubmitting ? "Processing..." : "✓ Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}