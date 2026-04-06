// src/features/billing/components/BillingPage.tsx
import React, { useState, useEffect } from 'react';
import { 
    CreditCard, ClipboardList, Plus, Loader2, 
    CheckCircle2, AlertTriangle, X, Calendar, Hash, Receipt, Trash2, PlusCircle
} from 'lucide-react';
import { billingService } from '../../../api/billingService';
import { apiClient } from '../../../api/client'; 
import type { Plan, Currency, ExchangeRate } from '../../../types/billing';
import type { User as Customer } from '../../../types/user';

export const BillingPage = () => {
    const [activeTab, setActiveTab] = useState<'payments' | 'plans'>('payments');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const [selectedUserId, setSelectedUserId] = useState<number>(0);
    const [selectedPlanId, setSelectedPlanId] = useState<number>(0);
    const [paymentsList, setPaymentsList] = useState<any[]>([]);
    
    const [currentPayment, setCurrentPayment] = useState({
        amount_paid: '',
        currency: 0, 
        method: 'CASH',
        reference: '',
        bank_origin: ''
    });

    const [newPlanForm, setNewPlanForm] = useState({
        codPlan: '', name: '', price: '', duration_days: 30, class_limit: 12, is_active: true
    });

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const [plansData, customersRes, currenciesData, rateData] = await Promise.all([
                billingService.getPlans(),
                apiClient.get<Customer[]>('/customers/'),
                billingService.getCurrencies(),
                billingService.getLatestExchangeRate()
            ]);
            setPlans(plansData);
            setCustomers(customersRes.data);
            setCurrencies(currenciesData);
            setExchangeRate(rateData);
            
            const usdCurrency = currenciesData.find((c: Currency) => c.is_base);
            if (usdCurrency) setCurrentPayment(prev => ({ ...prev, currency: usdCurrency.id }));
            
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al sincronizar con el servidor.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadInitialData(); }, []);

    // --- LÓGICA MATEMÁTICA DEL CARRITO (CON VUELTOS) ---
    const currentRateVal = exchangeRate ? Number(exchangeRate.rate) : 1;
    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    const totalUsd = selectedPlan ? Number(selectedPlan.price) : 0;
    const totalVes = totalUsd * currentRateVal;

    const paidUsd = paymentsList.reduce((acc, p) => {
        const isUsd = currencies.find(c => c.id === p.currency)?.is_base;
        const amount = Number(p.amount_paid);
        return acc + (isUsd ? amount : amount / currentRateVal);
    }, 0);

    // Balance neto. Positivo = Falta pagar. Negativo = Sobra dinero (Vuelto)
    const currentBalanceUsd = totalUsd - paidUsd; 
    
    // Permitir un margen de error de 5 centavos por redondeos
    const isFullyPaid = selectedPlanId !== 0 && Math.abs(currentBalanceUsd) <= 0.05; 
    const needsChange = currentBalanceUsd < -0.05; // ¿Pagó de más?

    // --- HANDLERS ---
    const handleAddPayment = () => {
        if (!currentPayment.amount_paid || Number(currentPayment.amount_paid) <= 0) return;
        if (currentPayment.method === 'PAGO_MOVIL' && !currentPayment.bank_origin) {
            setMessage({ type: 'error', text: 'Banco de origen obligatorio para Pago Móvil.' });
            return;
        }

        const newPayment = {
            ...currentPayment,
            exchange_rate_payment: currentRateVal,
            _currencyCode: currencies.find(c => c.id === currentPayment.currency)?.code 
        };

        setPaymentsList([...paymentsList, newPayment]);
        
        setCurrentPayment({
            ...currentPayment,
            amount_paid: '',
            reference: '',
            bank_origin: ''
        });
        setMessage(null);
    };

    const handleAutoChange = () => {
        const vesCurrency = currencies.find(c => !c.is_base);
        if (!vesCurrency) return;

        // Calculamos el excedente para inyectarlo como pago negativo
        const excedenteUsd = Math.abs(currentBalanceUsd);
        const excedenteVes = excedenteUsd * currentRateVal;

        const changePayment = {
            amount_paid: (-excedenteVes).toFixed(2),
            currency: vesCurrency.id,
            method: 'CHANGE',
            reference: 'VUELTO EN CAJA',
            bank_origin: '',
            exchange_rate_payment: currentRateVal,
            _currencyCode: vesCurrency.code
        };

        setPaymentsList([...paymentsList, changePayment]);
    };

    const handleRemovePayment = (index: number) => {
        setPaymentsList(paymentsList.filter((_, i) => i !== index));
    };

    const handleCheckoutSubmit = async () => {
        if (!isFullyPaid) return;
        try {
            await billingService.processCheckout(
                selectedUserId,
                selectedPlanId,
                totalUsd,
                totalVes,
                currentRateVal,
                paymentsList
            );
            setMessage({ type: 'success', text: 'Cobro procesado. Factura generada y créditos añadidos.' });
            
            setSelectedUserId(0);
            setSelectedPlanId(0);
            setPaymentsList([]);
        } catch (error: any) {
            setMessage({ type: 'error', text: `⚠️ Error al procesar el cobro. Verifique las referencias.` });
        }
    };

    const handlePlanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formattedPlan = { ...newPlanForm, price: String(newPlanForm.price) };
            await apiClient.post('/payments/plans/', formattedPlan); 
            setMessage({ type: 'success', text: 'Nuevo plan de entrenamiento creado.' });
            setShowPlanForm(false);
            setNewPlanForm({ codPlan: '', name: '', price: '', duration_days: 30, class_limit: 12, is_active: true });
            loadInitialData(); 
        } catch (error) {
            setMessage({ type: 'error', text: 'No se pudo crear el plan. Verifica los campos.' });
        }
    };

    if (isLoading) return (
        <div className="flex justify-center items-center h-screen bg-zinc-950">
            <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
        </div>
    );

    return (
        <div className="p-6 bg-zinc-950 text-white min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase italic mb-6">
                    Módulo de <span className="text-yellow-400">Facturación</span>
                </h1>
                
                <div className="flex gap-4 border-b border-zinc-800 pb-px">
                    <button onClick={() => setActiveTab('payments')} className={`flex items-center gap-2 px-6 py-3 font-bold uppercase text-sm border-b-2 ${activeTab === 'payments' ? 'border-yellow-400 text-yellow-400 bg-zinc-900/50' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                        <CreditCard className="w-5 h-5" /> Registrar Pago
                    </button>
                    <button onClick={() => setActiveTab('plans')} className={`flex items-center gap-2 px-6 py-3 font-bold uppercase text-sm border-b-2 ${activeTab === 'plans' ? 'border-yellow-400 text-yellow-400 bg-zinc-900/50' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                        <ClipboardList className="w-5 h-5" /> Gestión de Planes
                    </button>
                </div>
            </header>

            {message && (
                <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 font-medium border ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {message.type === 'success' ? <CheckCircle2 /> : <AlertTriangle />}
                    {message.text}
                </div>
            )}

            {activeTab === 'payments' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    <div className="lg:col-span-8 bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                <Plus className="text-yellow-400" /> Nuevo Cobro
                            </h2>
                            {exchangeRate && (
                                <span className="text-xs font-mono font-bold bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700">
                                    Tasa BCV: {exchangeRate.rate} Bs/$
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Socio</label>
                                <select value={selectedUserId} onChange={(e) => setSelectedUserId(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-yellow-400 outline-none">
                                    <option value={0} disabled>Seleccionar socio...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.document_number})</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Plan</label>
                                <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-yellow-400 outline-none">
                                    <option value={0} disabled>Seleccionar plan...</option>
                                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                                </select>
                            </div>
                        </div>

                        {selectedPlanId !== 0 && (
                            <div className="bg-zinc-950/50 p-6 rounded-xl border border-zinc-800/50 space-y-6">
                                <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                                    <Receipt className="w-4 h-4" /> Añadir Pago
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Monto</label>
                                        <div className="flex gap-2">
                                            <input type="number" step="0.01" value={currentPayment.amount_paid} onChange={(e) => setCurrentPayment({...currentPayment, amount_paid: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-yellow-400" placeholder="0.00" />
                                            <select value={currentPayment.currency} onChange={(e) => setCurrentPayment({...currentPayment, currency: Number(e.target.value)})} className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-white outline-none">
                                                {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Método</label>
                                        <select value={currentPayment.method} onChange={(e) => setCurrentPayment({...currentPayment, method: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-yellow-400">
                                            <option value="CASH">Efectivo</option>
                                            <option value="PAGO_MOVIL">Pago Móvil</option>
                                            <option value="ZELLE">Zelle</option>
                                            <option value="POS">Punto de Venta</option>
                                            <option value="TRANSFER">Transferencia</option>
                                        </select>
                                    </div>
                                    
                                    {currentPayment.method === 'PAGO_MOVIL' && (
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Banco Emisor</label>
                                            <select value={currentPayment.bank_origin} onChange={(e) => setCurrentPayment({...currentPayment, bank_origin: e.target.value})} className="w-full bg-zinc-900 border border-yellow-400/50 rounded-lg p-2 text-white outline-none">
                                                <option value="" disabled>Seleccione Banco...</option>
                                                <option value="Banesco">Banesco</option><option value="Mercantil">Mercantil</option><option value="Provincial">Provincial</option><option value="Venezuela">Venezuela</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Referencia</label>
                                        <input type="text" value={currentPayment.reference} onChange={(e) => setCurrentPayment({...currentPayment, reference: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-yellow-400" placeholder="N° de comprobante (Opcional en Efectivo)" />
                                    </div>
                                </div>
                                
                                <button type="button" onClick={handleAddPayment} disabled={!currentPayment.amount_paid} className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg border border-zinc-700 transition-colors disabled:opacity-50">
                                    <PlusCircle className="w-4 h-4" /> Agregar al Recibo
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl sticky top-6">
                        <h3 className="text-lg font-black italic uppercase text-white mb-4 border-b border-zinc-800 pb-3">Resumen de Venta</h3>
                        
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-zinc-400 text-sm">
                                <span>Total Plan:</span>
                                <span className="font-mono font-bold text-white">${totalUsd.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-zinc-500 text-xs">
                                <span>Equivalente:</span>
                                <span>{totalVes.toFixed(2)} Bs</span>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6 min-h-[100px] max-h-[200px] overflow-y-auto custom-scrollbar">
                            {paymentsList.length === 0 ? (
                                <p className="text-zinc-600 text-xs text-center italic mt-8">Sin pagos registrados</p>
                            ) : (
                                paymentsList.map((p, idx) => (
                                    <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${p.method === 'CHANGE' ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-950 border-zinc-800'}`}>
                                        <div>
                                            <p className={`text-xs font-bold ${p.method === 'CHANGE' ? 'text-red-400' : 'text-white'}`}>{p.method}</p>
                                            <p className={`text-[10px] font-mono ${p.method === 'CHANGE' ? 'text-red-400/80' : 'text-zinc-500'}`}>{p.amount_paid} {p._currencyCode} {p.reference && `| Ref: ${p.reference}`}</p>
                                        </div>
                                        <button onClick={() => handleRemovePayment(idx)} className="text-zinc-500 hover:text-red-400 p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* AQUI ESTA LA MODIFICACION PARA EL VUELTO EN USD Y BS */}
                        <div className="border-t border-zinc-800 pt-4 mb-6">
                            {needsChange ? (
                                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl space-y-3">
                                    <div className="flex justify-between items-start text-red-400">
                                        <span className="text-sm font-bold uppercase mt-1">Excedente a favor:</span>
                                        <div className="text-right">
                                            <span className="text-2xl font-black block">
                                                ${Math.abs(currentBalanceUsd).toFixed(2)}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-red-400/80 block">
                                                {(Math.abs(currentBalanceUsd) * currentRateVal).toFixed(2)} Bs
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-red-400/80 leading-tight">
                                        El cliente pagó de más. Registre la salida del vuelto para cuadrar la caja y permitir la facturación.
                                    </p>
                                    <button 
                                        onClick={handleAutoChange}
                                        className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold py-2 rounded-lg text-xs uppercase tracking-widest transition-colors border border-red-500/50"
                                    >
                                        Auto-Registrar Vuelto en Bs
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-sm font-bold text-zinc-400">Resta por Pagar:</span>
                                        <span className={`text-2xl font-black italic ${isFullyPaid ? 'text-green-500' : 'text-yellow-400'}`}>
                                            ${Math.max(0, currentBalanceUsd).toFixed(2)}
                                        </span>
                                    </div>
                                    {currentBalanceUsd > 0.05 && (
                                        <p className="text-right text-xs text-zinc-500 font-mono">{(currentBalanceUsd * currentRateVal).toFixed(2)} Bs</p>
                                    )}
                                </>
                            )}
                        </div>

                        <button 
                            onClick={handleCheckoutSubmit}
                            disabled={!isFullyPaid || selectedUserId === 0}
                            className="w-full bg-yellow-400 text-zinc-900 font-black py-4 rounded-xl uppercase tracking-widest hover:bg-yellow-300 transition-transform active:scale-95 shadow-lg shadow-yellow-400/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Facturar Venta
                        </button>
                    </div>
                </div>
            )}

            {/* PESTAÑA DE PLANES */}
            {activeTab === 'plans' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold italic uppercase tracking-tighter">Planes Vigentes</h2>
                        <button onClick={() => setShowPlanForm(!showPlanForm)} className="flex items-center gap-2 px-6 py-2 bg-white text-zinc-950 font-black rounded-lg hover:bg-yellow-400 transition-colors uppercase text-xs">
                            {showPlanForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showPlanForm ? 'Cerrar' : 'Nuevo Plan'}
                        </button>
                    </div>

                    {showPlanForm && (
                        <div className="bg-zinc-900 p-6 rounded-2xl border-2 border-dashed border-zinc-700 animate-in fade-in slide-in-from-top-4 duration-300">
                            <form onSubmit={handlePlanSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase">Código</label>
                                    <input type="text" required placeholder="Ej: PRO-12" value={newPlanForm.codPlan} onChange={e => setNewPlanForm({...newPlanForm, codPlan: e.target.value.toUpperCase()})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:border-yellow-400 outline-none uppercase font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase">Nombre del Plan</label>
                                    <input type="text" required placeholder="Ej: Mensual 12" value={newPlanForm.name} onChange={e => setNewPlanForm({...newPlanForm, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:border-yellow-400 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase">Precio ($)</label>
                                    <input type="number" step="0.01" required placeholder="30.00" value={newPlanForm.price} onChange={e => setNewPlanForm({...newPlanForm, price: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:border-yellow-400 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase">Clases Totales</label>
                                    <input type="number" required value={newPlanForm.class_limit} onChange={e => setNewPlanForm({...newPlanForm, class_limit: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:border-yellow-400 outline-none" />
                                </div>
                                <button type="submit" className="bg-yellow-400 text-zinc-900 font-black py-2 rounded-lg text-sm hover:bg-yellow-300 transition-colors">Guardar Plan</button>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map(plan => (
                            <div key={plan.id} className="group bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-yellow-400/30 transition-all shadow-xl">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex flex-col gap-2">
                                        <div className="p-3 bg-zinc-800 rounded-xl group-hover:bg-yellow-400 transition-colors w-fit">
                                            <ClipboardList className="w-6 h-6 text-yellow-400 group-hover:text-zinc-900" />
                                        </div>
                                        <span className="text-[10px] font-mono font-black text-zinc-900 bg-yellow-400 px-2 py-1 rounded w-fit uppercase tracking-widest">
                                            {plan.codPlan}
                                        </span>
                                    </div>
                                    <span className="text-3xl font-black text-white italic">${plan.price}</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-100 uppercase italic tracking-tighter mb-4">{plan.name}</h3>
                                <div className="space-y-3 border-t border-zinc-800 pt-4 font-mono text-xs">
                                    <div className="flex items-center justify-between text-zinc-400">
                                        <span className="flex items-center gap-2"><Calendar className="w-3 h-3" /> Duración</span>
                                        <span className="text-white font-bold">{plan.duration_days} días</span>
                                    </div>
                                    <div className="flex items-center justify-between text-zinc-400">
                                        <span className="flex items-center gap-2"><Hash className="w-3 h-3" /> Créditos</span>
                                        <span className="text-white font-bold">{plan.class_limit} Clases</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};