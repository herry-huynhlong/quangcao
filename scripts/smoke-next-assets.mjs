const origin=process.env.SMOKE_ORIGIN;
if(!origin) throw new Error('SMOKE_ORIGIN is required');
for(const path of ['/','/login','/register','/app','/admin']){
  const page=await fetch(new URL(path,origin),{redirect:'manual'});
  const html=await page.text();
  if(!page.ok||!page.headers.get('content-type')?.includes('text/html'))throw new Error(`${path}: HTML failed`);
  const assets=[...html.matchAll(/\/_next\/static\/[^"\\ ]+\.(?:css|js)/g)].map(match=>match[0]);
  if(!assets.length)throw new Error(`${path}: no Next assets found`);
  for(const asset of [...new Set(assets)]){const response=await fetch(new URL(asset,origin));const css=asset.endsWith('.css');if(!response.ok||!(css?response.headers.get('content-type')?.includes('text/css'):response.headers.get('content-type')?.includes('javascript')))throw new Error(`${path}: invalid ${asset} (${response.status} ${response.headers.get('content-type')})`);}
}
console.log('Next asset smoke test passed');
