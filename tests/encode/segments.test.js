import { expect, test } from "bun:test"
import { minStrategy } from "../../src"

function toStepFormat(arr){
  let segments = []
  let steps = arr
  let curMode = steps[0]
  let start = 0
  for(let i = 1; i <= steps.length; i++){
    if(i >= steps.length || steps[i] != curMode){
      segments.push([curMode, i - start])
      curMode = steps[i];
      start = i;
    }
  }
  return segments;
}

// test cases pulled from https://www.nayuki.io/page/optimal-text-segmentation-for-qr-codes

test('simple segmentation', () => {
  expect(minStrategy('TEST',1).steps).toEqual(
    toStepFormat(['alpha','alpha','alpha','alpha'])
  )
  expect(minStrategy('1234',1).steps).toEqual(
    toStepFormat(['numeric','numeric','numeric','numeric'])
  )
  expect(minStrategy('test',1).steps).toEqual(
    toStepFormat(['byte','byte','byte','byte'])
  )
  expect(minStrategy('12341234TEST',1).steps).toEqual(
    toStepFormat(['numeric','numeric','numeric','numeric','numeric','numeric','numeric','numeric','alpha','alpha','alpha','alpha'])
  )
  expect(minStrategy('1234TEST',1).steps).toEqual(
    toStepFormat(['alpha','alpha','alpha','alpha','alpha','alpha','alpha','alpha'])
  )
})

test('kanji mode', () => {
  expect(minStrategy('こんにち',1).steps).toEqual(
    toStepFormat([
      'kanji','kanji','kanji','kanji',
    ])
  )
  expect(minStrategy('αβγδ',1).steps).toEqual(
    toStepFormat([
      'kanji','kanji','kanji','kanji',
    ])
  )
  expect(minStrategy('αβγδx',1).steps).toEqual(
    toStepFormat([
      'byte','byte','byte','byte','byte'
    ])
  )
  expect(minStrategy('こんにちwa、世界！ αβγδ',1).steps).toEqual(
    toStepFormat([
      'kanji','kanji','kanji','kanji',
      'byte','byte',
      'kanji','kanji','kanji','kanji',
      'alpha',
      'kanji','kanji','kanji','kanji'
    ])
  )
})

test('segmentation breakpoints', () => {
  // ALPHA / BYTE breakpoint
  expect(minStrategy('ABCDEa',1).steps).toEqual(
    toStepFormat(['byte','byte','byte','byte','byte','byte'])
  )
  expect(minStrategy('ABCDEFa',1).steps).toEqual(
    toStepFormat(['alpha','alpha','alpha','alpha','alpha','alpha','byte'])
  )
  // NUMERIC / BYTE breakpoint
  expect(minStrategy('012a',1).steps).toEqual(
    toStepFormat(['byte','byte','byte','byte'])
  )
  expect(minStrategy('0123a',1).steps).toEqual(
    toStepFormat(['numeric','numeric','numeric','numeric','byte'])
  )
  // ALPHA / NUMERIC
  expect(minStrategy('012345A',1).steps).toEqual(
    toStepFormat(['alpha','alpha','alpha','alpha','alpha','alpha','alpha'])
  )
  expect(minStrategy('01234567A',1).steps).toEqual(
    toStepFormat(['numeric','numeric','numeric','numeric','numeric','numeric','numeric','numeric','alpha'])
  )
})

test('complex segmentation', () => {
  expect(minStrategy(`Golden ratio φ = 1.6180339887498948482045868343656381177203091798057628621354486227052604628189024497072072041893911374......`, 1).steps).toEqual(toStepFormat([
    ...Array(19).fill('byte'),
    ...Array(100).fill('numeric'),
    ...Array(6).fill('alpha')
  ]))

  expect(minStrategy(`67128177921547861663com.acme35584af52fa3-88d0-093b-6c14-b37ddafb59c528908608sg.com.dash.www0530329356521790265903SG.COM.NETS46968696003522G33250183309051017567088693441243693268766948304B2AE13344004SG.SGQR209710339366720B439682.63667470805057501195235502733744600368027857918629797829126902859SG8236HELLO FOO2517Singapore3272B815`, 1).steps).toEqual(toStepFormat([
    ...Array(20).fill('numeric'),
    ...Array(47).fill('byte'),
    ...Array(9).fill('numeric'),
    ...Array(15).fill('byte'),
    ...Array(22).fill('numeric'),
    ...Array(11).fill('alpha'),
    ...Array(14).fill('numeric'),
    ...Array(1).fill('alpha'),
    ...Array(47).fill('numeric'),
    ...Array(19).fill('alpha'),
    ...Array(15).fill('numeric'),
    ...Array(8).fill('alpha'),
    ...Array(65).fill('numeric'),
    ...Array(20).fill('alpha'),
    ...Array(8).fill('byte'),
    ...Array(8).fill('alpha'),
  ]))

  expect(minStrategy(`67128177921547861663com.acme35584af52fa3-88d0-093b-6c14-b37ddafb59c528908608sg.com.dash.www0530329356521790265903SG.COM.NETS46968696003522G33250183309051017567088693441243693268766948304B2AE13344004SG.SGQR209710339366720B439682.63667470805057501195235502733744600368027857918629797829126902859SG8236HELLO FOO2517Singapore3272B815`, 11).steps).toEqual(toStepFormat([
    ...Array(20).fill('numeric'),
    ...Array(47).fill('byte'),
    ...Array(9).fill('numeric'),
    ...Array(15).fill('byte'),
    ...Array(22).fill('numeric'),
    ...Array(26).fill('alpha'),
    ...Array(47).fill('numeric'),
    ...Array(19).fill('alpha'),
    ...Array(15).fill('numeric'),
    ...Array(8).fill('alpha'),
    ...Array(65).fill('numeric'),
    ...Array(20).fill('alpha'),
    ...Array(8).fill('byte'),
    ...Array(8).fill('alpha'),
  ]))

  expect(minStrategy(`67128177921547861663com.acme35584af52fa3-88d0-093b-6c14-b37ddafb59c528908608sg.com.dash.www0530329356521790265903SG.COM.NETS46968696003522G33250183309051017567088693441243693268766948304B2AE13344004SG.SGQR209710339366720B439682.63667470805057501195235502733744600368027857918629797829126902859SG8236HELLO FOO2517Singapore3272B815`, 39).steps).toEqual(toStepFormat([
    ...Array(20).fill('numeric'),
    ...Array(47).fill('byte'),
    ...Array(9).fill('numeric'),
    ...Array(15).fill('byte'),
    ...Array(22).fill('numeric'),
    ...Array(26).fill('alpha'),
    ...Array(47).fill('numeric'),
    ...Array(42).fill('alpha'),
    ...Array(65).fill('numeric'),
    ...Array(20).fill('alpha'),
    ...Array(8).fill('byte'),
    ...Array(8).fill('alpha'),
  ]))

  // NOTE: number depends on num chars vs num byte slots. this test diverges from Nayuki
  expect(minStrategy(`2004年大西洋颶風季是有纪录以来造成人员伤亡和财产损失最为惨重的大西洋飓风季之一，于2004年6月1日正式开始，同年11月30日结束，传统上这样的日期界定了一年中绝大多数热带气旋在大西洋形成的时间段lll ku`, 9).steps).toEqual(toStepFormat([
    ...Array(4).fill('numeric'),
    ...Array(9).fill('kanji'),
    ...Array(2).fill('byte'),
    ...Array(5).fill('kanji'),
    ...Array(10).fill('byte'),
    ...Array(6).fill('kanji'),
    ...Array(2).fill('byte'),
    ...Array(5).fill('kanji'),
    ...Array(4).fill('numeric'),
    ...Array(4).fill('byte'),
    ...Array(3).fill('kanji'),
    ...Array(1).fill('byte'),
    ...Array(4).fill('kanji'),
    ...Array(14).fill('byte'),
    ...Array(9).fill('kanji'),
    ...Array(1).fill('byte'),
    ...Array(3).fill('kanji'),
    ...Array(2).fill('byte'),
    ...Array(9).fill('kanji'),
    ...Array(9).fill('byte'),
  ]))
})
