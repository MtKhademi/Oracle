import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { Asset, parseRows, toRows } from './domain';

export async function pickWorkbook(): Promise<Asset[] | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'], copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!/\.(xlsx|xls|csv)$/i.test(asset.name)) throw new Error('فقط فایل Excel یا CSV انتخاب کنید.');
  if ((asset.size ?? 0) > 5 * 1024 * 1024) throw new Error('حجم فایل باید کمتر از ۵ مگابایت باشد.');
  let workbook: XLSX.WorkBook;
  if (Platform.OS === 'web') {
    if (!asset.file) throw new Error('فایل قابل خواندن نیست. دوباره انتخاب کنید.');
    workbook = XLSX.read(await asset.file.arrayBuffer(), { type: 'array', cellFormula: true });
  } else {
    const content = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
    workbook = XLSX.read(content, { type: 'base64', cellFormula: true });
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet || Object.keys(sheet).some(k => !k.startsWith('!') && sheet[k]?.f)) throw new Error('فایل خالی است یا فرمول دارد؛ مقادیر را به صورت عدد ثابت وارد کنید.');
  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1');
  if (range.e.r > 2000 || range.e.c > 50) throw new Error('ابعاد شیت بیش از حد مجاز است؛ حداکثر ۲۰۰۰ ردیف دارایی وارد کنید.');
  return parseRows(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][]);
}
export async function exportWorkbook(assets: Asset[], name = 'darayi-backup.xlsx') {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(toRows(assets));
  sheet['!cols'] = [24, 20, 26, 18, 24, 26].map(wch => ({ wch }));
  XLSX.utils.book_append_sheet(workbook, sheet, 'دارایی‌ها');
  workbook.Workbook = { Views: [{ RTL: true }] };
  if (Platform.OS === 'web') { XLSX.writeFile(workbook, name); return; }
  if (!await Sharing.isAvailableAsync()) throw new Error('اشتراک‌گذاری فایل روی این دستگاه در دسترس نیست.');
  const uri = `${FileSystem.cacheDirectory}${name}`;
  await FileSystem.writeAsStringAsync(uri, XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' }), { encoding: FileSystem.EncodingType.Base64 });
  await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', UTI: 'org.openxmlformats.spreadsheetml.sheet' });
}
