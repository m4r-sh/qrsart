export function valueSchema(){
  return {
    oneOf: [
      {
        description: "Simple Ethereum ETH payment request based on EIP-681 URI scheme for scannable QR codes",
        examples: [
          {address: "0xfb6916095ca1df60bb79Ce92ce3ea74c37c5d359", chainId: 1, amount: 0.1}
        ],
        type: "object",
        properties: {
          address: {description: "Ethereum address or ENS name (recipient)", type: "string"},
          chainId: {minimum: 1, description: "Chain ID (e.g., 1 for mainnet)", type: "number"},
          amount: {minimum: 0, description: "Amount in ETH (decimal)", type: "number"}
        },
        additionalProperties: false,
        required: ["address", "amount"]
      },
      {
        description: "ERC-20 token transfer request based on EIP-681 URI scheme for scannable QR codes",
        examples: [
          {
            token: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            address: "0xRecipientAddressHere",
            chainId: 1,
            amount: 10,
            decimals: 6
          }
        ],
        type: "object",
        properties: {
          token: {description: "ERC-20 token contract address", type: "string"},
          address: {description: "Recipient Ethereum address or ENS name", type: "string"},
          chainId: {minimum: 1, description: "Chain ID (e.g., 1 for mainnet)", type: "number"},
          amount: {minimum: 0, description: "Amount in token units (decimal)", type: "number"},
          decimals: {minimum: 0, description: "Token decimals (default: 18)", type: "number"}
        },
        additionalProperties: false,
        required: ["token", "address", "chainId", "amount", "decimals"]
      }
    ]
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

// Basic toString() for simple ETH payment
export function format(payment) {
  let { chainId = 1, amount, address, token, decimals } = payment
  let uri = 'ethereum:'
  if(token){
    uri += encodeURIComponent(token)
    if(chainId){ uri += `@${chainId}` }
    uri += `/transfer`
    uri += `?address=${address}`
    uri += `&uint256=${amount}e${decimals}`
  } else {
    uri += encodeURIComponent(address)
    if(chainId){ uri += `@${chainId}` }
    if(amount){ uri += `?value=${amount}e18`}
  }
  return uri
}

export function preview(value){
  let commons = {
    '1': 'Ethereum',
    '56': 'BNB',
    '8453': 'Base',
    '42161': 'Arbitrum',
    '43114': 'Avax',
    '137': 'Polygon',
  }
  let chain = commons[`${value.chainId}`] ?? 'EVM'
  return chain
}

export function icon(value){
  if(`${value.chainId}` == '1'){
    return {
      d: [
        'm10 14.296 5.287-3.131L10 18.588l-5.287-7.423L10 14.296Z',
        `m10 1.412 5.268 8.745L10 13.264l-5.268-3.107L10 1.412Z`
      ],
      scale: (1/20)
    }
  } else {
    return {
      d: ['M3.116 5.809a1.73 1.73 0 0 1 1.721-1.721h10.326a1.73 1.73 0 0 1 1.721 1.721 2.86 2.86 0 0 0-1.721-.574H4.837a2.858 2.858 0 0 0-1.721.574Zm0 2.294a1.73 1.73 0 0 1 1.721-1.721h10.326a1.73 1.73 0 0 1 1.721 1.721 2.859 2.859 0 0 0-1.721-.573H4.837c-.62-.001-1.225.2-1.721.573Zm4.589.574c.42 0 .765.345.765.765 0 .839.691 1.53 1.53 1.53.839 0 1.53-.691 1.53-1.53 0-.42.345-.765.765-.765h2.868a1.73 1.73 0 0 1 1.721 1.721v4.207c0 .944-.777 1.72-1.721 1.72H4.837a1.729 1.729 0 0 1-1.721-1.72v-4.207a1.73 1.73 0 0 1 1.721-1.721h2.868Z'],
      scale: (1/20)
    }
  }
}
