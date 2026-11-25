"""Offline regression checks for state helpers (without installed Flask)."""
from pathlib import Path
import ast
import json
import random
import unittest

SRC = Path(__file__).resolve().parents[1] / 'app.py'
code = ast.parse(SRC.read_text(encoding='utf-8'))
functions = {'normalize_quest', '_quest_name', '_quest_steps_open', '_merge_quests', '_merge_world_facts'}
ns = {'random':random, 'json':json}
for node in code.body:
    if isinstance(node, ast.FunctionDef) and node.name in functions:
        exec(compile(ast.Module(body=[node],type_ignores=[]), str(SRC), 'exec'), ns)

class QATest(unittest.TestCase):
    def test_quest_stages_dict(self):
        q=ns['normalize_quest']({'name':'Серебряный колокол','status':'completed',
                                 'stages': {'1':{'text':'Забрать колокол','done':True}, '2':{'text':'Вернуть Майре','done':True}}})
        self.assertEqual(len(q['stages']),2)
        self.assertFalse(ns['_quest_steps_open'](q))

    def test_completed_legacy_stages(self):
        q=ns['normalize_quest']({'name':'Колокол','status':'completed','stages':['Забрать','Вернуть']})
        self.assertTrue(all(x['done'] for x in q['stages']))

    def test_single_dict_stage(self):
        q=ns['normalize_quest']({'name':'Квест','stages':{'text':'Дойти','done':True}})
        self.assertEqual(q['stages'], [{'text':'Дойти','done':True}])

    def test_normalization_and_merge_preserve_progress(self):
        q={'id':'q','name':'Вернуть колокол','status':'active','stages':[{'text':'Забрать','done':True},{'text':'Сдать','done':False}], 'rewards': {'xp':50}}
        changes=[{'id':'q','name':'Вернуть колокол','status':'completed','stages':'Вернуть колокол'}]
        merged=ns['_merge_quests']([q],changes)
        self.assertEqual(merged[0]['status'],'active')
        self.assertEqual(merged[0]['rewards']['xp'],50)

    def test_explicit_completed_does_not_crash(self):
        q={'id':'q','name':'Сдать Майре','status':'completed','stages':{'end':{'text':'Сдать','done':True}}}
        merged=ns['_merge_quests']([q],[])
        self.assertEqual(merged[0]['status'],'completed')

    def test_fact_upsert_and_delete(self):
        f=ns['_merge_world_facts']([{'id':'password','text':'Сова считает волны'}],
                                   [{'id':'deadline','text':'19:30 возврат'}],[])
        self.assertEqual(len(f),2)
        f=ns['_merge_world_facts'](f,[{'id':'password','text':'Новый пароль'}], ['deadline'])
        self.assertEqual(f, [{'id':'password','text':'Новый пароль'}])

    def test_fact_untrusted_wrong_type(self):
        f=ns['_merge_world_facts']([{'id':'a','text':'Не забудь'}], {'a':'oops'}, 123)
        self.assertEqual(len(f),1)

if __name__=='__main__':unittest.main()
