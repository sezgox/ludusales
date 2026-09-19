import ExcelJS from 'exceljs';
import { RankingExcelImportService } from './ranking-excel-import.service';

describe('RankingExcelImportService', () => {
  const service = new RankingExcelImportService();

  it('reads dynamic columns from the first worksheet', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ranking');
    worksheet.addRow(['participantCode', 'fullName', 'score', 'image', 'Email', 'Localización']);
    worksheet.addRow(['ana-001', 'Ana García', '10.50', '', 'ana@example.com', 'Valencia']);
    const file = new File([await workbook.xlsx.writeBuffer()], 'ranking.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await expect(service.parse(file)).resolves.toEqual({
      fieldHeaders: ['Email', 'Localización'],
      entries: [{
        participantCode: 'ana-001', fullName: 'Ana García', score: '10.50', image: null,
        customFields: { Email: 'ana@example.com', Localización: 'Valencia' },
      }],
    });
  });

  it('rejects missing required columns', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ranking');
    worksheet.addRow(['participantCode', 'fullName']);
    const file = new File([await workbook.xlsx.writeBuffer()], 'ranking.xlsx');

    await expect(service.parse(file)).rejects.toThrow('Faltan las columnas: score.');
  });
});
