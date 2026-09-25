import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, ArrowRight, Minus, Plus, Package, ShieldCheck, MapPin } from 'lucide-react';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    // 1. Initial Load & Parsing
    useEffect(() => {
        // Simulate loading for better UX
        setTimeout(() => {
            const queryParams = new URLSearchParams(window.location.search);
            const itemsParam = queryParams.get('items');

            if (itemsParam) {
                const rawList = itemsParam.split(',');

                const parsedItems = rawList.map((itemStr, index) => {
                    // Logic: Split "Name:Qty:Price"
                    const parts = itemStr.split(':');

                    // Generate a deterministic color/image placeholder based on name
                    const colorHue = itemStr.length * 25 % 360;

                    if (parts.length === 3) {
                        return {
                            id: `item-${index}`,
                            name: decodeURIComponent(parts[0]),
                            qty: Math.max(1, parseInt(parts[1]) || 1),
                            price: parseInt(parts[2]) || 0,
                            color: `hsl(${colorHue}, 70%, 95%)`,
                            iconColor: `hsl(${colorHue}, 70%, 40%)`
                        };
                    } else {
                        // Fallback
                        return {
                            id: `item-${index}`,
                            name: decodeURIComponent(itemStr),
                            qty: 1,
                            price: 0,
                            color: `hsl(${colorHue}, 70%, 95%)`,
                            iconColor: `hsl(${colorHue}, 70%, 40%)`
                        };
                    }
                });
                setCartItems(parsedItems);
            }
            setLoading(false);
        }, 800);
    }, []);

    // 2. Total Calculation
    useEffect(() => {
        const newTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
        setTotal(newTotal);
    }, [cartItems]);

    const updateQty = (id, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, qty: Math.max(1, item.qty + delta) };
            }
            return item;
        }));
    };

    const removeItem = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-slate-600 dark:text-gray-400">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium tracking-wide">LOADING CART...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans text-gray-800 pb-20">
            {/* Navbar Placeholder */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center font-bold text-lg text-yellow-900">A</div>
                    <span className="font-bold text-xl tracking-tight text-gray-900">Annadata<span className="text-yellow-500">Mart</span></span>
                </div>
                <div className="bg-gray-100 p-2 rounded-full relative">
                    <ShoppingCart size={20} className="text-gray-600" />
                    {cartItems.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">{cartItems.length}</span>}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                    Your Shopping Cart
                    <span className="text-lg font-normal text-slate-500 dark:text-gray-500">({cartItems.length} items)</span>
                </h1>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* LEFT: Items List */}
                    <div className="flex-1 space-y-4">
                        {cartItems.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                                <ShoppingCart size={48} className="mx-auto text-slate-700 dark:text-gray-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-500 dark:text-gray-500">Your cart is empty</h3>
                                <p className="text-slate-600 dark:text-gray-400 mb-6">Looks like you haven't added anything yet.</p>
                                <button className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-xl transition-all">Start Shopping</button>
                            </div>
                        ) : (
                            cartItems.map((item) => (
                                <div key={item.id} className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-6 group hover:shadow-md transition-all duration-300">

                                    {/* Image Placeholder */}
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center text-3xl font-bold shrink-0 shadow-inner" style={{ backgroundColor: item.color, color: item.iconColor }}>
                                        {item.name.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{item.name}</h3>
                                                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mt-1 flex items-center gap-1">
                                                    <ShieldCheck size={12} /> In Stock • Verified Seller
                                                </p>
                                            </div>
                                            <span className="md:hidden font-bold text-xl text-gray-900">₹{item.price}</span>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                            {/* Qty Control */}
                                            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
                                                <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-slate-500 dark:text-gray-500 transition-all"><Minus size={14} /></button>
                                                <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                                                <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-gray-900 transition-all"><Plus size={14} /></button>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-gray-400">
                                                <button onClick={() => removeItem(item.id)} className="flex items-center gap-1 hover:text-red-500 transition-colors font-medium">
                                                    <Trash2 size={16} /> Remove
                                                </button>
                                                <span className="w-px h-4 bg-gray-200"></span>
                                                <button className="hover:text-blue-500 transition-colors">Save for later</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price Desktop */}
                                    <div className="hidden md:block text-right min-w-[100px]">
                                        <div className="text-2xl font-bold text-gray-900">₹{(item.price * item.qty).toLocaleString()}</div>
                                        {item.qty > 1 && <div className="text-xs text-slate-600 dark:text-gray-400">₹{item.price} each</div>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* RIGHT: Summary Card */}
                    <div className="w-full lg:w-96 min-w-[300px]">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium">₹{total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Discount</span>
                                    <span className="text-green-600 font-medium">- ₹0</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery Charges</span>
                                    <span className="text-green-600 font-medium">FREE</span>
                                </div>

                                <div className="h-px bg-gray-100 my-2"></div>

                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                    <span className="text-2xl font-bold text-gray-900">₹{total.toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-gray-400 text-right">Including GST</p>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-extrabold rounded-xl shadow-lg shadow-yellow-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2">
                                    Proceed to Checkout <ArrowRight size={20} />
                                </button>

                                <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-gray-400 mt-4 bg-gray-50 py-2 rounded-lg">
                                    <ShieldCheck size={14} className="text-green-500" />
                                    Secure Payment • 100% Authentic Items
                                </div>
                            </div>

                            {/* Location Preview */}
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="flex items-start gap-3">
                                    <MapPin size={20} className="text-slate-600 dark:text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-600 dark:text-gray-400 uppercase">Delivering to</p>
                                        <p className="font-bold text-sm text-gray-700">Farm #12, Nashik District...</p>
                                        <button className="text-xs text-blue-500 font-bold mt-1">Change</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Cart;
