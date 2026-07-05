import { prisma } from "../../../shared/prisma";
import { isTestMode } from "../../../utils/mode.util";
import { SearchService } from "./search.service";

async function reindex() {
  console.log("Starting product re-indexing...");

  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
    },
    select: { id: true, name: true },
  });

  console.log(`Found ${products.length} products to index.`);

  let count = 0;
  let success = 0;
  let fail = 0;

  for (const product of products) {
    count++;
    try {
      if (isTestMode()) {
        process.stdout.write(
          `[${count}/${products.length}] Indexing product: ${product.name}... `,
        );
      }

      await SearchService.generateAndStoreProductEmbedding(product.id);
      success++;

      if (isTestMode()) {
        process.stdout.write("DONE\n");
      }
    } catch (err: any) {
      fail++;
      console.error(`\nFAILED product ${product.id}:`, err.message);
    }
  }

  console.log("\nRe-indexing completed.");
  console.log(`Total: ${count}`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${fail}`);

  process.exit(0);
}

reindex().catch((err) => {
  console.error("Re-indexing script failed:", err);
  process.exit(1);
});
