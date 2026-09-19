import { Injectable } from '@angular/core';
import ExcelJS from 'exceljs';
import { RankingReplacementEntry } from '../models/gamification';

const requiredHeaders = ['participantCode', 'fullName', 'score'] as const;
const optionalImageHeader = 'image';
const maxEntries = 1000;

export type ImportedRankingEntry = RankingReplacementEntry & { image: File | null };
export type ImportedRanking = { fieldHeaders: string[]; entries: ImportedRankingEntry[] };
type ExtraColumn = { header: string; column: number };
type Columns = { participantCode: number; fullName: number; score: number; image: number | undefined; extra: ExtraColumn[] };

@Injectable({ providedIn: 'root' })
export class RankingExcelImportService {
  async parse(file: File): Promise<ImportedRanking> {
    if (!file.name.toLocaleLowerCase('en-US').endsWith('.xlsx')) {
      throw new Error('Selecciona un fichero Excel .xlsx.');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error('El Excel debe incluir una primera hoja.');

    const columns = this.columnsFor(worksheet);
    const images = this.imagesFor(workbook, worksheet, columns.image);
    const entries: ImportedRankingEntry[] = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const participantCode = this.cellText(row.getCell(columns.participantCode));
      const fullName = this.cellText(row.getCell(columns.fullName));
      const score = this.cellText(row.getCell(columns.score));
      const image = images.get(rowNumber) ?? null;
      const customFields = Object.fromEntries(columns.extra.map(({ header, column }) => [header, this.cellText(row.getCell(column))]).filter(([, value]) => value));
      if (!participantCode && !fullName && !score && !image && Object.keys(customFields).length === 0) continue;
      if (!participantCode || !fullName || !score) {
        throw new Error(`La fila ${rowNumber} debe incluir participantCode, fullName y score.`);
      }
      entries.push({ participantCode, fullName, score, customFields, image });
    }

    if (entries.length > maxEntries) throw new Error('El ranking admite un máximo de 1.000 participantes.');
    if (entries.length === 0) throw new Error('El Excel no contiene participantes.');
    const duplicates = entries.find((entry, index) => entries.findIndex((candidate) => candidate.participantCode === entry.participantCode) !== index);
    if (duplicates) throw new Error(`El código “${duplicates.participantCode}” aparece más de una vez.`);
    return { fieldHeaders: columns.extra.map(({ header }) => header), entries };
  }

  async template(): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ranking');
    worksheet.addRow(['participantCode', 'fullName', 'score', 'image']);
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns = [
      { width: 24 },
      { width: 32 },
      { width: 16 },
      { width: 18 },
    ];
    const data = await workbook.xlsx.writeBuffer();
    return new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  private columnsFor(worksheet: ExcelJS.Worksheet): Columns {
    const headers = new Map<string, number>();
    const extra: ExtraColumn[] = [];
    const reservedHeaders = new Set([...requiredHeaders, optionalImageHeader].map((header) => header.toLocaleLowerCase('en-US')));
    worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      const header = this.cellText(cell);
      const normalized = header.toLocaleLowerCase('en-US');
      if (!header) throw new Error(`La columna ${columnNumber} no tiene cabecera.`);
      if (headers.has(normalized)) throw new Error(`La cabecera â€œ${header}â€ estÃ¡ repetida.`);
      headers.set(normalized, columnNumber);
      if (!reservedHeaders.has(normalized)) extra.push({ header, column: columnNumber });
    });
    const columns = {
      participantCode: headers.get('participantcode'),
      fullName: headers.get('fullname'),
      score: headers.get('score'),
      image: headers.get(optionalImageHeader),
      extra,
    };
    const missing = requiredHeaders.filter((header) => columns[header] === undefined);
    if (missing.length) throw new Error(`Faltan las columnas: ${missing.join(', ')}.`);
    return columns as Columns;
  }

  private imagesFor(workbook: ExcelJS.Workbook, worksheet: ExcelJS.Worksheet, imageColumn: number | undefined): Map<number, File> {
    const images = new Map<number, File>();
    for (const imageRef of worksheet.getImages()) {
      if (imageColumn === undefined) throw new Error('Incluye la columna image para importar fotos.');
      const row = Math.floor(imageRef.range.tl.row) + 1;
      const column = Math.floor(imageRef.range.tl.col) + 1;
      if (column !== imageColumn || row < 2 || images.has(row)) {
        throw new Error('Cada foto debe estar anclada en la celda image de una única fila.');
      }
      const image = workbook.getImage(Number(imageRef.imageId));
      if (!image.buffer || !['jpeg', 'png'].includes(image.extension)) {
        throw new Error(`La imagen de la fila ${row} debe ser JPEG o PNG.`);
      }
      const bytes = new Uint8Array(image.buffer);
      const type = image.extension === 'jpeg' ? 'image/jpeg' : 'image/png';
      images.set(row, new File([bytes], `participant-${row}.${image.extension}`, { type }));
    }
    return images;
  }

  private cellText(cell: ExcelJS.Cell): string {
    return cell.text.trim();
  }
}
