import fs from 'fs';

function getCatId(name: string) {
  return name.split(/[\s,]+/)
    .map(w => w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 3))
    .filter(w => w.length > 0)
    .join('-');
}

const data = JSON.parse(fs.readFileSync('public/questions.json', 'utf8'));

const categoryMap: Record<string, string> = {
  'fundamentals-ai-ml': 'Fundamentals of AI/ML',
  'fundamentals-gen-ai': 'Fundamentals of Generative AI',
  'applications-fm': 'Applications of Foundation Models',
  'responsible-ai': 'Responsible AI',
  'security-compliance': 'Security, Compliance, and Governance',
  'scrambled': 'AWS AI Scrambled'
};

const newCatIds: Record<string, string> = {};
for (const [oldId, name] of Object.entries(categoryMap)) {
  newCatIds[oldId] = getCatId(name);
}

const nameToNewId: Record<string, string> = {};
for (const name of Object.values(categoryMap)) {
  nameToNewId[name] = getCatId(name);
}

const counts: Record<string, number> = {};

data.forEach((q: any) => {
  let oldCat = q.category;
  let newCat = newCatIds[oldCat] || nameToNewId[oldCat] || getCatId(oldCat);
  q.category = newCat;
  
  const key = `${newCat}-l${q.level}`;
  counts[key] = (counts[key] || 0) + 1;
  
  q.id = `${newCat}-l${q.level}-q${counts[key]}`;
});

fs.writeFileSync('public/questions.json', JSON.stringify(data, null, 2));
console.log('Updated questions.json');
