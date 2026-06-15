import { DataType, PermutationSet } from './DataType'

export const formats = ["bitcoin","event","wifi","phone","geo","vcard","ethereum","sms","url","email"];

export function bitcoinData(v){ return new DataType(v,__$0__,__$1__, __$2__, __$3__) }
export function eventData(v){ return new DataType(v,__$4__,__$5__, __$6__, __$7__) }
export function wifiData(v){ return new DataType(v,__$8__,__$9__, __$10_, __$11_) }
export function phoneData(v){ return new DataType(v,__$12_,__$13_, __$14_, __$15_) }
export function geoData(v){ return new DataType(v,__$16_,__$17_, __$18_, __$19_) }
export function vcardData(v){ return new DataType(v,__$20_,__$21_, __$22_, __$23_) }
export function ethereumData(v){ return new DataType(v,__$24_,__$25_, __$26_, __$27_) }
export function smsData(v){ return new DataType(v,__$28_,__$29_, __$30_, __$31_) }
export function urlData(v){ return new DataType(v,__$32_,__$33_, __$34_, __$35_) }
export function emailData(v){ return new DataType(v,__$36_,__$37_, __$38_, __$39_) }

export function qrData(type, value){
  let datatypes = {
    bitcoin: bitcoinData,
    event: eventData,
    wifi: wifiData,
    phone: phoneData,
    geo: geoData,
    vcard: vcardData,
    ethereum: ethereumData,
    sms: smsData,
    url: urlData,
    email: emailData,
  }
  return datatypes[type](value)
}

export function formatData(type, value){
  const formats = {
    bitcoin: __$0__,
    event: __$4__,
    wifi: __$8__,
    phone: __$12_,
    geo: __$16_,
    vcard: __$20_,
    ethereum: __$24_,
    sms: __$28_,
    url: __$32_,
    email: __$36_
  }
  return formats[type](value)
}

export function permuteData(type,value,options){
  const permutations = {
    bitcoin: __$1__,
    event: __$5__,
    wifi: __$9__,
    phone: __$13_,
    geo: __$17_,
    vcard: __$21_,
    ethereum: __$25_,
    sms: __$29_,
    url: __$33_,
    email: __$37_
  }
  return new PermutationSet(permutations[type](value,options))
}

export function previewData(type, value){
  const previews = {
    bitcoin: __$3__,
    event: __$7__,
    wifi: __$11_,
    phone: __$15_,
    geo: __$19_,
    vcard: __$23_,
    ethereum: __$27_,
    sms: __$31_,
    url: __$35_,
    email: __$39_
  }
  return previews[type](value)
}

export function iconData(type,value){
  const icons = {
    bitcoin: __$2__,
    event: __$6__,
    wifi: __$10_,
    phone: __$14_,
    geo: __$18_,
    vcard: __$22_,
    ethereum: __$26_,
    sms: __$30_,
    url: __$34_,
    email: __$38_
  }
  return icons[type](value)
}

export function schemaData(type){
  const valueSchemas = {
    bitcoin: __$40_,
    event: __$41_,
    wifi: __$42_,
    phone: __$43_,
    geo: __$44_,
    vcard: __$45_,
    ethereum: __$46_,
    sms: __$47_,
    url: __$48_,
    email: __$49_
  }
  const permuteSchemas = {
    bitcoin: __$50_,
    event: __$51_,
    wifi: __$52_,
    phone: __$53_,
    geo: __$54_,
    vcard: __$55_,
    ethereum: __$56_,
    sms: __$57_,
    url: __$58_,
    email: __$59_
  }
  return {
    value: valueSchemas[type](),
    permute: permuteSchemas[type]()
  }
}

/*--------------*/

import { format as __$0__, permute as __$1__, icon as __$2__, preview as __$3__, valueSchema as __$40_, permuteSchema as __$50_ } from '../data/formats/bitcoin'
import { format as __$36_, permute as __$37_, icon as __$38_, preview as __$39_, valueSchema as __$49_, permuteSchema as __$59_ } from '../data/formats/email'
import { format as __$24_, permute as __$25_, icon as __$26_, preview as __$27_, valueSchema as __$46_, permuteSchema as __$56_ } from '../data/formats/ethereum'
import { format as __$4__, permute as __$5__, icon as __$6__, preview as __$7__, valueSchema as __$41_, permuteSchema as __$51_ } from '../data/formats/event'
import { format as __$16_, permute as __$17_, icon as __$18_, preview as __$19_, valueSchema as __$44_, permuteSchema as __$54_ } from '../data/formats/geo'
import { format as __$12_, permute as __$13_, icon as __$14_, preview as __$15_, valueSchema as __$43_, permuteSchema as __$53_ } from '../data/formats/phone'
import { format as __$28_, permute as __$29_, icon as __$30_, preview as __$31_, valueSchema as __$47_, permuteSchema as __$57_ } from '../data/formats/sms'
import { format as __$32_, permute as __$33_, icon as __$34_, preview as __$35_, valueSchema as __$48_, permuteSchema as __$58_ } from '../data/formats/url'
import { format as __$20_, permute as __$21_, icon as __$22_, preview as __$23_, valueSchema as __$45_, permuteSchema as __$55_ } from '../data/formats/vcard'
import { format as __$8__, permute as __$9__, icon as __$10_, preview as __$11_, valueSchema as __$42_, permuteSchema as __$52_ } from '../data/formats/wifi'
