// Seed de dados para demo local
// Execução: npm run db:seed ou npx prisma db seed

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("[seed] Iniciando...");

  // Limpando dados existentes de entidades CRM para repetir seeds com segurança (opcional)
  // Comentado para não apagar dados em ambientes reais. Descomente se desejar resetar.
  // await prisma.opportunity.deleteMany({});
  // await prisma.contact.deleteMany({});
  // await prisma.lead.deleteMany({});

  // 1) Criar 10 contatos
  const contactNames = [
    "Alice Lima",
    "Bruno Souza",
    "Carla Mendes",
    "Diego Santos",
    "Elisa Rocha",
    "Felipe Nunes",
    "Gabriela Alves",
    "Henrique Dias",
    "Isabela Pereira",
    "João Carvalho",
  ];

  const contactPayloads = contactNames.map((name, idx) => ({
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    phone: `+55 21 9${String(10000000 + idx * 12345).slice(0,8)}`,
    consumoMedio: String(150 + idx * 10), // Decimal como string
    status: pick(["new", "contacted", "qualified", "proposal_won", "proposal_lost", "archived"]),
    address: { city: "Rio de Janeiro", state: "RJ" },
  }));

  await prisma.contact.createMany({ data: contactPayloads, skipDuplicates: true });
  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
  console.log(`[seed] Contatos prontos: ${contacts.length}`);

  // 2) Criar 5 leads
  const leadPayloads = Array.from({ length: 5 }).map((_, i) => ({
    name: `Lead ${i + 1}`,
    email: `lead${i + 1}@example.com`,
    phone: `+55 11 9${String(20000000 + i * 4321).slice(0,8)}`,
    consumoMedio: String(120 + i * 15), // Decimal como string
    status: pick(["new", "contacted", "qualified", "proposal_won", "proposal_lost", "archived"]),
    address: { city: "São Paulo", state: "SP" },
  }));

  await prisma.lead.createMany({ data: leadPayloads, skipDuplicates: true });
  const leads = await prisma.lead.findMany();
  console.log(`[seed] Leads prontos: ${leads.length}`);

  // 3) Criar 5 oportunidades vinculando aos primeiros 5 contatos
  const baseContacts = contacts.slice(0, 5);
  for (let i = 0; i < baseContacts.length; i++) {
    const c = baseContacts[i];
    await prisma.opportunity.create({
      data: {
        title: `Oportunidade #${i + 1}`,
        status: pick(["open", "won", "lost", "archived"]),
        amount: String(1000 + i * 250), // Decimal como string
        contactId: c.id,
      },
    });
  }
  const opps = await prisma.opportunity.findMany();
  console.log(`[seed] Oportunidades prontas: ${opps.length}`);

  console.log("[seed] Finalizado com sucesso ✔");
}

main()
  .catch((e) => {
    console.error("[seed] Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });