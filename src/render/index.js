import { penStrokes } from '../features';
import { Grid } from '../grid';
import { boxPath, rectPath, circlePath, getIconBox, drawDots, drawAligns, drawFinders } from './utils'
import { deepMerge, QRSART_VERSION } from '../utils'


const drawSVG_opts = {
  margin:2, // in terms of tiles
  width:100,
  height:100,
  colors:{
    landmarks:"#000",
    dots:"#334",
    lines:"#334",
    icon:"#118",
    background: false
  },
  lines:{ fill: true, thickness: 0.7 },
  dots:{ size: 0.7 },
  finders:{ ring: 1.0, center: 1.0, roundness: 0.2 },
  aligns:{ ring: 1.0, center: 1.0, roundness: 0.2 },
  icon: undefined,// { d:[''], scale: (1 / 20) },
}

export function drawSVG(qr, options={}){

  const hasIconOverride = Object.hasOwn(options, "icon")
  let { margin, width, height, colors, lines, dots, finders, aligns, icon } = deepMerge(drawSVG_opts, options)

  let { finder_grid, alignment_grid, grid } = qr
  let main_grid = Grid.erase(grid, finder_grid, alignment_grid)
  let icbx

  icon = hasIconOverride ? icon : qr.icon
  let preview = qr.preview ? `QR: ${qr.preview}` : `QR Code`

  if(icon && icon.d){
    icbx = getIconBox(qr, "bottom")
    for(let dx = 0; dx < icbx.width; dx++){
      for(let dy = 0; dy < icbx.height; dy++){
        main_grid.set(icbx.x + dx, icbx.y + dy, 0)
      }
    }
  }

  const lineThickness = lines.thickness ?? 0.7
  const lineFill = lines.fill ?? true
  const lineRadius = lines.radius ?? lineThickness / 2
  let { strokes: data_strokes, dots: data_dots } = penStrokes(main_grid, {
    fill: lineFill,
    thickness: lineThickness,
    radius: lineRadius,
  }).cache
  const linesPath = lineFill
    ? `<path id="Lines" fill="${colors.lines}" stroke="none" d="${data_strokes.join(' ')}" />`
    : `<path id="Lines" stroke="${colors.lines}" d="${data_strokes.join(' ')}" fill="none" stroke-width='${lineThickness}' stroke-linejoin='round' stroke-linecap='round' />`
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${grid.w+margin*2+1} ${grid.h+margin*2+1}' width="${width}" height="${height}" data-qrsart="${QRSART_VERSION}">
<title>${preview}</title>
${qr.data ? `<desc>${qr.data}</desc>` : ``}
${colors.background ? `<g id="Background">
  <rect x="0" y="0" width="${grid.w+margin*2+1}" height="${grid.h + margin * 2 + 1}" fill="${colors.background}" ></rect>
</g>\n`: ``}<g transform="translate(${margin + 0.5},${margin + 0.5})" id="Patterns" fill="${colors.landmarks}">
  <path id="Alignments" d="${drawAligns(qr,aligns)}" />
  <path id="Finders" d="${drawFinders(qr,finders)}" />
</g>
${icon && icon.d ? `<g id="Icon" fill="${colors.icon}" stroke="none" fill-rule="evenodd" transform="translate(${margin + icbx.x},${margin + icbx.y}) scale(${icbx.width * icon.scale})" >
  ${icon.d.map(d => ` <path d="${d}" /> `).join('\n  ')}
</g> ` : ``}
<g transform="translate(${margin + 0.5},${margin + 0.5})" id="Data">
  ${linesPath}
  <path id="Dots" stroke="none" fill="${colors.dots}" d="${drawDots(data_dots, dots)}" />
</g>
</svg>`.toString()
}


export {
  // utils
  rectPath,
  boxPath,
  circlePath,

  getIconBox,

  drawDots,
  drawAligns,
  drawFinders,
}
