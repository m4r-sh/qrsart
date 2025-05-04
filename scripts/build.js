await build()

async function build(){
  let res_arr = await Promise.all([
    Bun.build({
      entrypoints: ['./src/index.js'],
      outdir: './dist',
      minify: true,
      naming: '[dir]/[name].min.[ext]'
    }),
    Bun.build({
      entrypoints: ['./src/index.js'],
      outdir: './dist',
      minify: false,
      naming: '[dir]/[name].[ext]'
    }),
    Bun.build({
      entrypoints: ['./src/search/index.js'],
      outdir: './dist',
      minify: true,
      naming: '[dir]/search.min.[ext]'
    }),
    Bun.build({
      entrypoints: ['./src/search/index.js'],
      outdir: './dist',
      minify: false,
      naming: '[dir]/search.[ext]'
    }),
    Bun.build({
      entrypoints: ['./src/score/index.js'],
      outdir: './dist',
      minify: true,
      naming: '[dir]/score.min.[ext]'
    }),
    Bun.build({
      entrypoints: ['./src/score/index.js'],
      outdir: './dist',
      minify: false,
      naming: '[dir]/score.[ext]'
    }),
  ])
  res_arr.forEach(res => {
    if(!res.success){ console.log(res) }
  });
  console.log('build done')
}