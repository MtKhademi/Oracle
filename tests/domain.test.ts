import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { demo, headers, numberOf, parseRows, mergeAssets, summarize, toRows } from '../src/domain';

test('Persian, Arabic and fractional quantities',()=>{
  assert.equal(numberOf('۱۲٬۳۴۵٫۶۷'),12345.67);
  assert.equal(numberOf('٠٫٠٠٣'),0.003);
  assert.ok(Number.isNaN(numberOf('')));
  assert.ok(Number.isNaN(numberOf('1e5')));
});
test('rejects malformed rows without partial import',()=>{
  for(const row of [ ['x','طلا','Gold',1,100,''], ['x','طلای فیزیکی','Gold',-1,100,''], ['x','پول نقد','Bank',10,100,''], ['x','صندوق طلا','Ayar',1.1,100,''], ['x','ارز دیجیتال','BTC','',100,''] ]) assert.throws(()=>parseRows([headers,row]));
  assert.throws(()=>parseRows([headers,toRows(demo)[1],toRows(demo)[1]]),/تکراری/);
  assert.throws(()=>parseRows([headers]),/هیچ دارایی/);
});
test('same file import is idempotent and preserves unrelated assets',()=>{
  const items=parseRows(toRows(demo));const original=[{...demo[0],id:'unrelated'}];
  const merged=mergeAssets(original,items);
  assert.equal(merged.length,8);
  assert.deepEqual(mergeAssets(merged,items),merged);
  assert.equal(mergeAssets(merged,[{...items[0],quantity:99}]).find(a=>a.id===items[0].id)?.quantity,99);
});
test('partial cost basis does not treat missing cost as zero',()=>{
  const result=summarize([{...demo[0],quantity:2,price:100,cost:150},{...demo[1],quantity:3,price:100,cost:null}]);
  assert.equal(result.total,500);assert.equal(result.cost,150);assert.equal(result.profit,50);assert.equal(result.known,1);
  assert.equal(result.allocation.reduce((n,a)=>n+a.value,0),result.total);
});
test('actual XLSX bytes round-trip quantities, Persian names and blank cost basis',()=>{
  const assets=[...demo,{...demo[0],id:'no-cost',cost:null}];
  const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(toRows(assets)),'دارایی‌ها');
  const bytes=XLSX.write(book,{type:'buffer',bookType:'xlsx'});const read=XLSX.read(bytes,{type:'buffer'});
  const rows=XLSX.utils.sheet_to_json(read.Sheets[read.SheetNames[0]],{header:1,defval:''}) as unknown[][];
  assert.deepEqual(parseRows(rows).map(({updated,...a})=>a),assets.map(({updated,...a})=>a));
});
