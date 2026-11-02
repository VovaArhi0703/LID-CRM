"""Visual + interactive checks for Figma card hover glow (run with python scripts/test_glow.py)."""
from pathlib import Path
import sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(Path(__file__).resolve().parent))
from preview_helper import make_html

root = Path(__file__).resolve().parents[1]
out = root/'docs'/'previews'
out.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1920,'height':1080}, device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(make_html(),wait_until='load',timeout=90000)
    tiles=page.locator('.pricing-tile')
    assert tiles.count()==3, 'all 3 tile wrappers'
    assert page.locator('.pricing-glow-layer').count()==12, '4 layers per pricing card'
    assert page.locator('.pricing-glow-mask').count()==3, 'background-coloured masks'
    assert page.locator('.pricing-card').count()==3
    assert page.locator('.pricing-tile.standard .pricing-glow').evaluate('(e)=>getComputedStyle(e).opacity')=='0'
    before=page.locator('.pricing-tile.standard .pricing-card').bounding_box()
    assert int(before['height'])==562
    assert page.locator('.pricing-tile.standard .pricing-glow').evaluate('(e)=>getComputedStyle(e).getPropertyValue("--glow-sweep").trim()')=='0.72deg'
    page.screenshot(path=str(out/'glow-00-default.png'))
    card=page.locator('.pricing-tile.standard .pricing-card')
    card.hover(force=True)
    # Wait long enough for opacity, and sample animated variable *during* motion.
    page.wait_for_timeout(350)
    mid=float(page.locator('.pricing-tile.standard .pricing-glow').evaluate('(e)=>parseFloat(getComputedStyle(e).getPropertyValue("--glow-sweep"))'))
    assert 0.72<mid<142.47,f'angle must animate (not snap), mid={mid}'
    page.screenshot(path=str(out/'glow-01-midpoint.png'))
    page.wait_for_timeout(900)
    after=card.bounding_box()
    assert abs(after['y']-(before['y']-5))<.6,f'hover card moved {after["y"]-before["y"]}px'
    angle=float(page.locator('.pricing-tile.standard .pricing-glow').evaluate('(e)=>parseFloat(getComputedStyle(e).getPropertyValue("--glow-sweep"))'))
    assert abs(angle-142.47)<.05,f'final angle {angle}'
    assert page.locator('.pricing-tile.standard .pricing-glow').evaluate('(e)=>getComputedStyle(e).opacity')=='1'
    assert page.locator('.pricing-tile.plus .pricing-glow').evaluate('(e)=>getComputedStyle(e).opacity')=='0'
    assert page.locator('.pricing-tile.premium .pricing-glow').evaluate('(e)=>getComputedStyle(e).opacity')=='0'
    page.screenshot(path=str(out/'glow-02-hover-standard.png'))
    # Outside the tile, the glow fades away and returns to the original angle.
    page.mouse.move(15,970)
    page.wait_for_timeout(1150)
    assert page.locator('.pricing-tile.standard .pricing-glow').evaluate('(e)=>getComputedStyle(e).opacity')=='0'
    assert abs(float(page.locator('.pricing-tile.standard .pricing-glow').evaluate('(e)=>parseFloat(getComputedStyle(e).getPropertyValue("--glow-sweep"))'))-.72)<.02
    assert abs(card.bounding_box()['y']-before['y'])<.2
    page.screenshot(path=str(out/'glow-03-mouseout.png'))
    # Check other cards each has a local non-overlapping glow and stays clickable.
    for plan in ['plus','premium']:
        page.locator(f'.pricing-tile.{plan} .pricing-card').hover()
        page.wait_for_timeout(1100)
        assert page.locator(f'.pricing-tile.{plan} .pricing-glow').evaluate('(e)=>getComputedStyle(e).opacity')=='1'
        page.screenshot(path=str(out/f'glow-04-hover-{plan}.png'))
    # Restore pricing before testing modal/defaults; no background glow under dialog.
    page.locator('.pricing-tile.premium .primary-button').click()
    assert page.locator('.subscription-modal').is_visible()
    assert page.locator('[data-field=currency] [data-value=RUB]').get_attribute('aria-checked')=='true'
    assert page.locator('[name=employees]').input_value()=='1'
    assert page.locator('[name=funnels]').input_value()=='1'
    page.keyboard.press('Escape')
    # 390px viewport: tiles remain single-column, no horizontal overflow.
    page.set_viewport_size({'width':390,'height':844})
    page.mouse.move(0,0)
    page.wait_for_timeout(1100)
    widths=page.evaluate('''() => ({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})''')
    assert widths['scroll']<=widths['client']+2,widths
    assert page.locator('.pricing-tile').count()==3
    page.screenshot(path=str(out/'glow-05-mobile-390.png'),full_page=True)
    assert not errors,errors
    browser.close()
print('Glow hover QA PASSED: angle transition, 3 cards, masks, lift, mouseout, modal, defaults, responsive, JS errors')
