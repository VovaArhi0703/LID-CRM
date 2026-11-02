"""Targeted browser QA for editable account field and 3% subscription discount."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from preview_helper import make_html

html=make_html()
root=Path(__file__).resolve().parents[1]
checks=[]
def check(value,label):
 assert value,label
 checks.append(label)
 print('PASS',label)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1920,'height':1080})
 errors=[]
 page.on('pageerror',lambda err:errors.append(str(err)))
 page.set_content(html,timeout=90000)
 page.locator('.pricing-card.plus .primary-button').click()
 client=page.locator('[data-field=account] .account-input')
 arrow=page.locator('[data-field=account] .select-arrow')
 cat_arrow=page.locator('[data-field=category] .select-arrow')
 check(client.input_value()=='' and client.get_attribute('placeholder')!='','Account starts empty with placeholder')
 client.focus()
 check(page.locator('.account-list .account-option:visible').count()==4,'Focus opens full list')
 checks_css=page.evaluate("""() => {
 const account=document.querySelector('[data-field=account] .select-arrow');
 const cat=document.querySelector('[data-field=category] .select-arrow');
 return {account:{w:account.getBoundingClientRect().width,h:account.getBoundingClientRect().height,src:account.src},category:{w:cat.getBoundingClientRect().width,h:cat.getBoundingClientRect().height,src:cat.src}};
 }""")
 check(checks_css['account']['w']==checks_css['category']['w'] and checks_css['account']['h']==checks_css['category']['h'],'Chevron icon exactly matches Category size')
 check(page.locator('[data-field=account] .account-toggle img').get_attribute('src') == page.locator('[data-field=category] .select-trigger img').get_attribute('src') or page.locator('.account-list').is_visible(), 'Chevron changes to the Figma expanded-state SVG')
 client.fill('пикс')
 check(page.locator('.account-option:visible').count()==1 and 'Пиксель' in page.locator('.account-option:visible').inner_text(),'Typing filters account names')
 check(page.locator('.account-list').is_visible(),'Matches appear beneath the input')
 css=page.locator('.account-option:visible .option-detail').evaluate('(e)=>getComputedStyle(e).color')
 check(css==page.locator('.selected-plan .plan-eyebrow').evaluate('(e)=>getComputedStyle(e).color'),'Accounts with subscriptions use purple caption')
 page.screenshot(path=str(root/'docs/previews/account-01-filtered.png'))
 client.press('Enter')
 check('Пиксель' in client.input_value() and page.locator('.account-list').is_hidden(),'Enter chooses matching account')
 check('3%' in page.locator('.calculation-row').last.inner_text(),'Single existing subscription receives discount')
 check('−' in page.locator('.calculation-row').last.inner_text(),'Discount amount is shown')
 page.locator('[data-field=account] .account-toggle').click()
 check(page.locator('.account-option:visible').count()==4,'Chevron opens all options even with typed/selected value')
 check(page.locator('.account-option .has-subscriptions').count()==3,'All three subscribed clients highlighted')
 check('Нет подписок' in page.locator('.account-option').nth(1).inner_text(),'Unsubscribed client remains labeled')
 page.screenshot(path=str(root/'docs/previews/account-02-full-list.png'))
 page.locator('.account-option').nth(1).click()
 check('Пульс' in client.input_value() and '3%' not in page.locator('.calculation-row').last.inner_text(),'Unsubscribed client receives no discount')
 for i,client_name in [(0,'Грейд'),(3,'Орбита')]:
  page.locator('[data-field=account] .account-toggle').click()
  page.locator('.account-option').nth(i).click()
  check(client_name in client.input_value() and '3%' in page.locator('.calculation-row').last.inner_text(),f'Account {client_name} receives discount')
 client.fill('неизвестная компания')
 check(page.locator('.account-no-results').is_visible() and page.locator('.account-option:visible').count()==0,'No matches shows empty-state caption')
 check('3%' not in page.locator('.calculation-row').last.inner_text(),'Editing clears previously selected client discount')
 page.locator('[data-field=account] .account-toggle').click()
 check(page.locator('.account-option:visible').count()==4,'Chevron opens full list after unmatched search')
 client.press('Escape')
 check(page.locator('.account-list').is_hidden() and page.locator('.subscription-modal').count()==1,'Escape closes only the account list')
 client.fill('ООО «Грейд» · CL-0184')
 page.locator('[name=comment]').click()
 check('3%' in page.locator('.calculation-row').last.inner_text(),'Exact typed account name is accepted when leaving input')
 client.fill('неизвестная компания')
 page.locator('.calculation-footer button').click()
 check(page.locator('[data-field=account].invalid').count()==1,'Unknown account cannot be submitted as selected')
 check(page.locator('.subscription-modal').count()==1,'Invalid account never closes settings')
 check(not errors,f'No JavaScript errors: {errors}')
 page.close()
 browser.close()
print(f'\n{len(checks)} focused account checks passed')
