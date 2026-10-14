"""Temporary development research. No response/report/token files are written."""
import argparse
import base64
import json
import math
import os
import re
import sys
import time
import webbrowser
from decimal import Decimal, InvalidOperation, localcontext
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, HTTPRedirectHandler, build_opener

TOKEN_URL='https://oauth.fatsecret.com/connect/token'
API_URL='https://platform.fatsecret.com/rest/server.api'
ATTRIBUTION='Powered by fatsecret Platform API'
# API fields use documented mass units; no percentage/volume assumptions.
FIELDS={'calories':('1008','KCAL'), 'protein':('1003','G'), 'fat':('1004','G'),
        'carbohydrate':('1005','G'), 'fiber':('1079','G'), 'sugar':('2000','G'),
        'sodium':('1093','MG'), 'potassium':('1092','MG'), 'calcium':('1087','MG'),
        'iron':('1089','MG'), 'vitamin_c':('1162','MG'), 'saturated_fat':('1258','G'),
        'cholesterol':('1253','MG'), 'added_sugars':('1235','G')}

class ResearchError(Exception):
    pass

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):
        return None

def number(value):
    if value is None or value=='' or isinstance(value,bool): return None
    try:
        value=float(value)
        return value if math.isfinite(value) and value>=0 else None
    except (ValueError,TypeError): return None

def as_list(value):
    return value if isinstance(value,list) else [value] if isinstance(value,dict) else []

class Client:
    def __init__(self,client_id,secret,scope='basic'):
        if not client_id or not secret: raise ResearchError('Required FatSecret process environment variables are missing.')
        if scope not in ('basic','premier'): raise ResearchError('Unsupported scope.')
        self.client_id,self.secret,self.scope=client_id,secret,scope
        self.basic=base64.b64encode((client_id+':'+secret).encode()).decode()
        self.token=None
        self.expires=0
        self.calls=0

    def _request(self,url,params,auth):
        if url not in (TOKEN_URL,API_URL): raise ResearchError('Endpoint not permitted.')
        self.calls+=1
        if self.calls>3: raise ResearchError('Session request limit reached.')
        try:
            req=Request(url,data=urlencode(params).encode(),headers={
                'Authorization':auth,'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'})
            with build_opener(NoRedirect()).open(req,timeout=20) as response:
                body=response.read(2_000_001)
            if len(body)>2_000_000: raise ResearchError('Response exceeds session size limit.')
            # Retain numeric lexemes rather than losing decimal places to floats.
            result=json.loads(body,parse_float=str,parse_int=str)
            if not isinstance(result,dict): raise ResearchError('Unexpected API response.')
            if 'error' in result: raise ResearchError('API rejected the request. Check permissions, registered IP and account limits. No automatic retry.')
            return result
        except HTTPError as exc:
            if exc.code==429: raise ResearchError('Rate limit reached. Stop and wait; no automatic retries.') from None
            if exc.code in (401,403): raise ResearchError('Authentication or permission denied. Check account scope and registered IP.') from None
            raise ResearchError('HTTP request failed; remote details suppressed.') from None
        except ResearchError: raise
        except Exception: raise ResearchError('Request failed or timed out; details suppressed.') from None

    def get_token(self):
        if self.token and time.monotonic()<self.expires: return self.token
        response=self._request(TOKEN_URL,{'grant_type':'client_credentials','scope':self.scope},'Basic '+self.basic)
        token=response.get('access_token')
        seconds=number(response.get('expires_in'))
        if not isinstance(token,str) or not token or not seconds or str(response.get('token_type','')).lower()!='bearer':
            raise ResearchError('Invalid token response; details suppressed.')
        self.token=token
        self.expires=time.monotonic()+max(0,seconds-60)
        return token

    def scrub(self,value):
        text=json.dumps(value)
        for secret in (self.client_id,self.secret,self.basic,self.token):
            if secret:
                for variant in (secret,json.dumps(secret)[1:-1],urlencode({'x':secret})[2:]):
                    text=text.replace(variant,'[REDACTED]')
        return json.loads(text)

    def fetch(self,food_id):
        if not str(food_id).isdigit() or int(food_id)<=0: raise ResearchError('Invalid FatSecret food ID.')
        raw=self._request(API_URL,{'method':'food.get.v5','food_id':food_id,'format':'json'},'Bearer '+self.get_token())
        if str(raw.get('food',{}).get('food_id'))!=str(food_id): raise ResearchError('Returned food ID does not match.')
        return self.scrub(raw)

    def search(self,query):
        if not query.strip() or len(query)>200: raise ResearchError('Enter a search expression of 1–200 characters.')
        return self.scrub(self._request(API_URL,{'method':'foods.search','search_expression':query,
                    'max_results':10,'page_number':0,'format':'json'},'Bearer '+self.get_token()))

    def close(self):
        self.token=self.secret=self.client_id=self.basic=None
        self.expires=0

def decimal_value(raw):
    if raw is None or isinstance(raw,bool): return None
    try:
        value=Decimal(str(raw).strip())
        return value if value.is_finite() and value>=0 and abs(value.as_tuple().exponent)<=100 else None
    except (InvalidOperation,ValueError): return None

def rounding_interval(raw, scale=Decimal(1)):
    value=decimal_value(raw)
    if value is None: return None
    quantum=Decimal(1).scaleb(value.as_tuple().exponent)
    return (max(Decimal(0),value-quantum/2)*scale,(value+quantum/2)*scale)

def precision_comparison(source_raw, grams_raw, metric_unit, usda_raw, source_unit, usda_unit):
    """Half-last-reported-digit intervals; fixed declared serving weight, not a % tolerance."""
    with localcontext() as context:
        context.prec=50
        amount,weight,reference=map(decimal_value,(source_raw,grams_raw,usda_raw))
        grams=weight if metric_unit=='g' else weight*Decimal('28.349523125') if metric_unit=='oz' and weight is not None else None
        result={'status':'missing-or-incomparable','exactMatch':None,'reason':None,
                'fatsecretOriginal':source_raw,'usdaOriginal':usda_raw,
                'declaredServingAmount':grams_raw,'declaredServingUnit':metric_unit,
                'derivedPer100g':None,'fatsecretIntervalPer100g':None,'usdaIntervalPer100g':None,
                'precisionModel':'Nearest rounding to last reported decimal digit; declared gram weight held fixed. Not analytical uncertainty.'}
        if amount is None or reference is None:
            result['reason']='missing-nutrient-data'; return result
        if source_unit not in ('G','MG','UG','KCAL') or usda_unit not in ('G','MG','UG','KCAL'):
            result['reason']='missing-or-unknown-unit'; return result
        if source_unit!=usda_unit:
            result['reason']='unit-mismatch'; return result
        if grams is None or grams<=0:
            result['reason']='unresolved-serving-weight'; return result
        scale=Decimal(100)/grams
        a,b=rounding_interval(source_raw,scale),rounding_interval(usda_raw)
        result.update({'exactMatch':amount*Decimal(100)==reference*grams,
                       'derivedPer100g':grams!=Decimal(100),
                       'fatsecretIntervalPer100g':[str(v) for v in a],
                       'usdaIntervalPer100g':[str(v) for v in b]})
        overlap=max(a[0],b[0])<min(a[1],b[1])
        result['status']='equivalent-within-precision' if overlap else 'meaningful-discrepancy'
        result['reason']='rounding-intervals-overlap' if overlap else 'rounding-intervals-do-not-overlap'
        return result

def normalize(raw):
    food=raw['food']
    servings=[]
    for row in as_list(food.get('servings',{}).get('serving')):
        weight=number(row.get('metric_serving_amount'))
        metric=str(row.get('metric_serving_unit','')).lower()
        grams=weight if metric=='g' else weight*28.349523125 if metric=='oz' and weight is not None else None
        values={}
        for name,(nid,unit) in FIELDS.items():
            value=number(row.get(name))
            values[name]={'usdaNutrientId':nid,'unit':unit,'perServing':value,
                         'originalValue':row.get(name),
                         'per100g':value*100/grams if value is not None and grams is not None and grams>0 else None}
        servings.append({'fatsecretServingId':row.get('serving_id'), 'description':row.get('serving_description'),
                         'numberOfUnits':number(row.get('number_of_units')), 'measurement':row.get('measurement_description'),
                         'metricAmount':weight,'originalMetricAmount':row.get('metric_serving_amount'),
                         'metricUnit':metric or None,'grams':grams,'nutrients':values})
    return {'source':'fatsecret Platform API','fatsecretFoodId':str(food['food_id']),
            'description':food.get('food_name'),'foodType':food.get('food_type'),'sourceURL':food.get('food_url'),
            'retrievedAt':datetime.now(timezone.utc).isoformat(),'servings':servings,
            'reviewStatus':'temporary-unreviewed','publishable':False}

def compare(record,usda):
    comparisons=[]
    for serving in record['servings']:
        nutrients=[]
        for name,value in serving['nutrients'].items():
            old=usda['nutrients'].get(value['usdaNutrientId'],{})
            old_value=number(old.get('amountPer100g'))
            old_unit=old.get('definition',{}).get('unit_name','').upper()
            current=value['per100g']
            precision=precision_comparison(value.get('originalValue'),serving.get('originalMetricAmount'),
                                           serving['metricUnit'],old.get('amountPer100g'),value['unit'],old_unit)
            nutrients.append({'name':name,'unit':value['unit'],'fatsecretPer100g':current,
                              'usdaPer100g':old_value,'usdaUnit':old_unit or None,**precision})
        portions=[]
        for portion in usda['portions']:
            # Compare only matching count and literal household measure, never fuzzy food matches.
            if (serving['numberOfUnits']==number(portion.get('amount')) and
                (serving['measurement'] or '').strip().lower()==portion.get('modifier','').strip().lower()):
                weight=number(portion.get('gram_weight'))
                portions.append({'usdaPortionId':portion['id'],'usdaGrams':weight,'fatsecretGrams':serving['grams'],
                                 'status':'unknown' if weight is None or serving['grams'] is None else
                                          'match' if weight==serving['grams'] else 'weight-conflict'})
        comparisons.append({'serving':serving['description'],'nutrients':nutrients,'matchingPortions':portions,
                            'portionMatchStatus':'compared' if portions else 'unmatched-manual-review'})
    return {'fatsecretFoodId':record['fatsecretFoodId'],'usdaFdcId':usda['fdc_id'],
            'usdaDescription':usda.get('description','Not specified'),
            'identityStatus':'manual food/preparation confirmation required; IDs are not equivalent',
            'comparisons':comparisons,'publishable':False,'winner':None}

class WindowLifecycle:
    """One owner for WM close, timeout and finally cleanup of one Tk interpreter."""
    def __init__(self, root):
        self.root=root
        self.closed=False
        self.timer=None
        root.protocol('WM_DELETE_WINDOW',self.close)
        root.report_callback_exception=lambda *ignored: self.callback_failed()

    def callback_failed(self):
        print('Review window callback failed; details suppressed.',file=sys.stderr)
        self.close()

    def arm(self, milliseconds=15*60*1000):
        if self.closed: return
        if self.timer is not None: self.root.after_cancel(self.timer)
        self.timer=self.root.after(milliseconds,self.close)

    def close(self):
        if self.closed: return
        self.closed=True
        import tkinter as tk
        try:
            # Cancel our expiration and any other Tcl after/idle callbacks before
            # draining theme events while widgets still exist. No second Tk root.
            for callback in self.root.tk.call('after','info'):
                try: self.root.after_cancel(callback)
                except tk.TclError: pass
            self.timer=None
            self.root.update_idletasks()
            for callback in self.root.tk.call('after','info'):
                try: self.root.after_cancel(callback)
                except tk.TclError: pass
        except tk.TclError:
            pass
        finally:
            try: self.root.destroy()
            except tk.TclError: pass

RESULT_LABELS={'equivalent-within-precision':'Equivalent within precision',
               'meaningful-discrepancy':'Meaningful discrepancy',
               'missing-or-incomparable':'Missing or incomparable'}
REASONS={'missing-nutrient-data':'Missing nutrient data','missing-or-unknown-unit':'Unit unavailable or unknown',
         'unit-mismatch':'Incompatible known units','unresolved-serving-weight':'Serving weight unresolved',
         'rounding-intervals-overlap':'Rounding intervals overlap',
         'rounding-intervals-do-not-overlap':'Rounding intervals do not overlap'}

def preparation(description):
    found=[s for s in ('raw','cooked','dried','frozen','canned','roasted','boiled','baked')
           if re.search(r'\b'+s+r'\b',(description or '').lower())]
    return ', '.join(found) if found else 'Not stated — confirm manually'

def comparison_counts(rows):
    return {status:sum(r['status']==status for r in rows) for status in RESULT_LABELS}

def formatted(value,unit=''):
    if value is None: return 'Unknown'
    return f'{value:.5g} {unit.lower()}'.strip() if isinstance(value,(float,int)) else str(value)

class ReviewInterface:
    def __init__(self,document,lifecycle):
        import tkinter as tk
        from tkinter import ttk
        from tkinter.scrolledtext import ScrolledText
        self.document=document
        self.lifecycle=lifecycle
        root=lifecycle.root
        root.title('MoodMeal — temporary nutrition research')
        root.geometry('1180x850')
        root.minsize(820,620)
        self.frame=ttk.Frame(root,padding=16); self.frame.pack(fill='both',expand=True)
        ttk.Label(self.frame,text='Nutrition source review',font=('Segoe UI',18,'bold')).pack(anchor='w')
        ttk.Label(self.frame,text='Development only • No advice, import or publication • Memory-only session').pack(anchor='w')
        self.notice=ttk.Label(self.frame,text='Closes automatically in 15:00',foreground='#7136a8')
        self.notice.pack(anchor='w',pady=(4,8))
        ttk.Button(self.frame,text=ATTRIBUTION+' ↗',command=lambda:webbrowser.open('https://platform.fatsecret.com')).pack(anchor='w')
        ttk.Label(self.frame,text='USDA FoodData Central — primary reviewed source').pack(anchor='w')
        record=document.get('record',{})
        comparison=document.get('comparison',{})
        overview=ttk.LabelFrame(self.frame,text='Food identity — confirmation still required',padding=10)
        overview.pack(fill='x',pady=10)
        self.overview_text=(f"USDA FDC {comparison.get('usdaFdcId','not selected')}  |  {comparison.get('usdaDescription','No reviewed record selected')}\n"
                            f"Preparation: {preparation(comparison.get('usdaDescription'))}\n"
                            f"FatSecret {record.get('fatsecretFoodId','search')}  |  {record.get('description','Search results')}\n"
                            f"Preparation: {preparation(record.get('description'))}  •  Type: {record.get('foodType','not stated')}")
        identity_label=ttk.Label(overview,text=self.overview_text,wraplength=740,justify='left')
        identity_label.pack(anchor='w')
        overview.bind('<Configure>',lambda e:identity_label.configure(wraplength=max(200,e.width-30)))
        ttk.Label(overview,text='Retrieved: '+str(record.get('retrievedAt',document.get('retrievedAt','unknown')))).pack(anchor='w')
        notebook=ttk.Notebook(self.frame); notebook.pack(fill='both',expand=True)
        nutrients=ttk.Frame(notebook,padding=8); sizes=ttk.Frame(notebook,padding=8)
        notebook.add(nutrients,text='Nutrients'); notebook.add(sizes,text='Serving sizes')
        self.comparisons=comparison.get('comparisons',[])
        self.selection=ttk.Combobox(nutrients,state='readonly',values=[f"{i+1}. {c['serving'] or 'Unspecified serving'}" for i,c in enumerate(self.comparisons)])
        self.selection.pack(fill='x')
        ttk.Label(nutrients,text='Both nutrient columns are per 100 g. Select a FatSecret serving basis above.').pack(anchor='w',pady=4)
        self.summary=ttk.Label(nutrients,wraplength=740); self.summary.pack(anchor='w',pady=4)
        nutrients.bind('<Configure>',lambda e:self.summary.configure(wraplength=max(200,e.width-20)))
        self.table=self.make_table(nutrients,('Nutrient','USDA / 100 g','FatSecret / 100 g','Result','Reason'),(150,125,125,220,260),9)
        for tag,color in [('equivalent-within-precision','#e8f4ec'),('meaningful-discrepancy','#fff0db'),('missing-or-incomparable','#efedf4')]:
            self.table.tag_configure(tag,background=color)
        self.details_button=ttk.Button(nutrients,text='Show technical details',command=self.toggle_details)
        self.details_button.pack(anchor='w',pady=6)
        self.details=ScrolledText(nutrients,height=8,wrap='word',font=('Consolas',10))
        self.details_visible=False
        for event in ('<Control-c>','<Control-C>','<<Copy>>','<<Cut>>'): self.details.bind(event,lambda e:'break')
        ttk.Label(sizes,text='Source-specific weights are kept separate. Nutrient rounding does not resolve portion differences.',wraplength=1060).pack(anchor='w',pady=6)
        self.portions=self.make_table(sizes,('FatSecret serving','USDA grams','FatSecret grams','Result'),(260,150,150,300),10)
        for c in self.comparisons:
            for p in c['matchingPortions']:
                self.portions.insert('', 'end',values=(c['serving'],formatted(p['usdaGrams'],'g'),formatted(p['fatsecretGrams'],'g'),
                    {'weight-conflict':'Source-specific weight discrepancy','match':'Same weight','unknown':'Unknown weight'}[p['status']]))
            if not c['matchingPortions']:
                self.portions.insert('','end',values=(c['serving'],'Not matched','See serving basis','Manual portion matching required'))
        self.selection.bind('<<ComboboxSelected>>',lambda e:self.refresh())
        if self.comparisons:
            # Prefer a direct 100-g basis, while retaining every serving variant.
            chosen=next((i for i,s in enumerate(record.get('servings',[])) if s['grams']==100),0)
            self.selection.current(chosen); self.refresh()
        else:
            self.summary.configure(text='No USDA comparison selected. Source details are available below for research only.')
        self.deadline=time.monotonic()+900
        self.tick()

    def make_table(self,parent,columns,widths,height):
        from tkinter import ttk
        frame=ttk.Frame(parent); frame.pack(fill='both',expand=True)
        frame.rowconfigure(0,weight=1); frame.columnconfigure(0,weight=1)
        tree=ttk.Treeview(frame,columns=columns,show='headings',height=height)
        for c,w in zip(columns,widths): tree.heading(c,text=c); tree.column(c,width=w,minwidth=90)
        vertical=ttk.Scrollbar(frame,orient='vertical',command=tree.yview)
        horizontal=ttk.Scrollbar(frame,orient='horizontal',command=tree.xview)
        tree.configure(yscrollcommand=vertical.set,xscrollcommand=horizontal.set)
        tree.grid(row=0,column=0,sticky='nsew'); vertical.grid(row=0,column=1,sticky='ns'); horizontal.grid(row=1,column=0,sticky='ew')
        return tree

    def refresh(self):
        rows=self.comparisons[self.selection.current()]['nutrients']
        self.table.delete(*self.table.get_children())
        counts=comparison_counts(rows)
        self.summary.configure(text=f"Selected serving: {len(rows)} comparisons  •  "+'  •  '.join(f'{RESULT_LABELS[k]}: {v}' for k,v in counts.items()))
        for r in rows:
            self.table.insert('','end',values=(r['name'].replace('_',' ').title(),formatted(r['usdaPer100g'],r.get('usdaUnit') or ''),
                formatted(r['fatsecretPer100g'],r['unit']),RESULT_LABELS[r['status']],REASONS.get(r['reason'],r['reason'])),tags=(r['status'],))
        if self.details_visible: self.fill_details()

    def fill_details(self):
        value=self.comparisons[self.selection.current()] if self.comparisons else self.document
        self.details.configure(state='normal'); self.details.delete('1.0','end')
        self.details.insert('1.0',json.dumps(value,indent=2,ensure_ascii=False)); self.details.configure(state='disabled')

    def toggle_details(self):
        self.details_visible=not self.details_visible
        if self.details_visible: self.fill_details(); self.details.pack(fill='both',expand=True)
        else: self.details.pack_forget()
        self.details_button.configure(text='Hide technical details' if self.details_visible else 'Show technical details')

    def tick(self):
        if self.lifecycle.closed: return
        remaining=max(0,math.ceil(self.deadline-time.monotonic()))
        self.notice.configure(text=f'Closes automatically in {remaining//60:02d}:{remaining%60:02d} • No data is saved')
        if remaining==0: self.lifecycle.close()
        else: self.lifecycle.root.after(1000,self.tick)

def display(document, lifecycle):
    # Native ephemeral window avoids terminal transcripts and browser disk caches.
    root=lifecycle.root
    ReviewInterface(document,lifecycle)
    lifecycle.arm()
    root.deiconify()
    try:
        root.mainloop()
    finally:
        lifecycle.close()
        document.clear()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--scope',choices=['basic','premier'],default='basic')
    commands=parser.add_subparsers(dest='command',required=True)
    commands.add_parser('search').add_argument('query')
    fetch=commands.add_parser('fetch')
    fetch.add_argument('food_id',type=int)
    fetch.add_argument('--usda-id',type=int)
    args=parser.parse_args()
    client=None
    lifecycle=None
    document=None
    try:
        # Create/check GUI availability before requesting restricted content.
        import tkinter as tk
        root=tk.Tk()
        lifecycle=WindowLifecycle(root)
        root.withdraw()
        root.update_idletasks()
        client=Client(os.environ.get('FATSECRET_CLIENT_ID',''),os.environ.get('FATSECRET_CLIENT_SECRET',''),args.scope)
        if args.command=='search':
            document={'source':'fatsecret Platform API','retrievedAt':datetime.now(timezone.utc).isoformat(),
                      'searchResults':client.search(args.query),'publishable':False}
        else:
            usda=None
            if args.usda_id:
                path=Path(__file__).resolve().parents[1]/'usda/pilot-source-records.json'
                usda=json.loads(path.read_text(encoding='utf-8')).get(str(args.usda_id))
                if not usda: raise ResearchError('Only retained reviewed USDA pilot records are supported.')
            raw=client.fetch(args.food_id)
            record=normalize(raw)
            document={'record':record,'rawEvidenceInMemory':raw}
            if usda: document['comparison']=compare(record,usda)
        client.close()
        display(document,lifecycle)
        document.clear()
    except ResearchError as exc:
        print(str(exc),file=sys.stderr)
        return 1
    except Exception:
        print('Research session failed. Details suppressed; ensure Python Tk support is installed.',file=sys.stderr)
        return 1
    finally:
        if lifecycle: lifecycle.close()
        if document is not None: document.clear()
        if client: client.close()
    return 0

if __name__=='__main__':
    sys.exit(main())
