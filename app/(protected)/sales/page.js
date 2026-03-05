"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Sales() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentEmployee, setCurrentEmployee] = useState({ id: 1, name: "Markham Unionville" });

  const [step, setStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [paymentType, setPaymentType] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [orderNotes, setOrderNotes] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  
  const isStep1Complete = !!selectedCustomer; // true if a customer is picked
  const isStep2Complete = orderItems.length > 0; // true if items are added
  const isStep3Complete = !!paymentType && paymentAmount >= 0; // true if payment is set

  const DELIVERY_FEE = 100;

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

        setProducts(prodData);
        setCustomers(custData);
      } catch (err) {
        console.error("Failed to fetch data: ", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCompleteSale = async () => {
      if (!selectedCustomer) return alert("Please select a customer.");
      if (orderItems.length === 0) return alert("Order is empty.");
      if (!paymentType) return alert("Please select a payment type.");
      if (isSubmitting) return;

      // --- ADD THIS LINE HERE ---
      const currentEmployeeID = currentEmployee.id; // Use 1 for testing, or your actual admin ID

      const salePayload = {
        client_ID: selectedCustomer.client_ID,
        employee_ID: currentEmployeeID, 
        sales_notes: orderNotes, // Added this to capture your notes state
        items: orderItems.map(item => ({
          productLine_ID: item.product_ID, 
          quantity: item.qty,
          unitPrice: item.price
        })),
        payment: {
          // Changed amountPaid to paymentAmount to match your state variable
          payment_amount: parseFloat(paymentAmount) || 0, 
          payment_type: paymentType,
          employee_ID: currentEmployee.id
        }
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
        router.push(`/sales/${result.saleId || ''}`);
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
    const qty = quantities[product.product_ID] || 1;
    // We keep the price flexible here so it can be edited in the summary if needed
    const priceToUse = product.product_unitPrice; 

    const existing = orderItems.find((i) => i.product_ID === product.product_ID);

    if (existing) {
      setOrderItems(
        orderItems.map((i) =>
          i.product_ID === product.product_ID ? { ...i, qty: i.qty + qty } : i
        )
      );
    } else {
      setOrderItems([...orderItems, {
        product_ID: product.product_ID,
        name: product.product_name,
        price: priceToUse, // This maps to your unitPrice in the payload
        qty
      }]);
    }
  };

  const handleRemoveItem = (product_ID) => {
    setOrderItems(orderItems.filter((i) => i.product_ID !== product_ID));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal + DELIVERY_FEE;
  
  const formatCurrency = (amount) =>
    `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  const steps = [
    { num: 1, label: "1. Customer Info", complete: isStep1Complete },
    { num: 2, label: "2. Select Products", complete: isStep2Complete },
    { num: 3, label: "3. Review & Payment", complete: isStep3Complete },
  ];

  if (loading) return <div className="p-10 text-center text-gray-900 font-bold">Loading system data...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-900">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-bold text-gray-900">Create New Sale / Order</h1>
        <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg">
            <p className="text-xs text-blue-600 font-bold uppercase tracking-tight">System Operator</p>
            <p className="text-sm font-black text-blue-900">{currentEmployee.name} (ID: {currentEmployee.id})</p>
        </div>
      </div>

      {/* Step Indicator Bar */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, idx) => (
          <div key={`step-${s.num}`} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.num)}
              className={`px-5 py-2.5 rounded-md text-sm font-bold border transition-all ${
                step === s.num
                  ? "bg-blue-600 border-blue-700 text-white shadow-md"
                  : s.complete
                  ? "bg-green-100 border-green-400 text-green-800"
                  : "bg-white border-gray-300 text-gray-400"
              }`}
            >
              {s.label} {s.complete && "✓"}
            </button>
            {idx < steps.length - 1 && (
              <span className="text-gray-300 text-lg">→</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        <div className="flex-1 flex flex-col gap-5">
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
                      <div key={c.client_ID} onClick={() => handleSelectCustomer(c)} className="px-3 py-2 text-sm text-gray-900 hover:bg-blue-600 hover:text-white cursor-pointer border-b last:border-0">
                        {c.client_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Contact Person</label>
                <input type="text" value={selectedCustomer?.contactPerson || ""} readOnly className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Contact Number</label>
                <input type="text" value={selectedCustomer?.client_contactNumber || ""} readOnly className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Outstanding Balance</label>
                <input type="text" value={selectedCustomer ? formatCurrency(selectedCustomer.client_outstandingbalance || 0) : ""} readOnly className={`w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 font-bold ${selectedCustomer?.client_outstandingbalance > 0 ? "text-red-600" : "text-green-700"}`} />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-800 mb-1">Delivery Address</label>
              <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} rows={2} className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>

          {/* STEP 2: SELECT PRODUCTS */}
          <div className={getSectionClass(2, isStep2Complete)} onClick={() => setStep(2)}>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                2. Select Products {isStep2Complete && <span className="text-green-600">✓</span>}
            </h2>
            <input type="text" value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)} placeholder="Type product name or code..." className="w-full border border-gray-400 rounded px-3 py-2 text-sm mb-4" />
            <div className="grid grid-cols-3 gap-3">
              {filteredProducts.map((product) => (
                <div key={product.product_ID} className={`border-2 rounded-lg p-3 ${product.status === "in_stock" ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}>
                  <p className="text-sm font-bold text-gray-900 mb-1">{product.product_name}</p>
                  <p className="text-lg font-black text-blue-700">{formatCurrency(product.product_unitPrice)}</p>
                  <div className="mt-2">
                    <input type="number" min={1} value={quantities[product.product_ID] || 1} onChange={(e) => setQuantities({ ...quantities, [product.product_ID]: parseInt(e.target.value) || 1 })} className="w-full border border-gray-400 rounded px-2 py-1 text-sm font-bold mb-2" />
                    <button onClick={(e) => { e.stopPropagation(); handleAddToOrder(product); }} className="w-full bg-green-700 text-white text-xs font-bold py-2 rounded hover:bg-green-800 uppercase tracking-wider">Add to Order</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 3: ORDER SUMMARY */}
        <div className="w-80 flex-shrink-0">
          <div className={`${getSectionClass(3, isStep3Complete)} sticky top-6`}>
            <h2 className="text-xl font-black text-gray-900 mb-4 border-b pb-2">Order Summary</h2>
            <div className="mb-3">
                <label className="block text-sm font-bold text-gray-800 mb-1">Payment Type *</label>
                <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="w-full border-2 border-gray-400 rounded px-3 py-2 text-sm font-bold text-gray-900 bg-white">
                    <option value="">-- Select Type --</option>
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                </select>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-bold text-gray-800 mb-1">Amount Paid:</label>
                <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-900 font-bold text-sm">₱</span>
                    <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full border-2 border-gray-400 rounded pl-7 pr-3 py-2 text-sm font-bold text-gray-900" />
                </div>
            </div>
            <div className="max-h-60 overflow-y-auto mb-4 space-y-3">
                {orderItems.map((item) => (
                  <div key={`summary-${item.product_ID}`} className="flex justify-between items-start border-b border-gray-100 pb-2">
                    <div className="text-sm">
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-gray-700 font-medium">{item.qty} x {item.price}</p>
                    </div>
                    <button onClick={() => handleRemoveItem(item.product_ID)} className="text-red-600 font-bold text-xs hover:underline">Remove</button>
                  </div>
                ))}
            </div>
            <div className="space-y-2 border-t-2 border-gray-100 pt-3">
                <div className="flex justify-between text-gray-800 font-bold">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
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