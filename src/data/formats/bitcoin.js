export function valueSchema(){
  return {
    description: "Bitcoin payment request based on BIP-21 URI scheme for scannable QR codes",
    examples: [
      {
        address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        amount: 0.1,
        label: "Satoshi Nakamoto",
        message: "Donation for Bitcoin development"
      }
    ],
    type: "object",
    properties: {
      address: {description: "Bitcoin address (e.g., legacy, SegWit)", type: "string"},
      amount: {minimum: 0, description: "Amount in BTC (decimal)", type: "number"},
      label: {description: "Label for the payment (e.g., recipient name)", type: "string"},
      message: {description: "Message describing the payment", type: "string"}
    },
    additionalProperties: false,
    required: ["address"]
  }
}

export function permuteSchema(){
  return {examples: [{}], type: "object", properties: {}, additionalProperties: false}
}

export function permute(value={}, options={}) {

  return {
    total: 1,
    get(k){
      return format(value)
    }
  }
}


// @ Grok
export function format(payment) {
  let uri = `bitcoin:${encodeURIComponent(payment.address)}`;
  const params = [];
  if (payment.amount !== undefined) params.push(`amount=${payment.amount}`);
  if (payment.label) params.push(`label=${encodeURIComponent(payment.label)}`);
  if (payment.message) params.push(`message=${encodeURIComponent(payment.message)}`);
  if (params.length > 0) uri += `?${params.join('&')}`;
  return uri;
}


export function preview(value){
  return 'Bitcoin'
}

export function icon(){
  return {
    d: [
      `M7.526 18.207v-1.759H4.595V14.69h1.758V5.31H4.595V3.552h2.931V1.793h1.758v1.759h1.759V1.793h1.758v2.003c.733.31 1.307.761 1.722 1.355.416.594.623 1.282.623 2.065 0 .472-.069.895-.207 1.27a3.496 3.496 0 0 1-.623 1.05c.586.277 1.066.716 1.441 1.319.374.602.562 1.242.562 1.92 0 1.016-.33 1.87-.99 2.562-.659.692-1.502 1.062-2.528 1.111v1.759h-1.758v-1.759H9.284v1.759H7.526Zm.586-9.086h3.371c.537 0 .989-.187 1.355-.559.366-.373.55-.82.55-1.343s-.187-.972-.56-1.347a1.833 1.833 0 0 0-1.345-.562H8.112v3.811Zm0 5.569h4.543c.537 0 .989-.187 1.355-.559.367-.373.55-.82.55-1.344 0-.523-.186-.971-.56-1.346a1.832 1.832 0 0 0-1.345-.562H8.112v3.811Z`
    ],
    scale: (1/20)
  }
}
