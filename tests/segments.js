import { expect, test } from "bun:test"
import { findMinimalSegmentation } from "../src/segments"

// test cases pulled from https://www.nayuki.io/page/optimal-text-segmentation-for-qr-codes

test('simple segmentation', () => {
  expect(findMinimalSegmentation('TEST',1).steps).toEqual(
    ['alpha','alpha','alpha','alpha']
  )
  expect(findMinimalSegmentation('1234',1).steps).toEqual(
    ['numeric','numeric','numeric','numeric']
  )
  expect(findMinimalSegmentation('test',1).steps).toEqual(
    ['byte','byte','byte','byte']
  )
  expect(findMinimalSegmentation('12341234TEST',1).steps).toEqual(
    ['numeric','numeric','numeric','numeric','numeric','numeric','numeric','numeric','alpha','alpha','alpha','alpha']
  )
  expect(findMinimalSegmentation('1234TEST',1).steps).toEqual(
    ['alpha','alpha','alpha','alpha','alpha','alpha','alpha','alpha']
  )
})

test('segmentation breakpoints', () => {
  // ALPHA / BYTE breakpoint
  expect(findMinimalSegmentation('ABCDEa',1).steps).toEqual(
    ['byte','byte','byte','byte','byte','byte']
  )
  expect(findMinimalSegmentation('ABCDEFa',1).steps).toEqual(
    ['alpha','alpha','alpha','alpha','alpha','alpha','byte']
  )
  // NUMERIC / BYTE breakpoint
  expect(findMinimalSegmentation('012a',1).steps).toEqual(
    ['byte','byte','byte','byte']
  )
  expect(findMinimalSegmentation('0123a',1).steps).toEqual(
    ['numeric','numeric','numeric','numeric','byte']
  )
  // ALPHA / NUMERIC
  expect(findMinimalSegmentation('012345A',1).steps).toEqual(
    ['alpha','alpha','alpha','alpha','alpha','alpha','alpha']
  )
  expect(findMinimalSegmentation('01234567A',1).steps).toEqual(
    ['numeric','numeric','numeric','numeric','numeric','numeric','numeric','numeric','alpha']
  )
})

test('complex segmentation', () => {
  expect(findMinimalSegmentation(`Golden ratio φ = 1.6180339887498948482045868343656381177203091798057628621354486227052604628189024497072072041893911374......`).steps).toEqual([
    ...Array(20).fill('byte'),
    ...Array(100).fill('numeric'),
    ...Array(6).fill('alpha')
  ])

  expect(findMinimalSegmentation(`67128177921547861663com.acme35584af52fa3-88d0-093b-6c14-b37ddafb59c528908608sg.com.dash.www0530329356521790265903SG.COM.NETS46968696003522G33250183309051017567088693441243693268766948304B2AE13344004SG.SGQR209710339366720B439682.63667470805057501195235502733744600368027857918629797829126902859SG8236HELLO FOO2517Singapore3272B815`, 1).steps).toEqual([
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
  ])

  expect(findMinimalSegmentation(`67128177921547861663com.acme35584af52fa3-88d0-093b-6c14-b37ddafb59c528908608sg.com.dash.www0530329356521790265903SG.COM.NETS46968696003522G33250183309051017567088693441243693268766948304B2AE13344004SG.SGQR209710339366720B439682.63667470805057501195235502733744600368027857918629797829126902859SG8236HELLO FOO2517Singapore3272B815`, 11).steps).toEqual([
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
  ])

  expect(findMinimalSegmentation(`67128177921547861663com.acme35584af52fa3-88d0-093b-6c14-b37ddafb59c528908608sg.com.dash.www0530329356521790265903SG.COM.NETS46968696003522G33250183309051017567088693441243693268766948304B2AE13344004SG.SGQR209710339366720B439682.63667470805057501195235502733744600368027857918629797829126902859SG8236HELLO FOO2517Singapore3272B815`, 39).steps).toEqual([
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
  ])
})