# MoodMeal Avatar — Redesign Phase 1

The avatar creator asks for three choices, in this order:

1. **Style**: Feminine, Masculine, or Androgynous (body, outfit, and pose).
2. **Skin Tone**: Fair, Light, Medium, Tan, Deep, or Rich.
3. **Hairstyle**: Long Wavy, Straight, Braids, Short Curly, Short Straight,
   Buzz Cut, or Bald.

Every hairstyle works with every style and skin tone. Hair color is fixed
and isn't a user choice.

Avatars saved under the old seven-preset lineup (or any earlier option set)
are migrated automatically on load. See "Legacy avatar migration" in
README.md for the exact mapping.

The mood-expression system is still independent of identity: the same
avatar shows all 12 mood expressions without changing its style, skin tone,
or hairstyle.
