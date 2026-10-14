"""Entirely synthetic fixtures, not copied or recorded API responses."""
import json
import unittest
from unittest.mock import patch, MagicMock
from urllib.error import HTTPError
import fatsecret_review as app

def fixture():
    return {'food':{'food_id':'999001','food_name':'Synthetic test food', 'food_type':'Generic',
        'servings':{'serving':[{'serving_id':'11','serving_description':'100 g','number_of_units':'100',
        'measurement_description':'g','metric_serving_amount':'100','metric_serving_unit':'g',
        'calories':'42','protein':'0'}, {'serving_id':'12','serving_description':'1 cup',
        'number_of_units':'1','measurement_description':'cup','metric_serving_amount':'150','metric_serving_unit':'g','calories':'63'}]}}}

def baseline():
    return {'fdc_id':'999002','nutrients':{'1008':{'amountPer100g':'42','definition':{'unit_name':'KCAL'}}},
            'portions':[{'id':'20','amount':'1','modifier':'cup','gram_weight':'155'}]}

class Tests(unittest.TestCase):
    def test_missing_reasons_precede_units(self):
        for source,reference in [(None,None),('1',None),(None,'1')]:
            result=app.precision_comparison(source,'100','g',reference,'G','MG')
            self.assertEqual(result['reason'],'missing-nutrient-data')
        self.assertEqual(app.precision_comparison('1','100','g','1','G',None)['reason'],'missing-or-unknown-unit')
        self.assertEqual(app.precision_comparison('1','100','g','1','G','MG')['reason'],'unit-mismatch')

    def test_real_comparison_interface_and_expiry(self):
        import subprocess,sys
        from pathlib import Path
        code = """
import tkinter as tk
import fatsecret_review as app
from test_fatsecret_review import fixture,baseline
root=tk.Tk(); life=app.WindowLifecycle(root)
root.withdraw(); root.update_idletasks()
record=app.normalize(fixture())
document={'record':record,'comparison':app.compare(record,baseline())}
ui=app.ReviewInterface(document,life)
root.update_idletasks()
assert '999001' in ui.overview_text and '999002' in ui.overview_text
assert len(ui.table.get_children()) == len(app.FIELDS)
assert 'Equivalent within precision: 1' in ui.summary.cget('text')
rows=[ui.portions.item(i)['values'] for i in ui.portions.get_children()]
assert any('155 g' in r and '150 g' in r and 'Source-specific weight discrepancy' in r for r in rows)
ui.toggle_details(); root.update_idletasks()
assert 'precisionModel' in ui.details.get('1.0','end')
ui.selection.current(1); ui.refresh()
assert '1 cup' in ui.details.get('1.0','end')
ui.toggle_details(); assert not ui.details_visible
root.deiconify(); root.geometry('820x620'); root.update_idletasks()
assert ui.table.winfo_height()>50
life.arm(); ui.deadline=0; ui.tick(); life.close()
assert life.closed
"""
        result=subprocess.run([sys.executable,'-c',code],cwd=Path(app.__file__).parent,
                              capture_output=True,text=True,timeout=15)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(result.stderr,'')

    def test_precision_derived_serving_rounding(self):
        # Synthetic 160-g serving: 13 kcal rounds before division, not afterwards.
        result=app.precision_comparison('13','160','g','8','KCAL','KCAL')
        self.assertEqual(result['status'],'equivalent-within-precision')
        self.assertFalse(result['exactMatch'])
        self.assertTrue(result['derivedPer100g'])
        self.assertEqual(result['fatsecretOriginal'],'13')
        self.assertEqual(result['fatsecretIntervalPer100g'],['7.8125','8.4375'])

    def test_precision_trailing_zeros_and_true_conflict(self):
        wide=app.precision_comparison('1.2','100','g','1.24','G','G')
        narrow=app.precision_comparison('1.20','100','g','1.24','G','G')
        self.assertEqual(wide['status'],'equivalent-within-precision')
        self.assertEqual(narrow['status'],'meaningful-discrepancy')
        self.assertEqual(narrow['fatsecretOriginal'],'1.20')
        exact=app.precision_comparison('1.20','100','g','1.2','G','G')
        self.assertTrue(exact['exactMatch'])

    def test_precision_unknown_zero_units_and_boundary(self):
        for amount,weight,metric,unit in [(None,'100','g','G'),('2','0','g','G'),('2','100','ml','G'),('2','100','g','MG')]:
            r=app.precision_comparison(amount,weight,metric,'2','G',unit)
            self.assertEqual(r['status'],'missing-or-incomparable')
            self.assertIsNone(r['exactMatch'])
        self.assertTrue(app.precision_comparison('0','100','g','0','G','G')['exactMatch'])
        self.assertEqual(app.precision_comparison('8','100','g','9','G','G')['status'],'meaningful-discrepancy')

    def test_api_numeric_precision_preserved(self):
        client=app.Client('dummy-id','dummy-secret')
        with patch.object(app,'build_opener') as opener:
            opener.return_value.open.return_value.__enter__.return_value.read.return_value=b'{"value":1.200,"count":100}'
            result=client._request(app.API_URL,{},'dummy-auth')
        self.assertEqual(result['value'],'1.200')

    def test_real_tk_manual_and_timeout_have_no_theme_errors(self):
        import subprocess,sys
        from pathlib import Path
        for mode in ('manual','timeout'):
            code = """
import tkinter as tk
from tkinter import ttk
import fatsecret_review as app
root=tk.Tk()
life=app.WindowLifecycle(root)
root.withdraw()
root.update_idletasks()
ttk.Label(root,text='Synthetic lifecycle test').pack()
life.arm(30 if MODE=='timeout' else 900000)
if MODE=='manual': root.after(30,life.close)
root.mainloop()
life.close()
assert life.closed
""".replace('MODE',repr(mode))
            result=subprocess.run([sys.executable,'-c',code],cwd=Path(app.__file__).parent,
                                  capture_output=True,text=True,timeout=10)
            self.assertEqual(result.returncode,0,result.stderr)
            self.assertEqual(result.stderr,'')

    def test_manual_close_cancels_callbacks_and_destroys_once(self):
        root=MagicMock()
        root.after.return_value='expiry'
        root.tk.call.side_effect=[('expiry','idle-theme'),()]
        life=app.WindowLifecycle(root)
        life.arm()
        root.after.assert_called_once_with(900000,life.close)
        root.protocol.assert_called_once_with('WM_DELETE_WINDOW',life.close)
        life.close(); life.close()
        root.after_cancel.assert_any_call('expiry')
        root.after_cancel.assert_any_call('idle-theme')
        root.destroy.assert_called_once()

    def test_timeout_uses_same_close_path(self):
        root=MagicMock(); root.tk.call.return_value=()
        life=app.WindowLifecycle(root); life.arm()
        timeout=root.after.call_args.args[1]
        timeout(); life.close(); life.arm()
        root.destroy.assert_called_once()
        self.assertEqual(root.after.call_count,1)

    def test_window_callback_error_does_not_log_payload(self):
        import io,contextlib
        root=MagicMock(); root.tk.call.return_value=()
        life=app.WindowLifecycle(root)
        with contextlib.redirect_stderr(io.StringIO()) as stream:
            root.report_callback_exception(ValueError,ValueError('private-token'),None)
        self.assertNotIn('private-token',stream.getvalue())
        root.destroy.assert_called_once()

    def test_synthetic_source_specific_cup_weights(self):
        # Invented IDs and values deliberately different from real food data.
        raw=fixture(); raw['food']['servings']['serving'][1]['metric_serving_amount']='120'
        old=baseline(); old['portions'][0]['gram_weight']='125'
        result=app.compare(app.normalize(raw),old)['comparisons'][1]['matchingPortions'][0]
        self.assertEqual((result['fatsecretGrams'],result['usdaGrams']),(120,125))
        self.assertEqual(result['status'],'weight-conflict')
        self.assertEqual(old['portions'][0]['gram_weight'],'125')

    def test_missing_zero_and_identity(self):
        data=app.normalize(fixture())
        self.assertEqual(data['fatsecretFoodId'],'999001')
        self.assertNotIn('usdaFdcId',data)
        self.assertIsNone(data['servings'][0]['nutrients']['fiber']['per100g'])
        self.assertEqual(data['servings'][0]['nutrients']['protein']['per100g'],0)
        self.assertFalse(data['publishable'])

    def test_units_and_single_serving(self):
        raw=fixture(); row=raw['food']['servings']['serving'][0]
        raw['food']['servings']['serving']=row
        row['metric_serving_unit']='ml'
        self.assertIsNone(app.normalize(raw)['servings'][0]['grams'])
        row['metric_serving_unit']='oz'; row['metric_serving_amount']='1'
        self.assertEqual(app.normalize(raw)['servings'][0]['grams'],28.349523125)

    def test_comparison_conflict_not_winner(self):
        result=app.compare(app.normalize(fixture()),baseline())
        self.assertEqual(result['comparisons'][0]['nutrients'][0]['status'],'equivalent-within-precision')
        self.assertEqual(result['comparisons'][1]['matchingPortions'][0]['status'],'weight-conflict')
        self.assertEqual(result['usdaFdcId'],'999002')
        self.assertIsNone(result['winner'])
        old=baseline(); old['nutrients']['1008']['amountPer100g']='43'
        self.assertEqual(app.compare(app.normalize(fixture()),old)['comparisons'][0]['nutrients'][0]['status'],'meaningful-discrepancy')

    def test_unknown_and_unit_conflicts(self):
        old=baseline(); old['nutrients']['1008']['definition']['unit_name']='G'
        result=app.compare(app.normalize(fixture()),old)
        self.assertEqual(result['comparisons'][0]['nutrients'][0]['status'],'missing-or-incomparable')
        self.assertEqual(result['comparisons'][0]['nutrients'][1]['status'],'missing-or-incomparable')

    def test_token_memory_expiry_and_close(self):
        client=app.Client('dummy-id','dummy-secret')
        with patch.object(client,'_request',return_value={'access_token':'dummy-token','token_type':'Bearer','expires_in':3600}) as call:
            self.assertEqual(client.get_token(),'dummy-token')
            client.get_token(); self.assertEqual(call.call_count,1)
            client.expires=0; client.get_token(); self.assertEqual(call.call_count,2)
        client.close(); self.assertIsNone(client.token); self.assertIsNone(client.secret)

    def test_scrubs_secret_token_basic_auth(self):
        client=app.Client('dummy-id','dummy-secret'); client.token='dummy-token'
        result=client.scrub({'unexpected':[client.client_id,client.secret,client.token,client.basic]})
        self.assertEqual(result['unexpected'],['[REDACTED]']*4)

    def test_errors_and_timeouts_sanitized(self):
        for error in [HTTPError('secret-url',429,'secret-body',{},None),HTTPError('secret-url',403,'secret-body',{},None),TimeoutError('secret-body')]:
            client=app.Client('dummy-id','dummy-secret')
            with patch.object(app,'build_opener') as opener:
                opener.return_value.open.side_effect=error
                with self.assertRaises(app.ResearchError) as raised: client._request(app.API_URL,{},'secret-auth')
                self.assertNotIn('secret',str(raised.exception))

    def test_response_error_timeout_redirect_and_size(self):
        for body in [b'{"error":{"message":"secret-token"}}', b'x'*2_000_001, b'invalid']:
            client=app.Client('dummy-id','dummy-secret')
            with patch.object(app,'build_opener') as opener:
                opener.return_value.open.return_value.__enter__.return_value.read.return_value=body
                with self.assertRaises(app.ResearchError): client._request(app.API_URL,{},'auth')
                self.assertEqual(opener.return_value.open.call_args.kwargs['timeout'],20)
        self.assertIsNone(app.NoRedirect().redirect_request(None))

    def test_fixed_host_budget_and_scope(self):
        client=app.Client('dummy-id','dummy-secret')
        with self.assertRaises(app.ResearchError): client._request('https://example.com',{},'auth')
        client.calls=3
        with self.assertRaises(app.ResearchError): client._request(app.API_URL,{},'auth')
        with self.assertRaises(app.ResearchError): app.Client('dummy-id','dummy-secret','all')
        with self.assertRaises(app.ResearchError): app.Client('','')

    def test_fetch_id_and_permission_no_retry(self):
        client=app.Client('dummy-id','dummy-secret'); client.token='dummy-token'; client.expires=float('inf')
        with patch.object(client,'_request',return_value=fixture()):
            self.assertEqual(client.fetch(999001)['food']['food_id'],'999001')
            with self.assertRaises(app.ResearchError): client.fetch(888)
        with patch.object(client,'_request',side_effect=app.ResearchError('Permission denied')) as call:
            with self.assertRaises(app.ResearchError): client.search('synthetic')
            self.assertEqual(call.call_count,1)

    def test_no_file_write_or_data_stdout(self):
        # Guard the library operations against accidental persistence.
        with patch('builtins.open',side_effect=AssertionError('No disk IO')), patch('builtins.print',side_effect=AssertionError('No data logs')):
            app.compare(app.normalize(fixture()),baseline())

if __name__=='__main__': unittest.main()
