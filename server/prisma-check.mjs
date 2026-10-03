import('@prisma/client').then(m => {
  const c = new m.PrismaClient();
  console.log('prisma client instancia ok');
  return c.$disconnect();
}).catch(e => console.log('PRISMA FAIL:', e.message.split('\n').slice(0,2).join(' | ')));
