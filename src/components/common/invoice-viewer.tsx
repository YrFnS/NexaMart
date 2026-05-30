'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { APP_NAME, APP_SUPPORT_EMAIL, APP_DOMAIN } from '@/lib/config';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';

interface InvoiceItem {
  productId: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface InvoiceSeller {
  storeName: string;
  storeNameAr: string;
  address: string;
  addressAr: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  taxId?: string;
}

interface InvoiceBuyer {
  name: string;
  email: string;
  phone: string;
  address: string;
  addressAr: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  invoiceDate: string;
  dueDate: string;
  seller: InvoiceSeller;
  buyer: InvoiceBuyer;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  discount: number;
  discountLabel?: string;
  grandTotal: number;
  currency: string;
  paymentMethod: string;
  paymentMethodAr: string;
  paymentStatus: 'paid' | 'unpaid';
  notes?: string;
}

interface InvoiceViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
}

export function InvoiceViewer({ open, onOpenChange, orderId }: InvoiceViewerProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInvoice = async () => {
      if (!open || !orderId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/invoices?orderId=${orderId}`);
        const data = await res.json();
        setInvoice(data);
      } catch {
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };
    loadInvoice();
  }, [open, orderId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(getLocale(isRTL), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPdf = useCallback(() => {
    // Use browser print with save-as-PDF option
    window.print();
    toast.success(t('invoiceDownloaded'));
  }, [t]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/orders?invoice=${orderId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success(t('invoiceCopied'));
    }).catch(() => {
      // Fallback
      toast.success(t('invoiceCopied'));
    });
  }, [t, orderId]);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <FileText className="size-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {isRTL ? 'لم يتم العثور على الفاتورة' : 'Invoice not found'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-print-area,
          .invoice-print-area * {
            visibility: visible;
          }
          .invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-white-bg {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-border {
            border-color: #333 !important;
          }
          .print-text-black {
            color: black !important;
          }
          .print-text-gray {
            color: #555 !important;
          }
          .print-header-bar {
            background: #059669 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-table-header {
            background: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-table-alt {
            background: #fafafa !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 print-white-bg" showCloseButton>
          <DialogHeader className="sr-only">
            <DialogTitle>
              {t('invoice')} #{invoice.invoiceNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="invoice-print-area print-white-bg">
            {/* Action Buttons (hidden in print) */}
            <div className="no-print flex items-center justify-end gap-2 p-4 border-b">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleDownloadPdf}
              >
                <Download className="size-3.5 me-1" />
                {t('downloadInvoice')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handlePrint}
              >
                <Printer className="size-3.5 me-1" />
                {t('printInvoice')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleShare}
              >
                <Share2 className="size-3.5 me-1" />
                {t('shareInvoice')}
              </Button>
            </div>

            {/* Invoice Content */}
            <div className="p-6 space-y-6 print-white-bg print-text-black">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                {/* Logo & Brand */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 print-header-bar flex items-center justify-center">
                    <span className="text-white font-bold text-lg">N</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold print-text-black">{APP_NAME}</h1>
                    <p className="text-xs text-muted-foreground print-text-gray">
                      {isRTL ? 'منصة التجارة متعددة البائعين' : 'Multi-Vendor Commerce Platform'}
                    </p>
                  </div>
                </div>
                {/* Invoice Title & Number */}
                <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
                  <h2 className="text-2xl font-bold text-emerald-600 print-text-black tracking-wider">
                    {t('invoiceTitle')}
                  </h2>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-sm font-mono print-text-black">
                      <span className="text-muted-foreground print-text-gray">{t('invoiceNumber')}: </span>
                      <span className="font-semibold">{invoice.invoiceNumber}</span>
                    </p>
                    <p className="text-sm print-text-black">
                      <span className="text-muted-foreground print-text-gray">{t('invoiceDate')}: </span>
                      <span>{formatDate(invoice.invoiceDate)}</span>
                    </p>
                    <p className="text-sm print-text-black">
                      <span className="text-muted-foreground print-text-gray">{t('dueDate')}: </span>
                      <span>{formatDate(invoice.dueDate)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <Badge
                  className={`${
                    invoice.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                  } border-0 print-table-header`}
                >
                  {invoice.paymentStatus === 'paid' ? (
                    <CheckCircle2 className="size-3 me-1" />
                  ) : (
                    <Clock className="size-3 me-1" />
                  )}
                  {invoice.paymentStatus === 'paid' ? t('paidStatus') : t('unpaidStatus')}
                </Badge>
                <span className="text-xs text-muted-foreground print-text-gray">
                  {t('orderReference')}: <span className="font-mono font-medium print-text-black">{invoice.orderNumber}</span>
                </span>
              </div>

              {/* Bill To / Ship To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Seller Info */}
                <div className="p-4 rounded-lg border print-border bg-muted/30 print-table-alt">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="size-4 text-emerald-600 print-text-black" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground print-text-gray">
                      {t('sellerInfo')}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm print-text-black">
                      {isRTL ? invoice.seller.storeNameAr : invoice.seller.storeName}
                    </p>
                    <p className="text-xs text-muted-foreground print-text-gray">
                      {isRTL ? invoice.seller.addressAr : invoice.seller.address}
                    </p>
                    <p className="text-xs text-muted-foreground print-text-gray">
                      {invoice.seller.city}, {invoice.seller.country}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground print-text-gray">
                      <Phone className="size-3" />
                      {invoice.seller.phone}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground print-text-gray">
                      <Mail className="size-3" />
                      {invoice.seller.email}
                    </div>
                    {invoice.seller.taxId && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground print-text-gray">
                        <BadgeCheck className="size-3" />
                        {isRTL ? 'الرقم الضريبي' : 'Tax ID'}: {invoice.seller.taxId}
                      </div>
                    )}
                  </div>
                </div>

                {/* Buyer Info */}
                <div className="p-4 rounded-lg border print-border bg-muted/30 print-table-alt">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="size-4 text-emerald-600 print-text-black" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground print-text-gray">
                      {t('billTo')}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm print-text-black">{invoice.buyer.name}</p>
                    <p className="text-xs text-muted-foreground print-text-gray">
                      {isRTL ? invoice.buyer.addressAr : invoice.buyer.address}
                    </p>
                    <p className="text-xs text-muted-foreground print-text-gray">
                      {invoice.buyer.city}, {invoice.buyer.state} {invoice.buyer.postalCode}
                    </p>
                    <p className="text-xs text-muted-foreground print-text-gray">{invoice.buyer.country}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground print-text-gray">
                      <Phone className="size-3" />
                      {invoice.buyer.phone}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground print-text-gray">
                      <Mail className="size-3" />
                      {invoice.buyer.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden print-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/80 print-table-header">
                      <th className={`px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider print-text-black ${isRTL ? 'text-right' : 'text-left'}`}>
                        #
                      </th>
                      <th className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider print-text-black ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('item')}
                      </th>
                      <th className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider print-text-black ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('quantity')}
                      </th>
                      <th className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider print-text-black ${isRTL ? 'text-right' : 'text-right'}`}>
                        {t('unitPrice')}
                      </th>
                      <th className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider print-text-black ${isRTL ? 'text-left' : 'text-right'}`}>
                        {t('lineTotal')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr
                        key={item.productId}
                        className={`border-t print-border ${idx % 2 === 0 ? '' : 'bg-muted/30 print-table-alt'}`}
                      >
                        <td className={`px-4 py-3 text-muted-foreground print-text-gray ${isRTL ? 'text-right' : 'text-left'}`}>
                          {idx + 1}
                        </td>
                        <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <p className="font-medium print-text-black">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground print-text-gray mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td className={`px-4 py-3 print-text-black ${isRTL ? 'text-right' : 'text-left'}`}>
                          {item.quantity}
                        </td>
                        <td className={`px-4 py-3 print-text-black ${isRTL ? 'text-left' : 'text-right'}`}>
                          {formatPrice(item.unitPrice)}
                        </td>
                        <td className={`px-4 py-3 font-medium print-text-black ${isRTL ? 'text-left' : 'text-right'}`}>
                          {formatPrice(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full sm:w-72 space-y-2">
                  <div className="flex justify-between text-sm print-text-black">
                    <span className="text-muted-foreground print-text-gray">{t('subtotal')}</span>
                    <span className="font-medium">{formatPrice(invoice.subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-sm print-text-black">
                    <span className="text-muted-foreground print-text-gray">
                      {t('taxRate')} ({invoice.taxRate}%)
                    </span>
                    <span className="font-medium">{formatPrice(invoice.taxAmount)}</span>
                  </div>

                  {invoice.shippingCost > 0 ? (
                    <div className="flex justify-between text-sm print-text-black">
                      <span className="text-muted-foreground print-text-gray">{t('shippingCost')}</span>
                      <span className="font-medium">{formatPrice(invoice.shippingCost)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm print-text-black">
                      <span className="text-muted-foreground print-text-gray">{t('shippingCost')}</span>
                      <span className="font-medium text-emerald-600">{t('free')}</span>
                    </div>
                  )}

                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-sm print-text-black">
                      <span className="text-muted-foreground print-text-gray">
                        {t('couponDiscount')}
                        {invoice.discountLabel && (
                          <span className="text-xs ms-1">({invoice.discountLabel})</span>
                        )}
                      </span>
                      <span className="font-medium text-red-600">-{formatPrice(invoice.discount)}</span>
                    </div>
                  )}

                  <Separator className="print-border" />

                  <div className="flex justify-between text-base font-bold print-text-black">
                    <span>{t('grandTotal')}</span>
                    <span className="text-emerald-600 print-text-black">{formatPrice(invoice.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="p-4 rounded-lg border print-border bg-muted/30 print-table-alt">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground print-text-gray">
                      {t('paymentMethod')}
                    </p>
                    <p className="text-sm font-medium print-text-black">
                      {isRTL ? invoice.paymentMethodAr : invoice.paymentMethod}
                    </p>
                  </div>
                  <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground print-text-gray">
                      {t('paymentStatus')}
                    </p>
                    <Badge
                      className={`${
                        invoice.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                      } border-0 print-table-header`}
                    >
                      {invoice.paymentStatus === 'paid' ? t('paidStatus') : t('unpaidStatus')}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="p-3 rounded-lg border print-border bg-amber-50 dark:bg-amber-950/20 print-table-alt">
                  <p className="text-xs text-muted-foreground print-text-gray">
                    {isRTL ? 'ملاحظات' : 'Notes'}: {invoice.notes}
                  </p>
                </div>
              )}

              {/* Footer */}
              <Separator className="print-border" />
              <div className="text-center space-y-2 py-2">
                <p className="text-sm font-medium text-emerald-600 print-text-black">
                  {t('thankYouForShopping')}
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground print-text-gray">
                  <span className="flex items-center gap-1">
                    <Mail className="size-3" />
                    {APP_SUPPORT_EMAIL}
                  </span>
                  <span>•</span>
                  <span>{t('termsAndConditions')}: {APP_DOMAIN}/terms</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60 print-text-gray">
                  {isRTL
                    ? 'هذه الفاتورة تم إنشاؤها إلكترونياً وهي صالحة بدون توقيع.'
                    : 'This invoice was generated electronically and is valid without a signature.'}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
