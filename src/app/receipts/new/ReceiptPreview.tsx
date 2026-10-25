"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  receiptDocumentHtml,
  renderReceiptMarkup,
  type ReceiptCompanyView,
} from "@/lib/receipt/document";

/** A5 yatay: 210 x 148 mm (96 dpi CSS pikseline çevrilmiş). */
const PAGE_WIDTH = (210 / 25.4) * 96;
const PAGE_HEIGHT = (148 / 25.4) * 96;

export interface ReceiptPreviewData {
  receiptNumber: string;
  receiptDate: string;
  customerName: string;
  customerTaxOffice: string;
  customerTaxNumber: string;
  customerPhone: string;
  customerAddress: string;
  amount: number;
  amountInWords: string;
  paymentMethod: string;
  otherPaymentMethod: string;
  description: string;
  bankInfo: string;
  extraNotes: string;
  preparedByName: string;
}

export default function ReceiptPreview({
  data,
  company,
}: {
  data: ReceiptPreviewData;
  company: ReceiptCompanyView;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.58);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;

    const update = () => {
      const width = element.clientWidth;
      if (width > 0) setScale(width / PAGE_WIDTH);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const html = useMemo(
    () =>
      receiptDocumentHtml({
        markup: renderReceiptMarkup(data, company),
        fontOverride: '"Noto Sans", "Segoe UI", system-ui, sans-serif',
        title: data.receiptNumber || "Tahsilat Makbuzu",
      }),
    [data, company]
  );

  return (
    <div
      ref={frameRef}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md"
      style={{ height: PAGE_HEIGHT * scale }}
    >
      <iframe
        title="Tahsilat Makbuzu A5 önizlemesi"
        srcDoc={html}
        className="border-0 bg-white"
        style={{
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
