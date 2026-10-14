import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock
from urllib.error import HTTPError
import fdc_review as tool

class ReviewTests(unittest.TestCase):
    def fixture(self):
        old = json.loads((tool.HERE/'pilot-source-records.json').read_text())['171711']
        return old, {'fdcId':171711, 'description':old['description'], 'dataType':'SR Legacy', 'publicationDate':old['publication_date'],
            'foodNutrients':[{'id':r['sourceRow']['id'], 'amount':r['amountPer100g'],
                             'nutrient':{'id':int(n), 'name':r['definition']['name'], 'unitName':r['definition']['unit_name'].lower()}}
                            for n,r in old['nutrients'].items()],
            'foodPortions':[{'id':p['id'],'amount':p['amount'],'gramWeight':p['gram_weight'],
                             'modifier':p['modifier'],'portionDescription':p['portion_description'],
                             'measureUnit':{'id':p['measure_unit_id']}} for p in old['portions']]}

    def test_missing_and_zero(self):
        for v in [None,'', 'NaN', -1, True, 'bad']:
            self.assertIsNone(tool.number(v))
        self.assertEqual(tool.number(0),0)
        n=tool.normalize({'foodNutrients':[{'nutrient':{'id':1235}}], 'foodPortions':[{}]})
        self.assertIsNone(n['nutrients']['1235']['amountPer100g'])
        self.assertIsNone(n['portions'][0]['gramWeight'])

    def test_units(self):
        self.assertEqual(tool.unit('mg'),'MG')
        self.assertEqual(tool.unit('µg'),'UG')
        self.assertEqual(tool.unit('mcg'),'UG')
        self.assertIsNone(tool.unit(None))

    def test_preparation_and_publication(self):
        n=tool.normalize({'description':'Blueberries, dried','approved':True},'raw')
        self.assertEqual(n['preparationCheck'],'manual-review-required')
        self.assertFalse(n['approved'])
        self.assertFalse(n['publishable'])
        self.assertEqual(n['reviewStatus'],'pending-review')

    def test_csv_roundtrip_and_discrepancies(self):
        old, raw=self.fixture()
        self.assertEqual(tool.compare(tool.normalize(raw),old)['differences'],[])
        raw['foodNutrients'][0]['amount']=999
        raw['foodPortions'][0]['gramWeight']=999
        self.assertEqual(len(tool.compare(tool.normalize(raw),old)['differences']),2)
        raw['foodNutrients'].pop()
        self.assertTrue(any(d['field'].endswith('.present') for d in tool.compare(tool.normalize(raw),old)['differences']))

    def test_http_errors_sanitized(self):
        for code in [401,403,429,500]:
            with patch.object(tool,'build_opener') as opener:
                opener.return_value.open.side_effect=HTTPError('SECRET',code,'SECRET',{},None)
                with self.assertRaises(tool.ReviewError) as caught:
                    tool.request('food/171711','SECRET')
                self.assertNotIn('SECRET',str(caught.exception))
        with patch.object(tool,'build_opener') as opener:
            opener.return_value.open.side_effect=TimeoutError('SECRET')
            with self.assertRaises(tool.ReviewError) as caught:
                tool.request('food/171711','SECRET')
            self.assertNotIn('SECRET',str(caught.exception))

    def test_timeout_and_redirect(self):
        with patch.object(tool,'build_opener') as opener:
            opener.return_value.open.return_value.__enter__.return_value.read.return_value=b'{}'
            tool.request('food/171711','fake-key')
            self.assertEqual(opener.return_value.open.call_args.kwargs['timeout'],20)
        self.assertIsNone(tool.NoRedirect().redirect_request(None,None,None,None,None,None))

    def test_mock_cli_comparison_and_no_secret(self):
        old, raw=self.fixture()
        raw['unexpected']='fake-secret'
        with tempfile.TemporaryDirectory() as temp, patch.object(tool,'HERE',Path(temp)), patch.object(tool,'PENDING',Path(temp)/'pending-review'):
            (Path(temp)/'pilot-source-records.json').write_text(json.dumps({'171711':old}))
            with patch.dict('os.environ',{'FDC_API_KEY':'fake-secret'}), patch.object(tool,'request',return_value=raw), patch.object(tool.sys,'argv',['tool','fetch','171711','--expected-state','raw','--compare-pilot']), contextlib.redirect_stdout(io.StringIO()) as log:
                self.assertEqual(tool.main(),0)
            text=next((Path(temp)/'pending-review').glob('*.json')).read_text()
            self.assertNotIn('fake-secret',text+log.getvalue())
            self.assertFalse(json.loads(text)['publishable'])
            self.assertEqual(json.loads(text)['comparison']['differences'],[])

    def test_missing_key(self):
        with patch.dict('os.environ',{'FDC_API_KEY':''}), patch.object(tool.sys,'argv',['tool','fetch','171711']), patch.object(tool,'request') as request, contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(tool.main(),1)
            request.assert_not_called()

    def test_duplicate_rows_retained_without_selection(self):
        old, raw = self.fixture()
        row = raw['foodNutrients'][0]
        raw['foodNutrients'] += [dict(row, amount=999), dict(row, amount=None)]
        normalized = tool.normalize(raw)
        nid=str(row['nutrient']['id'])
        self.assertEqual(len(normalized['duplicateNutrientRows'][nid]),3)
        self.assertIsNone(normalized['nutrients'][nid]['amountPer100g'])
        self.assertFalse(normalized['publishable'])
        self.assertFalse(tool.compare(normalized,old)['summary']['cleanNutritionalComparison'])

    def test_resume_skips_only_saved_pending_record(self):
        with tempfile.TemporaryDirectory() as temp, patch.object(tool,'PENDING',Path(temp)):
            self.assertFalse(tool.already_saved(171711))
            (Path(temp)/'saved.json').write_text(json.dumps({'rawResponse':{'fdcId':171711},'record':{'fdcId':'171711'},'reviewStatus':'pending-review','approved':False,'publishable':False}))
            self.assertTrue(tool.already_saved(171711))
            self.assertFalse(tool.already_saved(168588))
            with patch.object(tool.sys,'argv',['tool','fetch','171711','--skip-existing']), patch.object(tool,'request') as request, contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(tool.main(),0)
                request.assert_not_called()

    def test_empty_categories_are_informational_only(self):
        old, raw = self.fixture()
        for nid, name in tool.EMPTY_CATEGORIES.items():
            raw['foodNutrients'].append({'nutrient':{'id':int(nid),'name':name,'unitName':'g'}})
        result = tool.compare(tool.normalize(raw), old)
        self.assertEqual(result['summary']['totalDifferences'],12)
        self.assertEqual(result['summary']['materialDifferences'],0)
        self.assertTrue(result['summary']['cleanNutritionalComparison'])
        self.assertFalse(result['summary']['exactComparedFieldsMatch'])
        self.assertEqual(len(result['groups']['empty-category']),12)
        raw['foodNutrients'][-1]['amount']=1
        self.assertGreater(tool.compare(tool.normalize(raw),old)['summary']['materialDifferences'],0)

    def test_meaningful_null_and_new_values(self):
        old, raw = self.fixture()
        raw['foodNutrients'].append({'nutrient':{'id':99999,'name':'Meaningful unknown','unitName':'mg'}})
        result=tool.compare(tool.normalize(raw),old)
        self.assertGreater(result['summary']['missingValueDifferences'],0)
        self.assertFalse(result['summary']['cleanNutritionalComparison'])
        raw['foodNutrients'][0]['amount']=None
        self.assertTrue(any(d['field'].endswith('.amount') for d in tool.compare(tool.normalize(raw),old)['groups']['missing-value']))

    def test_material_portion_preparation_and_metadata(self):
        old, raw = self.fixture()
        raw['foodNutrients'][0]['amount']=999
        raw['foodPortions'][0]['gramWeight']=999
        raw['description']='Blueberries, cooked'
        raw['publicationDate']='2099-01-01'
        result=tool.compare(tool.normalize(raw),old)
        self.assertEqual(len(result['groups']['material-nutrient']),1)
        self.assertEqual(result['summary']['portionDifferences'],1)
        self.assertEqual(result['summary']['preparationStateDifferences'],1)
        self.assertEqual(len(result['groups']['metadata']),1)

    def test_search_generic_only(self):
        with patch.dict('os.environ',{'FDC_API_KEY':'fake-key'}), patch.object(tool.sys,'argv',['tool','search','blueberries']), patch.object(tool,'request',return_value={}) as request, patch.object(tool,'save',return_value=Path('pending.json')), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(tool.main(),0)
            self.assertNotIn('Branded',request.call_args.args[2]['dataType'])

if __name__=='__main__':
    unittest.main()
