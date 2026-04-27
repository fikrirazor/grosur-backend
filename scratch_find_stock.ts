
import { PrismaClient } from './src/generated/prisma';
const prisma = new PrismaClient();

async function main() {
  const stock = await prisma.stock.findFirst({
    include: {
      product: true,
      store: true
    }
  });
  console.log(JSON.stringify(stock, null, 2));
}

main();
