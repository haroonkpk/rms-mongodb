'use client'

import React, { useState } from 'react'
import { CartItem, POSOrderPayload } from '@/types/pos'
import { createPOSOrder } from '@/actions/pos'
import { Button } from '@/components/ui/button'
import { PrintPdfButton } from '@/components/shared/print-pdf-button'
import {
  Receipt,
  X,
  Trash2,
  Plus,
  Minus,
  Banknote,
  CreditCard,
  QrCode,
  Printer,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BillDrawerProps {
  isOpen: boolean
  onClose: () => void
  billItems: CartItem[]
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void
  onRemoveItem: (cartItemId: string) => void
  onClearBill: () => void
  cashierName?: string
}

export function BillDrawer({
  isOpen,
  onClose,
  billItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearBill,
  cashierName = 'Cashier',
}: BillDrawerProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'QR_CODE'>('CASH')
  const [cashReceivedInput, setCashReceivedInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderCompletedResult, setOrderCompletedResult] = useState<{
    orderNumber: string
    createdAt: string
    cashierName: string
    cashReceived?: number
    changeGiven?: number
  } | null>(null)

  const totalAmount = billItems.reduce((acc, item) => acc + item.itemTotal, 0)
  const totalItemCount = billItems.reduce((acc, item) => acc + item.quantity, 0)

  const cashReceived = parseFloat(cashReceivedInput) || 0
  const changeGiven = Math.max(0, cashReceived - totalAmount)
  const isCashInsufficient = paymentMethod === 'CASH' && cashReceived < totalAmount

  const handlePlaceOrderAndPrint = async () => {
    if (billItems.length === 0) return

    try {
      setIsSubmitting(true)

      const payload: POSOrderPayload = {
        items: billItems,
        subtotal: totalAmount,
        totalAmount: totalAmount,
        paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? cashReceived : undefined,
        changeGiven: paymentMethod === 'CASH' ? changeGiven : undefined,
      }

      const res = await createPOSOrder(payload)

      if (res.success && res.orderNumber) {
        setOrderCompletedResult({
          orderNumber: res.orderNumber,
          createdAt: res.createdAt || new Date().toLocaleString(),
          cashierName: res.cashierName || cashierName,
          cashReceived: paymentMethod === 'CASH' ? cashReceived : undefined,
          changeGiven: paymentMethod === 'CASH' ? changeGiven : undefined,
        })
      } else {
        alert(res.error || 'Failed to place order.')
      }
    } catch (err) {
      console.error('Order placement error:', err)
      alert('An error occurred while placing order.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetForNewOrder = () => {
    setOrderCompletedResult(null)
    setCashReceivedInput('')
    onClearBill()
  }

  // PDF Data formatting for PrintPdfButton
  const pdfHeaders = [
    { key: 'item', label: 'Item Name' },
    { key: 'qty', label: 'Qty' },
    { key: 'price', label: 'Price' },
    { key: 'total', label: 'Total' },
  ]

  const pdfData = billItems.map((c) => ({
    item: `${c.name}${c.variant ? ` (${c.variant.name})` : ''}`,
    qty: c.quantity,
    price: `$${c.unitPrice.toFixed(2)}`,
    total: `$${c.itemTotal.toFixed(2)}`,
  }))

  const pdfSummary = {
    'Total Payable': `$${totalAmount.toFixed(2)}`,
    'Payment Method': paymentMethod,
    ...(paymentMethod === 'CASH'
      ? {
          'Cash Received': `$${cashReceived.toFixed(2)}`,
          'Change Returned': `$${changeGiven.toFixed(2)}`,
        }
      : {}),
  }

  if (!isOpen) return null

  return (
    <>
      {/* Dim Overlay Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
      />

      {/* Side Slide-Out Bill Drawer */}
      <aside
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[clamp(22rem,35vw,26rem)] bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-[clamp(1rem,1.5vw,1.25rem)] py-[clamp(0.875rem,1.2vw,1rem)] border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold">
              <Receipt size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Current Order Bill</h2>
              <p className="text-[0.7rem] text-slate-500 font-medium">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in bill
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {billItems.length > 0 && !orderCompletedResult && (
              <button
                onClick={onClearBill}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Drawer Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-[clamp(1rem,1.5vw,1.25rem)] space-y-4">
          {!orderCompletedResult ? (
            <>
              {/* Bill Items List */}
              {billItems.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Receipt size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">Bill is empty</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                    Select items from menu grid to add to customer bill.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {billItems.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="p-3 bg-slate-50/80 rounded-[clamp(0.5rem,0.75vw,0.625rem)] border border-slate-200/80 transition-all hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                          {item.variant && (
                            <p className="text-[0.7rem] font-semibold text-[var(--color-primary)]">
                              Option: {item.variant.name}
                            </p>
                          )}
                          {item.addOns.length > 0 && (
                            <p className="text-[0.68rem] text-slate-500 line-clamp-1 mt-0.5">
                              + {item.addOns.map((a) => a.name).join(', ')}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-[0.68rem] italic text-amber-700 mt-0.5 line-clamp-1">
                              Note: "{item.notes}"
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-slate-900 block">
                            ${item.itemTotal.toFixed(2)}
                          </span>
                          <span className="text-[0.65rem] text-slate-400">
                            ${item.unitPrice.toFixed(2)} ea
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls & Delete */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/60">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center border border-slate-300 hover:bg-slate-100 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold text-slate-900 min-w-[1.25rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center border border-slate-300 hover:bg-slate-100 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.cartItemId)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Integrated Payment Method Section (Inside Bill Drawer) */}
              {billItems.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={cn(
                        'p-2.5 rounded-[clamp(0.375rem,0.5vw,0.5rem)] border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-xs font-bold',
                        paymentMethod === 'CASH'
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <Banknote size={16} />
                      Cash
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={cn(
                        'p-2.5 rounded-[clamp(0.375rem,0.5vw,0.5rem)] border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-xs font-bold',
                        paymentMethod === 'CARD'
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <CreditCard size={16} />
                      Card
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QR_CODE')}
                      className={cn(
                        'p-2.5 rounded-[clamp(0.375rem,0.5vw,0.5rem)] border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-xs font-bold',
                        paymentMethod === 'QR_CODE'
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <QrCode size={16} />
                      QR Code
                    </button>
                  </div>

                  {/* Cash Received Input */}
                  {paymentMethod === 'CASH' && (
                    <div className="p-3 bg-slate-50 rounded-[clamp(0.5rem,0.75vw,0.625rem)] border border-slate-200 space-y-2">
                      <div>
                        <label className="block text-[0.7rem] font-bold text-slate-700 mb-1">
                          Cash Received ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={cashReceivedInput}
                          onChange={(e) => setCashReceivedInput(e.target.value)}
                          placeholder={`Min $${totalAmount.toFixed(2)}`}
                          className="w-full px-3 py-1.5 bg-white text-sm font-bold text-slate-900 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                        <span className="font-semibold text-slate-600">Change Due:</span>
                        <span
                          className={cn(
                            'font-bold',
                            isCashInsufficient ? 'text-rose-600' : 'text-emerald-700'
                          )}
                        >
                          ${changeGiven.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Order Placed Receipt Screen */
            <div className="space-y-4 py-4">
              <div className="p-4 bg-emerald-50 rounded-[clamp(0.5rem,1vw,0.75rem)] border border-emerald-200 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-base font-bold text-emerald-900">Order Placed & Completed!</h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Order Number: <span className="font-bold">{orderCompletedResult.orderNumber}</span>
                </p>
              </div>

              {/* Receipt Box */}
              <div className="p-4 bg-white border border-slate-200 rounded-[clamp(0.5rem,1vw,0.75rem)] text-xs text-slate-700 space-y-2 font-mono">
                <div className="text-center border-b border-dashed border-slate-300 pb-2">
                  <h4 className="font-bold text-sm text-slate-900">RESTAURANT MANAGEMENT</h4>
                  <p className="text-[0.65rem] text-slate-400">{orderCompletedResult.createdAt}</p>
                </div>

                <div className="flex justify-between text-[0.7rem]">
                  <span>Receipt #: {orderCompletedResult.orderNumber}</span>
                  <span>Cashier: {orderCompletedResult.cashierName}</span>
                </div>

                <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                  {billItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <span className="truncate max-w-[12rem]">
                        {item.quantity}x {item.name}
                      </span>
                      <span>${item.itemTotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
                  <span>Total Amount:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-[clamp(1rem,1.5vw,1.25rem)] border-t border-slate-200 bg-white space-y-3 shrink-0">
          {!orderCompletedResult ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Bill
                </span>
                <span className="text-2xl font-black text-[var(--color-primary)]">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>

              <Button
                variant="primary"
                disabled={billItems.length === 0 || isCashInsufficient}
                onClick={handlePlaceOrderAndPrint}
                isLoading={isSubmitting}
                icon={<Printer className="w-4 h-4" />}
                className="w-full text-xs sm:text-sm py-3 font-bold rounded-[clamp(0.5rem,1vw,0.75rem)] shadow-md"
              >
                Place Order & Print (${totalAmount.toFixed(2)})
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <PrintPdfButton
                title={`Receipt - ${orderCompletedResult.orderNumber}`}
                subtitle={`Cashier: ${orderCompletedResult.cashierName} | Payment: ${paymentMethod}`}
                headers={pdfHeaders}
                data={pdfData}
                summary={pdfSummary}
                fileName={`Receipt_${orderCompletedResult.orderNumber}`}
                variant="primary"
              />

              <Button
                variant="outline"
                onClick={handleResetForNewOrder}
                icon={<RotateCcw className="w-4 h-4" />}
                className="w-full text-xs py-2.5 font-semibold"
              >
                Start New Order
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
