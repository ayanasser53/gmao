export type ExportTableRow = Array<string | number | null | undefined>;

export interface ExportTableOptions {
  title: string;
  fileName: string;
  headers: string[];
  rows: ExportTableRow[];
}

function sanitizePdfText(value: string | number | null | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value: string | number | null | undefined): string {
  return sanitizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function escapeCsvCell(value: string | number | null | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadBlob(content: BlobPart, type: string, fileName: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function shorten(value: string | number | null | undefined, maxLength: number) {
  const text = sanitizePdfText(value);

  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}.` : text;
}

export function exportTableCsv(options: ExportTableOptions) {
  const rows = [options.headers, ...options.rows];
  const csv = rows.map((row) => row.map(escapeCsvCell).join(";")).join("\r\n");

  downloadBlob(`\uFEFF${csv}`, "text/csv;charset=utf-8", `${options.fileName}.csv`);
}

export function exportTablePdf(options: ExportTableOptions) {
  const pageWidth = 842;
  const pageHeight = 595;
  const marginX = 34;
  const tableWidth = pageWidth - marginX * 2;
  const blue = "0.031 0.498 0.741";
  const dark = "0.031 0.184 0.349";
  const gray = "0.38 0.45 0.53";
  const border = "0.78 0.84 0.90";
  const soft = "0.93 0.97 0.99";
  const rowHeight = 30;
  const rowsPerPage = 12;
  const pages = Math.max(1, Math.ceil(options.rows.length / rowsPerPage));
  const columnWidth = tableWidth / options.headers.length;

  function text(
    commands: string[],
    value: string | number | null | undefined,
    x: number,
    y: number,
    size = 9,
    color = dark,
  ) {
    commands.push(`BT ${color} rg /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`);
  }

  function rect(
    commands: string[],
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    fill = false,
  ) {
    commands.push(`${color} ${fill ? "rg" : "RG"} ${x} ${y} ${width} ${height} re ${fill ? "f" : "S"}`);
  }

  const contents = Array.from({ length: pages }, (_, pageIndex) => {
    const commands: string[] = [];
    const pageRows = options.rows.slice(
      pageIndex * rowsPerPage,
      pageIndex * rowsPerPage + rowsPerPage,
    );

    rect(commands, 0, 0, pageWidth, pageHeight, "1 1 1", true);
    text(commands, "SmartMaint", marginX, 548, 15, blue);
    text(commands, options.title, marginX, 516, 22, dark);
    text(
      commands,
      `Export du ${new Intl.DateTimeFormat("fr-FR").format(new Date())}`,
      marginX,
      493,
      9,
      gray,
    );
    text(commands, `${options.rows.length} ligne(s)`, 720, 493, 9, gray);

    const headerY = 455;
    rect(commands, marginX, headerY, tableWidth, 28, blue, true);
    options.headers.forEach((header, index) => {
      text(commands, header, marginX + index * columnWidth + 8, headerY + 10, 8.5, "1 1 1");
    });

    pageRows.forEach((row, rowIndex) => {
      const y = headerY - rowHeight * (rowIndex + 1);
      rect(commands, marginX, y, tableWidth, rowHeight, rowIndex % 2 === 0 ? "1 1 1" : soft, true);

      options.headers.forEach((_, columnIndex) => {
        rect(commands, marginX + columnIndex * columnWidth, y, columnWidth, rowHeight, border);
      });

      row.forEach((cell, columnIndex) => {
        const limit = Math.max(10, Math.floor(columnWidth / 5.2));
        text(
          commands,
          shorten(cell, limit),
          marginX + columnIndex * columnWidth + 8,
          y + 12,
          8,
          dark,
        );
      });
    });

    text(commands, `Page ${pageIndex + 1} / ${pages}`, 745, 32, 8, gray);

    return commands.join("\n");
  });

  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${contents
      .map((_, index) => `${4 + index * 2} 0 R`)
      .join(" ")}] /Count ${contents.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  contents.forEach((content, index) => {
    const pageObjectId = 4 + index * 2;
    const contentObjectId = pageObjectId + 1;

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
    );
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  downloadBlob(pdf, "application/pdf", `${options.fileName}.pdf`);
}
