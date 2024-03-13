import { permuteURL } from '../../src'
import { find_ideal_qr } from './permute.js'
import { tetris_render } from './render.js'

tetris()

export async function tetris(){
  
  let qr = find_ideal_qr({
    data_options: permuteURL('m4r.sh'),
    ecl: 'medium',
    version: 3
  })

  await tetris_render(qr)
}



