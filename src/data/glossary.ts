import {NUTRIENTS, OWNER_TEXT_REVIEW} from "./knowledge";
/** Every definition was checked against its source page (glossary review, 2026-11-04). */
const GLOSSARY_REVIEW = { reviewOrigin: OWNER_TEXT_REVIEW.reviewOrigin, reviewedBy: OWNER_TEXT_REVIEW.reviewedBy!, reviewedDate: OWNER_TEXT_REVIEW.reviewedDate! };
export const TERMS = [
  ["potassium", "Potassium", "A mineral used by nerves, muscles and the heart. Found in potatoes, beans and bananas. Kidney disease and some medicines can change how much is safe; ask your clinician before increasing it or using potassium salt substitutes.", "https://ods.od.nih.gov/factsheets/Potassium-Consumer/"],
  ["vitamin-c", "Vitamin C", "Helps make collagen and supports normal immune function. It also helps your body absorb iron from plant foods. Peppers, citrus fruit and berries provide vitamin C.", "https://ods.od.nih.gov/factsheets/VitaminC-Consumer/"],
  ["antioxidants", "Antioxidants", "Substances that may prevent or delay some types of cell damage. Vegetables and fruits are rich sources. It isn't clear whether the benefits of these foods come from their antioxidants, and high-dose antioxidant supplements may carry risks.", "https://medlineplus.gov/antioxidants.html"],
  ["carbohydrates", "Carbohydrates", "Sugars, starches and fiber in food. Your body uses many carbohydrates for energy. Whole grains, beans, vegetables and fruit provide carbohydrates, and whole grains also provide vitamins, minerals and fiber.", "https://medlineplus.gov/carbohydrates.html"],
  ["iron", "Iron", "A mineral needed to make hemoglobin, which carries oxygen in blood. Beans, meat and fortified foods provide iron. Tell your health care provider about any iron supplement you take, and keep iron products away from children.", "https://ods.od.nih.gov/factsheets/Iron-Consumer/"],
  ["fiber", "Fiber", "A type of carbohydrate found in plants. It aids digestion and helps prevent constipation, and soluble fiber can lower cholesterol. Found in whole grains, beans, vegetables and fruit.", "https://medlineplus.gov/ency/article/002470.htm"],
  ["protein", "Protein", "Used to build and maintain bones, muscles and skin. Meat, dairy, nuts, beans and some grains provide protein.", "https://medlineplus.gov/dietaryproteins.html"],
  ["magnesium", "Magnesium", "Helps regulate muscle and nerve function, blood sugar and blood pressure. Nuts, seeds, whole grains and leafy vegetables are sources.", "https://ods.od.nih.gov/factsheets/Magnesium-Consumer/"],
  ["omega-3", "Omega-3", "Fats that are part of the membrane around every cell. Fish and seafood provide EPA and DHA. ALA comes mainly from plant oils, and nuts and seeds such as walnuts and chia also provide omega-3s. Supplements can interact with medicines.", "https://ods.od.nih.gov/factsheets/Omega3FattyAcids-Consumer/"],
  ["sodium", "Sodium", "A mineral in salt and many packaged foods. The DASH eating pattern emphasizes reducing sodium for blood pressure management. Check labels and follow your personal care plan.", "https://www.nhlbi.nih.gov/health/dash-eating-plan"],
  ["folate", "Folate", "A B vitamin needed to make DNA and new cells. Leafy greens, beans and fortified grains provide folate.", "https://ods.od.nih.gov/factsheets/Folate-Consumer/"],
  ["calcium", "Calcium", "A mineral needed for bones, teeth, muscles and nerves. Dairy, fortified alternatives and some vegetables provide calcium.", "https://ods.od.nih.gov/factsheets/Calcium-Consumer/"],
] .map(([id, name, definition, source]) => ({ id, name, definition, source, ...GLOSSARY_REVIEW }));
for (const [id,n] of Object.entries(NUTRIENTS)) {
 if (!TERMS.some(t=>t.id===id)) TERMS.push({id,name:n.label,definition:n.explanation,source:n.source.sourceURL!,...GLOSSARY_REVIEW});
}
export function termFor(text: string) {
 const lower = text.toLowerCase();
 return TERMS.find(t => lower.includes(t.name.toLowerCase())) ?? (/carb/i.test(text) ? TERMS.find(t => t.id === "carbohydrates") : undefined);
}
