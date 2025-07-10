import { collection, setDoc, doc } from "firebase/firestore";
import { useEffect } from "react";
import { db } from "./firebase"; // adjust if your db is exported elsewhere

export default function Seeder() {
  const appId = "default-app-id";
  const basePath = `artifacts/${appId}/public/data`;

  useEffect(() => {
    const seed = async () => {
      const add = async (collectionName, dataArray) => {
        for (const data of dataArray) {
          const ref = doc(collection(db, `${basePath}/${collectionName}`));
          await setDoc(ref, data);
        }
      };

      await add("productTypes", [
        { commodity: "Cocoa", name: "Cocoa butter" },
        { commodity: "Cocoa", name: "Cocoa powder" },
        { commodity: "Cocoa", name: "Cocoa liquor" },
        { commodity: "Coffee", name: "Roasted coffee" },
        { commodity: "Coffee", name: "Instant coffee" },
        { commodity: "Coffee", name: "Coffee extract" },
        { commodity: "Rubber", name: "Latex concentrate" },
        { commodity: "Rubber", name: "Smoked sheets" },
        { commodity: "Rubber", name: "Crepe rubber" },
        { commodity: "Palm Oil", name: "Refined palm oil" },
        { commodity: "Palm Oil", name: "Palm kernel oil" },
        { commodity: "Palm Oil", name: "Palm olein" },
        { commodity: "Soy", name: "Soy oil" },
        { commodity: "Soy", name: "Soy meal" },
        { commodity: "Soy", name: "Soy protein isolate" },
      ]);

      await add("conversionRatios", [
        { commodity: "Cocoa", processedProduct: "Cocoa butter", ratio: 1.2 },
        { commodity: "Cocoa", processedProduct: "Cocoa powder", ratio: 1.1 },
        { commodity: "Cocoa", processedProduct: "Cocoa liquor", ratio: 1.0 },
        { commodity: "Coffee", processedProduct: "Roasted coffee", ratio: 1.18 },
        { commodity: "Coffee", processedProduct: "Instant coffee", ratio: 2.6 },
        { commodity: "Coffee", processedProduct: "Coffee extract", ratio: 1.5 },
        { commodity: "Rubber", processedProduct: "Latex concentrate", ratio: 0.6 },
        { commodity: "Rubber", processedProduct: "Smoked sheets", ratio: 1.0 },
        { commodity: "Rubber", processedProduct: "Crepe rubber", ratio: 1.0 },
        { commodity: "Palm Oil", processedProduct: "Refined palm oil", ratio: 0.2 },
        { commodity: "Palm Oil", processedProduct: "Palm kernel oil", ratio: 0.02 },
        { commodity: "Palm Oil", processedProduct: "Palm olein", ratio: 1.0 },
        { commodity: "Soy", processedProduct: "Soy oil", ratio: 0.18 },
        { commodity: "Soy", processedProduct: "Soy meal", ratio: 0.78 },
        { commodity: "Soy", processedProduct: "Soy protein isolate", ratio: 0.05 },
      ]);

      await add("yieldData", [
        { country: "Ivory Coast", commodity: "Cocoa", yield: 600 },
        { country: "Ghana", commodity: "Cocoa", yield: 500 },
        { country: "Indonesia", commodity: "Cocoa", yield: 700 },
        { country: "Cameroon", commodity: "Cocoa", yield: 450 },
        { country: "Nigeria", commodity: "Cocoa", yield: 400 },
        { country: "Brazil", commodity: "Cocoa", yield: 800 },
        { country: "Ecuador", commodity: "Cocoa", yield: 750 },
        { country: "Brazil", commodity: "Coffee", yield: 1500 },
        { country: "Vietnam", commodity: "Coffee", yield: 2500 },
        { country: "Colombia", commodity: "Coffee", yield: 800 },
        { country: "Indonesia", commodity: "Coffee", yield: 1000 },
        { country: "Ethiopia", commodity: "Coffee", yield: 700 },
        { country: "Honduras", commodity: "Coffee", yield: 600 },
        { country: "India", commodity: "Coffee", yield: 850 },
        { country: "Thailand", commodity: "Rubber", yield: 1500 },
        { country: "Indonesia", commodity: "Rubber", yield: 1200 },
        { country: "Vietnam", commodity: "Rubber", yield: 1100 },
        { country: "India", commodity: "Rubber", yield: 1000 },
        { country: "China", commodity: "Rubber", yield: 900 },
        { country: "Malaysia", commodity: "Rubber", yield: 1000 },
        { country: "Indonesia", commodity: "Palm Oil", yield: 4000 },
        { country: "Malaysia", commodity: "Palm Oil", yield: 3800 },
        { country: "Thailand", commodity: "Palm Oil", yield: 3000 },
        { country: "Colombia", commodity: "Palm Oil", yield: 2800 },
        { country: "Nigeria", commodity: "Palm Oil", yield: 2500 },
        { country: "Brazil", commodity: "Soy", yield: 3500 },
        { country: "USA", commodity: "Soy", yield: 3300 },
        { country: "Argentina", commodity: "Soy", yield: 3000 },
        { country: "China", commodity: "Soy", yield: 2800 },
        { country: "India", commodity: "Soy", yield: 2500 },
      ]);

      await add("riskFlags", [
        { country: "Brazil", riskLevel: "High", description: "Significant deforestation risk in Amazon and Cerrado biomes." },
        { country: "Indonesia", riskLevel: "High", description: "Palm oil expansion linked to deforestation and peatland conversion." },
        { country: "Ivory Coast", riskLevel: "Medium", description: "Cocoa production linked to forest degradation." },
        { country: "Colombia", riskLevel: "Low", description: "Generally lower deforestation rates, but localised issues exist." },
        { country: "Vietnam", riskLevel: "Medium", description: "Coffee and rubber expansion and land use change concerns." },
        { country: "Cameroon", riskLevel: "Medium", description: "Cocoa expansion and forest encroachment concerns." },
        { country: "Nigeria", riskLevel: "Medium", description: "Palm oil and cocoa expansion linked to forest loss." },
        { country: "Thailand", riskLevel: "Low", description: "Rubber production generally stable, but some areas face land use change pressure." },
        { country: "Ethiopia", riskLevel: "Medium", description: "Coffee expansion in forest areas." },
        { country: "Honduras", riskLevel: "Medium", description: "Coffee production in areas with deforestation pressure." },
        { country: "India", riskLevel: "Low", description: "Diverse agricultural landscape, some localised deforestation for soy and coffee." },
        { country: "China", riskLevel: "Low", description: "Rubber expansion in sensitive ecosystems." },
        { country: "Argentina", riskLevel: "High", description: "Soy expansion linked to deforestation in Gran Chaco." },
        { country: "USA", riskLevel: "Low", description: "Mature agricultural landscape, but sustainability practices are key." },
      ]);

      alert("✅ Seeding complete!");
    };

    seed();
  }, []);

  return <div className="p-4 text-center text-green-600">Seeding Firestore data...</div>;
}
