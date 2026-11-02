from pathlib import Path
import base64,mimetypes,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
def make_html():
 css=(ROOT/'src/styles.css').read_text()
 font=ROOT/'assets/fonts/Manrope-Variable.ttf'
 css=css.replace("../assets/fonts/Manrope-Variable.ttf",'data:font/ttf;base64,'+base64.b64encode(font.read_bytes()).decode())
 scripts=[(ROOT/f'src/{x}').read_text() for x in ('design-data.js','renderer.js','calculator.js','components.js','app.js')]
 files=list((ROOT/'assets/icons').glob('*.svg'))
 images={f'assets/icons/{f.name}':'data:image/svg+xml;base64,'+base64.b64encode(f.read_bytes()).decode() for f in files}
 data=json.dumps(images)
 avatars=base64.b64encode((ROOT/'assets/avatar.jpg').read_bytes()).decode()
 patch=f'''for(const asset of Object.values(window.FIGMA.assets)) if(({data})[asset.src]) asset.src=({data})[asset.src];'''
 scripts[-1]=scripts[-1].replace("'assets/avatar.jpg'","'data:image/jpeg;base64,"+avatars+"'")
 return '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>'+css+'</style></head><body><main id="app"></main><div id="announcer" role="status" aria-live="polite"></div>'+''.join(f'<script>{s}</script>' for s in [scripts[0],patch,*scripts[1:]])+'</body></html>'
if __name__=='__main__':
 html=make_html()
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=b.new_page(viewport={'width':1920,'height':1080},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(html,wait_until='load',timeout=90000)
  page.screenshot(path=str(ROOT/'docs/previews/pricing.png'))
  print('SCREEN 1',page.locator('.pricing-card').count(), 'errors',errors)
  page.locator('.pricing-card.plus .primary-button').click()
  page.screenshot(path=str(ROOT/'docs/previews/settings.png'),full_page=True)
  print('SCREEN 2',page.locator('.subscription-modal').count(), 'errors',errors)
  print('settings bounds', page.locator('.settings').bounding_box(), 'modal',page.locator('.subscription-modal').bounding_box())
  b.close()
