import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeAvatarConfig as normalize } from '../src/data/avatarMigration';
import { avatarSource, AVATAR_MOODS } from '../src/data/modularAvatars';
import { DEFAULT_AVATAR_CONFIG } from '../src/data/avatarOptions';
for (const baseStyle of ['feminine','masculine','androgynous']) {
 const legacy = {baseStyle,skinTone:'rich',hairStyle:'braids'};
 assert.deepEqual(normalize(legacy),legacy);
 assert.match(avatarSource(normalize(legacy)!),/presets/);
}
for(const raw of [null,[],42,'bad']) assert.equal(normalize(raw),null);
assert.equal(normalize({presetId:'androgynous'})?.baseStyle,'androgynous');
assert.equal(normalize({presetId:'__proto__'})?.baseStyle,'feminine');
assert.equal(normalize({...DEFAULT_AVATAR_CONFIG,baseStyle:'androgynous'})?.artworkVersion,undefined);
for(const baseStyle of ['feminine','masculine'] as const) for(const skinTone of ['fair','light','medium','tan','deep','rich'] as const) for(const hairStyle of [baseStyle === 'feminine' ? 'long-wavy' : 'short-straight','short-curly'] as const) {
 const config={artworkVersion:'modular-v1' as const,baseStyle,skinTone,hairStyle};
 assert.deepEqual(normalize(JSON.parse(JSON.stringify(config))),config);
 for(const mood of AVATAR_MOODS) assert.ok(fs.existsSync('public'+avatarSource(config,mood)),avatarSource(config,mood));
}
assert.equal(normalize({...DEFAULT_AVATAR_CONFIG,hairStyle:'braids'})?.hairStyle,'braids');
assert.equal(normalize({...DEFAULT_AVATAR_CONFIG,baseStyle:'masculine',hairStyle:'ponytail'})?.hairStyle,'short-straight');
console.log('PASS: legacy retention, malformed input, JSON round-trip, hair normalization, all 312 asset paths');

import { STYLE_OPTIONS, selectCharacter, updateAppearance, appearanceFor } from '../src/data/avatarAppearance';
import { avatarLayers } from '../src/data/modularAvatars';
let independent = updateAppearance(DEFAULT_AVATAR_CONFIG, {hairStyle:'braids',hairColor:'purple',eyeColor:'green'});
independent = selectCharacter(independent,'masculine');
assert.equal(independent.hairStyle,'short-straight');
independent = updateAppearance(independent,{hairStyle:'side-part',hairColor:'blonde',eyeColor:'blue'});
independent = normalize(JSON.parse(JSON.stringify(independent)))!;
independent = selectCharacter(independent,'feminine');
assert.deepEqual(appearanceFor(independent,'feminine'),{hairStyle:'braids',hairColor:'purple',eyeColor:'green'});
assert.deepEqual(appearanceFor(independent,'masculine'),{hairStyle:'side-part',hairColor:'blonde',eyeColor:'blue'});
assert.equal(selectCharacter(independent,'masculine').hairStyle,'side-part');
for(const baseStyle of ['feminine','masculine'] as const) for(const option of STYLE_OPTIONS[baseStyle]) {
 const config=updateAppearance(selectCharacter(DEFAULT_AVATAR_CONFIG,baseStyle),{hairStyle:option.id,hairColor:'purple',eyeColor:'blue'});
 assert.deepEqual(normalize(config),config);
 for(const mood of AVATAR_MOODS) for(const layer of avatarLayers(config,mood)) {
  assert.ok(fs.existsSync('public'+layer.src),layer.src);
  if(layer.part==='base'||layer.part==='expression'||layer.part==='scalp') assert.equal(layer.filter,'none');
 }
}
const invalid=normalize({...DEFAULT_AVATAR_CONFIG,appearances:{feminine:{hairStyle:'side-part',hairColor:'invalid',eyeColor:'invalid'},masculine:42}})!;
assert.deepEqual(appearanceFor(invalid,'feminine'),{hairStyle:'long-wavy',hairColor:'original',eyeColor:'original'});
assert.equal(invalid.appearances?.masculine,undefined);
console.log('PASS: independent character choices/colors, all new layers, invalid appearance recovery, skin/clothing filters unchanged');

assert.equal(STYLE_OPTIONS.feminine.find(s=>s.id==='short-curly')?.label,'Short wavy');
assert.equal(STYLE_OPTIONS.feminine.length,7);
assert.equal(STYLE_OPTIONS.masculine.length,7);
assert.equal(STYLE_OPTIONS.feminine.find(s=>s.id==='straight')?.label,'Straight with bangs');
assert.equal(STYLE_OPTIONS.feminine.find(s=>s.id==='long-straight')?.label,'Straight');
let revisions = updateAppearance(DEFAULT_AVATAR_CONFIG,{hairStyle:'short-curly'});
revisions = updateAppearance(selectCharacter(revisions,'masculine'),{hairStyle:'braids'});
assert.equal(selectCharacter(normalize(revisions)!,'feminine').hairStyle,'short-curly');
assert.equal(selectCharacter(normalize(revisions)!,'masculine').hairStyle,'braids');
console.log('PASS revision labels, 7 styles each, independent braid selection and previous short-curls compatibility');
