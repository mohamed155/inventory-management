type PrintOptions = {
  title: string;
  content: string;
  dir?: 'ltr' | 'rtl';
};

export function printContent({ title, content, dir }: PrintOptions): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html dir="${dir ?? document.documentElement.dir ?? 'ltr'}" lang="${document.documentElement.lang ?? 'en'}">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; padding: 32px; color: #111; font-size: 14px; }
    h1 { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
    h6 { font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #555; }
    p { font-size: 14px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .grid > div { padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0 20px; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: start; }
    th { background: #f9fafb; font-weight: 600; font-size: 13px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; border: 1px solid #d1d5db; font-size: 12px; }
    .flex { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
    .text-green { color: #16a34a; }
    .text-red { color: #dc2626; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${content}
</body>
</html>`);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
