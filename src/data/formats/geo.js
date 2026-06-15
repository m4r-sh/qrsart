import { permute_casing, permute_group } from "../DataType";

export function valueSchema(){
  return {
    description: "Link to a location using latitude and longitude",
    examples: [{latitude: 38.71482, longitude: 115.44185}],
    type: "object",
    properties: {
      latitude: {minimum: -90, maximum: 90, type: "number"},
      longitude: {minimum: -180, maximum: 180, type: "number"},
      altitude: {type: "number"}
    },
    additionalProperties: false,
    required: ["latitude", "longitude"]
  }
}

export function permuteSchema(){
  return {
    description: "Iterate over ~equal coordinates that point to the same location",
    examples: [{prefixCaps: true, varyPrecision: true, maxDecimals: 10, precision: 5}],
    type: "object",
    properties: {
      prefixCaps: {type: "boolean"},
      varyPrecision: {type: "boolean"},
      maxDecimals: {type: "integer"},
      precision: {type: "integer"}
    },
    additionalProperties: false
  }
}

export function permute(value={},options={}){
  let { latitude, longitude, altitude } = value
  let { prefixCaps=false, varyPrecision=false, maxDecimals=10, precision=5 } = options

  function coordComponent(x, vary=false) {
    x = (+x).toFixed(precision)
    let needed_digits = x.split('.')[1].replace(/0+$/,"").length
    return {
      total: vary ? Math.max(1,maxDecimals - needed_digits + 1) : 1,
      get: (k) => {
        const dec = precision + k;
        return parseFloat(x).toFixed(needed_digits + k);
      }
    }
  }

  return permute_group([
    permute_casing('geo:', { any_casing: prefixCaps }),
    coordComponent(latitude, varyPrecision),
    ',',
    coordComponent(longitude, varyPrecision),
    (altitude && altitude !== 0) ? ',' + altitude : ''
  ], { join: '' })
}

export function format(value){
  return permute(value).get(0)
}


export function preview(value){
  return 'Location'
}

// Source: Heroicons map-pin, 20 solid.
// https://github.com/tailwindlabs/heroicons/blob/master/optimized/20/solid/map-pin.svg
export function icon(){
  return {
    d: [
      `m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z`
    ],
    scale: (1/20)
  }
}
